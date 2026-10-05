import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  findUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }
}