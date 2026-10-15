import { IsMongoId, IsInt, Min, Max } from 'class-validator';

export class OrderItemDto {
  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;
}
