import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaService } from '../generated/prisma/prisma.service.js';
import { AccountsController } from './accounts.controller.js';
import { AccountsService } from './accounts.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AccountsController],
  providers: [PrismaService, AccountsService],
})
export class AccountsModule {}
