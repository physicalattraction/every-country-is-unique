import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CountryQueryDto } from '../dto/country.query.dto';
import { CountryResponseDto } from '../dto/country.response.dto';
import { CountryService } from '../services/country.service';

@ApiTags('countries')
@Controller('countries')
export class CountryController {
    constructor(private readonly countryService: CountryService) { }

    @Get()
    @ApiOperation({
        summary: 'Get all countries',
        description: 'Retrieves a list of all countries, optionally filtered by name',
    })
    @ApiQuery({ name: 'search', required: false, description: 'Search term to filter countries by name' })
    @ApiResponse({
        status: 200,
        description: 'List of countries retrieved successfully',
        type: [CountryResponseDto],
    })
    async findAll(@Query() query: CountryQueryDto): Promise<CountryResponseDto[]> {
        return this.countryService.findAll(query);
    }

    @Get(':code')
    @ApiOperation({
        summary: 'Get country by code',
        description: 'Retrieves detailed information about a specific country',
    })
    @ApiParam({ name: 'code', description: 'The three-letter country code' })
    @ApiResponse({
        status: 200,
        description: 'Country details retrieved successfully',
        type: CountryResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Country not found',
    })
    async findOne(@Param('code') code: string): Promise<CountryResponseDto> {
        return this.countryService.findOne(code);
    }
}
