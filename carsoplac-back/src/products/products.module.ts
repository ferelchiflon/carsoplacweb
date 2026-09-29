import { Module } from '@nestjs/common';
import { ProductService } from './products.service';
import { ProductController } from './products.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [CloudinaryModule, AuthModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductsModule {}
