import { OptimizedImage } from '@/components/Image';
import { Navbar } from '@/components/Navbar';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <section className="relative h-[20vh] w-full">
      <OptimizedImage
        src="/images/ECU_header_01.jpeg"
        alt="Ecuadorian landscape"
        width={1920}
        height={1080}
        className="object-cover w-full h-full"
      />
      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-5xl font-bold">{title}</h1>
        </div>
      </div>
      <Navbar />
    </section>
  );
} 