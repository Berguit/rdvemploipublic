import { createServerClient, createBrowserClient } from './supabase';
import { getBlasonForVille } from './villes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Offre {
  id: number;
  slug: string;
  title: string;
  employer: string;
  siteWebEmployeur?: string;
  location: string;
  lieuTravail?: string;
  department: string;
  departmentName: string;
  region: string;
  categorie: 'A' | 'B' | 'C';
  filiere: string;
  familleMetiers?: string;
  grades?: string;
  metiers?: string;
  typeEmploi: string;
  typeEmploiRaw?: string;
  tempsTravail: 'Temps complet' | 'Temps partiel' | 'Temps non complet';
  tempsTravailRaw?: string;
  teletravail?: string;
  management?: string;
  experience?: string;
  contact?: string;
  ouvertContractuels: boolean;
  contractuelsDetail?: string;
  description: string;
  descriptionRaw?: string;
  missions: string[];
  missionsRaw?: string;
  profil: string[];
  profilRaw?: string;
  candidature: string;
  handicap?: string;
  nombrePostes?: number;
  motifVacance?: string;
  datePoste?: string;
  sourceUrl: string;
  publishedAt: string;
  dateLimite?: string;
  expired?: boolean;
}

// ---------------------------------------------------------------------------
// Grade / Salary info
// ---------------------------------------------------------------------------

export interface GradeInfo {
  gradeNom: string;
  cadreEmploiNom: string;
  cadreEmploiSlug: string;
  fpSlug: string;
  salaireMinBrut: number;
  salaireMaxBrut: number;
  salaireMinNet: number;
  salaireMaxNet: number;
  imMin: number;
  imMax: number;
}

export interface VilleStats {
  nbOffres: number;
  blasonUrl: string | null;
}

export interface DepartementStats {
  nbOffres: number;
  topFilieres: { filiere: string; count: number }[];
}

export interface FiltresOffres {
  q?: string;
  dept?: string;
  region?: string;
  categorie?: string;
  filiere?: string;
  typeEmploi?: string;
  tempsTravail?: string;
  contractuels?: string;
  tri?: 'date' | 'pertinence';
  page?: number;
}

// ---------------------------------------------------------------------------
// Constants (used by UI filters)
// ---------------------------------------------------------------------------

export const FILIERES = [
  'Administrative',
  'Technique',
  'Médico-sociale',
  'Culturelle',
  'Sportive',
  'Animation',
  'Police municipale',
  'Sapeurs-pompiers',
  'Informatique',
  'Juridique',
  'Urbanisme',
  'Restauration',
  'Social',
  'Autre',
] as const;

export const TYPES_EMPLOI = [
  'Titulaire',
  'Contractuel',
  'Vacataire',
  'Apprenti',
] as const;

export const REGIONS: Record<string, string[]> = {
  'Île-de-France': ['75', '77', '78', '91', '92', '93', '94', '95'],
  'Auvergne-Rhône-Alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
  'Provence-Alpes-Côte d\'Azur': ['04', '05', '06', '13', '83', '84'],
  'Occitanie': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
  'Nouvelle-Aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
  'Bretagne': ['22', '29', '35', '56'],
  'Pays de la Loire': ['44', '49', '53', '72', '85'],
  'Hauts-de-France': ['02', '59', '60', '62', '80'],
  'Grand Est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
  'Normandie': ['14', '27', '50', '61', '76'],
  'Bourgogne-Franche-Comté': ['21', '25', '39', '58', '70', '71', '89', '90'],
  'Centre-Val de Loire': ['18', '28', '36', '37', '41', '45'],
  'Corse': ['2A', '2B'],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitLines(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/[-●•]\s*|\n/)
    .map(s => s.trim())
    .filter(s => s.length > 5);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapRow(row: any): Offre {
  return {
    id: row.id,
    slug: row.slug,
    title: row.titre || 'Offre sans titre',
    employer: row.employeur || 'Employeur non précisé',
    siteWebEmployeur: row.site_web_employeur || undefined,
    location: row.ville_clean || row.ville || 'Non précisé',
    lieuTravail: row.lieu_travail || undefined,
    department: row.departement || '00',
    departmentName: row.departement_nom || '',
    region: row.region || 'Autre',
    categorie: (row.categorie as 'A' | 'B' | 'C') || 'C',
    filiere: row.filiere || 'Autre',
    familleMetiers: row.famille_metiers || undefined,
    grades: row.grades || undefined,
    metiers: row.metiers || undefined,
    typeEmploi: row.type_emploi || 'Titulaire',
    typeEmploiRaw: row.type_emploi_raw || undefined,
    tempsTravail: (row.temps_travail as Offre['tempsTravail']) || 'Temps complet',
    tempsTravailRaw: row.temps_travail_raw || undefined,
    teletravail: row.teletravail || undefined,
    management: row.management || undefined,
    experience: row.experience || undefined,
    contact: row.contact || undefined,
    ouvertContractuels: row.ouvert_contractuels ?? false,
    contractuelsDetail: row.contractuels_detail || undefined,
    description: row.descriptif_emploi || '',
    descriptionRaw: row.descriptif_emploi || undefined,
    missions: splitLines(row.missions),
    missionsRaw: row.missions || undefined,
    profil: splitLines(row.profil_recherche),
    profilRaw: row.profil_recherche || undefined,
    candidature: row.modalites_candidature || '',
    handicap: row.handicap || undefined,
    nombrePostes: row.nombre_postes ? Number(row.nombre_postes) : undefined,
    motifVacance: row.motif_vacance || undefined,
    datePoste: row.date_poste ? String(row.date_poste) : undefined,
    sourceUrl: row.source_url || '',
    publishedAt: row.date_poste ? String(row.date_poste) : new Date().toISOString().split('T')[0],
    dateLimite: row.date_limite ? String(row.date_limite) : undefined,
    expired: row.expired ?? false,
  };
}

function mapRpcRow(row: any): Offre {
  // The RPC returns a subset of columns — fill in what we have
  return {
    id: row.id,
    slug: row.slug,
    title: row.titre || 'Offre sans titre',
    employer: row.employeur || 'Employeur non précisé',
    location: row.ville_clean || row.ville || 'Non précisé',
    department: row.departement || '00',
    departmentName: row.departement_nom || '',
    region: row.region || 'Autre',
    categorie: (row.categorie as 'A' | 'B' | 'C') || 'C',
    filiere: row.filiere || 'Autre',
    typeEmploi: row.type_emploi || 'Titulaire',
    tempsTravail: (row.temps_travail as Offre['tempsTravail']) || 'Temps complet',
    ouvertContractuels: row.ouvert_contractuels ?? false,
    description: '',
    missions: [],
    profil: [],
    candidature: '',
    sourceUrl: row.source_url || '',
    publishedAt: row.date_poste ? String(row.date_poste) : new Date().toISOString().split('T')[0],
    dateLimite: row.date_limite ? String(row.date_limite) : undefined,
    expired: row.expired ?? false,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Select columns used in list views (lighter than full row)
const LIST_COLUMNS = 'id,slug,titre,employeur,ville,ville_clean,departement,departement_nom,region,categorie,filiere,type_emploi,temps_travail,ouvert_contractuels,date_poste,date_limite,source_url,expired';

// Select all columns for detail views
const DETAIL_COLUMNS = '*';

// ---------------------------------------------------------------------------
// Client helper — picks the right Supabase client based on environment
// ---------------------------------------------------------------------------

function getClient() {
  if (typeof window === 'undefined') {
    return createServerClient();
  }
  return createBrowserClient();
}

// ---------------------------------------------------------------------------
// Data functions (all async)
// ---------------------------------------------------------------------------

/** Get paginated offres (most recent first). */
export async function getOffres(limit = 1000, offset = 0): Promise<Offre[]> {
  const client = getClient();
  const { data, error } = await client
    .from('offres')
    .select(LIST_COLUMNS)
    .order('date_poste', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`getOffres: ${error.message}`);
  return (data || []).map(mapRow);
}

/** Get a single offre by slug. */
export async function getOffreBySlug(slug: string): Promise<Offre | undefined> {
  const client = getClient();
  const { data, error } = await client
    .from('offres')
    .select(DETAIL_COLUMNS)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return undefined; // not found
    throw new Error(`getOffreBySlug: ${error.message}`);
  }
  return data ? mapRow(data) : undefined;
}

/** Filter offres using the search_offres RPC (full-text + filters + pagination). */
export async function filtrerOffres(filtres: FiltresOffres): Promise<{ offres: Offre[]; total: number }> {
  const client = getClient();
  const page = filtres.page || 1;
  const perPage = 20;
  const offset = (page - 1) * perPage;

  // If we have a text query OR specific filters that map to RPC params, use the RPC
  const useRpc = !!filtres.q;

  if (useRpc) {
    const { data, error } = await client.rpc('search_offres', {
      search_query: filtres.q || null,
      p_departement: filtres.dept || null,
      p_region: filtres.region || null,
      p_categorie: filtres.categorie || null,
      p_filiere: filtres.filiere || null,
      p_type_emploi: filtres.typeEmploi || null,
      p_contractuels: filtres.contractuels === 'oui' ? true : null,
      p_limit: perPage,
      p_offset: offset,
    });

    if (error) throw new Error(`filtrerOffres RPC: ${error.message}`);
    const rows = data || [];
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
    return { offres: rows.map(mapRpcRow), total };
  }

  // No text query — use regular query builder for more flexibility
  let query = client
    .from('offres')
    .select(LIST_COLUMNS, { count: 'exact' });

  if (filtres.dept) query = query.eq('departement', filtres.dept);
  if (filtres.region) query = query.eq('region', filtres.region);
  if (filtres.categorie) query = query.eq('categorie', filtres.categorie);
  if (filtres.filiere) query = query.eq('filiere', filtres.filiere);
  if (filtres.typeEmploi) query = query.eq('type_emploi', filtres.typeEmploi);
  if (filtres.tempsTravail) query = query.eq('temps_travail', filtres.tempsTravail);
  if (filtres.contractuels === 'oui') query = query.eq('ouvert_contractuels', true);

  query = query.order('date_poste', { ascending: false, nullsFirst: false });
  query = query.range(offset, offset + perPage - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`filtrerOffres: ${error.message}`);

  return {
    offres: (data || []).map(mapRow),
    total: count ?? 0,
  };
}

/** Count offres per filter value (for the sidebar counts). */
export async function compterParFiltre(filtres?: FiltresOffres): Promise<{
  categorie: Record<string, number>;
  filiere: Record<string, number>;
  typeEmploi: Record<string, number>;
  tempsTravail: Record<string, number>;
  contractuels: { oui: number; non: number };
}> {
  const client = getClient();

  // Build a base query with current filters (except the one being counted)
  // For simplicity, we fetch all matching IDs then count in separate queries
  // Actually, the simplest approach: fetch all rows matching current filters and count client-side
  // But that could be heavy. Let's use individual count queries.

  const compteurs = {
    categorie: {} as Record<string, number>,
    filiere: {} as Record<string, number>,
    typeEmploi: {} as Record<string, number>,
    tempsTravail: {} as Record<string, number>,
    contractuels: { oui: 0, non: 0 },
  };

  // Helper to build a count query with base filters applied
  function countQuery() {
    let q = client.from('offres').select('id', { count: 'exact', head: true });
    if (filtres?.dept) q = q.eq('departement', filtres.dept);
    if (filtres?.region) q = q.eq('region', filtres.region);
    return q;
  }

  // Count by categorie
  for (const cat of ['A', 'B', 'C']) {
    const { count } = await countQuery().eq('categorie', cat);
    compteurs.categorie[cat] = count ?? 0;
  }

  // Count by filiere
  for (const f of FILIERES) {
    const { count } = await countQuery().eq('filiere', f);
    compteurs.filiere[f] = count ?? 0;
  }

  // Count by typeEmploi
  for (const t of TYPES_EMPLOI) {
    const { count } = await countQuery().eq('type_emploi', t);
    compteurs.typeEmploi[t] = count ?? 0;
  }

  // Count by tempsTravail
  for (const t of ['Temps complet', 'Temps partiel', 'Temps non complet']) {
    const { count } = await countQuery().eq('temps_travail', t);
    compteurs.tempsTravail[t] = count ?? 0;
  }

  // Count contractuels
  {
    const { count } = await countQuery().eq('ouvert_contractuels', true);
    compteurs.contractuels.oui = count ?? 0;
  }
  {
    const { count } = await countQuery().eq('ouvert_contractuels', false);
    compteurs.contractuels.non = count ?? 0;
  }

  return compteurs;
}

/** Get department counts for the map using the view. */
export async function compterParDepartement(): Promise<Record<string, { name: string; count: number }>> {
  const client = getClient();
  const { data, error } = await client
    .from('offres_par_departement')
    .select('departement,departement_nom,nb_offres');

  if (error) throw new Error(`compterParDepartement: ${error.message}`);

  const result: Record<string, { name: string; count: number }> = {};
  for (const row of data || []) {
    result[row.departement] = {
      name: row.departement_nom || row.departement,
      count: Number(row.nb_offres),
    };
  }
  return result;
}

/** Get similar offres (same department or filiere). */
export async function getOffresSimilaires(offre: Offre, limit = 3): Promise<Offre[]> {
  const client = getClient();

  // Try same department first, then same filiere
  const { data, error } = await client
    .from('offres')
    .select(LIST_COLUMNS)
    .neq('id', offre.id)
    .or(`departement.eq.${offre.department},filiere.eq.${offre.filiere}`)
    .order('date_poste', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(`getOffresSimilaires: ${error.message}`);
  return (data || []).map(mapRow);
}

// ---------------------------------------------------------------------------
// Enrichment functions (grade salary, ville stats, dept stats)
// ---------------------------------------------------------------------------

/** Compute net salary from indice majoré using the standard formula. */
function computeSalaries(im: number): { brut: number; net: number } {
  const tbm = im * 4.92278;
  const net = tbm - (tbm * 11.10 / 100) - (tbm * 98.25 * 9.20 / 10000) - (tbm * 98.25 * 0.50 / 10000);
  return { brut: Math.round(tbm), net: Math.round(net) };
}

/** Slugify helper for matching grade → cadre URL */
function slugifyGrade(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Look up a grade name in the grades table, get its salary range from echelons.
 * Returns info including cadre d'emploi link, or null if not found.
 */
export async function getGradeInfo(gradeName: string): Promise<GradeInfo | null> {
  const client = getClient();

  // Search for the grade by name (case-insensitive)
  const { data: gradeRows, error } = await client
    .from('grades')
    .select('id, nom, cadre_emploi_id')
    .ilike('nom', gradeName.trim())
    .limit(1);

  if (error || !gradeRows || gradeRows.length === 0) return null;

  const grade = gradeRows[0];

  // Get echelons for salary range
  const { data: echelons } = await client
    .from('echelons')
    .select('indice_majore')
    .eq('grade_id', grade.id)
    .order('echelon', { ascending: true });

  if (!echelons || echelons.length === 0) return null;

  const imMin = echelons[0].indice_majore;
  const imMax = echelons[echelons.length - 1].indice_majore;
  const salMin = computeSalaries(imMin);
  const salMax = computeSalaries(imMax);

  // Get cadre d'emploi info for the link
  const { data: cadre } = await client
    .from('cadres_emploi')
    .select('id, nom, filiere_id')
    .eq('id', grade.cadre_emploi_id)
    .single();

  let fpSlug = 'territoriale';
  if (cadre) {
    const { data: filiere } = await client
      .from('filieres')
      .select('fonction_publique_id')
      .eq('id', cadre.filiere_id)
      .single();

    if (filiere) {
      const { data: fp } = await client
        .from('fonctions_publiques')
        .select('slug')
        .eq('id', filiere.fonction_publique_id)
        .single();

      if (fp) {
        // Convert db slug to url slug
        fpSlug = fp.slug === 'ville-paris' ? 'ville-de-paris' : fp.slug;
      }
    }
  }

  return {
    gradeNom: grade.nom,
    cadreEmploiNom: cadre?.nom || '',
    cadreEmploiSlug: cadre ? slugifyGrade(cadre.nom) : '',
    fpSlug,
    salaireMinBrut: salMin.brut,
    salaireMaxBrut: salMax.brut,
    salaireMinNet: salMin.net,
    salaireMaxNet: salMax.net,
    imMin,
    imMax,
  };
}

/**
 * Get multiple grade infos from a grades string (space-separated or comma-separated).
 * Returns the first match found.
 */
export async function getGradeInfoFromString(gradesStr: string): Promise<GradeInfo | null> {
  if (!gradesStr) return null;

  // Try the full string first
  const fullMatch = await getGradeInfo(gradesStr);
  if (fullMatch) return fullMatch;

  // Try splitting by common separators
  const parts = gradesStr.split(/[,;/]/).map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    const info = await getGradeInfo(part);
    if (info) return info;
  }

  // Fuzzy matching: fetch all grade names and find the longest one contained in the string
  const client = getClient();
  const { data: allGrades } = await client
    .from('grades')
    .select('nom')
    .order('nom');

  if (!allGrades) return null;

  // Get unique grade names, sorted by length desc (longest match first)
  const uniqueNames = [...new Set(allGrades.map(g => g.nom))].sort((a, b) => b.length - a.length);
  const lowerStr = gradesStr.toLowerCase();

  for (const nom of uniqueNames) {
    if (lowerStr.includes(nom.toLowerCase())) {
      const info = await getGradeInfo(nom);
      if (info) return info;
    }
  }

  return null;
}

/** Count offres in a given ville. */
export async function getVilleStats(ville: string, departement: string): Promise<VilleStats> {
  const client = getClient();

  const [countResult, blasonResult] = await Promise.all([
    client
      .from('offres')
      .select('id', { count: 'exact', head: true })
      .eq('ville', ville)
      .eq('departement', departement),
    client
      .from('villes')
      .select('blason_url,image_url')
      .eq('ville', ville)
      .eq('departement', departement)
      .maybeSingle(),
  ]);

  return {
    nbOffres: countResult.count ?? 0,
    blasonUrl: blasonResult.data?.blason_url || blasonResult.data?.image_url || null,
  };
}

/** Count offres and top filières in a department. */
export async function getDepartementStats(departement: string): Promise<DepartementStats> {
  const client = getClient();

  // Count total offres
  const { count } = await client
    .from('offres')
    .select('id', { count: 'exact', head: true })
    .eq('departement', departement);

  // Get top filières — fetch filiere column for this dept and count client-side
  const { data: rows } = await client
    .from('offres')
    .select('filiere')
    .eq('departement', departement)
    .limit(2000);

  const filiereCounts: Record<string, number> = {};
  for (const row of rows || []) {
    if (row.filiere) {
      filiereCounts[row.filiere] = (filiereCounts[row.filiere] || 0) + 1;
    }
  }

  const topFilieres = Object.entries(filiereCounts)
    .map(([filiere, c]) => ({ filiere, count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    nbOffres: count ?? 0,
    topFilieres,
  };
}

// ---------------------------------------------------------------------------
// Ville pages (SEO)
// ---------------------------------------------------------------------------

export interface VillePageData {
  ville: string;
  villeSlug: string;
  departement: string;
  departementNom: string;
  region: string;
  nbOffres: number;
  blasonUrl: string | null;
  offres: Offre[];
  topFilieres: { filiere: string; count: number }[];
  topCategories: { categorie: string; count: number }[];
}

/** Slugify a ville name for URL. */
export function slugifyVille(ville: string): string {
  return ville
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 200);
}

/** Get all distinct villes with their offre count (for generateStaticParams or listing). */
export async function getVillesWithCounts(minOffres = 1): Promise<
  { ville: string; villeSlug: string; departement: string; departementNom: string; region: string; nbOffres: number }[]
> {
  const client = getClient();
  // Use ville_clean for grouping — paginate to get all rows (Supabase default limit = 1000)
  let allData: { ville_clean: string; departement: string; departement_nom: string; region: string }[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await client
      .from('offres')
      .select('ville_clean, departement, departement_nom, region')
      .not('ville_clean', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`getVillesWithCounts: ${error.message}`);
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    from += data.length;
    if (data.length < PAGE) break;
  }
  const data = allData;

  // Group by ville_clean+departement
  const map = new Map<string, { ville: string; departement: string; departementNom: string; region: string; count: number }>();
  for (const row of data || []) {
    if (!row.ville_clean || !row.departement) continue;
    const key = `${row.ville_clean}|${row.departement}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
    } else {
      map.set(key, {
        ville: row.ville_clean,
        departement: row.departement,
        departementNom: row.departement_nom || '',
        region: row.region || '',
        count: 1,
      });
    }
  }

  return Array.from(map.values())
    .filter(v => v.count >= minOffres)
    .map(v => ({
      ...v,
      villeSlug: slugifyVille(v.ville),
      nbOffres: v.count,
    }))
    .sort((a, b) => b.nbOffres - a.nbOffres);
}

/** Get full page data for a ville by slug. */
export async function getVillePageData(villeSlug: string): Promise<VillePageData | null> {
  const client = getClient();

  // Find the ville name from slug using ville_clean — paginate
  let allOffres: { ville_clean: string; departement: string; departement_nom: string; region: string; filiere: string; categorie: string }[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await client
      .from('offres')
      .select('ville_clean, departement, departement_nom, region, filiere, categorie')
      .not('ville_clean', 'is', null)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`getVillePageData: ${error.message}`);
    if (!data || data.length === 0) break;
    allOffres = allOffres.concat(data);
    from += data.length;
    if (data.length < PAGE) break;
  }

  // Find first match
  let targetVille = '';
  let targetDept = '';
  let targetDeptNom = '';
  let targetRegion = '';

  const villeOffres: typeof allOffres = [];

  for (const row of allOffres || []) {
    if (!row.ville_clean) continue;
    if (slugifyVille(row.ville_clean) === villeSlug) {
      if (!targetVille) {
        targetVille = row.ville_clean;
        targetDept = row.departement || '';
        targetDeptNom = row.departement_nom || '';
        targetRegion = row.region || '';
      }
      villeOffres.push(row);
    }
  }

  if (!targetVille) return null;

  // Count filières
  const filiereCounts: Record<string, number> = {};
  const categorieCounts: Record<string, number> = {};
  for (const row of villeOffres) {
    if (row.filiere) filiereCounts[row.filiere] = (filiereCounts[row.filiere] || 0) + 1;
    if (row.categorie) categorieCounts[row.categorie] = (categorieCounts[row.categorie] || 0) + 1;
  }

  const topFilieres = Object.entries(filiereCounts)
    .map(([filiere, count]) => ({ filiere, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topCategories = Object.entries(categorieCounts)
    .map(([categorie, count]) => ({ categorie, count }))
    .sort((a, b) => b.count - a.count);

  // Get blason
  const blasonUrl = await getBlasonForVille(targetVille, targetDept);

  // Get actual offres (paginated, most recent)
  const { data: offresData } = await client
    .from('offres')
    .select(LIST_COLUMNS)
    .eq('ville_clean', targetVille)
    .eq('departement', targetDept)
    .order('date_poste', { ascending: false, nullsFirst: false })
    .limit(50);

  return {
    ville: targetVille,
    villeSlug,
    departement: targetDept,
    departementNom: targetDeptNom,
    region: targetRegion,
    nbOffres: villeOffres.length,
    blasonUrl,
    offres: (offresData || []).map(mapRow),
    topFilieres,
    topCategories,
  };
}

// ---------------------------------------------------------------------------
// Format helpers (sync — no change needed)
// ---------------------------------------------------------------------------

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
}
