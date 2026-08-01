'use client';

import { EveryCountryIsUniqueQuiz } from '@/components/EveryCountryIsUniqueQuiz';

interface PuzzleByIdPageProps {
    params: {
        id: string;
    };
}

export default function PuzzleByIdPage({ params }: PuzzleByIdPageProps) {
    return <EveryCountryIsUniqueQuiz puzzleId={Number(params.id)} />;
}
