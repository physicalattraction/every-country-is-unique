'use client';

import { countryService } from '@/services/countryService';
import { CountryResponseDto } from '@/services/types';
import { useEffect, useState } from 'react';

export type FlagQuizMode = 'country-by-flag' | 'flag-by-country';

interface FlagQuizProps {
    mode: FlagQuizMode;
}

function hasTouchInput() {
    if (typeof window === 'undefined') return false;

    return window.matchMedia('(pointer: coarse)').matches;
}

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function getTitle(mode: FlagQuizMode, currentCountry: CountryResponseDto | null): string {
    switch (mode) {
        case 'country-by-flag':
            return 'Which country has this flag?';
        case 'flag-by-country':
            return `What is the flag of ${currentCountry?.name}?`;
        default: {
            const _exhaustive: never = mode;
            return _exhaustive;
        }
    }
}

function getNextButtonLabel(mode: FlagQuizMode): string {
    switch (mode) {
        case 'country-by-flag':
            return 'Next Flag';
        case 'flag-by-country':
            return 'Next Country';
        default: {
            const _exhaustive: never = mode;
            return _exhaustive;
        }
    }
}

function getEnterAfterAnswerHelp(mode: FlagQuizMode): string {
    switch (mode) {
        case 'country-by-flag':
            return 'Move to next flag';
        case 'flag-by-country':
            return 'Move to next country';
        default: {
            const _exhaustive: never = mode;
            return _exhaustive;
        }
    }
}

function getOptionButtonClassName(
    mode: FlagQuizMode,
    countryCode: string,
    correctCode: string,
    selectedAnswer: string | null,
): string {
    const isCountryByFlag = mode === 'country-by-flag';
    const base = isCountryByFlag
        ? 'p-4 text-lg font-medium rounded-lg transition-colors border border-gray-200'
        : 'p-4 text-7xl font-medium rounded-lg transition-colors flex items-center justify-center border border-gray-200 aspect-square';

    if (selectedAnswer === null) {
        return [
            base,
            'bg-white hover:bg-gray-50 hover:shadow-md',
            isCountryByFlag ? 'text-gray-800' : '',
        ]
            .filter(Boolean)
            .join(' ');
    }

    if (countryCode === correctCode) {
        return `${base} bg-green-500${isCountryByFlag ? ' text-white' : ''}`;
    }

    if (selectedAnswer === countryCode) {
        return `${base} bg-red-500${isCountryByFlag ? ' text-white' : ''}`;
    }

    return `${base} bg-white${isCountryByFlag ? ' text-gray-800' : ''}`;
}

export function FlagQuiz({ mode }: FlagQuizProps) {
    const [countries, setCountries] = useState<CountryResponseDto[]>([]);
    const [currentCountry, setCurrentCountry] = useState<CountryResponseDto | null>(null);
    const [options, setOptions] = useState<CountryResponseDto[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [correctGuesses, setCorrectGuesses] = useState(0);
    const [totalGuesses, setTotalGuesses] = useState(0);
    const [showKeyboardControls, setShowKeyboardControls] = useState(true);

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
        const fetchCountries = async () => {
            try {
                const data = await countryService.getAllCountries();
                setCountries(data);
                startNewRound(data);
            } catch (err) {
                console.error('Error fetching countries:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch countries');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCountries();
    }, []);

    const startNewRound = (availableCountries: CountryResponseDto[]) => {
        setSelectedAnswer(null);

        const randomIndex = Math.floor(Math.random() * availableCountries.length);
        const selectedCountry = availableCountries[randomIndex];

        const otherCountries = availableCountries
            .filter((country) => country.code !== selectedCountry.code)
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);

        const allOptions = shuffleArray([selectedCountry, ...otherCountries]);

        setCurrentCountry(selectedCountry);
        setOptions(allOptions);
    };

    const handleAnswer = (countryCode: string) => {
        setSelectedAnswer(countryCode);
        setTotalGuesses((prev) => prev + 1);
        if (currentCountry && countryCode === currentCountry.code) {
            setCorrectGuesses((prev) => prev + 1);
        }
    };

    const handleNextRound = () => {
        startNewRound(countries);
    };

    useEffect(() => {
        if (selectedAnswer === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleNextRound();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedAnswer, countries]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center py-8 text-red-600">{error}</div>;
    }

    const isCountryByFlag = mode === 'country-by-flag';

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                    {getTitle(mode, currentCountry)}
                </h2>

                {currentCountry && (
                    <div className="space-y-8">
                        {isCountryByFlag && (
                            <div className="flex justify-center">
                                <div className="text-9xl">{currentCountry.flag}</div>
                            </div>
                        )}

                        <div className={`grid gap-4 ${isCountryByFlag ? 'grid-cols-2' : 'grid-cols-3'}`}>
                            {options.map((country) => (
                                <button
                                    key={country.code}
                                    onClick={() => handleAnswer(country.code)}
                                    disabled={selectedAnswer !== null}
                                    className={getOptionButtonClassName(
                                        mode,
                                        country.code,
                                        currentCountry.code,
                                        selectedAnswer,
                                    )}
                                >
                                    {isCountryByFlag ? country.name : country.flag}
                                </button>
                            ))}
                        </div>

                        <div className="w-full flex flex-col items-center mt-4">
                            <span className="text-base font-semibold text-gray-700">
                                Score: {correctGuesses} out of {totalGuesses}
                            </span>
                        </div>

                        {selectedAnswer !== null && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={handleNextRound}
                                    className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                >
                                    {getNextButtonLabel(mode)}
                                </button>
                            </div>
                        )}

                        {showKeyboardControls && (
                            <div className="border-t border-gray-200 mt-8 pt-6">
                                <h3 className="text-sm font-semibold text-gray-600 mb-4">Keyboard Controls</h3>
                                <div className="text-sm text-gray-500">
                                    <p>
                                        <span className="font-medium">Enter (after answer):</span>{' '}
                                        {getEnterAfterAnswerHelp(mode)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
