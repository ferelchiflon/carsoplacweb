import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { ProductsQueryDto } from './dto/products-query.dto';
import {
  PRODUCT_IMAGES_MULTER_OPTIONS,
  getSanitizedFileInfo,
} from '../common/multer/multer-options';

@Controller('products')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}

  /**
   * Crear un nuevo producto con imágenes.
   * - Multer aplica fileFilter (whitelist MIME/extensión) y limits (DoS/OOM).
   * - Se exige al menos una imagen (la lógica de negocio puede relajarlo si quiere).
   */
  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10, PRODUCT_IMAGES_MULTER_OPTIONS))
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createProductDto: CreateProductDto,
  ) {
    this.logger.log(`Creando producto: ${createProductDto.name}`);

    if (!files || files.length === 0) {
      throw new BadRequestException('Al menos una imagen es requerida');
    }

    this.logger.debug(`Archivos recibidos: ${files.length}`);
    files.forEach((file, index) => {
      const info = getSanitizedFileInfo(file);
      this.logger.debug(
        `Archivo ${index + 1}: ${info.filename} (${info.size} bytes, ${info.mimetype})`,
      );
    });

    return this.productService.create(createProductDto, files);
  }

  @Get()
  async findAll(@Query() query: ProductsQueryDto) {
    return this.productService.findAll(query);
  }

  @Get('filters')
  async getFilters() {
    return this.productService.getFilters();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

@UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }
@UseGuards(AuthGuard)

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
