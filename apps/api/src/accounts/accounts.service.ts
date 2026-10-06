import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../generated/prisma/prisma.service.js';
import { CreateAccountDto } from './dto/create-account.dto.js';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Authenticated user not found');
    return this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        currency: dto.currency,
        balance: 0,
      },
    });
  }

  findAll(userId: number) {
    return this.prisma.account.findMany({ where: { userId } });
  }

  async findOne(userId: number, id: number) {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
      include: { user: true },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }
}
