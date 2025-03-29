import { OptimizedImage } from '@/components/Image';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full">
        <OptimizedImage
          src="/data/ECU_header_01.jpeg"
          alt="Ecuadorian landscape"
          width={1920}
          height={1080}
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-5xl font-bold mb-4">Every Country Is Unique</h1>
            <p className="text-xl">Discover the beauty and diversity of our world</p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Welcome to Our Journey</h2>
            <p className="text-lg text-gray-600">
              Embark on an exploration of the world&apos;s most fascinating destinations. 
              Each country has its own story, culture, and unique characteristics that make it special.
            </p>
            <p className="text-lg text-gray-600">
              Through our curated collection of images and information, we invite you to 
              discover the rich tapestry of our global community.
            </p>
          </div>
          <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
            <OptimizedImage
              src="/data/ECU_01.jpeg"
              alt="Ecuadorian scenery"
              width={800}
              height={600}
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
