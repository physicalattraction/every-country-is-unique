import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Puzzle } from '../entities/puzzle.entity';
import { IClue } from '../entities/clue.entity';
import { Country } from '../../country/entities/country.entity';
import { ClueService } from './clue.service';

@Injectable()
export class PuzzleService {
  constructor(
    @InjectRepository(Puzzle)
    private puzzleRepository: Repository<Puzzle>,
    @InjectRepository(Country)
    private countryRepository: Repository<Country>,
    private clueService: ClueService,
  ) {}

  async findOneWithClues(id: number): Promise<Puzzle> {
    return this.puzzleRepository.findOne({
      where: { id },
      relations: ['clues', 'country']
    });
  }

  async createPuzzleWithClues(countryCode: string, clues: IClue[]): Promise<Puzzle> {
    const country = await this.countryRepository.findOne({ where: { code: countryCode } });
    if (!country) {
      throw new Error(`Country with code ${countryCode} not found`);
    }

    const puzzle = await this.puzzleRepository.save({ country });
    await this.clueService.createClues(clues, puzzle);

    return puzzle;
  }
} 