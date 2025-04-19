'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function QuizRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/quiz/country-by-uniqueness');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
} 