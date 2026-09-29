import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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
}
