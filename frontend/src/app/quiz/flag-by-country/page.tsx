'use client';

import { useState, useEffect } from 'react';
import { countryService } from '@/services/countryService';
import { CountryResponseDto } from '@/services/types';

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default function FlagByCountryQuiz() {
  const [countries, setCountries] = useState<CountryResponseDto[]>([]);
  const [currentCountry, setCurrentCountry] = useState<CountryResponseDto | null>(null);
  const [options, setOptions] = useState<CountryResponseDto[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch countries once on initial load
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
    // Reset state
    setSelectedAnswer(null);

    // Pick random country
    const randomIndex = Math.floor(Math.random() * availableCountries.length);
    const selectedCountry = availableCountries[randomIndex];

    // Get 5 other random countries
    const otherCountries = availableCountries
      .filter(country => country.code !== selectedCountry.code)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    // Combine and shuffle all options
    const allOptions = shuffleArray([selectedCountry, ...otherCountries]);

    setCurrentCountry(selectedCountry);
    setOptions(allOptions);
  };

  const handleAnswer = (countryCode: string) => {
    setSelectedAnswer(countryCode);
  };

  const handleNextRound = () => {
    startNewRound(countries);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          What is the flag of {currentCountry?.name}?
        </h2>

        {currentCountry && (
          <div className="space-y-8">
            {/* Options Grid */}
            <div className="grid grid-cols-3 gap-4">
              {options.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleAnswer(country.code)}
                  disabled={selectedAnswer !== null}
                  className={`
                    p-4 text-7xl font-medium rounded-lg transition-colors flex items-center justify-center
                    ${selectedAnswer === null 
                      ? 'bg-white hover:bg-gray-50' 
                      : country.code === currentCountry.code
                        ? 'bg-green-500'
                        : selectedAnswer === country.code
                          ? 'bg-red-500'
                          : 'bg-white'
                    }
                    ${selectedAnswer === null ? 'hover:shadow-md' : ''}
                    border border-gray-200 aspect-square
                  `}
                >
                  {country.flag}
                </button>
              ))}
            </div>

            {/* Next Button */}
            {selectedAnswer !== null && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleNextRound}
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Next Country
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 