import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
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

    async findOne(idOrHash: number | string): Promise<Puzzle> {
        return this.puzzleRepository.findOne({
            where: typeof idOrHash === 'number' ? { id: idOrHash } : { deduplicationKey: idOrHash },
            relations: ['country', 'clues']
        });
    }

    async findOneByHash(deduplicationKey: string): Promise<Puzzle | null> {
        return this.puzzleRepository.findOne({
            where: { deduplicationKey },
            relations: ['country', 'clues'],
        });
    }

    async create(countryCode: string, clues: IClue[], alternativeCountries: string[][], deduplicationKey: string): Promise<Puzzle> {
        const existingPuzzle = await this.findOneByHash(deduplicationKey);
        if (existingPuzzle) {
            return existingPuzzle;
        }

        if (!clues?.length) {
            throw new BadRequestException('A puzzle must have at least one clue');
        }

        if (!alternativeCountries?.length || alternativeCountries.length !== clues.length) {
            throw new BadRequestException('Alternative countries array must have the same length as clues array');
        }

        if (alternativeCountries.some(innerArray => !innerArray?.length)) {
            throw new BadRequestException('Each inner array in alternativeCountries must contain at least one element');
        }

        // Get all country codes in one query
        const allCountries = await this.countryRepository.find();

        // Find target country in the list
        const country = allCountries.find(c => c.code === countryCode);

        if (!country) {
            throw new BadRequestException(`Country with code ${countryCode} not found`);
        }

        // Create a Set of valid country codes for O(1) lookups
        const validCountryCodes = new Set(allCountries.map(c => c.code));

        // Validate all country codes in alternativeCountries
        const invalidCodes = new Set<string>();
        for (const innerArray of alternativeCountries) {
            for (const code of innerArray) {
                if (!validCountryCodes.has(code)) {
                    invalidCodes.add(code);
                }
            }
        }

        if (invalidCodes.size > 0) {
            throw new BadRequestException(
                `Invalid country codes found: ${Array.from(invalidCodes).join(', ')}`
            );
        }

        // Use a single transaction for both puzzle and clue creation
        const puzzle = await this.puzzleRepository.manager.transaction(async manager => {
            // Save puzzle
            const savedPuzzle = await manager.save(Puzzle, {
                country,
                alternativeCountries,
                deduplicationKey
            });

            // Create all clue entities at once
            const clueEntities = clues.map(clue => ({
                ...clue,
                puzzle: savedPuzzle,
            }));

            // Bulk save all clues
            await manager
                .createQueryBuilder()
                .insert()
                .into(Clue)
                .values(clueEntities)
                .execute();

            // Return the full puzzle with relations in a single query
            return this.findOne(savedPuzzle.id);
        });

        return puzzle;
    }

    async update(id: number, countryCode: string, clues: IClue[], alternativeCountries: string[][]): Promise<Puzzle> {
        const puzzle = await this.findOne(id);
        if (!puzzle) {
            throw new NotFoundException(`Puzzle with id ${id} not found`);
        }

        if (!clues?.length) {
            throw new BadRequestException('A puzzle must have at least one clue');
        }

        if (!alternativeCountries?.length || alternativeCountries.length !== clues.length) {
            throw new BadRequestException('Alternative countries array must have the same length as clues array');
        }

        if (alternativeCountries.some(innerArray => !innerArray?.length)) {
            throw new BadRequestException('Each inner array in alternativeCountries must contain at least one element');
        }

        // Get the target country and all country codes in one query
        const [country, allCountries] = await Promise.all([
            this.countryRepository.findOne({ where: { code: countryCode } }),
            this.countryRepository.find({ select: ['code'] })
        ]);

        if (!country) {
            throw new BadRequestException(`Country with code ${countryCode} not found`);
        }

        // Create a Set of valid country codes for O(1) lookups
        const validCountryCodes = new Set(allCountries.map(c => c.code));

        // Validate all country codes in alternativeCountries
        const invalidCodes = new Set<string>();
        for (const innerArray of alternativeCountries) {
            for (const code of innerArray) {
                if (!validCountryCodes.has(code)) {
                    invalidCodes.add(code);
                }
            }
        }

        if (invalidCodes.size > 0) {
            throw new BadRequestException(
                `Invalid country codes found: ${Array.from(invalidCodes).join(', ')}`
            );
        }

        // Update puzzle country and alternativeCountries
        puzzle.country = country;
        puzzle.alternativeCountries = alternativeCountries;
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

        await this.puzzleRepository.remove(puzzle);
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
