import { Controller, Get, Post } from '@nestjs/common';
import { PrismaService } from './generated/prisma/prisma.service.js';

@Controller('users')
export class UserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  createUser() {
    return this.prisma.user.create({
      data: {
        name: 'Victor',
        email: 'victor@ledgerly.com',
      },
    });
  }
}