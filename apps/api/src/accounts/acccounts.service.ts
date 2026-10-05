import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../generated/prisma/prisma.service.js';
import { CreateAccountDto } from './dto/create-account.dto.js';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAccountDto: CreateAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: createAccountDto.userId,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createAccountDto.userId} not found`,
      );
    }

    return this.prisma.account.create({
      data: {
        userId: createAccountDto.userId,
        name: createAccountDto.name,
        type: createAccountDto.type,
        currency: createAccountDto.currency,
        balance: 0,
      },
    });
  }

  async findAll(userId?: number) {
    return this.prisma.account.findMany({
      where: userId !== undefined ? { userId } : undefined,
    });
  }

  async findOne(id: number) {
    const account = await this.prisma.account.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }
}