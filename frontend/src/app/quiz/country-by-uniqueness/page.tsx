'use client';

import { debounce } from 'lodash';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface CurrencyDto {
    code: string;
    name: string;
    symbol?: string;
}

interface LanguageDto {
    code: string;
    name: string;
}

interface CountryResponseDto {
    code: string;
    name: string;
    flag: string;
    currencies: CurrencyDto[];
    languages: LanguageDto[];
}

interface ClueResponseDto {
    id: number;
    text: string;
}

interface PuzzleResponseDto {
    id: number;
    country: CountryResponseDto;
    clues: ClueResponseDto[];
}

export default function CountryByUniquenessQuiz() {
    const [puzzle, setPuzzle] = useState<PuzzleResponseDto | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<CountryResponseDto[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<CountryResponseDto | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchRandomPuzzle = useCallback(async () => {
        try {
            const response = await fetch('/api/puzzles/random');
            if (!response.ok) throw new Error('Failed to fetch puzzle');
            const data = await response.json();
            setPuzzle(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching puzzle:', error);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRandomPuzzle();
    }, [fetchRandomPuzzle]);

    const searchCountries = useCallback(
        debounce(async (term: string) => {
            if (term.length < 3) {
                setSuggestions([]);
                return;
            }

            try {
                const response = await fetch(`/api/countries?search=${term}`);
                if (!response.ok) throw new Error('Failed to fetch countries');
                const data = await response.json();
                setSuggestions(data);
            } catch (error) {
                console.error('Error searching countries:', error);
                setSuggestions([]);
            }
        }, 500),
        []
    );

    useEffect(() => {
        searchCountries(searchTerm);
    }, [searchTerm, searchCountries]);

    const handleSubmit = () => {
        if (!selectedCountry || !puzzle) return;
        const isAnswerCorrect = selectedCountry.code === puzzle.country.code;
        setIsCorrect(isAnswerCorrect);
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
            <h1 className="text-3xl font-bold mb-8 text-center">Country by Uniqueness</h1>

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="space-y-4">
                    {puzzle.clues.map((clue) => (
                        <div key={clue.id} className="p-4 bg-gray-100 rounded-lg">
                            <p className="text-lg">{clue.text}</p>
                        </div>
                    ))}
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Start typing a country name..."
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {suggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                            {suggestions.map((country) => (
                                <div
                                    key={country.code}
                                    onClick={() => {
                                        setSelectedCountry(country);
                                        setSearchTerm(country.name);
                                        setSuggestions([]);
                                    }}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                >
                                    {country.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!selectedCountry}
                    className={`w-full p-3 rounded-lg text-white font-semibold ${isCorrect === null
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : isCorrect
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-red-500 hover:bg-red-600'
                        }`}
                >
                    Submit
                </button>

                {isCorrect !== null && (
                    <button
                        onClick={handleNextPuzzle}
                        className="w-full p-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600"
                    >
                        Next Puzzle
                    </button>
                )}
            </div>
        </div>
    );
} 