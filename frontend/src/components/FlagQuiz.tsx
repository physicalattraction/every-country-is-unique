'use client';

import { countryService } from '@/services/countryService';
import { CountryResponseDto } from '@/services/types';
import { useEffect, useRef, useState } from 'react';

export type FlagQuizMode = 'country-by-flag' | 'flag-by-country';

interface FlagQuizProps {
    mode: FlagQuizMode;
}

interface FlagQuizModeConfig {
    title: (country: CountryResponseDto | null) => string;
    nextLabel: string;
    gridClass: string;
    showPromptFlag: boolean;
    optionLabel: (country: CountryResponseDto) => string;
    optionBaseClass: string;
    optionAnsweredTextClass: string;
    optionDefaultTextClass: string;
}

const FLAG_QUIZ_MODE: Record<FlagQuizMode, FlagQuizModeConfig> = {
    'country-by-flag': {
        title: () => 'Which country has this flag?',
        nextLabel: 'Next Flag',
        gridClass: 'grid-cols-2',
        showPromptFlag: true,
        optionLabel: (country) => country.name,
        optionBaseClass: 'p-4 text-lg font-medium rounded-lg transition-colors border border-gray-200',
        optionAnsweredTextClass: ' text-white',
        optionDefaultTextClass: ' text-gray-800',
    },
    'flag-by-country': {
        title: (country) => `What is the flag of ${country?.name}?`,
        nextLabel: 'Next Country',
        gridClass: 'grid-cols-3',
        showPromptFlag: false,
        optionLabel: (country) => country.flag,
        optionBaseClass:
            'p-4 text-7xl font-medium rounded-lg transition-colors flex items-center justify-center border border-gray-200 aspect-square',
        optionAnsweredTextClass: '',
        optionDefaultTextClass: '',
    },
};

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function getOptionButtonClassName(
    config: FlagQuizModeConfig,
    countryCode: string,
    correctCode: string,
    selectedAnswer: string | null,
): string {
    const { optionBaseClass, optionAnsweredTextClass, optionDefaultTextClass } = config;

    if (selectedAnswer === null) {
        return [optionBaseClass, 'bg-white hover:bg-gray-50 hover:shadow-md', optionDefaultTextClass]
            .filter(Boolean)
            .join(' ');
    }

    if (countryCode === correctCode) {
        return `${optionBaseClass} bg-green-500${optionAnsweredTextClass}`;
    }

    if (selectedAnswer === countryCode) {
        return `${optionBaseClass} bg-red-500${optionAnsweredTextClass}`;
    }

    return `${optionBaseClass} bg-white${optionDefaultTextClass}`;
}

function startNewRound(availableCountries: CountryResponseDto[]): {
    selectedCountry: CountryResponseDto;
    options: CountryResponseDto[];
} {
    const randomIndex = Math.floor(Math.random() * availableCountries.length);
    const selectedCountry = availableCountries[randomIndex];
    const otherCountries = shuffleArray(
        availableCountries.filter((country) => country.code !== selectedCountry.code),
    ).slice(0, 5);

    return {
        selectedCountry,
        options: shuffleArray([selectedCountry, ...otherCountries]),
    };
}

export function FlagQuiz({ mode }: FlagQuizProps) {
    const config = FLAG_QUIZ_MODE[mode];
    const [countries, setCountries] = useState<CountryResponseDto[]>([]);
    const [currentCountry, setCurrentCountry] = useState<CountryResponseDto | null>(null);
    const [options, setOptions] = useState<CountryResponseDto[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [correctGuesses, setCorrectGuesses] = useState(0);
    const [totalGuesses, setTotalGuesses] = useState(0);
    const handleNextRoundRef = useRef(() => {});

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const data = await countryService.getAllCountries();
                setCountries(data);
                const round = startNewRound(data);
                setCurrentCountry(round.selectedCountry);
                setOptions(round.options);
            } catch (err) {
                console.error('Error fetching countries:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch countries');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCountries();
    }, []);

    const handleAnswer = (countryCode: string) => {
        setSelectedAnswer(countryCode);
        setTotalGuesses((prev) => prev + 1);
        if (currentCountry && countryCode === currentCountry.code) {
            setCorrectGuesses((prev) => prev + 1);
        }
    };

    const handleNextRound = () => {
        setSelectedAnswer(null);
        const round = startNewRound(countries);
        setCurrentCountry(round.selectedCountry);
        setOptions(round.options);
    };
    handleNextRoundRef.current = handleNextRound;

    useEffect(() => {
        if (selectedAnswer === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleNextRoundRef.current();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedAnswer]);

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

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                    {config.title(currentCountry)}
                </h2>

                {currentCountry && (
                    <div className="space-y-8">
                        {config.showPromptFlag && (
                            <div className="flex justify-center">
                                <div className="text-9xl">{currentCountry.flag}</div>
                            </div>
                        )}

                        <div className={`grid gap-4 ${config.gridClass}`}>
                            {options.map((country) => (
                                <button
                                    key={country.code}
                                    onClick={() => handleAnswer(country.code)}
                                    disabled={selectedAnswer !== null}
                                    className={getOptionButtonClassName(
                                        config,
                                        country.code,
                                        currentCountry.code,
                                        selectedAnswer,
                                    )}
                                >
                                    {config.optionLabel(country)}
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
                                    {config.nextLabel}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
