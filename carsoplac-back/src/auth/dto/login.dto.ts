// auth/dto/login.dto.ts
import { IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @MinLength(6)
  password: string;
}
