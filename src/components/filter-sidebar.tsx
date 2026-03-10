'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { X, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { FILIERES, TYPES_EMPLOI } from '@/lib/offres';

interface FilterSidebarProps {
  compteurs: {
    categorie: Record<string, number>;
    filiere: Record<string, number>;
    typeEmploi: Record<string, number>;
    tempsTravail: Record<string, number>;
    contractuels: { oui: number; non: number };
  };
}

export default function FilterSidebar({ compteurs }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete('page');
    router.push(`/offres?${params.toString()}`);
  }

  function clearFilters() {
    const q = searchParams.get('q');
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    router.push(`/offres?${params.toString()}`);
  }

  const hasFilters = searchParams.has('categorie') || searchParams.has('filiere') ||
    searchParams.has('typeEmploi') || searchParams.has('tempsTravail') ||
    searchParams.has('contractuels') || searchParams.has('dept') || searchParams.has('region');

  const content = (
    <div className="space-y-6">
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="text-sm text-red-600 hover:text-red-700 underline"
        >
          Réinitialiser les filtres
        </button>
      )}

      {/* Département */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Département</h3>
        <input
          type="text"
          placeholder="Ex: 75"
          value={searchParams.get('dept') || ''}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            if (e.target.value) {
              params.set('dept', e.target.value);
            } else {
              params.delete('dept');
            }
            params.delete('page');
            router.push(`/offres?${params.toString()}`);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
        />
      </div>

      {/* Catégorie */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Catégorie</h3>
        <div className="space-y-1">
          {['A', 'B', 'C'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter('categorie', cat)}
              className={`flex items-center justify-between w-full px-3 py-1.5 rounded text-sm transition-colors ${
                searchParams.get('categorie') === cat
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span>Catégorie {cat}</span>
              <span className={`text-xs ${
                searchParams.get('categorie') === cat ? 'text-white/80' : 'text-gray-400'
              }`}>
                {compteurs.categorie[cat] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filière */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Filière</h3>
        <div className="space-y-1">
          {FILIERES.map((f) => (
            <button
              key={f}
              onClick={() => setFilter('filiere', f)}
              className={`flex items-center justify-between w-full px-3 py-1.5 rounded text-sm transition-colors ${
                searchParams.get('filiere') === f
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="truncate mr-2">{f}</span>
              <span className={`text-xs flex-shrink-0 ${
                searchParams.get('filiere') === f ? 'text-white/80' : 'text-gray-400'
              }`}>
                {compteurs.filiere[f] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Type d'emploi */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Type d&apos;emploi</h3>
        <div className="space-y-1">
          {TYPES_EMPLOI.map((t) => (
            <button
              key={t}
              onClick={() => setFilter('typeEmploi', t)}
              className={`flex items-center justify-between w-full px-3 py-1.5 rounded text-sm transition-colors ${
                searchParams.get('typeEmploi') === t
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span>{t}</span>
              <span className={`text-xs ${
                searchParams.get('typeEmploi') === t ? 'text-white/80' : 'text-gray-400'
              }`}>
                {compteurs.typeEmploi[t] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Temps de travail */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Temps de travail</h3>
        <div className="space-y-1">
          {['Temps complet', 'Temps partiel', 'Temps non complet'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter('tempsTravail', t)}
              className={`flex items-center justify-between w-full px-3 py-1.5 rounded text-sm transition-colors ${
                searchParams.get('tempsTravail') === t
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span>{t}</span>
              <span className={`text-xs ${
                searchParams.get('tempsTravail') === t ? 'text-white/80' : 'text-gray-400'
              }`}>
                {compteurs.tempsTravail[t] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ouvert aux contractuels */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Ouvert aux contractuels</h3>
        <button
          onClick={() => setFilter('contractuels', 'oui')}
          className={`flex items-center justify-between w-full px-3 py-1.5 rounded text-sm transition-colors ${
            searchParams.get('contractuels') === 'oui'
              ? 'bg-[var(--brand-primary)] text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <span>Oui</span>
          <span className={`text-xs ${
            searchParams.get('contractuels') === 'oui' ? 'text-white/80' : 'text-gray-400'
          }`}>
            {compteurs.contractuels.oui}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtres
        {hasFilters && (
          <span className="bg-[var(--brand-primary)] text-white text-xs rounded-full px-1.5 py-0.5">!</span>
        )}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">Filtres</h2>
              <button onClick={() => setMobileOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {content}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--brand-primary)' }}>
          Filtres
        </h2>
        {content}
      </div>
    </>
  );
}
