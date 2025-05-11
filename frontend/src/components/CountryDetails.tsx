import { CountryResponseDto } from '@/services/types';

interface CountryDetailsProps {
  country: CountryResponseDto | null;
  isLoading: boolean;
  error: string | null;
}

export function CountryDetails({ country, isLoading, error }: CountryDetailsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (!country) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-500">
        Select a country to view details
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center space-x-4">
        <span className="text-4xl">{country.flag}</span>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{country.name}</h2>
          <p className="text-sm text-gray-500">Code: {country.code}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Demographics</h3>
        <ul className="space-y-1">
          {(country.population !== undefined && country.population !== null) && (
            <li className="flex items-center space-x-2">
              <span className="font-medium">Population:</span>
              <span>{country.population.toLocaleString()}</span>
            </li>
          )}
          {(country.area !== undefined && country.area !== null) && (
            <li className="flex items-center space-x-2">
              <span className="font-medium">Area:</span>
              <span>{country.area.toLocaleString()} km²</span>
            </li>
          )}
          {(country.populationDensity !== undefined && country.populationDensity !== null) && (
            <li className="flex items-center space-x-2">
              <span className="font-medium">Population Density:</span>
              <span>{country.populationDensity.toLocaleString()} people/km²</span>
            </li>
          )}
        </ul>
      </div>

      {country.currencies && country.currencies.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Currencies</h3>
          <ul className="space-y-1">
            {country.currencies.map((currency) => (
              <li key={currency.code} className="flex items-center space-x-2">
                <span className="font-medium">{currency.code}</span>
                <span className="text-gray-600">-</span>
                <span>{currency.name}</span>
                {currency.symbol && (
                  <>
                    <span className="text-gray-600">-</span>
                    <span>{currency.symbol}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {country.languages && country.languages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Languages</h3>
          <ul className="space-y-1">
            {country.languages.map((language) => (
              <li key={language.code} className="flex items-center space-x-2">
                <span className="font-medium">{language.code}</span>
                <span className="text-gray-600">-</span>
                <span>{language.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 