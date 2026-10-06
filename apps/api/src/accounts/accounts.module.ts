import { Module } from '@nestjs/common';
import { PrismaService } from '../generated/prisma/prisma.service.js';
import { AccountsController } from './accounts.controller.js';
import { AccountsService } from './accounts.service.js';

@Module({
  controllers: [AccountsController],
  providers: [PrismaService, AccountsService],
})
export class AccountsModule {}
