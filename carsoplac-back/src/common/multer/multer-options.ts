import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Tipos MIME permitidos para la carga de imágenes de productos.
 * Esta lista es la primera barrera de defensa (antes del chequeo de magic bytes).
 */
export const ALLOWED_IMAGE_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

/**
 * Extensiones permitidas, alineadas con los mimetype de arriba.
 * Se usa en `fileFilter` para rechazar archivos cuya extensión no coincida
 * con lo declarado (defensa adicional contra spoofing trivial).
 */
export const ALLOWED_IMAGE_EXTENSIONS: readonly string[] = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
] as const;

/**
 * Tamaño máximo permitido por archivo: 5 MB.
 */
export const MAX_IMAGE_FILE_SIZE_BYTES: number = 5 * 1024 * 1024;

/**
 * Cantidad máxima de archivos por request.
 */
export const MAX_IMAGE_FILES_PER_REQUEST: number = 10;

/**
 * Forma mínima de un archivo procesado por Multer.
 * Evitamos depender de `Express.Multer.File` para no acoplarnos a tipos globales.
 */
interface MulterFileLike {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

/**
 * `fileFilter` reutilizable para los interceptores de Multer.
 *
 *  - Rechaza cualquier archivo cuyo `mimetype` declarado por el cliente no esté
 *    en la lista blanca.
 *  - También rechaza si la extensión del nombre original no está permitida,
 *    como defensa rápida contra typos maliciosos.
 *  - El chequeo del contenido real (magic bytes) se hace después en el service,
 *    porque el `fileFilter` de Multer ya habrá guardado el archivo cuando
 *    dispongamos del buffer en modo `memoryStorage`.
 *
 * @throws BadRequestException si el archivo no cumple las reglas.
 */
export function imageMimeTypeFileFilter(
  _req: Request,
  file: MulterFileLike,
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        `Tipo de archivo no permitido: "${file.mimetype}". Solo se aceptan imágenes JPEG, PNG, WEBP o AVIF.`,
      ),
      false,
    );
  }

  const lowerName: string = file.originalname.toLowerCase();
  const hasValidExtension: boolean = ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext),
  );
  if (!hasValidExtension) {
    return callback(
      new BadRequestException(
        `Extensión de archivo no permitida para "${file.originalname}". Solo se aceptan .jpg, .jpeg, .png, .webp o .avif.`,
      ),
      false,
    );
  }

  return callback(null, true);
}

/**
 * Opciones listas para pasar a `FilesInterceptor('images', N, options)`.
 * Centraliza `fileFilter` y `limits` para mantener consistencia entre endpoints.
 *
 * Nombre exportado con prefijo `PRODUCT_` porque el controller lo espera así
 * (`PRODUCT_IMAGES_MULTER_OPTIONS`).
 */
export const PRODUCT_IMAGES_MULTER_OPTIONS = {
  fileFilter: imageMimeTypeFileFilter,
  limits: {
    fileSize: MAX_IMAGE_FILE_SIZE_BYTES,
    files: MAX_IMAGE_FILES_PER_REQUEST,
  },
} as const;

/**
 * Alias genérico para mantener compatibilidad con otros endpoints
 * que pudieran querer las mismas reglas.
 */
export const imageUploadMulterOptions = PRODUCT_IMAGES_MULTER_OPTIONS;

/**
 * Devuelve un objeto "seguro" para loguear: nunca expone el buffer ni la
 * ruta temporal en disco, sólo metadatos.
 */
export function getSanitizedFileInfo(file: MulterFileLike): {
  fieldname: string;
  filename: string;
  size: number;
  mimetype: string;
} {
  return {
    fieldname: file.fieldname,
    filename: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  };
}
