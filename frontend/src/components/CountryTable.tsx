import { CountryResponseDto } from '@/services/types';

interface CountryTableProps {
  countries: CountryResponseDto[];
  onSelectCountry: (code: string) => void;
  selectedCode?: string;
}

export function CountryTable({ countries, onSelectCountry, selectedCode }: CountryTableProps) {
  const speakCountryName = (name: string) => {
    const utterance = new SpeechSynthesisUtterance(name);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            <th scope="col" className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Flag
            </th>
            <th scope="col" className="w-[25%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Code
            </th>
            <th scope="col" className="w-[50%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {countries.map((country, index) => (
            <tr 
              key={country.code} 
              className={`hover:bg-gray-50 cursor-pointer ${
                selectedCode === country.code ? 'bg-blue-50' : ''
              }`}
              onClick={() => {
                speakCountryName(country.name);
                onSelectCountry(country.code);
              }}
              title="Click to view details and hear pronunciation"
            >
              <td className="w-[10%] px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                {index + 1}
              </td>
              <td className="w-[15%] px-6 py-4 whitespace-nowrap text-2xl">
                {country.flag}
              </td>
              <td className="w-[25%] px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {country.code}
              </td>
              <td className="w-[50%] px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {country.name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 