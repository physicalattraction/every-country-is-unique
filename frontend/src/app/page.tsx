import { OptimizedImage } from '@/components/Image';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
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
            <h1 className="text-5xl font-bold mb-4">Every Country Is Unique</h1>
            <p className="text-xl">Can you guess the country from its unique features?</p>
          </div>
        </div>
      </section>

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
                alt="Auto-generated image with a bearded man on it, surrounded by fake flags"
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
