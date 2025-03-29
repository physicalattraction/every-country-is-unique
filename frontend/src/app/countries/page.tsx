import { Header } from '@/components/Header';

export default function CountriesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header title="Countries" />
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-gray-800">There are 193 countries</h2>
      </div>
    </main>
  );
} 