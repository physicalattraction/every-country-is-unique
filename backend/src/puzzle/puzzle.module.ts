import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Country } from '../country/entities/country.entity';
import { PuzzleController } from './controllers/puzzle.controller';
import { Clue } from './entities/clue.entity';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzleService } from './services/puzzle.service';

@Module({
    imports: [TypeOrmModule.forFeature([Puzzle, Clue, Country])],
    controllers: [PuzzleController],
    providers: [PuzzleService],
    exports: [PuzzleService],
})
export class PuzzleModule {}
