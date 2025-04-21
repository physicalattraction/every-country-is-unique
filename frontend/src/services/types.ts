export interface CurrencyDto {
  code: string;
  name: string;
  symbol?: string;
}

export interface LanguageDto {
  code: string;
  name: string;
}

export interface CountryResponseDto {
  code: string;
  name: string;
  flag: string;
  currencies?: CurrencyDto[];
  languages?: LanguageDto[];
}

export interface PuzzleResponseDto {
  id: number;
  country: CountryResponseDto;
  clues: {
    source: string;
    key: string;
    value: string;
  }[];
  alternativeCountries: string[][];
  deduplicationKey: string;
} 