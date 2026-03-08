'use client';

import { Search } from 'lucide-react';

export default function HeroSection() {
  const stats = [
    { number: '25 759', label: 'offres' },
    { number: '101', label: 'départements' },
    { number: '630', label: 'métiers' }
  ];

  return (
    <section className="py-12 md:py-20" style={{ backgroundColor: 'var(--brand-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Titre principal */}
          <h1 className="text-3xl md:text-5xl font-bold mb-4" style={{ color: 'var(--brand-primary)' }}>
            Trouvez votre emploi dans la fonction publique
          </h1>
          
          {/* Sous-titre */}
          <p className="text-lg md:text-xl mb-8" style={{ color: 'var(--brand-text)' }}>
            25 000+ offres d'emploi territorial mises à jour quotidiennement
          </p>

          {/* Barre de recherche */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Input texte */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Métier, mot-clé..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none min-h-[44px]"
                  />
                  <Search 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
                    aria-hidden="true"
                  />
                </div>

                {/* Select département */}
                <div className="md:w-48">
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent outline-none bg-white min-h-[44px]">
                    <option value="">Département</option>
                    <option value="01">01 - Ain</option>
                    <option value="02">02 - Aisne</option>
                    <option value="03">03 - Allier</option>
                    <option value="75">75 - Paris</option>
                    <option value="69">69 - Rhône</option>
                    {/* Plus de départements ici en réel */}
                  </select>
                </div>

                {/* Bouton rechercher */}
                <button
                  className="px-8 py-3 text-white font-medium rounded-md hover:opacity-90 transition-opacity min-h-[44px] md:w-auto w-full"
                  style={{ backgroundColor: 'var(--brand-accent)' }}
                >
                  Rechercher
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--brand-primary)' }}>
                  {stat.number}
                </div>
                <div className="text-sm md:text-base" style={{ color: 'var(--brand-text)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}