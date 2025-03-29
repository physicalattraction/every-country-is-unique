import { OptimizedImage } from '@/components/Image';
import { Header } from '@/components/Header';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header title="Every Country Is Unique" />

      {/* Content Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Test Your Global Knowledge</h2>
            <p className="text-lg text-gray-600">
              Embark on an exciting journey of discovery through our unique country-guessing puzzles. 
              Each challenge presents you with three or more carefully crafted clues that capture the 
              essence of a nation - from its cultural landmarks to hidden gems.
            </p>
            <p className="text-lg text-gray-600">
              Whether you&apos;re a seasoned traveler or an aspiring globetrotter, put your knowledge 
              to the test and uncover fascinating facts about countries around the world. How many 
              can you guess correctly?
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
