import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, MapPin, Building2, Calendar, Users, Briefcase,
  Clock, Monitor, Award, ExternalLink, Phone, Mail, Shield,
  GraduationCap, Layers, Target, FileText, TrendingUp,
  BarChart3, Globe, Hash, UserCheck, Wifi, CircleDollarSign,
  AlertTriangle
} from 'lucide-react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import JobCard from '@/components/job-card';
import ShareButton from '@/components/share-button';
import FormattedText from '@/components/formatted-text';
import BlasonImage from '@/components/blason-image';
import {
  getOffreBySlug, getOffresSimilaires, formatDate,
  getGradeInfoFromString, getVilleStats, getDepartementStats,
  type GradeInfo, type VilleStats, type DepartementStats
} from '@/lib/offres';
import { getBlasonForVille, getBlasonsForVilles, blasonKey } from '@/lib/villes';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Helper: check if an offer expired more than N days ago
function expiredDaysAgo(offre: { dateLimite?: string; expired?: boolean }): number | null {
  if (!offre.expired || !offre.dateLimite) return null;
  const diff = Date.now() - new Date(offre.dateLimite).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const offre = await getOffreBySlug(slug);
  if (!offre) return { title: 'Offre non trouvée' };

  const title = `${offre.title} à ${offre.location} (${offre.department}) - ${offre.employer} | Emploi Public`;
  const description = `Offre d'emploi ${offre.typeEmploi}: ${offre.title} à ${offre.location} (${offre.department}). ${offre.categorie} - ${offre.filiere}. ${offre.tempsTravail}. Postulez maintenant.`;

  // noindex for expired offers (< 30 days) — over 30 days will return 410
  const isExpired = offre.expired === true;

  return {
    title: isExpired ? `[Expirée] ${title}` : title,
    description,
    ...(isExpired ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: `${offre.title} - ${offre.employer}`,
      description,
      type: 'article',
    },
  };
}

// ---------------------------------------------------------------------------
// Helper: info row for synthesis tables
// ---------------------------------------------------------------------------
function InfoRow({ icon: Icon, label, value, href }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-b-0">
      <Icon className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
        <div className="text-sm text-gray-800 font-medium mt-0.5">
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-primary)] hover:underline">
              {value} <ExternalLink className="inline h-3 w-3" />
            </a>
          ) : value}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function OffrePage({ params }: PageProps) {
  const { slug } = await params;
  const offre = await getOffreBySlug(slug);

  if (!offre) notFound();

  // Offers expired > 30 days → 404 (notFound). 
  // Phase 2: upgrade to 410 via middleware.
  const daysExpired = expiredDaysAgo(offre);
  if (daysExpired !== null && daysExpired > 30) {
    notFound();
  }
  
  const isExpired = offre.expired === true;

  // Parallel data fetching for enrichment
  const [similaires, blasonUrl, gradeInfo, villeStats, deptStats] = await Promise.all([
    getOffresSimilaires(offre),
    getBlasonForVille(offre.location, offre.department),
    offre.grades ? getGradeInfoFromString(offre.grades) : Promise.resolve(null),
    getVilleStats(offre.location, offre.department),
    getDepartementStats(offre.department),
  ]);

  // Batch-fetch blasons for similar offres
  const similairesBlasons = similaires.length > 0
    ? await getBlasonsForVilles(similaires.map((o) => ({ ville: o.location, dept: o.department })))
    : new Map<string, string>();

  // Build JSON-LD
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: offre.title,
    description: offre.description,
    datePosted: offre.publishedAt,
    ...(offre.dateLimite ? { validThrough: offre.dateLimite } : {}),
    employmentType: offre.tempsTravail === 'Temps complet' ? 'FULL_TIME' : 'PART_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: offre.employer,
      ...(offre.siteWebEmployeur ? { sameAs: offre.siteWebEmployeur } : {}),
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
    ...(offre.experience ? { experienceRequirements: offre.experience } : {}),
  };

  if (gradeInfo) {
    jsonLd.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'EUR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: gradeInfo.salaireMinBrut,
        maxValue: gradeInfo.salaireMaxBrut,
        unitText: 'MONTH',
      },
    };
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://rdvemploipublic.fr' },
      { '@type': 'ListItem', position: 2, name: 'Offres', item: 'https://rdvemploipublic.fr/offres' },
      { '@type': 'ListItem', position: 3, name: `${offre.departmentName} (${offre.department})`, item: `https://rdvemploipublic.fr/offres?dept=${offre.department}` },
      { '@type': 'ListItem', position: 4, name: offre.title },
    ],
  };

  // Extract contact info
  const emailMatch = offre.contact?.match(/[\w.-]+@[\w.-]+\.\w+/);
  const phoneMatch = offre.contact?.match(/(?:0[1-9])(?:[\s.-]?\d{2}){4}/);

  // Parse grades list
  const gradesList = offre.grades
    ? offre.grades.split(/[,;/]/).map(g => g.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {!isExpired && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <main className="flex-1 py-6 md:py-10" style={{ backgroundColor: 'var(--brand-background)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Expired banner */}
          {isExpired && (
            <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-bold text-amber-800 mb-1">
                    Cette offre n&apos;est plus disponible
                  </h2>
                  <p className="text-sm text-amber-700 mb-3">
                    La date limite de candidature pour cette offre est dépassée
                    {offre.dateLimite && <> (expirée le {formatDate(offre.dateLimite)})</>}.
                    Elle n&apos;est plus ouverte aux candidatures.
                  </p>
                  {similaires.length > 0 ? (
                    <p className="text-sm text-amber-700 font-medium">
                      👇 Consultez les <a href="#offres-similaires" className="underline text-amber-900 hover:text-amber-700">offres similaires</a> ci-dessous.
                    </p>
                  ) : (
                    <Link
                      href="/offres"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-200 text-amber-900 hover:bg-amber-300 transition-colors"
                    >
                      Rechercher d&apos;autres offres →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

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
            <span className="text-gray-900 font-medium truncate max-w-[250px]">{offre.title}</span>
          </nav>

          {/* Layout: main + sidebar */}
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* Header card */}
              <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-primary-light, #6366f1))' }} />

                <div className="p-6 md:p-8">
                  {/* Title block */}
                  <div className="flex items-start gap-4 mb-5">
                    <BlasonImage blasonUrl={blasonUrl} ville={offre.location} size={80} />
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2" style={{ color: 'var(--brand-primary)' }}>
                        {offre.title}
                      </h1>
                      <p className="text-lg text-gray-700 font-medium flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        {offre.employer}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                      Cat. {offre.categorie}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      offre.typeEmploi === 'Titulaire'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {offre.typeEmploi}
                    </span>
                    {offre.ouvertContractuels && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        Ouvert aux contractuels
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      <Clock className="h-3 w-3" />
                      {offre.tempsTravail}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Publiée le {formatDate(offre.publishedAt)}
                    </span>
                    {offre.dateLimite && (
                      <span className="flex items-center gap-1.5 text-red-600 font-medium">
                        <Calendar className="h-4 w-4" />
                        Date limite : {formatDate(offre.dateLimite)}
                      </span>
                    )}
                  </div>
                </div>
              </article>

              {/* Synthèse de l'offre */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--brand-primary)' }}>
                  <FileText className="h-5 w-5" />
                  Synthèse de l&apos;offre
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div>
                    <InfoRow icon={Building2} label="Employeur" value={offre.employer} href={offre.siteWebEmployeur} />
                    <InfoRow icon={MapPin} label="Lieu de travail" value={offre.lieuTravail || offre.location} />
                    <InfoRow icon={Globe} label="Département / Région" value={`${offre.departmentName} (${offre.department}) — ${offre.region}`} />
                    <InfoRow icon={Briefcase} label="Type d'emploi" value={[offre.typeEmploi, offre.motifVacance].filter(Boolean).join(' — ')} />
                    <InfoRow icon={Users} label="Catégorie" value={`Catégorie ${offre.categorie}`} />
                  </div>
                  <div>
                    <InfoRow icon={Layers} label="Filière" value={offre.filiere} />
                    <InfoRow icon={Hash} label="Nombre de postes" value={offre.nombrePostes ? String(offre.nombrePostes) : undefined} />
                    <InfoRow icon={Calendar} label="Date limite" value={offre.dateLimite ? formatDate(offre.dateLimite) : undefined} />
                    <InfoRow icon={Calendar} label="Date de prise de poste" value={offre.datePoste ? formatDate(offre.datePoste) : undefined} />
                    <InfoRow
                      icon={UserCheck}
                      label="Ouvert aux contractuels"
                      value={offre.ouvertContractuels
                        ? (offre.contractuelsDetail ? `Oui — ${offre.contractuelsDetail}` : 'Oui')
                        : 'Non'
                      }
                    />
                  </div>
                </div>
              </section>

              {/* Détails du poste */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--brand-primary)' }}>
                  <Target className="h-5 w-5" />
                  Détails du poste
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div>
                    <InfoRow
                      icon={GraduationCap}
                      label="Grade(s) de recrutement"
                      value={gradesList.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {gradesList.map((g, i) => (
                            <span key={i} className="inline-block text-sm">
                              {g}{i < gradesList.length - 1 ? ',' : ''}
                            </span>
                          ))}
                          {gradeInfo && (
                            <Link
                              href={`/grilles-indiciaires/${gradeInfo.fpSlug}/${gradeInfo.cadreEmploiSlug}`}
                              className="inline-flex items-center gap-1 text-xs text-[var(--brand-primary)] hover:underline ml-1"
                            >
                              <BarChart3 className="h-3 w-3" />
                              Voir la grille
                            </Link>
                          )}
                        </div>
                      ) : undefined}
                    />
                    <InfoRow icon={Briefcase} label="Métier(s)" value={offre.metiers} />
                    <InfoRow icon={Layers} label="Famille de métiers" value={offre.familleMetiers} />
                  </div>
                  <div>
                    <InfoRow icon={Clock} label="Temps de travail" value={offre.tempsTravail} />
                    <InfoRow icon={Wifi} label="Télétravail" value={offre.teletravail} />
                    <InfoRow icon={Users} label="Management" value={offre.management} />
                    <InfoRow icon={Award} label="Expérience souhaitée" value={offre.experience} />
                  </div>
                </div>
              </section>

              {/* Rémunération estimée */}
              {gradeInfo && (
                <section className="rounded-xl shadow-sm border border-emerald-200 p-6 md:p-8 bg-gradient-to-br from-emerald-50 to-teal-50">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-800">
                    <CircleDollarSign className="h-5 w-5" />
                    Rémunération estimée
                  </h2>
                  <p className="text-sm text-emerald-700 mb-4">
                    Estimation basée sur la grille indiciaire du grade <strong>{gradeInfo.gradeNom}</strong> (IM {gradeInfo.imMin} → {gradeInfo.imMax}).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/70 rounded-lg p-4 text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Salaire brut mensuel</div>
                      <div className="text-xl font-bold text-emerald-700">
                        {gradeInfo.salaireMinBrut.toLocaleString('fr-FR')} € — {gradeInfo.salaireMaxBrut.toLocaleString('fr-FR')} €
                      </div>
                    </div>
                    <div className="bg-white/70 rounded-lg p-4 text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Salaire net estimé</div>
                      <div className="text-xl font-bold text-emerald-700">
                        {gradeInfo.salaireMinNet.toLocaleString('fr-FR')} € — {gradeInfo.salaireMaxNet.toLocaleString('fr-FR')} €
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <Link
                      href={`/grilles-indiciaires/${gradeInfo.fpSlug}/${gradeInfo.cadreEmploiSlug}`}
                      className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-medium"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Voir la grille indiciaire complète
                    </Link>
                    <Link
                      href="/calculateur-salaire-net-fonction-publique"
                      className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-medium"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Calculateur de salaire
                    </Link>
                  </div>
                </section>
              )}

              {/* Descriptif de l'emploi */}
              {offre.descriptionRaw && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--brand-primary)' }}>
                    Descriptif de l&apos;emploi
                  </h2>
                  <FormattedText text={offre.descriptionRaw} />
                </section>
              )}

              {/* Missions */}
              {offre.missionsRaw && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--brand-primary)' }}>
                    Missions et conditions d&apos;exercice
                  </h2>
                  <FormattedText text={offre.missionsRaw} />
                </section>
              )}

              {/* Profil recherché */}
              {offre.profilRaw && (
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--brand-primary)' }}>
                    Profil recherché
                  </h2>
                  <FormattedText text={offre.profilRaw} />
                </section>
              )}

              {/* Candidature */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--brand-primary)' }}>
                  Contact et modalités de candidature
                </h2>

                {offre.candidature && (
                  <FormattedText text={offre.candidature} className="mb-4" />
                )}

                {/* Contact info */}
                {(emailMatch || phoneMatch || offre.contact) && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-5 space-y-2">
                    {offre.contact && !emailMatch && !phoneMatch && (
                      <p className="text-sm text-gray-700">{offre.contact}</p>
                    )}
                    {phoneMatch && (
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${phoneMatch[0].replace(/[\s.-]/g, '')}`} className="hover:text-[var(--brand-primary)]">
                          {phoneMatch[0]}
                        </a>
                      </p>
                    )}
                    {emailMatch && (
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${emailMatch[0]}`} className="hover:text-[var(--brand-primary)]">
                          {emailMatch[0]}
                        </a>
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {!isExpired && offre.sourceUrl && (
                    <a
                      href={offre.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity shadow-sm"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Postuler sur le site source
                    </a>
                  )}
                  {isExpired && (
                    <Link
                      href="/offres"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity shadow-sm"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      Voir les offres disponibles →
                    </Link>
                  )}
                  <ShareButton title={offre.title} />
                </div>
              </section>

              {/* Travailleurs handicapés */}
              {offre.handicap && (
                <section className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-blue-800 mb-1">
                        Travailleurs handicapés
                      </h3>
                      <p className="text-sm text-blue-700 leading-relaxed">{offre.handicap}</p>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-80 flex-shrink-0 space-y-6">

              {/* CTA sticky */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 lg:sticky lg:top-6">
                {isExpired ? (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-100 text-amber-800 font-medium text-sm mb-3">
                      <AlertTriangle className="h-4 w-4" />
                      Offre expirée
                    </div>
                    <Link
                      href="/offres"
                      className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity shadow-sm"
                      style={{ backgroundColor: 'var(--brand-primary)' }}
                    >
                      Rechercher d&apos;autres offres
                    </Link>
                  </div>
                ) : (
                  <>
                    {offre.sourceUrl && (
                      <a
                        href={offre.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity shadow-sm mb-3"
                        style={{ backgroundColor: 'var(--brand-primary)' }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Postuler
                      </a>
                    )}
                    <ShareButton title={offre.title} />

                    {offre.dateLimite && (
                      <p className="text-xs text-center text-gray-500 mt-3">
                        ⏰ Date limite : {formatDate(offre.dateLimite)}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* À propos de la ville */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[var(--brand-primary)]" />
                  À propos de {offre.location}
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  {(villeStats.blasonUrl || blasonUrl) && (
                    <BlasonImage blasonUrl={villeStats.blasonUrl || blasonUrl} ville={offre.location} size={48} />
                  )}
                  <div>
                    <p className="text-sm text-gray-700">{offre.departmentName} ({offre.department})</p>
                    <p className="text-sm text-gray-500">{offre.region}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  <strong>{villeStats.nbOffres}</strong> offre{villeStats.nbOffres > 1 ? 's' : ''} disponible{villeStats.nbOffres > 1 ? 's' : ''} à {offre.location}
                </p>
                <Link
                  href={`/offres?q=${encodeURIComponent(offre.location)}`}
                  className="text-sm text-[var(--brand-primary)] hover:underline font-medium"
                >
                  Voir toutes les offres à {offre.location} →
                </Link>
              </div>

              {/* Statistiques du département */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[var(--brand-primary)]" />
                  {offre.departmentName} ({offre.department})
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  <strong>{deptStats.nbOffres}</strong> offre{deptStats.nbOffres > 1 ? 's' : ''} dans le département
                </p>
                {deptStats.topFilieres.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Top filières</p>
                    <div className="space-y-1.5">
                      {deptStats.topFilieres.map((f) => (
                        <div key={f.filiere} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{f.filiere}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{f.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Link
                  href={`/offres?dept=${offre.department}`}
                  className="text-sm text-[var(--brand-primary)] hover:underline font-medium"
                >
                  Voir toutes les offres du {offre.departmentName} →
                </Link>
              </div>

              {/* Grille indiciaire link */}
              {gradeInfo && (
                <Link
                  href={`/grilles-indiciaires/${gradeInfo.fpSlug}/${gradeInfo.cadreEmploiSlug}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-[var(--brand-primary)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Grille indiciaire</p>
                      <p className="text-xs text-gray-500">{gradeInfo.cadreEmploiNom}</p>
                    </div>
                  </div>
                </Link>
              )}
            </aside>
          </div>

          {/* Similar offers */}
          {similaires.length > 0 && (
            <section id="offres-similaires" className={`mt-10 ${isExpired ? 'ring-2 ring-amber-300 rounded-xl p-6 bg-white' : ''}`}>
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--brand-primary)' }}>
                {isExpired ? '🔍 Offres similaires encore disponibles' : 'Offres similaires'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {similaires.map((o) => (
                  <JobCard
                    key={o.id}
                    offre={o}
                    blasonUrl={similairesBlasons.get(blasonKey(o.location, o.department))}
                  />
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
