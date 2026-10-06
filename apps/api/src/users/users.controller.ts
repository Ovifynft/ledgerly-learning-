import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service.js';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get(':id') findUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }
}
