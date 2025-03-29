import { Controller, Get, Param, Query } from '@nestjs/common';
import { CountryService } from '../services/country.service';
import { CountryResponseDto } from '../dto/country.response.dto';
import { CountryQueryDto } from '../dto/country.query.dto';

@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  async findAll(@Query() query: CountryQueryDto): Promise<CountryResponseDto[]> {
    return this.countryService.findAll(query);
  }

  @Get(':code')
  async findOne(@Param('code') code: string): Promise<CountryResponseDto> {
    return this.countryService.findOne(code);
  }
} 