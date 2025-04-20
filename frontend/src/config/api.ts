// During build time, we don't have access to environment variables
// so we'll use a default value that will be replaced at runtime
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiConfig = {
  baseUrl,
  endpoints: {
    countries: '/countries',
    puzzles: '/puzzles',
  },
} as const; 