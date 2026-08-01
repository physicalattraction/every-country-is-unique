'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { QUIZ_BASE_PATH } from '@/components/EveryCountryIsUniqueQuiz';
import { puzzleService } from '@/services/puzzleService';

export default function EveryCountryIsUniqueQuizPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [retryToken, setRetryToken] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setError(null);

        const redirectToRandomPuzzle = async () => {
            try {
                const data = await puzzleService.getRandomPuzzle();
                if (!cancelled) {
                    router.replace(`${QUIZ_BASE_PATH}/${data.id}`);
                }
            } catch (err) {
                console.error('Error fetching random puzzle:', err);
                if (!cancelled) {
                    setError('Failed to load puzzle');
                }
            }
        };

        redirectToRandomPuzzle();

        return () => {
            cancelled = true;
        };
    }, [router, retryToken]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-500">{error}</p>
                <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 underline"
                    onClick={() => setRetryToken((token) => token + 1)}
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
    );
}
