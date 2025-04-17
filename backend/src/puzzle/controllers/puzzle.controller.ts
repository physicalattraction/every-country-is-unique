import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { CreatePuzzleDto } from '../dto/create-puzzle.dto';
import { PuzzleResponseDto } from '../dto/puzzle-response.dto';
import { UpdatePuzzleDto } from '../dto/update-puzzle.dto';
import { PuzzleService } from '../services/puzzle.service';

@Controller('puzzles')
export class PuzzleController {
    constructor(private readonly puzzleService: PuzzleService) { }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<PuzzleResponseDto> {
        const puzzle = await this.puzzleService.findOne(Number(id));
        if (!puzzle) {
            throw new HttpException('Puzzle not found', HttpStatus.NOT_FOUND);
        }
        return new PuzzleResponseDto(puzzle);
    }

    @Post()
    async create(@Body() createPuzzleDto: CreatePuzzleDto): Promise<PuzzleResponseDto> {
        try {
            const puzzle = await this.puzzleService.create(
                createPuzzleDto.countryCode,
                createPuzzleDto.clues,
            );
            return new PuzzleResponseDto(puzzle);
        } catch (error) {
            if (error.message.includes('Country with code')) {
                throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
            }
            throw error;
        }
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updatePuzzleDto: UpdatePuzzleDto,
    ): Promise<PuzzleResponseDto> {
        try {
            const puzzle = await this.puzzleService.update(
                Number(id),
                updatePuzzleDto.countryCode,
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