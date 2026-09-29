export class CreateProductDto {
  name!: string;
  description?: string;
  brand!: string;
  price!: number;
  stock?: number;
  images!: string[];
}
