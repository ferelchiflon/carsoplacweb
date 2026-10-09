import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [UsersController],
  providers: [UserService],
  imports: [forwardRef(() => AuthModule)],
  exports: [UserService],
})
export class UsersModule {}
