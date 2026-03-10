'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { ArrowUpDown } from 'lucide-react';
import SearchBar from '@/components/search-bar';
import FilterSidebar from '@/components/filter-sidebar';
import JobCard from '@/components/job-card';
import { filtrerOffres, getOffres, compterParFiltre, type FiltresOffres } from '@/lib/offres';

export default function OffresContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filtres: FiltresOffres = useMemo(() => ({
    q: searchParams.get('q') || undefined,
    dept: searchParams.get('dept') || undefined,
    region: searchParams.get('region') || undefined,
    categorie: searchParams.get('categorie') || undefined,
    filiere: searchParams.get('filiere') || undefined,
    typeEmploi: searchParams.get('typeEmploi') || undefined,
    tempsTravail: searchParams.get('tempsTravail') || undefined,
    contractuels: searchParams.get('contractuels') || undefined,
    tri: (searchParams.get('tri') as 'date' | 'pertinence') || 'date',
    page: parseInt(searchParams.get('page') || '1', 10),
  }), [searchParams]);

  const { offres, total } = useMemo(() => filtrerOffres(filtres), [filtres]);
  const compteurs = useMemo(() => compterParFiltre(getOffres()), []);

  const totalPages = Math.ceil(total / 20);
  const currentPage = filtres.page || 1;

  function setTri(tri: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tri', tri);
    params.delete('page');
    router.push(`/offres?${params.toString()}`);
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', String(page));
    } else {
      params.delete('page');
    }
    router.push(`/offres?${params.toString()}`);
  }

  return (
    <main className="flex-1 py-8" style={{ backgroundColor: 'var(--brand-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search bar */}
        <div className="mb-6">
          <SearchBar />
        </div>

        {/* Results header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <FilterSidebar compteurs={compteurs} />
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{total}</span> offre{total !== 1 ? 's' : ''} trouvée{total !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">Tri :</span>
            <button
              onClick={() => setTri('date')}
              className={`px-2 py-1 rounded ${filtres.tri === 'date' ? 'bg-[var(--brand-primary)] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Date
            </button>
            <button
              onClick={() => setTri('pertinence')}
              className={`px-2 py-1 rounded ${filtres.tri === 'pertinence' ? 'bg-[var(--brand-primary)] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Pertinence
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-lg border border-gray-200 p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <FilterSidebar compteurs={compteurs} />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {offres.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg text-gray-500 mb-2">Aucune offre ne correspond à vos critères.</p>
                <p className="text-sm text-gray-400">Essayez d&apos;élargir votre recherche ou de modifier les filtres.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offres.map((offre) => (
                  <JobCard key={offre.id} offre={offre} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-3 py-2 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  Précédent
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-2 rounded text-sm ${
                      page === currentPage
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-2 rounded border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
