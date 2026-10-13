import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) { }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    return user;
  }

  async updatePassword(username: string, hashedPassword: string) {
    const user = await this.prisma.user.update({
      where: { username },
      data: { password: hashedPassword },
    });
    return user;
  }

  async getProfile(userId: string) {
    // Return the user by id, but we should not return the password in the response.
    // We'll fetch the user and then remove the password before returning.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return null;
    }
    // Create a copy without the password
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // The User model does not have the fields in dto (name, phone, address).
    // We will not update anything. We'll just return the user as is.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return null;
    }
    // No update performed
    const { password, ...result } = user;
    return result;
  }

  async getFavorites(userId: string) {
    // No favorites implementation in the current schema.
    return [];
  }

  async addFavorite(userId: string, productId: string) {
    // No implementation
    return;
  }

  async removeFavorite(userId: string, productId: string) {
    // No implementation
    return;
  }
}