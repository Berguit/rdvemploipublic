'use client';

import Link from 'next/link';
import JobCard from '@/components/job-card';
import { getOffres } from '@/lib/offres';

export default function LatestJobs() {
  const offres = getOffres().slice(0, 6);

  return (
    <section className="py-12 md:py-16" style={{ backgroundColor: 'var(--brand-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--brand-primary)' }}>
            Dernières offres
          </h2>
          <p className="text-lg" style={{ color: 'var(--brand-text)' }}>
            Découvrez les nouvelles opportunités dans la fonction publique territoriale
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {offres.map((offre) => (
            <JobCard key={offre.id} offre={offre} />
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/offres"
            className="inline-flex items-center px-8 py-3 text-white font-medium rounded-md hover:opacity-90 transition-opacity min-h-[44px]"
            style={{ backgroundColor: 'var(--brand-accent)' }}
          >
            Voir toutes les offres
          </Link>
        </div>
      </div>
    </section>
  );
}
