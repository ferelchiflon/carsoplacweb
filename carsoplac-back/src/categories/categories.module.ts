import { Module } from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CategoryController } from './categories.controller';
import { AuthModule } from 'src/auth/auth.module';

// AuthModule: provee JwtService para el AuthGuard que usa
// CategoryController (mismo patrón que ProductsModule).
@Module({
  imports: [AuthModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoriesModule {}
