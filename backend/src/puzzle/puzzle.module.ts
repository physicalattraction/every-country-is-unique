import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuzzleService } from './services/puzzle.service';
import { Puzzle } from './entities/puzzle.entity';
import { Clue } from './entities/clue.entity';
import { Country } from '../country/entities/country.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Puzzle, Clue, Country])],
  providers: [PuzzleService],
  exports: [PuzzleService],
})
export class PuzzleModule {} 