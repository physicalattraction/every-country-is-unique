import { API_CONFIG } from '@/config/api';

export interface Country {
  code: string;
  name: string;
  flag: string;
}

class CountryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    console.log('CountryService initialized with baseUrl:', this.baseUrl);
  }

  async getAllCountries(): Promise<Country[]> {
    try {
      const url = `${this.baseUrl}${API_CONFIG.endpoints.countries}`;
      console.log('Fetching countries from:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch countries: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw error;
    }
  }
}

export const countryService = new CountryService(); 