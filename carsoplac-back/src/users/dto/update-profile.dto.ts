import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  // No fields because the User model does not support name, phone, address.
  // This dto is kept for compatibility with the controller.
}
