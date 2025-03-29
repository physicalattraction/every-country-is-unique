import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-center gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="bg-black bg-opacity-50 text-white hover:bg-opacity-60 px-6 py-2 text-sm font-medium rounded min-w-[120px] text-center"
            >
              Home
            </Link>
            <Link 
              href="/countries" 
              className="bg-black bg-opacity-50 text-white hover:bg-opacity-60 px-6 py-2 text-sm font-medium rounded min-w-[120px] text-center"
            >
              Countries
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 