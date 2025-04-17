import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clue, IClue } from '../entities/clue.entity';

@Injectable()
export class ClueService {
  constructor(
    @InjectRepository(Clue)
    private clueRepository: Repository<Clue>,
  ) {}

  async createClue(clue: IClue): Promise<Clue> {
    const newClue = this.clueRepository.create({
      source: clue.source,
      key: clue.key,
      value: clue.value,
    });
    return this.clueRepository.save(newClue);
  }

  async createClues(clues: IClue[]): Promise<Clue[]> {
    const createdClues: Clue[] = [];
    for (const clue of clues) {
      const createdClue = await this.createClue(clue);
      createdClues.push(createdClue);
    }
    return createdClues;
  }
} 