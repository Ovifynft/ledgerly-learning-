import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  amount!: number;
}
