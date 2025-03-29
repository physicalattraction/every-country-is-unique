'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { CountryTable } from '@/components/CountryTable';
import { CountryDetails } from '@/components/CountryDetails';
import { countryService } from '@/services/countryService';
import { CountryResponseDto } from '@/services/types';

export default function CountriesPage() {
  const [countries, setCountries] = useState<CountryResponseDto[]>([]);
  const [totalCountries, setTotalCountries] = useState<number>(0);
  const [selectedCountry, setSelectedCountry] = useState<CountryResponseDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Fetch total count once on initial load
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        const data = await countryService.getAllCountries();
        setTotalCountries(data.length);
      } catch (err) {
        console.error('Error fetching total count:', err);
      }
    };

    fetchTotalCount();
  }, []);

  // Fetch filtered countries when search term changes
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await countryService.getAllCountries(searchTerm);
        setCountries(data);
      } catch (err) {
        console.error('Error fetching countries:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch countries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountries();
  }, [searchTerm]);

  const handleCountrySelect = async (code: string) => {
    setIsLoadingDetails(true);
    setDetailsError(null);
    try {
      const country = await countryService.getCountryByCode(code);
      setSelectedCountry(country);
    } catch (err) {
      console.error('Error fetching country details:', err);
      setDetailsError(err instanceof Error ? err.message : 'Failed to fetch country details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header currentPage="countries" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-800 mb-8">
            Explore all {totalCountries} countries
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              {error}
            </div>
          ) : (
            <div className="flex gap-8">
              {/* Left panel with table */}
              <div className="flex-1">
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder="Search by country name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
                  <CountryTable 
                    countries={countries}
                    onSelectCountry={handleCountrySelect}
                    selectedCode={selectedCountry?.code}
                  />
                </div>
              </div>

              {/* Right panel with details */}
              <div className="w-[21rem] bg-white rounded-lg shadow-md sticky top-8 h-fit overflow-y-auto">
                <CountryDetails
                  country={selectedCountry}
                  isLoading={isLoadingDetails}
                  error={detailsError}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 