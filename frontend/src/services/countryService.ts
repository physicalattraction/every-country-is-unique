import { apiConfig } from '@/config/api';
import { CountryResponseDto } from './types';

export interface Country {
  code: string;
  name: string;
  flag: string;
}

class CountryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = apiConfig.baseUrl;
    console.log('CountryService initialized with baseUrl:', this.baseUrl);
  }

  async getAllCountries(search?: string): Promise<CountryResponseDto[]> {
    try {
      const url = new URL(`${this.baseUrl}${apiConfig.endpoints.countries}`);
      if (search) {
        url.searchParams.append('search', search);
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch countries: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }

  async getCountryByCode(code: string): Promise<CountryResponseDto> {
    try {
      const url = `${this.baseUrl}${apiConfig.endpoints.countries}/${code}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Country with code ${code} not found`);
        }
        throw new Error(`Failed to fetch country: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching country:', error);
      throw error;
    }
  }
}

export const countryService = new CountryService(); 