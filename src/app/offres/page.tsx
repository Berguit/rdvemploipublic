import { Suspense } from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import OffresContent from './offres-content';

export const metadata: Metadata = {
  title: 'Offres d\'emploi public territorial | RDV Emploi Public',
  description: 'Recherchez parmi des milliers d\'offres d\'emploi dans la fonction publique territoriale. Filtrez par département, catégorie, filière et type d\'emploi.',
  openGraph: {
    title: 'Offres d\'emploi public territorial | RDV Emploi Public',
    description: 'Recherchez parmi des milliers d\'offres d\'emploi dans la fonction publique territoriale.',
  },
};

export default function OffresPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Suspense fallback={
        <main className="flex-1 py-8 bg-[var(--brand-background)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 rounded-lg" />
              <div className="h-64 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </main>
      }>
        <OffresContent />
      </Suspense>
      <Footer />
    </div>
  );
}
