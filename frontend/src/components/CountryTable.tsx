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
            </th>
            <th scope="col" className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Flag
            </th>
            <th scope="col" className="w-[25%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Code
            </th>
            <th scope="col" className="w-[45%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="w-[5%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {countries.map((country, index) => (
            <tr 
              key={country.code} 
              className={`hover:bg-gray-50 ${
                selectedCode === country.code ? 'bg-blue-50' : ''
              }`}
            >
              <td 
                className="w-[10%] px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 cursor-pointer"
                onClick={() => onSelectCountry(country.code)}
              >
                {index + 1}
              </td>
              <td 
                className="w-[15%] px-6 py-4 whitespace-nowrap text-2xl cursor-pointer"
                onClick={() => onSelectCountry(country.code)}
              >
                {country.flag}
              </td>
              <td 
                className="w-[25%] px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer"
                onClick={() => onSelectCountry(country.code)}
              >
                {country.code}
              </td>
              <td 
                className="w-[45%] px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                onClick={() => onSelectCountry(country.code)}
              >
                {country.name}
              </td>
              <td className="w-[5%] px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button
                  onClick={() => speakCountryName(country.name)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Click to hear pronunciation"
                >
                  🔊
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 