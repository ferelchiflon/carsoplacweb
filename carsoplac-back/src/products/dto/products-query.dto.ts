import { IsOptional, IsIn, IsNumber, Min, Max, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export const productSortOptions = [
  'price_asc',
  'price_desc',
  'name_asc',
  'name_desc',
  'newest',
] as const;

export type ProductSortOption = typeof productSortOptions[number];

export class ProductsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  inStock?: boolean;

  @IsOptional()
  @IsIn(productSortOptions)
  sort?: ProductSortOption = 'newest';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 20;
}