import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreatePuzzleDto } from '../dto/create-puzzle.dto';
import { FindPuzzlesDto } from '../dto/find-puzzles.dto';
import { PuzzleResponseDto } from '../dto/puzzle-response.dto';
import { UpdatePuzzleDto } from '../dto/update-puzzle.dto';
import { PuzzleService } from '../services/puzzle.service';

@ApiTags('puzzles')
@Controller('puzzles')
export class PuzzleController {
    constructor(private readonly puzzleService: PuzzleService) { }

    @Get()
    @ApiOperation({
        summary: 'Get all puzzles',
        description: 'Retrieves a paginated list of puzzles with optional filtering',
    })
    @ApiQuery({ name: 'country_code', required: false, description: 'Filter puzzles by country code' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
    @ApiResponse({
        status: 200,
        description: 'List of puzzles retrieved successfully',
        schema: {
            properties: {
                puzzles: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/PuzzleResponseDto' },
                },
                total: {
                    type: 'number',
                    description: 'Total number of puzzles',
                },
            },
        },
    })
    async findMany(@Query() query: FindPuzzlesDto): Promise<{ puzzles: PuzzleResponseDto[]; total: number }> {
        const { puzzles, total } = await this.puzzleService.findMany(query.country_code, query.page, query.limit);
        return {
            puzzles: puzzles.map(puzzle => new PuzzleResponseDto(puzzle)),
            total,
        };
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get puzzle by ID',
        description: 'Retrieves detailed information about a specific puzzle',
    })
    @ApiParam({ name: 'id', description: 'The puzzle ID', type: Number })
    @ApiResponse({
        status: 200,
        description: 'Puzzle details retrieved successfully',
        type: PuzzleResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Puzzle not found',
    })
    async findOne(@Param('id') id: string): Promise<PuzzleResponseDto> {
        const puzzle = await this.puzzleService.findOne(Number(id));
        if (!puzzle) {
            throw new HttpException('Puzzle not found', HttpStatus.NOT_FOUND);
        }
        return new PuzzleResponseDto(puzzle);
    }

    @Post()
    @ApiOperation({
        summary: 'Create puzzle',
        description: 'Creates a new puzzle with the given country and clues',
    })
    @ApiResponse({
        status: 201,
        description: 'Puzzle created successfully',
        type: PuzzleResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid country code or missing clues',
    })
    async create(@Body() createPuzzleDto: CreatePuzzleDto): Promise<PuzzleResponseDto> {
        try {
            const puzzle = await this.puzzleService.create(createPuzzleDto.country_code, createPuzzleDto.clues);
            return new PuzzleResponseDto(puzzle);
        } catch (error) {
            if (error.message.includes('Country with code')) {
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            }
            throw error;
        }
    }

    @Put(':id')
    @ApiOperation({
        summary: 'Update puzzle',
        description: 'Updates an existing puzzle by its ID',
    })
    @ApiParam({ name: 'id', description: 'The puzzle ID', type: Number })
    @ApiResponse({
        status: 200,
        description: 'Puzzle updated successfully',
        type: PuzzleResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: 'Puzzle not found',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid country code or missing clues',
    })
    async update(@Param('id') id: string, @Body() updatePuzzleDto: UpdatePuzzleDto): Promise<PuzzleResponseDto> {
        try {
            const puzzle = await this.puzzleService.update(
                Number(id),
                updatePuzzleDto.country_code,
                updatePuzzleDto.clues,
            );
            if (!puzzle) {
                throw new HttpException('Puzzle not found', HttpStatus.NOT_FOUND);
            }
            return new PuzzleResponseDto(puzzle);
        } catch (error) {
            if (error.message.includes('Country with code')) {
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            }
            throw error;
        }
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete puzzle',
        description: 'Deletes an existing puzzle by its ID',
    })
    @ApiParam({ name: 'id', description: 'The puzzle ID', type: Number })
    @ApiResponse({
        status: 200,
        description: 'Puzzle deleted successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Puzzle not found',
    })
    async delete(@Param('id') id: string): Promise<void> {
        try {
            await this.puzzleService.delete(Number(id));
        } catch (error) {
            if (error.message.includes('Puzzle with id')) {
                throw new HttpException('Puzzle not found', HttpStatus.NOT_FOUND);
            }
            throw error;
        }
    }
}
