import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puzzle } from '../entities/puzzle.entity';
import { Country } from '../../country/entities/country.entity';
import { IClue } from '../entities/clue.entity';
import { Clue } from '../entities/clue.entity';

@Injectable()
export class PuzzleService {
  constructor(
    @InjectRepository(Puzzle)
    private puzzleRepository: Repository<Puzzle>,
    @InjectRepository(Country)
    private countryRepository: Repository<Country>,
    @InjectRepository(Clue)
    private clueRepository: Repository<Clue>,
  ) {}

  async findOne(id: number): Promise<Puzzle> {
    return this.puzzleRepository.findOne({
      where: { id },
      relations: ['country', 'clues']
    });
  }

  async create(countryCode: string, clues: IClue[]): Promise<Puzzle> {
    if (!clues?.length) {
      throw new BadRequestException('A puzzle must have at least one clue');
    }

    const country = await this.countryRepository.findOne({ where: { code: countryCode } });
    if (!country) {
      throw new Error(`Country with code ${countryCode} not found`);
    }

    const puzzle = await this.puzzleRepository.save({ country });
    
    const clueEntities = clues.map(clue => this.clueRepository.create({
      ...clue,
      puzzle
    }));
    await this.clueRepository.save(clueEntities);

    return this.findOne(puzzle.id);
  }
} 