import Link from 'next/link';
import { Calendar, MapPin, Clock, User, Briefcase } from 'lucide-react';
import { type Offre, formatDateShort } from '@/lib/offres';

export default function JobCard({ offre }: { offre: Offre }) {
  return (
    <Link href={`/offres/${offre.slug}`}>
      <article className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[var(--brand-primary)]/30 transition-all cursor-pointer h-full flex flex-col">
        <div className="mb-4 flex-1">
          <h3 className="text-lg font-semibold mb-2 line-clamp-2" style={{ color: 'var(--brand-primary)' }}>
            {offre.title}
          </h3>
          <p className="text-gray-600 font-medium mb-1">{offre.employer}</p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{offre.location} ({offre.department})</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Briefcase className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{offre.filiere}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{offre.tempsTravail}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Cat. {offre.categorie}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{formatDateShort(offre.publishedAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
            offre.typeEmploi === 'Titulaire'
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {offre.typeEmploi}
          </span>
          {offre.ouvertContractuels && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
              Ouvert aux contractuels
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}
