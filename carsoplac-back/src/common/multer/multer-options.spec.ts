/// <reference types="jest" />
import { BadRequestException } from '@nestjs/common';
import {
  imageMimeTypeFileFilter,
  MAX_IMAGE_FILE_SIZE_BYTES,
  MAX_IMAGE_FILES_PER_REQUEST,
  PRODUCT_IMAGES_MULTER_OPTIONS,
} from './multer-options';

type MulterLikeFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

/**
 * Helper que devuelve el primer argumento (error) con el tipo correcto,
 * evitando `any` que dispara reglas de ESLint.
 */
function getFilterError(cb: FileFilterCallback): Error {
  const mock = cb as unknown as jest.Mock;
  const calls = mock.mock.calls as ReadonlyArray<ReadonlyArray<unknown>>;
  const firstArg = calls[0]?.[0] as Error;
  return firstArg;
}

const buildFile = (mimetype: string, originalname?: string): MulterLikeFile => {
  const ext = mimetype.split('/')[1] ?? 'bin';
  return {
    fieldname: 'images',
    originalname: originalname ?? `test.${ext}`,
    encoding: '7bit',
    mimetype,
    size: 1024,
    buffer: Buffer.from([]),
  };
};

describe('imageMimeTypeFileFilter', () => {
  it('permite image/jpeg con extensión .jpg', () => {
    const cb: FileFilterCallback = jest.fn();
    imageMimeTypeFileFilter({} as never, buildFile('image/jpeg'), cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('permite image/png con extensión .png', () => {
    const cb: FileFilterCallback = jest.fn();
    imageMimeTypeFileFilter({} as never, buildFile('image/png'), cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('permite image/webp con extensión .webp', () => {
    const cb: FileFilterCallback = jest.fn();
    imageMimeTypeFileFilter({} as never, buildFile('image/webp'), cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('permite image/avif con extensión .avif', () => {
    const cb: FileFilterCallback = jest.fn();
    imageMimeTypeFileFilter({} as never, buildFile('image/avif'), cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it('rechaza application/pdf', () => {
    const cb: FileFilterCallback = jest.fn();
    imageMimeTypeFileFilter({} as never, buildFile('application/pdf'), cb);
    const error = getFilterError(cb);
    expect(error).toBeInstanceOf(BadRequestException);
    expect(String(error.message)).toContain('JPEG');
  });

  it('rechaza application/x-msdownload (EXE)', () => {
    const cb: FileFilterCallback = jest.fn();
    imageMimeTypeFileFilter(
      {} as never,
      buildFile('application/x-msdownload'),
      cb,
    );
    expect(getFilterError(cb)).toBeInstanceOf(BadRequestException);
  });

  it('rechaza application/zip', () => {
    const cb: FileFilterCallback = jest.fn();
    imageMimeTypeFileFilter({} as never, buildFile('application/zip'), cb);
    expect(getFilterError(cb)).toBeInstanceOf(BadRequestException);
  });

  it('rechaza text/plain (script plano)', () => {
    const cb: FileFilterCallback = jest.fn();
    imageMimeTypeFileFilter({} as never, buildFile('text/plain'), cb);
    expect(getFilterError(cb)).toBeInstanceOf(BadRequestException);
  });

  it('rechaza image/gif (no está en whitelist)', () => {
    const cb: FileFilterCallback = jest.fn();
    imageMimeTypeFileFilter({} as never, buildFile('image/gif'), cb);
    expect(getFilterError(cb)).toBeInstanceOf(BadRequestException);
  });

  it('rechaza mimetype vacío', () => {
    const cb: FileFilterCallback = jest.fn();
    imageMimeTypeFileFilter({} as never, buildFile(''), cb);
    expect(getFilterError(cb)).toBeInstanceOf(BadRequestException);
  });

  it('rechaza si la extensión no es válida aunque el mimetype lo sea', () => {
    const cb: FileFilterCallback = jest.fn();
    imageMimeTypeFileFilter(
      {} as never,
      buildFile('image/jpeg', 'evil.exe'),
      cb,
    );
    const error = getFilterError(cb);
    expect(error).toBeInstanceOf(BadRequestException);
    expect(String(error.message)).toContain('Extensión');
  });
});

describe('límites de carga', () => {
  it('MAX_IMAGE_FILE_SIZE_BYTES es 5 MB', () => {
    expect(MAX_IMAGE_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });

  it('MAX_IMAGE_FILES_PER_REQUEST es 10', () => {
    expect(MAX_IMAGE_FILES_PER_REQUEST).toBe(10);
  });

  it('PRODUCT_IMAGES_MULTER_OPTIONS aplica los límites correctos', () => {
    expect(PRODUCT_IMAGES_MULTER_OPTIONS.limits.fileSize).toBe(
      MAX_IMAGE_FILE_SIZE_BYTES,
    );
    expect(PRODUCT_IMAGES_MULTER_OPTIONS.limits.files).toBe(
      MAX_IMAGE_FILES_PER_REQUEST,
    );
    expect(PRODUCT_IMAGES_MULTER_OPTIONS.fileFilter).toBe(
      imageMimeTypeFileFilter,
    );
  });
});
