'use client';

import FranceMap from './france-map';

export default function MapRegionsSection() {
  const regions = [
    'Auvergne-Rhône-Alpes',
    'Bourgogne-Franche-Comté',
    'Bretagne',
    'Centre-Val de Loire',
    'Corse',
    'Grand Est',
    'Hauts-de-France',
    'Île-de-France',
    'Normandie',
    'Nouvelle-Aquitaine',
    'Occitanie',
    'Pays de la Loire',
    'Provence-Alpes-Côte d\'Azur'
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop - Carte interactive */}
        <div className="hidden md:block">
          <FranceMap />
        </div>

        {/* Mobile - Grille des régions */}
        <div className="md:hidden">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--brand-primary)' }}>
            Rechercher par région
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {regions.map((region, index) => (
              <button
                key={index}
                className="bg-white text-left px-4 py-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-[var(--brand-primary)] transition-all min-h-[44px] flex items-center"
                style={{ color: 'var(--brand-text)' }}
              >
                <span className="text-sm font-medium">{region}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}