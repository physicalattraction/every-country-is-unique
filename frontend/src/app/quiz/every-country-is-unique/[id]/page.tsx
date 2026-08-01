import { EveryCountryIsUniqueQuiz } from '@/components/EveryCountryIsUniqueQuiz';
import { notFound } from 'next/navigation';

interface PuzzleByIdPageProps {
    params: {
        id: string;
    };
}

export default function PuzzleByIdPage({ params }: PuzzleByIdPageProps) {
    if (!/^\d+$/.test(params.id)) {
        notFound();
    }

    return <EveryCountryIsUniqueQuiz puzzleId={Number(params.id)} />;
}
