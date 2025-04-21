// The API URL must be set via the NEXT_PUBLIC_API_URL environment variable
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiConfig = {
  baseUrl,
  endpoints: {
    countries: '/countries',
    puzzles: '/puzzles',
  },
} as const; 