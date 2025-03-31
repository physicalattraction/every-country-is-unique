import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clue, IClue } from '../entities/clue.entity';
import { Puzzle } from '../entities/puzzle.entity';

@Injectable()
export class ClueService {
  constructor(
    @InjectRepository(Clue)
    private clueRepository: Repository<Clue>,
  ) {}

  async createClue(clue: IClue, puzzle: Puzzle): Promise<Clue> {
    const newClue = this.clueRepository.create({
      source: clue.source,
      key: clue.key,
      value: clue.value,
      puzzleId: puzzle.id,
    });
    return this.clueRepository.save(newClue);
  }

  async createClues(clues: IClue[], puzzle: Puzzle): Promise<Clue[]> {
    const createdClues: Clue[] = [];
    for (const clue of clues) {
      const createdClue = await this.createClue(clue, puzzle);
      createdClues.push(createdClue);
    }
    return createdClues;
  }

  async getCluesForPuzzle(puzzle: Puzzle): Promise<Clue[]> {
    return this.clueRepository.find({
      where: { puzzleId: puzzle.id },
      order: { id: 'ASC' }
    });
  }
} 