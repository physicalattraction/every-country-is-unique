import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Country } from '../../country/entities/country.entity';
import { Clue, IClue } from '../entities/clue.entity';
import { Puzzle } from '../entities/puzzle.entity';

@Injectable()
export class PuzzleService {
    constructor(
        @InjectRepository(Puzzle)
        private puzzleRepository: Repository<Puzzle>,
        @InjectRepository(Country)
        private countryRepository: Repository<Country>,
        @InjectRepository(Clue)
        private clueRepository: Repository<Clue>,
    ) { }

    async findOne(id: number): Promise<Puzzle> {
        return this.puzzleRepository.findOne({
            where: { id },
            relations: ['country', 'clues'],
        });
    }

    async create(countryCode: string, clues: IClue[]): Promise<Puzzle> {
        if (!clues?.length) {
            throw new BadRequestException('A puzzle must have at least one clue');
        }

        const country = await this.countryRepository.findOne({ where: { code: countryCode } });
        if (!country) {
            throw new BadRequestException(`Country with code ${countryCode} not found`);
        }

        const puzzle = await this.puzzleRepository.save({ country });

        const clueEntities = clues.map(clue =>
            this.clueRepository.create({
                ...clue,
                puzzle,
            }),
        );
        await this.clueRepository.save(clueEntities);

        return this.findOne(puzzle.id);
    }

    async update(id: number, countryCode: string, clues: IClue[]): Promise<Puzzle> {
        const puzzle = await this.findOne(id);
        if (!puzzle) {
            throw new NotFoundException(`Puzzle with id ${id} not found`);
        }

        if (!clues?.length) {
            throw new BadRequestException('A puzzle must have at least one clue');
        }

        const country = await this.countryRepository.findOne({ where: { code: countryCode } });
        if (!country) {
            throw new BadRequestException(`Country with code ${countryCode} not found`);
        }

        // Update puzzle country
        puzzle.country = country;
        await this.puzzleRepository.save(puzzle);

        // Delete existing clues
        await this.clueRepository.delete({ puzzle: { id } });

        // Create new clues
        const clueEntities = clues.map(clue =>
            this.clueRepository.create({
                ...clue,
                puzzle,
            }),
        );
        await this.clueRepository.save(clueEntities);

        return this.findOne(id);
    }

    async delete(id: number): Promise<void> {
        const puzzle = await this.findOne(id);
        if (!puzzle) {
            throw new NotFoundException(`Puzzle with id ${id} not found`);
        }

        // Delete clues first due to foreign key constraint
        await this.clueRepository.delete({ puzzle: { id } });
        await this.puzzleRepository.delete(id);
    }

    async findMany(countryCode?: string, page = 1, limit = 20): Promise<{ puzzles: Puzzle[]; total: number }> {
        const skip = (page - 1) * limit;
        const where = countryCode ? { country: { code: countryCode } } : {};

        const [puzzles, total] = await this.puzzleRepository.findAndCount({
            where,
            relations: ['country', 'clues'],
            order: { id: 'DESC' },
            skip,
            take: limit,
        });

        return { puzzles, total };
    }

    async findRandom(): Promise<Puzzle> {
        const count = await this.puzzleRepository.count();
        if (count === 0) {
            throw new NotFoundException('No puzzles found');
        }

        const randomOffset = Math.floor(Math.random() * count);
        const puzzle = await this.puzzleRepository
            .createQueryBuilder('puzzle')
            .leftJoinAndSelect('puzzle.country', 'country')
            .leftJoinAndSelect('puzzle.clues', 'clues')
            .skip(randomOffset)
            .take(1)
            .getOne();

        if (!puzzle) {
            throw new NotFoundException('No puzzle found');
        }

        return puzzle;
    }
}
