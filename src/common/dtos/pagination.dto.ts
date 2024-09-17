import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max } from 'class-validator';

export class PaginationDto {


  @ApiProperty({default: 1})
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number) // enable implicit comversion
  page?: number;

  @ApiProperty({default: 10})
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
