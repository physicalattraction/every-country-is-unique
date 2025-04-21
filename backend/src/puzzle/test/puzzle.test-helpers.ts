import { Repository } from 'typeorm';

import { Country } from '../../country/entities/country.entity';
import { Clue } from '../entities/clue.entity';
import { Puzzle } from '../entities/puzzle.entity';

export interface TestRepositoryContext {
    puzzleRepository: Repository<Puzzle>;
    clueRepository: Repository<Clue>;
    countryRepository: Repository<Country>;
}

export interface TestCountry {
    code: string;
    name: string;
    flag: string;
}

export interface TestClue {
    source: string;
    key: string;
    value: string;
}

export interface CreateTestPuzzleOptions {
    country?: TestCountry;
    clues?: TestClue[];
    alternativeCountries?: string[][];
    skipClues?: boolean;
    skipCountry?: boolean;
    deduplicationKey?: string;
}

const DEFAULT_COUNTRY: TestCountry = {
    code: 'QAT',
    name: 'Qatar',
    flag: '🇶🇦',
};

const DEFAULT_CLUES: TestClue[] = [
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

const DEFAULT_ALTERNATIVE_COUNTRIES: string[][] = [
    ['OMN', 'UAE'],  // Countries that match all clues except the first one
    ['BHR', 'KWT'],  // Countries that match all clues except the second one
];

export async function createTestCountry(
    countryRepository: Repository<Country>,
    country: TestCountry = DEFAULT_COUNTRY,
): Promise<Country> {
    return countryRepository.save(country);
}

export async function createTestPuzzle(
    context: TestRepositoryContext,
    options: CreateTestPuzzleOptions = {},
): Promise<Puzzle> {
    const {
        country = DEFAULT_COUNTRY,
        clues = DEFAULT_CLUES,
        alternativeCountries = DEFAULT_ALTERNATIVE_COUNTRIES,
        skipClues = false,
        skipCountry = false,
        deduplicationKey = 'test-key'
    } = options;

    // Create or get country
    let savedCountry: Country;
    if (!skipCountry) {
        savedCountry = await createTestCountry(context.countryRepository, country);
    } else {
        savedCountry = await context.countryRepository.findOne({ where: { code: country.code } });
        if (!savedCountry) {
            throw new Error(`Country with code ${country.code} not found`);
        }
    }

    // Create puzzle
    const puzzle = await context.puzzleRepository.save({
        country: savedCountry,
        alternativeCountries,
        deduplicationKey
    });

    // Create clues if needed
    if (!skipClues) {
        const clueEntities = clues.map(clue => ({
            ...clue,
            puzzle,
        }));
        await context.clueRepository.save(clueEntities);
    }

    return context.puzzleRepository.findOne({
        where: { id: puzzle.id },
        relations: ['country', 'clues'],
    });
}

export function createTestContext(
    puzzleRepository: Repository<Puzzle>,
    clueRepository: Repository<Clue>,
    countryRepository: Repository<Country>,
): TestRepositoryContext {
    return {
        puzzleRepository,
        clueRepository,
        countryRepository,
    };
}
