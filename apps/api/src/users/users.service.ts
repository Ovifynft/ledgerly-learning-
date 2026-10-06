import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../generated/prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
const publicUser = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  createdAt: true,
  updatedAt: true,
} as const;
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(dto: CreateUserDto, passwordHash: string) {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
      },
      select: publicUser,
    });
  }
  async findPublic(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUser,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { ...publicUser, accounts: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
