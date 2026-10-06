import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateAccountDto {
  @IsInt()
  userId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  currency: string;
}
