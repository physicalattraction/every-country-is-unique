import { Body, Controller, Delete, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { CountryBulkUpdateDto } from '../dto/country.bulk-update.dto';
import { CountryQueryDto } from '../dto/country.query.dto';
import { CountryResponseDto } from '../dto/country.response.dto';
import { CountryUpsertDto } from '../dto/country.upsert.dto';
import { CountryService } from '../services/country.service';

@ApiTags('countries')
@Controller('countries')
export class CountryController {
    constructor(private readonly countryService: CountryService) {
        // No-op
    }

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

    @Put()
    @UseGuards(ApiKeyGuard)
    @ApiOperation({
        summary: 'Create or update a country',
        description: 'Creates a new country or updates an existing one based on the three-letter code',
    })
    @ApiResponse({
        status: 200,
        description: 'Country created or updated successfully',
        type: CountryResponseDto,
    })
    async upsert(@Body() dto: CountryUpsertDto): Promise<CountryResponseDto> {
        return this.countryService.upsert(dto);
    }

    @Delete(':code')
    @UseGuards(ApiKeyGuard)
    @ApiOperation({
        summary: 'Delete a country',
        description: 'Deletes a country by its three-letter code',
    })
    @ApiParam({ name: 'code', description: 'The three-letter country code' })
    @ApiResponse({
        status: 200,
        description: 'Country deleted successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Cannot delete country because it is still being used in puzzles',
    })
    @ApiResponse({
        status: 404,
        description: 'Country not found',
    })
    async delete(@Param('code') code: string): Promise<void> {
        return this.countryService.delete(code);
    }

    @Put('bulk')
    @UseGuards(ApiKeyGuard)
    @ApiOperation({
        summary: 'Bulk update countries',
        description: 'Updates multiple countries at once using a dictionary of country codes to partial update objects',
    })
    @ApiResponse({
        status: 200,
        description: 'Countries updated successfully',
        type: [CountryResponseDto],
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid update data provided',
    })
    @ApiResponse({
        status: 401,
        description: 'Invalid or missing API key',
    })
    async bulkUpdate(@Body() dto: CountryBulkUpdateDto): Promise<CountryResponseDto[]> {
        return this.countryService.bulkUpdateCountries(dto);
    }
}
