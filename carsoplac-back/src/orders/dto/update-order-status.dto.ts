import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'])
  status: string;
}
