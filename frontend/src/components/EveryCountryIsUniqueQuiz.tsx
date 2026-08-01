'use client';

import { countryService } from '@/services/countryService';
import { puzzleService } from '@/services/puzzleService';
import { CountryResponseDto, PuzzleResponseDto } from '@/services/types';
import { formatClue } from '@/utils/formatting';
import { debounce } from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const QUIZ_BASE_PATH = '/quiz/every-country-is-unique';

function hasTouchInput() {
    if (typeof window === 'undefined') return false;

    // Check if the device uses touch as primary input
    return window.matchMedia('(pointer: coarse)').matches;
}

function resetGuessState(
    setSearchTerm: (value: string) => void,
    setSuggestions: (value: CountryResponseDto[]) => void,
    setSelectedCountry: (value: CountryResponseDto | null) => void,
    setIsCorrect: (value: boolean | null) => void,
) {
    setSearchTerm('');
    setSuggestions([]);
    setSelectedCountry(null);
    setIsCorrect(null);
}

interface EveryCountryIsUniqueQuizProps {
    puzzleId?: number;
}

export function EveryCountryIsUniqueQuiz({ puzzleId }: EveryCountryIsUniqueQuizProps) {
    const [puzzle, setPuzzle] = useState<PuzzleResponseDto | null>(null);
    const [formattedClues, setFormattedClues] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<CountryResponseDto[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<CountryResponseDto | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [countries, setCountries] = useState<CountryResponseDto[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [showKeyboardControls, setShowKeyboardControls] = useState(true);
    const [correctGuesses, setCorrectGuesses] = useState(0);
    const [totalGuesses, setTotalGuesses] = useState(0);
    const [reloadToken, setReloadToken] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const loadedPuzzleIdRef = useRef<number | null>(null);
    const router = useRouter();

    useEffect(() => {
        function checkInputMethod() {
            setShowKeyboardControls(!hasTouchInput());
        }

        checkInputMethod();

        const mediaQuery = window.matchMedia('(pointer: coarse)');
        mediaQuery.addEventListener('change', checkInputMethod);

        return () => {
            mediaQuery.removeEventListener('change', checkInputMethod);
        };
    }, []);

    useEffect(() => {
        setHighlightedIndex(-1);
    }, [suggestions]);

    useEffect(() => {
        if (puzzle && !isLoading) {
            inputRef.current?.focus();
        }
    }, [puzzle, isLoading]);

    const selectCountry = (country: CountryResponseDto) => {
        setSelectedCountry(country);
        setSearchTerm(country.name);
        setSuggestions([]);
        setHighlightedIndex(-1);
    };

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
        if (puzzle && countries.length > 0) {
            const formatted = puzzle.clues.map(
                (clue: { source: string; key: string; value: string }) => formatClue(clue, countries),
            );
            setFormattedClues(formatted);
        }
    }, [puzzle, countries]);

    useEffect(() => {
        let cancelled = false;

        const loadPuzzle = async () => {
            if (puzzleId !== undefined) {
                if (Number.isNaN(puzzleId)) {
                    loadedPuzzleIdRef.current = null;
                    setPuzzle(null);
                    setLoadError('Invalid puzzle id');
                    setIsLoading(false);
                    return;
                }

                if (loadedPuzzleIdRef.current === puzzleId) {
                    setIsLoading(false);
                    return;
                }

                setIsLoading(true);
                setLoadError(null);
                try {
                    const data = await puzzleService.getPuzzleById(puzzleId);
                    if (cancelled) return;
                    loadedPuzzleIdRef.current = data.id;
                    setPuzzle(data);
                    resetGuessState(setSearchTerm, setSuggestions, setSelectedCountry, setIsCorrect);
                } catch (error) {
                    console.error('Error fetching puzzle:', error);
                    if (cancelled) return;
                    loadedPuzzleIdRef.current = null;
                    setPuzzle(null);
                    setLoadError('Puzzle not found');
                } finally {
                    if (!cancelled) {
                        setIsLoading(false);
                    }
                }
                return;
            }

            // No id in the URL: pick a random puzzle and replace the URL.
            // Stay on the loading state until the [id] route takes over.
            setIsLoading(true);
            setLoadError(null);
            try {
                const data = await puzzleService.getRandomPuzzle();
                if (cancelled) return;
                router.replace(`${QUIZ_BASE_PATH}/${data.id}`);
            } catch (error) {
                console.error('Error fetching random puzzle:', error);
                if (cancelled) return;
                loadedPuzzleIdRef.current = null;
                setPuzzle(null);
                setLoadError('Failed to load puzzle');
                setIsLoading(false);
            }
        };

        loadPuzzle();

        return () => {
            cancelled = true;
        };
    }, [puzzleId, reloadToken, router]);

    const searchCountries = useCallback(
        debounce(async (term: string) => {
            if (term.length < 3) {
                setSuggestions([]);
                return;
            }

            const exactMatch = countries.find(
                (country) => country.name.toLowerCase() === term.toLowerCase(),
            );

            if (exactMatch) {
                setSelectedCountry(exactMatch);
                setSuggestions([]);
                return;
            }

            const filteredCountries = countries.filter((country) =>
                country.name.toLowerCase().includes(term.toLowerCase()),
            );
            setSuggestions(filteredCountries);
        }, 500),
        [countries],
    );

    useEffect(() => {
        searchCountries(searchTerm);
    }, [searchTerm, searchCountries]);

    const handleSubmit = () => {
        if (!selectedCountry || !puzzle) return;
        const isAnswerCorrect = selectedCountry.code === puzzle.country.code;
        setIsCorrect(isAnswerCorrect);
        setTotalGuesses((prev) => prev + 1);
        if (isAnswerCorrect) {
            setCorrectGuesses((prev) => prev + 1);
        }
    };

    const handleNextPuzzle = async () => {
        resetGuessState(setSearchTerm, setSuggestions, setSelectedCountry, setIsCorrect);
        setIsLoading(true);
        setLoadError(null);
        try {
            const data = await puzzleService.getRandomPuzzle();
            loadedPuzzleIdRef.current = data.id;
            setPuzzle(data);
            router.replace(`${QUIZ_BASE_PATH}/${data.id}`);
        } catch (error) {
            console.error('Error fetching random puzzle:', error);
            loadedPuzzleIdRef.current = null;
            setPuzzle(null);
            setLoadError('Failed to load puzzle');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyNavigation = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (suggestions.length === 1) {
                selectCountry(suggestions[0]);
                handleSubmit();
            } else if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                selectCountry(suggestions[highlightedIndex]);
            } else if (selectedCountry && isCorrect === null) {
                handleSubmit();
            } else if (isCorrect !== null) {
                handleNextPuzzle();
            }
        } else if (suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
            }
        }
    };

    const getSubmitButtonText = () => {
        if (isCorrect === null) return 'Submit';
        if (!puzzle) return 'Error loading puzzle';
        if (isCorrect) return `Correct! The answer is ${puzzle.country.name}`;
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
                {puzzleId !== undefined ? (
                    <Link href={QUIZ_BASE_PATH} className="text-blue-600 hover:text-blue-800 underline">
                        Load a random puzzle
                    </Link>
                ) : (
                    <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 underline"
                        onClick={() => {
                            loadedPuzzleIdRef.current = null;
                            setReloadToken((token) => token + 1);
                        }}
                    >
                        Try again
                    </button>
                )}
            </div>
        );
    }

    return (
        <>
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
                                {isCorrect !== null && puzzle.alternativeCountries[index] && (
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
                            value={searchTerm}
                            onChange={(e) => {
                                const newTerm = e.target.value;
                                setSearchTerm(newTerm);

                                if (
                                    selectedCountry &&
                                    selectedCountry.name.toLowerCase() !== newTerm.toLowerCase()
                                ) {
                                    setSelectedCountry(null);
                                }
                            }}
                            onKeyDown={handleKeyNavigation}
                            placeholder="Start typing a country name..."
                            className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        {suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                                {suggestions.map((country, index) => (
                                    <div
                                        key={country.code}
                                        onClick={() => selectCountry(country)}
                                        className={`p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 ${
                                            index === highlightedIndex ? 'bg-gray-100' : ''
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
                        disabled={!selectedCountry || isCorrect !== null}
                        className={`w-full p-4 rounded-lg text-white font-semibold text-lg transition-colors ${
                            isCorrect === null
                                ? selectedCountry
                                    ? 'bg-blue-500 hover:bg-blue-600'
                                    : 'bg-gray-300 cursor-not-allowed'
                                : isCorrect
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

                    {isCorrect !== null && (
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
        </>
    );
}
