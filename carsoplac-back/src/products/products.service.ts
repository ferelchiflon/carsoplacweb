import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ProductsQueryDto } from './dto/products-query.dto';

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

  async findAll(query: ProductsQueryDto) {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      brand,
      inStock,
      sort,
      page = 1,
      limit = 10,
    } = query;

    // Build where clause
    const where: any = {};

    // Text search in name and description (case-insensitive)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by category name (case-insensitive)
    if (category) {
      where.category = {
        name: { equals: category, mode: 'insensitive' },
      };
    }

    // Price range
    if (minPrice !== undefined) {
      where.price = {
        ...where.price,
        gte: minPrice,
      };
    }
    if (maxPrice !== undefined) {
      where.price = {
        ...where.price,
        lte: maxPrice,
      };
    }

    // Brand (exact match, but we can make case-insensitive if needed)
    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' };
    }

    // In stock filter
    if (inStock) {
      where.stock = { gt: 0 };
    }

    // Determine order by based on sort
    let orderBy: any = { createdAt: 'desc' }; // default
    if (sort) {
      switch (sort) {
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
        case 'name_asc':
          orderBy = { name: 'asc' };
          break;
        case 'name_desc':
          orderBy = { name: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
          break;
      }
    }

    // Pagination
    const skip = (page - 1) * limit;
    const take = limit;

    // Execute count and findMany in a transaction
    const [total, data] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page: 1,
      limit: 10,
      totalPages,
    };
  }

  async getFilters() {
    // Get distinct categories (names) and brands
    const [categories, brands] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        select: { name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.findMany({
        select: { brand: true },
        distinct: ['brand'],
        where: { brand: { not: '' } },
        orderBy: { brand: 'asc' },
      }),
    ]);

    return {
      categories: categories.map((c) => c.name),
      brands: brands.map((b) => b.brand).filter((b): b is string => b !== null && b !== ''),
    };
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
