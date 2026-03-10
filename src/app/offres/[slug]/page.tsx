import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, MapPin, Briefcase, Clock, User, Calendar, ExternalLink, CheckCircle } from 'lucide-react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import JobCard from '@/components/job-card';
import ShareButton from '@/components/share-button';
import { getOffreBySlug, getOffres, getOffresSimilaires, formatDate } from '@/lib/offres';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getOffres().map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const offre = getOffreBySlug(slug);
  if (!offre) return { title: 'Offre non trouvée' };

  return {
    title: `${offre.title} - ${offre.employer} | RDV Emploi Public`,
    description: `${offre.title} à ${offre.location} (${offre.department}). ${offre.description.slice(0, 140)}...`,
    openGraph: {
      title: `${offre.title} - ${offre.employer}`,
      description: `Offre d'emploi public : ${offre.title} à ${offre.location}`,
      type: 'article',
    },
  };
}

export default async function OffrePage({ params }: PageProps) {
  const { slug } = await params;
  const offre = getOffreBySlug(slug);

  if (!offre) notFound();

  const similaires = getOffresSimilaires(offre);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: offre.title,
    description: offre.description,
    datePosted: offre.publishedAt,
    employmentType: offre.tempsTravail === 'Temps complet' ? 'FULL_TIME' : 'PART_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: offre.employer,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: offre.location,
        addressRegion: offre.region,
        addressCountry: 'FR',
      },
    },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 py-6 md:py-8" style={{ backgroundColor: 'var(--brand-background)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-gray-500 mb-6 flex-wrap gap-1">
            <Link href="/" className="hover:text-[var(--brand-primary)]">Accueil</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/offres" className="hover:text-[var(--brand-primary)]">Offres</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/offres?dept=${offre.department}`} className="hover:text-[var(--brand-primary)]">
              {offre.departmentName} ({offre.department})
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{offre.title}</span>
          </nav>

          {/* Main card */}
          <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-gray-100" style={{ borderTopColor: 'var(--brand-primary)', borderTopWidth: '4px' }}>
              <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--brand-primary)' }}>
                {offre.title}
              </h1>
              <p className="text-lg text-gray-700 font-medium mb-4">{offre.employer}</p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {offre.location} ({offre.department})
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {offre.filiere}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  Cat. {offre.categorie}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {offre.tempsTravail}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(offre.publishedAt)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  offre.typeEmploi === 'Titulaire'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {offre.typeEmploi}
                </span>
                {offre.ouvertContractuels && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    Ouvert aux contractuels
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-8">
              {/* Description */}
              <section>
                <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--brand-primary)' }}>
                  Description du poste
                </h2>
                <p className="text-gray-700 leading-relaxed">{offre.description}</p>
              </section>

              {/* Missions */}
              <section>
                <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--brand-primary)' }}>
                  Missions principales
                </h2>
                <ul className="space-y-2">
                  {offre.missions.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0 text-green-500" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Profil */}
              <section>
                <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--brand-primary)' }}>
                  Profil recherché
                </h2>
                <ul className="space-y-2">
                  {offre.profil.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0 text-blue-500" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Candidature */}
              <section>
                <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--brand-primary)' }}>
                  Pour postuler
                </h2>
                <p className="text-gray-700 mb-4">{offre.candidature}</p>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={offre.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Postuler sur le site source
                  </a>
                  <ShareButton title={offre.title} />
                </div>
              </section>
            </div>
          </article>

          {/* Similar offers */}
          {similaires.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--brand-primary)' }}>
                Offres similaires
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {similaires.map((o) => (
                  <JobCard key={o.id} offre={o} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

