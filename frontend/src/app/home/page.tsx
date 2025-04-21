import { Header } from '@/components/Header';
import { OptimizedImage } from '@/components/Image';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <Header currentPage="home" />

            {/* Content Section */}
            <section className="container mx-auto px-4 py-16">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-gray-800">Every Country Is Unique</h2>
                        <p className="text-lg text-gray-600">
                            Welcome to our unique country-guessing game! Test your knowledge with our distinctive puzzles.
                            Each puzzle presents you with clues about a country - from its geographical features
                            and population to interesting facts about its culture, sports achievements, and more.
                        </p>
                        <p className="text-lg text-gray-600">
                            Try to guess the country based on the clues provided. Use the search box to find and select
                            your answer, navigate through suggestions using arrow keys, and submit with Enter. We&apos;re
                            continuously adding new puzzles and features to make your global exploration even more exciting!
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <div className="w-1/2 relative aspect-square rounded-lg overflow-hidden shadow-xl">
                            <OptimizedImage
                                src="/images/ECU_01.jpeg"
                                alt="A bold, stylized portrait of a bearded man surrounded by vibrant, radiating flags from around the world."
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
