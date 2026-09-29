import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
  ) {
    const imageUrls: string[] = [];

    for (const file of files) {
      console.log('Subiendo:', file.originalname);

      const imageUrl = await this.cloudinaryService.uploadFile(file);

      imageUrls.push(imageUrl);

      console.log('Upload completado');
    }

    createProductDto.images = imageUrls;

    createProductDto.price = Number(createProductDto.price);

    if (createProductDto.stock) {
      createProductDto.stock = Number(createProductDto.stock);
    }

    return this.prisma.product.create({
      data: createProductDto,
    });
  }

  findAll() {
    // include: el frontend espera product.category.name para mostrar
    // la categoría y filtrar por ella. Sin el include llega como null
    // y el catálogo muestra "General" en todos lados y el filtro no matchea.
    return this.prisma.product.findMany({
      include: { category: true },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  update(id: string, updateProductDto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
