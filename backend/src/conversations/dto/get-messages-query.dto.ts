import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class GetMessagesQueryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;
}
