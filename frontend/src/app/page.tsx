import { OptimizedImage } from '@/components/Image';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header currentPage="home" />

      {/* Content Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Every Country Is Unique</h2>
            <p className="text-lg text-gray-600">
              Welcome to our work in progress! We&apos;re building an exciting platform for exploring 
              the world&apos;s countries. Currently, you can browse our collection of countries and 
              learn about their flags, currencies, and languages.
            </p>
            <p className="text-lg text-gray-600">
              Coming soon: Interactive country-guessing puzzles that will challenge your global knowledge 
              and help you discover fascinating facts about nations around the world. Stay tuned for updates!
            </p>
          </div>
          <div className="flex justify-center">
            <div className="w-1/2 relative aspect-square rounded-lg overflow-hidden shadow-xl">
              <OptimizedImage
                src="/images/ECU_01.jpeg"
                alt="Ecuadorian scenery"
                width={800}
                height={800}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
