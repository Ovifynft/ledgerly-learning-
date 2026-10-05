import { Module } from '@nestjs/common';
import { PrismaService } from '../generated/prisma/prisma.service.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [UsersController],
  providers: [PrismaService, UsersService],
})
export class UsersModule {}