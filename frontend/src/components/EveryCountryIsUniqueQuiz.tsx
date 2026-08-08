'use client';

import { useShowKeyboardControls } from '@/hooks/useShowKeyboardControls';
import { countryService } from '@/services/countryService';
import { puzzleService } from '@/services/puzzleService';
import { CountryResponseDto, PuzzleResponseDto } from '@/services/types';
import { formatClue } from '@/utils/formatting';
import { debounce } from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

export const QUIZ_BASE_PATH = '/quiz/every-country-is-unique';

interface GuessState {
    searchTerm: string;
    suggestions: CountryResponseDto[];
    selectedCountry: CountryResponseDto | null;
    isCorrect: boolean | null;
    highlightedIndex: number;
}

const initialGuessState: GuessState = {
    searchTerm: '',
    suggestions: [],
    selectedCountry: null,
    isCorrect: null,
    highlightedIndex: -1,
};

type GuessAction =
    | { type: 'reset' }
    | { type: 'setSearchTerm'; value: string }
    | { type: 'setSuggestions'; value: CountryResponseDto[] }
    | { type: 'selectCountry'; country: CountryResponseDto }
    | { type: 'exactMatch'; country: CountryResponseDto }
    | { type: 'setHighlightedIndex'; value: number }
    | { type: 'submitResult'; isCorrect: boolean };

function guessReducer(state: GuessState, action: GuessAction): GuessState {
    switch (action.type) {
        case 'reset':
            return initialGuessState;
        case 'setSearchTerm': {
            const selectedCountry =
                state.selectedCountry &&
                state.selectedCountry.name.toLowerCase() !== action.value.toLowerCase()
                    ? null
                    : state.selectedCountry;
            return { ...state, searchTerm: action.value, selectedCountry };
        }
        case 'setSuggestions':
            return { ...state, suggestions: action.value, highlightedIndex: -1 };
        case 'selectCountry':
            return {
                ...state,
                selectedCountry: action.country,
                searchTerm: action.country.name,
                suggestions: [],
                highlightedIndex: -1,
            };
        case 'exactMatch':
            return {
                ...state,
                selectedCountry: action.country,
                suggestions: [],
                highlightedIndex: -1,
            };
        case 'setHighlightedIndex':
            return { ...state, highlightedIndex: action.value };
        case 'submitResult':
            return { ...state, isCorrect: action.isCorrect };
        default: {
            const _exhaustive: never = action;
            return _exhaustive;
        }
    }
}

interface EveryCountryIsUniqueQuizProps {
    puzzleId: number;
}

export function EveryCountryIsUniqueQuiz({ puzzleId }: EveryCountryIsUniqueQuizProps) {
    const [puzzle, setPuzzle] = useState<PuzzleResponseDto | null>(null);
    const [guess, dispatchGuess] = useReducer(guessReducer, initialGuessState);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [countries, setCountries] = useState<CountryResponseDto[]>([]);
    const [correctGuesses, setCorrectGuesses] = useState(0);
    const [totalGuesses, setTotalGuesses] = useState(0);
    const showKeyboardControls = useShowKeyboardControls();
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const formattedClues = useMemo(() => {
        if (!puzzle || countries.length === 0) {
            return [];
        }
        return puzzle.clues.map((clue) => formatClue(clue, countries));
    }, [puzzle, countries]);

    useEffect(() => {
        if (puzzle && !isLoading) {
            inputRef.current?.focus();
        }
    }, [puzzle, isLoading]);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const allCountries = await countryService.getAllCountries();
                setCountries(allCountries);
            } catch (error) {
                console.error('Error fetching countries:', error);
            }
        };
        fetchCountries();
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadPuzzle = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const data = await puzzleService.getPuzzleById(puzzleId);
                if (cancelled) return;
                setPuzzle(data);
                dispatchGuess({ type: 'reset' });
            } catch (error) {
                console.error('Error fetching puzzle:', error);
                if (cancelled) return;
                setPuzzle(null);
                setLoadError('Puzzle not found');
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadPuzzle();

        return () => {
            cancelled = true;
        };
    }, [puzzleId]);

    const searchCountries = useCallback(
        debounce((term: string) => {
            if (term.length < 3) {
                dispatchGuess({ type: 'setSuggestions', value: [] });
                return;
            }

            const exactMatch = countries.find(
                (country) => country.name.toLowerCase() === term.toLowerCase(),
            );

            if (exactMatch) {
                dispatchGuess({ type: 'exactMatch', country: exactMatch });
                return;
            }

            const filteredCountries = countries.filter((country) =>
                country.name.toLowerCase().includes(term.toLowerCase()),
            );
            dispatchGuess({ type: 'setSuggestions', value: filteredCountries });
        }, 500),
        [countries],
    );

    useEffect(() => {
        searchCountries(guess.searchTerm);
    }, [guess.searchTerm, searchCountries]);

    const applyAnswer = (country: CountryResponseDto) => {
        if (!puzzle || guess.isCorrect !== null) return;
        const isAnswerCorrect = country.code === puzzle.country.code;
        dispatchGuess({ type: 'submitResult', isCorrect: isAnswerCorrect });
        setTotalGuesses((prev) => prev + 1);
        if (isAnswerCorrect) {
            setCorrectGuesses((prev) => prev + 1);
        }
    };

    const handleSubmit = () => {
        if (!guess.selectedCountry) return;
        applyAnswer(guess.selectedCountry);
    };

    const handleNextPuzzle = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const data = await puzzleService.getRandomPuzzle();
            if (data.id === puzzleId) {
                setPuzzle(data);
                dispatchGuess({ type: 'reset' });
                setIsLoading(false);
                return;
            }
            router.replace(`${QUIZ_BASE_PATH}/${data.id}`);
        } catch (error) {
            console.error('Error fetching random puzzle:', error);
            setPuzzle(null);
            setLoadError('Failed to load puzzle');
            setIsLoading(false);
        }
    };

    const handleKeyNavigation = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (guess.suggestions.length === 1) {
                const chosen = guess.suggestions[0];
                dispatchGuess({ type: 'selectCountry', country: chosen });
                applyAnswer(chosen);
            } else if (
                guess.highlightedIndex >= 0 &&
                guess.highlightedIndex < guess.suggestions.length
            ) {
                dispatchGuess({
                    type: 'selectCountry',
                    country: guess.suggestions[guess.highlightedIndex],
                });
            } else if (guess.selectedCountry && guess.isCorrect === null) {
                handleSubmit();
            } else if (guess.isCorrect !== null) {
                handleNextPuzzle();
            }
        } else if (guess.suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                dispatchGuess({
                    type: 'setHighlightedIndex',
                    value:
                        guess.highlightedIndex < guess.suggestions.length - 1
                            ? guess.highlightedIndex + 1
                            : 0,
                });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                dispatchGuess({
                    type: 'setHighlightedIndex',
                    value:
                        guess.highlightedIndex > 0
                            ? guess.highlightedIndex - 1
                            : guess.suggestions.length - 1,
                });
            }
        }
    };

    const getSubmitButtonText = () => {
        if (guess.isCorrect === null) return 'Submit';
        if (!puzzle) return 'Error loading puzzle';
        if (guess.isCorrect) return `Correct! The answer is ${puzzle.country.name}`;
        return `Incorrect. The answer is ${puzzle.country.name}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!puzzle) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500">{loadError ?? 'Failed to load puzzle'}</p>
                <Link href={QUIZ_BASE_PATH} className="text-blue-600 hover:text-blue-800 underline">
                    Load a random puzzle
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Every Country is Unique</h1>

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formattedClues.map((formattedClue, index) => (
                        <div
                            key={index}
                            className="p-6 bg-white rounded-lg shadow-md border border-gray-200 relative group"
                        >
                            <p className="text-lg text-gray-800">
                                <span className="font-semibold text-blue-600">Clue {index + 1}:</span>{' '}
                                {formattedClue}
                            </p>
                            {guess.isCorrect !== null && puzzle.alternativeCountries[index] && (
                                <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 z-50">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">
                                        Without this clue, these countries would also match:
                                    </p>
                                    <div className="bg-white shadow-sm rounded-lg p-3">
                                        <div className="flex flex-wrap gap-2">
                                            {puzzle.alternativeCountries[index].map((countryCode: string) => {
                                                const country = countries.find((c) => c.code === countryCode);
                                                return (
                                                    <span
                                                        key={countryCode}
                                                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                                    >
                                                        {country?.flag} {country?.name || countryCode}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="relative mt-8">
                    <input
                        ref={inputRef}
                        type="text"
                        value={guess.searchTerm}
                        onChange={(e) =>
                            dispatchGuess({ type: 'setSearchTerm', value: e.target.value })
                        }
                        onKeyDown={handleKeyNavigation}
                        placeholder="Start typing a country name..."
                        className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    {guess.suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                            {guess.suggestions.map((country, index) => (
                                <div
                                    key={country.code}
                                    onClick={() =>
                                        dispatchGuess({ type: 'selectCountry', country })
                                    }
                                    className={`p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 ${
                                        index === guess.highlightedIndex ? 'bg-gray-100' : ''
                                    }`}
                                >
                                    {country.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!guess.selectedCountry || guess.isCorrect !== null}
                    className={`w-full p-4 rounded-lg text-white font-semibold text-lg transition-colors ${
                        guess.isCorrect === null
                            ? guess.selectedCountry
                                ? 'bg-blue-500 hover:bg-blue-600'
                                : 'bg-gray-300 cursor-not-allowed'
                            : guess.isCorrect
                              ? 'bg-green-500'
                              : 'bg-red-500'
                    }`}
                >
                    {getSubmitButtonText()}
                </button>

                <div className="w-full flex flex-col items-center mt-2">
                    <span className="text-base font-semibold text-gray-700">
                        Score: {correctGuesses} out of {totalGuesses}
                    </span>
                </div>

                {guess.isCorrect !== null && (
                    <button
                        onClick={handleNextPuzzle}
                        className="w-full p-4 bg-blue-500 text-white rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors"
                    >
                        Next Puzzle
                    </button>
                )}

                {showKeyboardControls && (
                    <div className="border-t border-gray-200 mt-8 pt-6">
                        <h3 className="text-sm font-semibold text-gray-600 mb-4">Keyboard Controls</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                            <div>
                                <p className="mb-2">
                                    <span className="font-medium">↑/↓ Arrow Keys:</span> Navigate through
                                    country suggestions
                                </p>
                                <p className="mb-2">
                                    <span className="font-medium">Enter:</span> Select highlighted country or
                                    submit answer
                                </p>
                            </div>
                            <div>
                                <p className="mb-2">
                                    <span className="font-medium">Type 3+ Letters:</span> Search for countries
                                </p>
                                <p>
                                    <span className="font-medium">Enter (after answer):</span> Move to next
                                    puzzle
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
