'use client';

import { countryService } from '@/services/countryService';
import { puzzleService } from '@/services/puzzleService';
import { CountryResponseDto, PuzzleResponseDto } from '@/services/types';
import { formatClue } from '@/utils/formatting';
import { debounce } from 'lodash';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

function hasTouchInput() {
    if (typeof window === 'undefined') return false;

    // Check if the device uses touch as primary input
    return window.matchMedia('(pointer: coarse)').matches;
}

export default function EveryCountryIsUniqueQuiz() {
    const [puzzle, setPuzzle] = useState<PuzzleResponseDto | null>(null);
    const [formattedClues, setFormattedClues] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<CountryResponseDto[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<CountryResponseDto | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [countries, setCountries] = useState<CountryResponseDto[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const [showKeyboardControls, setShowKeyboardControls] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        function checkInputMethod() {
            setShowKeyboardControls(!hasTouchInput());
        }

        // Initial check
        checkInputMethod();

        // Create a media query list
        const mediaQuery = window.matchMedia('(pointer: coarse)');

        // Add event listener for media query changes
        mediaQuery.addEventListener('change', checkInputMethod);

        // Cleanup
        return () => {
            mediaQuery.removeEventListener('change', checkInputMethod);
        };
    }, []);

    // Reset highlighted index when suggestions change
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [suggestions]);

    // Focus input when puzzle changes
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

    const handleKeyNavigation = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (suggestions.length === 1) {
                // If there's only one suggestion, select it and submit
                selectCountry(suggestions[0]);
                handleSubmit();
            } else if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                // If an option is highlighted, select it
                selectCountry(suggestions[highlightedIndex]);
            } else if (selectedCountry && isCorrect === null) {
                // If a country is already selected, submit
                handleSubmit();
            } else if (isCorrect !== null) {
                // If we've already submitted, go to next puzzle
                handleNextPuzzle();
            }
        } else if (suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
            }
        }
    };

    // Fetch all countries when component mounts
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

    // Update formatted clues when puzzle or countries change
    useEffect(() => {
        if (puzzle && countries.length > 0) {
            const formatted = puzzle.clues.map((clue: { source: string; key: string; value: string }) => formatClue(clue, countries));
            setFormattedClues(formatted);
        }
    }, [puzzle, countries]);

    const fetchRandomPuzzle = useCallback(async () => {
        try {
            const data = await puzzleService.getRandomPuzzle();
            setPuzzle(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching random puzzle:', error);
            setIsLoading(false);
            setPuzzle(null);
        }
    }, []);

    useEffect(() => {
        fetchRandomPuzzle();
    }, [fetchRandomPuzzle]);

    const searchCountries = useCallback(
        debounce(async (term: string) => {
            // If the term is less than 3 characters, don't show any suggestions
            if (term.length < 3) {
                setSuggestions([]);
                return;
            }

            // Check for exact match first
            const exactMatch = countries.find(
                country => country.name.toLowerCase() === term.toLowerCase()
            );

            if (exactMatch) {
                setSelectedCountry(exactMatch);
                setSuggestions([]);
                return;
            }

            // If no exact match, show suggestions
            const filteredCountries = countries.filter(country =>
                country.name.toLowerCase().includes(term.toLowerCase())
            );
            setSuggestions(filteredCountries);
        }, 500),
        [selectedCountry, countries]
    );

    useEffect(() => {
        searchCountries(searchTerm);
    }, [searchTerm, searchCountries]);

    const handleSubmit = () => {
        if (!selectedCountry || !puzzle) return;
        const isAnswerCorrect = selectedCountry.code === puzzle.country.code;
        setIsCorrect(isAnswerCorrect);
    };

    const getSubmitButtonText = () => {
        if (isCorrect === null) return 'Submit';
        if (!puzzle) return 'Error loading puzzle';
        if (isCorrect) return `Correct! The answer is ${puzzle.country.name}`;
        return `Incorrect. The answer is ${puzzle.country.name}`;
    };

    const handleNextPuzzle = () => {
        setPuzzle(null);
        setSearchTerm('');
        setSuggestions([]);
        setSelectedCountry(null);
        setIsCorrect(null);
        setIsLoading(true);
        fetchRandomPuzzle();
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
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-red-500">Failed to load puzzle</p>
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
                            {isCorrect !== null && puzzle.alternativeCountries[index] && (
                                <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 z-50">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Without this clue, these countries would also match:</p>
                                    <div className="bg-white shadow-sm rounded-lg p-3">
                                        <div className="flex flex-wrap gap-2">
                                            {puzzle.alternativeCountries[index].map((countryCode: string) => {
                                                const country = countries.find(c => c.code === countryCode);
                                                return (
                                                    <span key={countryCode} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
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

                            // Clear selected country if the input doesn't match it exactly
                            if (selectedCountry && selectedCountry.name.toLowerCase() !== newTerm.toLowerCase()) {
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
                                    className={`p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0 ${index === highlightedIndex ? 'bg-gray-100' : ''
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
                    className={`w-full p-4 rounded-lg text-white font-semibold text-lg transition-colors ${isCorrect === null
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

                {isCorrect !== null && (
                    <button
                        onClick={handleNextPuzzle}
                        className="w-full p-4 bg-blue-500 text-white rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors"
                    >
                        Next Puzzle
                    </button>
                )}

                {/* Keyboard Controls Section - Only show on non-touch devices */}
                {showKeyboardControls && (
                    <div className="border-t border-gray-200 mt-8 pt-6">
                        <h3 className="text-sm font-semibold text-gray-600 mb-4">Keyboard Controls</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                            <div>
                                <p className="mb-2">
                                    <span className="font-medium">↑/↓ Arrow Keys:</span> Navigate through country suggestions
                                </p>
                                <p className="mb-2">
                                    <span className="font-medium">Enter:</span> Select highlighted country or submit answer
                                </p>
                            </div>
                            <div>
                                <p className="mb-2">
                                    <span className="font-medium">Type 3+ Letters:</span> Search for countries
                                </p>
                                <p>
                                    <span className="font-medium">Enter (after answer):</span> Move to next puzzle
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 