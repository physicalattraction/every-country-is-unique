import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

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
    ) {}

    async findOne(id: number): Promise<Puzzle | null> {
        return this.puzzleRepository.findOne({
            where: { id },
            relations: ['country', 'clues'],
        });
    }

    async findOneByHash(deduplicationKey: string): Promise<Puzzle | null> {
        return this.puzzleRepository.findOne({
            where: { deduplicationKey },
            relations: ['country', 'clues'],
        });
    }

    async create(
        countryCode: string,
        clues: IClue[],
        alternativeCountries: string[][],
        deduplicationKey: string,
    ): Promise<Puzzle> {
        const existingPuzzle = await this.findOneByHash(deduplicationKey);
        if (existingPuzzle) {
            return existingPuzzle;
        }

        this.validateCluesAndAlternatives(clues, alternativeCountries);
        const country = await this.resolveCountryAndValidateAlternatives(countryCode, alternativeCountries);

        const savedPuzzle = await this.puzzleRepository.manager.transaction(async manager => {
            const puzzle = await manager.save(Puzzle, {
                country,
                alternativeCountries,
                deduplicationKey,
            });

            const clueEntities = clues.map(clue => ({
                ...clue,
                puzzle,
            }));

            await manager.createQueryBuilder().insert().into(Clue).values(clueEntities).execute();

            return puzzle;
        });

        const created = await this.findOne(savedPuzzle.id);
        if (!created) {
            throw new NotFoundException(`Puzzle with id ${savedPuzzle.id} not found after create`);
        }
        return created;
    }

    async update(id: number, countryCode: string, clues: IClue[], alternativeCountries: string[][]): Promise<Puzzle> {
        const puzzle = await this.findOne(id);
        if (!puzzle) {
            throw new NotFoundException(`Puzzle with id ${id} not found`);
        }

        this.validateCluesAndAlternatives(clues, alternativeCountries);
        const country = await this.resolveCountryAndValidateAlternatives(countryCode, alternativeCountries);

        const updatedPuzzle = await this.puzzleRepository.manager.transaction(async manager => {
            const savedPuzzle = await manager.save(Puzzle, {
                ...puzzle,
                country,
                alternativeCountries,
            });

            await manager.delete(Clue, { puzzle: { id } });

            const clueEntities = clues.map(clue => ({
                ...clue,
                puzzle: savedPuzzle,
            }));

            await manager.createQueryBuilder().insert().into(Clue).values(clueEntities).execute();

            return savedPuzzle;
        });

        const updated = await this.findOne(updatedPuzzle.id);
        if (!updated) {
            throw new NotFoundException(`Puzzle with id ${updatedPuzzle.id} not found after update`);
        }
        return updated;
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

    private validateCluesAndAlternatives(clues: IClue[], alternativeCountries: string[][]): void {
        if (!clues?.length) {
            throw new BadRequestException('A puzzle must have at least one clue');
        }

        if (!alternativeCountries?.length || alternativeCountries.length !== clues.length) {
            throw new BadRequestException('Alternative countries array must have the same length as clues array');
        }

        if (alternativeCountries.some(innerArray => !innerArray?.length)) {
            throw new BadRequestException('Each inner array in alternativeCountries must contain at least one element');
        }
    }

    private async resolveCountryAndValidateAlternatives(
        countryCode: string,
        alternativeCountries: string[][],
    ): Promise<Country> {
        const requestedCodes = [...new Set([countryCode, ...alternativeCountries.flat()])];
        const countries = await this.countryRepository.find({
            where: { code: In(requestedCodes) },
        });
        const countriesByCode = new Map(countries.map(country => [country.code, country]));

        const country = countriesByCode.get(countryCode);
        if (!country) {
            throw new BadRequestException(`Country with code ${countryCode} not found`);
        }

        const invalidCodes = requestedCodes.filter(code => !countriesByCode.has(code));
        if (invalidCodes.length > 0) {
            throw new BadRequestException(`Invalid country codes found: ${invalidCodes.join(', ')}`);
        }

        return country;
    }
}
