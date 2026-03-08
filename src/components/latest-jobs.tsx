'use client';

import { Calendar, MapPin, Clock, User } from 'lucide-react';

interface Job {
  id: number;
  title: string;
  employer: string;
  location: string;
  department: string;
  type: 'permanent' | 'temporaire';
  grade: string;
  publishedAt: string;
}

export default function LatestJobs() {
  const mockJobs: Job[] = [
    {
      id: 1,
      title: 'Agent de police municipale',
      employer: 'Mairie de Lyon',
      location: 'Lyon',
      department: '69',
      type: 'permanent',
      grade: 'Cat. C',
      publishedAt: '2026-03-08'
    },
    {
      id: 2,
      title: 'Responsable des espaces verts',
      employer: 'Communauté de communes',
      location: 'Annecy',
      department: '74',
      type: 'permanent',
      grade: 'Cat. B',
      publishedAt: '2026-03-07'
    },
    {
      id: 3,
      title: 'Assistant administratif',
      employer: 'Conseil départemental',
      location: 'Toulouse',
      department: '31',
      type: 'temporaire',
      grade: 'Cat. C',
      publishedAt: '2026-03-07'
    },
    {
      id: 4,
      title: 'Éducateur spécialisé',
      employer: 'CCAS de Marseille',
      location: 'Marseille',
      department: '13',
      type: 'permanent',
      grade: 'Cat. B',
      publishedAt: '2026-03-06'
    },
    {
      id: 5,
      title: 'Agent d\'entretien des bâtiments',
      employer: 'Mairie de Nantes',
      location: 'Nantes',
      department: '44',
      type: 'temporaire',
      grade: 'Cat. C',
      publishedAt: '2026-03-06'
    },
    {
      id: 6,
      title: 'Bibliothécaire',
      employer: 'Médiathèque intercommunale',
      location: 'Bordeaux',
      department: '33',
      type: 'permanent',
      grade: 'Cat. A',
      publishedAt: '2026-03-05'
    }
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long'
    });
  };

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
          {mockJobs.map((job) => (
            <article 
              key={job.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2 line-clamp-2" style={{ color: 'var(--brand-primary)' }}>
                  {job.title}
                </h3>
                <p className="text-gray-600 font-medium mb-1">{job.employer}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{job.location} ({job.department})</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className={job.type === 'permanent' ? 'text-green-600' : 'text-orange-600'}>
                    {job.type === 'permanent' ? 'Permanent' : 'Temporaire'}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{job.grade}</span>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{formatDate(job.publishedAt)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center">
          <button
            className="inline-flex items-center px-8 py-3 text-white font-medium rounded-md hover:opacity-90 transition-opacity min-h-[44px]"
            style={{ backgroundColor: 'var(--brand-accent)' }}
          >
            Voir toutes les offres
          </button>
        </div>
      </div>
    </section>
  );
}