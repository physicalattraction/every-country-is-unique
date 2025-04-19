'use client';

import { Header } from '@/components/Header';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header currentPage="quiz" />

      {/* Sub Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4 overflow-x-auto">
            <Link
              href="/quiz/country-by-uniqueness"
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${pathname === '/quiz/country-by-uniqueness'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Country by uniqueness
            </Link>
            <Link
              href="/quiz/country-by-flag"
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${pathname === '/quiz/country-by-flag'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Country by flag
            </Link>
            <Link
              href="/quiz/flag-by-country"
              className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${pathname === '/quiz/flag-by-country'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Flag by country
            </Link>
          </div>
        </div>
      </div>

      {children}
    </main>
  );
} 