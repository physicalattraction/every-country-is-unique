import Link from 'next/link';

interface NavbarProps {
  currentPage: 'home' | 'countries' | 'quiz';
}

export function Navbar({ currentPage }: NavbarProps) {
  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-center gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/home"
              className={`px-6 py-2 text-sm font-medium rounded min-w-[120px] text-center transition-colors ${currentPage === 'home'
                  ? 'bg-white bg-opacity-50 text-black'
                  : 'bg-black bg-opacity-50 text-white hover:bg-opacity-60'
                }`}
            >
              Home
            </Link>
            <Link
              href="/countries"
              className={`px-6 py-2 text-sm font-medium rounded min-w-[120px] text-center transition-colors ${currentPage === 'countries'
                  ? 'bg-white bg-opacity-50 text-black'
                  : 'bg-black bg-opacity-50 text-white hover:bg-opacity-60'
                }`}
            >
              Countries
            </Link>
            <Link
              href="/quiz"
              className={`px-6 py-2 text-sm font-medium rounded min-w-[120px] text-center transition-colors ${currentPage === 'quiz'
                  ? 'bg-white bg-opacity-50 text-black'
                  : 'bg-black bg-opacity-50 text-white hover:bg-opacity-60'
                }`}
            >
              Quiz
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 