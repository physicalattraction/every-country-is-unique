import { IsOptional, IsString } from 'class-validator';

export class CountryQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
} 