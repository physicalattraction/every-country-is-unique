import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PuzzleService } from './puzzle.service';
import { ClueService } from './clue.service';
import { Puzzle } from '../entities/puzzle.entity';
import { Clue } from '../entities/clue.entity';
import { Country } from '../../country/entities/country.entity';
import { Currency } from '../../country/entities/currency.entity';
import { Language } from '../../country/entities/language.entity';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('PuzzleService', () => {
  let service: PuzzleService;
  let clueService: ClueService;
  let puzzleRepository: Repository<Puzzle>;
  let clueRepository: Repository<Clue>;
  let countryRepository: Repository<Country>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          dropSchema: true,
          entities: [Puzzle, Clue, Country, Currency, Language],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Puzzle, Clue, Country]),
      ],
      providers: [
        PuzzleService,
        ClueService,
        {
          provide: Puzzle,
          useFactory: (dataSource) => dataSource.getRepository(Puzzle),
          inject: [getDataSourceToken()],
        },
        {
          provide: Clue,
          useFactory: (dataSource) => dataSource.getRepository(Clue),
          inject: [getDataSourceToken()],
        },
        {
          provide: Country,
          useFactory: (dataSource) => dataSource.getRepository(Country),
          inject: [getDataSourceToken()],
        },
      ],
    }).compile();

    service = module.get<PuzzleService>(PuzzleService);
    clueService = module.get<ClueService>(ClueService);
    puzzleRepository = module.get<Repository<Puzzle>>(Puzzle);
    clueRepository = module.get<Repository<Clue>>(Clue);
    countryRepository = module.get<Repository<Country>>(Country);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneWithClues', () => {
    it('should find a puzzle with its clues', async () => {
      // Arrange
      const country = await countryRepository.save({
        code: 'QAT',
        name: 'Qatar',
        flag: '🇶🇦',
      });

      const puzzle = await puzzleRepository.save({ country });
      
      const clues = [
        {
          source: 'name',
          key: 'has_nr_letters_lte',
          value: '5',
        },
        {
          source: 'population',
          key: 'population_lt',
          value: '3000000',
        },
      ];

      await clueService.createClues(clues, puzzle);

      // Act
      const result = await service.findOneWithClues(puzzle.id);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(puzzle.id);
      expect(result.country).toEqual(country);
      expect(result.clues).toHaveLength(2);
      expect(result.clues[0]).toMatchObject({
        source: 'name',
        key: 'has_nr_letters_lte',
        value: '5',
      });
      expect(result.clues[1]).toMatchObject({
        source: 'population',
        key: 'population_lt',
        value: '3000000',
      });
    });
  });

  describe('createPuzzleWithClues', () => {
    it('should create a puzzle with three clues', async () => {
      // Arrange
      const country = await countryRepository.save({
        code: 'QAT',
        name: 'Qatar',
        flag: '🇶🇦',
      });

      const clues = [
        {
          source: 'name',
          key: 'has_nr_letters_lte',
          value: '5',
        },
        {
          source: 'population',
          key: 'population_lt',
          value: '3000000',
        },
        {
          source: 'continent',
          key: 'in_continent',
          value: 'Asia',
        },
      ];

      // Act
      const result = await service.createPuzzleWithClues('QAT', clues);

      // Assert
      expect(result).toBeDefined();
      expect(result.country).toEqual(country);
      
      const savedClues = await clueService.getCluesForPuzzle(result);
      
      expect(savedClues).toHaveLength(3);
      expect(savedClues[0]).toMatchObject({
        source: 'name',
        key: 'has_nr_letters_lte',
        value: '5',
      });
      expect(savedClues[1]).toMatchObject({
        source: 'population',
        key: 'population_lt',
        value: '3000000',
      });
      expect(savedClues[2]).toMatchObject({
        source: 'continent',
        key: 'in_continent',
        value: 'Asia',
      });
    });
  });
}); 