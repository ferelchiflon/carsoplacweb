import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { fileTypeFromBuffer } from 'file-type';

/**
 * Forma mínima de un archivo de Multer en memoria. Evita depender del
 * namespace global `Express.Multer.File`, que no siempre está disponible
 * según la configuración de `@types/multer`.
 */
interface MulterFileLike {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Magic bytes permitidos. Sirven como "huella digital" del contenido real
 * del archivo (no del mimetype declarado por el cliente, que es spoofable).
 *
 * Los valores coinciden con los reportados por `file-type` para cada formato.
 */
const ALLOWED_IMAGE_MAGIC_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

/**
 * Formatos explícitamente aceptados por Cloudinary (segunda barrera).
 * Mantiene consistencia con `ALLOWED_IMAGE_MAGIC_TYPES`.
 */
const CLOUDINARY_ALLOWED_FORMATS: readonly string[] = [
  'jpg',
  'jpeg',
  'png',
  'webp',
] as const;

/**
 * Tamaño máximo en bytes para subir a Cloudinary. Es un segundo control
 * porque Multer ya limitó el tamaño al recibir la request, pero por defensa
 * adicional dejamos el tope acá.
 */
const CLOUDINARY_MAX_FILE_SIZE_BYTES: number = 5 * 1024 * 1024;

/**
 * Servicio responsable de subir imágenes a Cloudinary.
 *
 * Capas de defensa aplicadas antes de tocar Cloudinary:
 *  1. Multer: filtra por mimetype declarado + tamaño + cantidad.
 *  2. `validateImageContent`: lee los magic bytes del buffer y compara con
 *     la whitelist. Esto neutraliza spoofing (ej: archivo .exe renombrado
 *     a .jpg con mimetype `image/jpeg` falso).
 *  3. Cloudinary: `allowed_formats` + `transformation` como red final.
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  /**
   * Valida que el contenido real del buffer coincida con un formato de imagen
   * permitido. Si no coincide, lanza `BadRequestException`.
   *
   * Nota: `file-type` es una librería estándar que detecta formato leyendo
   * los primeros bytes del archivo (magic numbers). No se basa en la
   * extensión ni en el mimetype que mandó el cliente.
   */
  private async validateImageContent(file: MulterFileLike): Promise<void> {
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(
        'El archivo recibido está vacío y no puede procesarse.',
      );
    }

    const detected = await fileTypeFromBuffer(file.buffer);

    if (!detected) {
      throw new BadRequestException(
        'No se pudo determinar el tipo real del archivo. Solo se aceptan imágenes JPEG, PNG, WEBP o AVIF.',
      );
    }

    if (!ALLOWED_IMAGE_MAGIC_TYPES.includes(detected.mime)) {
      throw new BadRequestException(
        `El contenido real del archivo (${detected.mime}) no coincide con un formato de imagen permitido. Posible intento de spoofing.`,
      );
    }

    // Verificación adicional: el mimetype declarado por el cliente debe
    // coincidir con el formato real. Esto bloquea casos como un JPEG real
    // enviado con `Content-Type: image/png`.
    if (detected.mime !== file.mimetype) {
      throw new BadRequestException(
        `El tipo declarado ("${file.mimetype}") no coincide con el contenido real del archivo ("${detected.mime}").`,
      );
    }
  }

  /**
   * Sube una imagen validada a Cloudinary y devuelve la URL segura.
   */
  async uploadFile(file: MulterFileLike): Promise<string> {
    this.logger.log(
      `Subiendo archivo: ${file.originalname} (${file.size} bytes, ${file.mimetype})`,
    );

    // 1) Defensa contra spoofing: validar magic bytes.
    await this.validateImageContent(file);

    // 2) Defensa adicional por tamaño (Multer ya limita, pero mantenemos
    //    el control por si se reusa el service desde otro punto de entrada).
    if (file.size > CLOUDINARY_MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `El archivo excede el tamaño máximo permitido de ${CLOUDINARY_MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
      );
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'products',
          // Limita los formatos aceptados por Cloudinary (última barrera).
          allowed_formats: [...CLOUDINARY_ALLOWED_FORMATS],
          // Limita dimensiones y peso de la imagen entregada por Cloudinary.
          // `crop: 'limit'` no recorta, sólo reduce si excede; mantiene
          // proporción.
          transformation: [
            {
              width: 1500,
              height: 1500,
              crop: 'limit',
            },
          ],
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            this.logger.error(
              `Error de Cloudinary al subir ${file.originalname}`,
              error.stack,
            );
            return reject(error);
          }

          if (!result) {
            return reject(new Error('Cloudinary no devolvió resultado.'));
          }

          this.logger.log(`Subida OK: ${result.secure_url}`);
          resolve(result.secure_url);
        },
      );

      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }
}
