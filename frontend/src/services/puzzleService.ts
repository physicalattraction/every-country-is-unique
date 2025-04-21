import { apiConfig } from '@/config/api';
import { PuzzleResponseDto } from './types';

class PuzzleService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = apiConfig.baseUrl;
        console.log('PuzzleService initialized with baseUrl:', this.baseUrl);
    }

    async getRandomPuzzle(): Promise<PuzzleResponseDto> {
        try {
            const url = `${this.baseUrl}/puzzles/random`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch random puzzle: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching random puzzle:', error);
            throw error;
        }
    }

    async getPuzzleById(id: number): Promise<PuzzleResponseDto> {
        try {
            const url = `${this.baseUrl}/puzzles/${id}`;

            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Puzzle with id ${id} not found`);
                }
                throw new Error(`Failed to fetch puzzle: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching puzzle:', error);
            throw error;
        }
    }
}

export const puzzleService = new PuzzleService(); 