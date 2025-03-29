import { OptimizedImage } from '@/components/Image';
import { Navbar } from '@/components/Navbar';

interface HeaderProps {
  currentPage: 'home' | 'countries';
}

export function Header({ currentPage }: HeaderProps) {
  return (
    <section className="relative w-full">
      <div className="h-36">
        <OptimizedImage
          src="/images/ECU_header_01.jpeg"
          alt="Ecuadorian landscape"
          width={1920}
          height={1080}
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-between py-8">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl font-bold">Every Country Is Unique</h1>
          </div>
          <Navbar currentPage={currentPage} />
        </div>
      </div>
    </section>
  );
} 