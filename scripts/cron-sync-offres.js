/**
 * Cron sync script for offers from emploi-territorial.fr
 * Phase 1: Import new offers with full details
 * Phase 2: Mark expired offers
 * Phase 3: Report
 * 
 * Usage: npx dotenvx run -f .env.local -- node scripts/cron-sync-offres.js
 */
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.emploi-territorial.fr';
const LISTING_URL = `${BASE_URL}/emploi-mobilite/`;
const MAX_PAGES_WITHOUT_NEW = 3; // Stop after 3 consecutive pages without new offers
const RATE_LIMIT_MS = 1100; // 1.1s between requests
const BATCH_SIZE = 100;

// ---------------------------------------------------------------------------
// ville-utils (ported from scrape-new-offres.js)
// ---------------------------------------------------------------------------
const LOWERCASE_WORDS = new Set([
  'de', 'du', 'des', 'le', 'la', 'les', 'l', 'en', 'sur', 'sous', 'aux', 'et',
]);

function toTitleCase(str) {
  return str.toLowerCase().split(/(\s+|-|')/).map((part, i) => {
    if (/^\s+$/.test(part) || part === '-' || part === "'") return part;
    if (i > 0 && LOWERCASE_WORDS.has(part)) return part;
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join('');
}

function normalize(raw) {
  let s = raw.trim().replace(/\s{2,}/g, ' ').replace(/^-+|-+$/g, '').trim();
  if (s.length < 2 || /^\d+$/.test(s)) return null;
  return toTitleCase(s);
}

function slugify(text) {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 120);
}

function generateSlug(titre, departement, reference) {
  const base = slugify(titre);
  const dept = departement || '';
  const refShort = reference.toLowerCase();
  return `${base}-${dept}-${refShort}`.replace(/--+/g, '-').substring(0, 200);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Dept mapping
const DEPT_NAME_TO_CODE = {
  'ain': '01', 'aisne': '02', 'allier': '03', 'alpes-de-haute-provence': '04',
  'hautes-alpes': '05', 'alpes-maritimes': '06', 'ardeche': '07', 'ardennes': '08',
  'ariege': '09', 'aube': '10', 'aude': '11', 'aveyron': '12',
  'bouches-du-rhone': '13', 'calvados': '14', 'cantal': '15', 'charente': '16',
  'charente-maritime': '17', 'cher': '18', 'correze': '19', 'corse-du-sud': '2A',
  'haute-corse': '2B', "cote-d'or": '21', "cotes-d'armor": '22', 'creuse': '23',
  'dordogne': '24', 'doubs': '25', 'drome': '26', 'eure': '27',
  'eure-et-loir': '28', 'finistere': '29', 'gard': '30', 'haute-garonne': '31',
  'gers': '32', 'gironde': '33', 'herault': '34', 'ille-et-vilaine': '35',
  'indre': '36', 'indre-et-loire': '37', 'isere': '38', 'jura': '39',
  'landes': '40', 'loir-et-cher': '41', 'loire': '42', 'haute-loire': '43',
  'loire-atlantique': '44', 'loiret': '45', 'lot': '46', 'lot-et-garonne': '47',
  'lozere': '48', 'maine-et-loire': '49', 'manche': '50', 'marne': '51',
  'haute-marne': '52', 'mayenne': '53', 'meurthe-et-moselle': '54', 'meuse': '55',
  'morbihan': '56', 'moselle': '57', 'nievre': '58', 'nord': '59',
  'oise': '60', 'orne': '61', 'pas-de-calais': '62', 'puy-de-dome': '63',
  'pyrenees-atlantiques': '64', 'hautes-pyrenees': '65', 'pyrenees-orientales': '66',
  'bas-rhin': '67', 'haut-rhin': '68', 'rhone': '69', 'haute-saone': '70',
  'saone-et-loire': '71', 'sarthe': '72', 'savoie': '73', 'haute-savoie': '74',
  'paris': '75', 'seine-maritime': '76', 'seine-et-marne': '77', 'yvelines': '78',
  'deux-sevres': '79', 'somme': '80', 'tarn': '81', 'tarn-et-garonne': '82',
  'var': '83', 'vaucluse': '84', 'vendee': '85', 'vienne': '86',
  'haute-vienne': '87', 'vosges': '88', 'yonne': '89', 'territoire de belfort': '90',
  'essonne': '91', 'hauts-de-seine': '92', 'seine-saint-denis': '93',
  'val-de-marne': '94', "val-d'oise": '95', 'guadeloupe': '971',
  'martinique': '972', 'guyane': '973', 'la reunion': '974', 'mayotte': '976',
};

function deptNameToCode(name) {
  if (!name) return null;
  const normalized = name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return DEPT_NAME_TO_CODE[normalized] || null;
}

// Ville utils (truncated for brevity - same as in scrape-new-offres.js)
const LIEU_PATTERN_COMMA = /,\s*([^,]+?)\s*\([^)]*\(\d{2,3}\)\s*\)\s*$/;
const LIEU_PATTERN_NO_COMMA = /^([^,(]+?)\s*\([^)]*\(\d{2,3}\)\s*\)\s*$/;
const LIEU_PATTERN_SIMPLE_PAREN = /^(?:.*,\s*)?([A-ZÀ-Ü][A-ZÀ-Ü\s-]{2,})\s*\(\d{2,3}\)\s*$/;

const NOISE_PATTERNS = [
  /titulaire/i, /permis\s*[A-Z]/i, /poste\s/i, /expérience/i, /diplôme/i,
  /bac\s*\+/i, /formation/i, /contrat/i, /temps\s*(plein|partiel)/i, /cdd|cdi/i,
  /fonctionnaire/i, /catégorie\s*[A-C]/i,
  /adjoint|rédacteur|attaché|ingénieur|technicien/i, /^\d{5}$/,
];

function isNoise(s) { return NOISE_PATTERNS.some(p => p.test(s)); }

function extractFromLieuTravail(lieu) {
  if (!lieu) return null;
  let m = lieu.match(LIEU_PATTERN_COMMA);
  if (m && m[1].trim().length >= 2 && !/^\d+$/.test(m[1].trim())) return normalize(m[1].trim());
  m = lieu.match(LIEU_PATTERN_NO_COMMA);
  if (m) return normalize(m[1].trim());
  m = lieu.match(LIEU_PATTERN_SIMPLE_PAREN);
  if (m) return normalize(m[1].trim());
  const parts = lieu.split(',');
  if (parts.length >= 2) {
    const last = parts[parts.length - 1].trim();
    if (/^[A-ZÀ-Ü][A-ZÀ-Üa-zà-ÿ\s'-]{2,}$/.test(last) && last.length <= 60 && !isNoise(last))
      return normalize(last);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Parse listing page (proven version from import-listing-fast.js)
// ---------------------------------------------------------------------------
function parseListingPage(html) {
  const $ = cheerio.load(html);
  const offers = [];

  const cards = $('[class*="offre"]').filter((i, el) => $(el).find('.numOf').length > 0);

  cards.each((i, el) => {
    const $card = $(el);
    const reference = $card.find('.numOf').first().text().trim();
    const titleLink = $card.find('a.lien-details-offre').first();
    const titre = titleLink.text().trim();
    const href = titleLink.attr('href') || '';
    const url = href ? `${BASE_URL}${href}` : '';

    // Type recrutement
    const typeRecrutement = $card.find('.badge-light').first().text().trim();

    // Employeur
    const employeurEl = $card.find('.detail-offre-collectivite .valeur a');
    let employeur = '';
    if (employeurEl.length) {
      employeur = employeurEl.clone().children('.icon-hash').remove().end().text().trim();
    }

    // Département name
    const deptName = $card.find('.detail-offre-collectivite .text-secondary').text().trim();

    // Grade
    const gradeEl = $card.find('.detail-offre-grade .valeur').first();
    const grade = gradeEl.contents().filter(function() { return this.nodeType === 3; }).text().trim();

    // Catégorie
    const catBadge = $card.find('.badge-info').first();
    const catTitle = catBadge.attr('title') || '';
    const catText = catBadge.text().trim();

    // Filière
    const filiereBadge = $card.find('.badge-secondary').first();
    const filiereTitle = filiereBadge.attr('title') || '';
    const filiereText = filiereBadge.text().trim();

    // Dates from tooltips
    let datePublication = null;
    let dateLimite = null;
    $card.find('button[data-tooltip]').each((j, btn) => {
      const tooltip = $(btn).attr('data-tooltip') || '';
      const pubMatch = tooltip.match(/publi[ée]\s+le\s+(\d{2})\/(\d{2})\/(\d{4})/i);
      if (pubMatch) datePublication = `${pubMatch[3]}-${pubMatch[2]}-${pubMatch[1]}`;
      const limMatch = tooltip.match(/limite.*?(\d{2})\/(\d{2})\/(\d{4})/i);
      if (limMatch) dateLimite = `${limMatch[3]}-${limMatch[2]}-${limMatch[1]}`;
    });

    if (reference && titre) {
      offers.push({
        reference, titre, url, typeRecrutement, employeur,
        deptName, grade, catTitle, catText, filiereTitle, filiereText,
        datePublication, dateLimite
      });
    }
  });

  return offers;
}

// ---------------------------------------------------------------------------
// Fetch detail page (proven version from scrape-new-offres.js)
// ---------------------------------------------------------------------------
async function fetchAndParseDetail(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove scripts/styles for cleaner text extraction
  $('script, style').remove();
  const bodyText = $('body').text();

  const data = {};

  // Lieu de travail
  const lieuMatch = bodyText.match(/Lieu de travail\s+(.*?)(?=\s*Poste à pourvoir|\s*Date limite|\s*Type d'emploi)/s);
  if (lieuMatch) data.lieu_travail = lieuMatch[1].trim().replace(/\s+/g, ' ');

  // Date poste
  const datePosteMatch = bodyText.match(/Poste à pourvoir le\s+(\d{2}\/\d{2}\/\d{4})/);
  if (datePosteMatch) {
    const [d, m, y] = datePosteMatch[1].split('/');
    data.date_poste = `${y}-${m}-${d}`;
  }

  // Date limite
  const dateLimiteMatch = bodyText.match(/Date limite de candidature\s+(\d{2}\/\d{2}\/\d{4})/);
  if (dateLimiteMatch) {
    const [d, m, y] = dateLimiteMatch[1].split('/');
    data.date_limite = `${y}-${m}-${d}`;
  }

  // Type emploi
  const typeMatch = bodyText.match(/Type d'emploi\s+(.*?)(?=\s*Motif|\s*Localisation|\s*Détails)/s);
  if (typeMatch) data.type_emploi_raw = typeMatch[1].trim().replace(/\s+/g, ' ');

  // Famille de métiers
  const familleMatch = bodyText.match(/Famille de métiers\s+(.*?)(?=\s*Grade|\s*Métier)/s);
  if (familleMatch) data.famille_metiers = familleMatch[1].trim().replace(/\s+/g, ' ');

  // Grades
  const gradesMatch = bodyText.match(/Grade\(s\) recherché\(s\)\s+(.*?)(?=\s*Métier|\s*Ouvert)/s);
  if (gradesMatch) data.grades = gradesMatch[1].trim().replace(/\s+/g, ' ');

  // Métiers
  const metiersMatch = bodyText.match(/Métier\(s\)\s+(.*?)(?=\s*Ouvert|\s*Temps)/s);
  if (metiersMatch) data.metiers = metiersMatch[1].trim().replace(/\s+/g, ' ');

  // Ouvert aux contractuels
  const contractuelsMatch = bodyText.match(/Ouvert aux contractuels\s+(Oui|Non)/i);
  if (contractuelsMatch) data.ouvert_contractuels = contractuelsMatch[1].toLowerCase() === 'oui';

  // Temps de travail
  const tempsMatch = bodyText.match(/Temps de travail\s+(.*?)(?=\s*Télétravail|\s*Management|\s*Expérience|\s*Descriptif)/s);
  if (tempsMatch) data.temps_travail_raw = tempsMatch[1].trim().replace(/\s+/g, ' ');

  // Télétravail
  const teletravailMatch = bodyText.match(/Télétravail\s+(Oui|Non)/i);
  if (teletravailMatch) data.teletravail = teletravailMatch[1].toLowerCase() === 'oui';

  // Management
  const managementMatch = bodyText.match(/Management\s+(Oui|Non)/i);
  if (managementMatch) data.management = managementMatch[1].toLowerCase() === 'oui';

  // Experience
  const expMatch = bodyText.match(/Expérience souhaitée\s+(.*?)(?=\s*Rémunération|\s*Descriptif|\s*$)/s);
  if (expMatch) data.experience = expMatch[1].trim().replace(/\s+/g, ' ').substring(0, 200);

  // Descriptif de l'emploi
  const descMatch = bodyText.match(/Descriptif de l'emploi\s+(.*?)(?=\s*Profil recherché|\s*Missions|\s*$)/s);
  if (descMatch) data.descriptif_emploi = descMatch[1].trim().replace(/\s+/g, ' ').substring(0, 5000);

  // Profil recherché
  const profilMatch = bodyText.match(/Profil recherché\s+(.*?)(?=\s*Contact|\s*Informations|\s*$)/s);
  if (profilMatch) data.profil_recherche = profilMatch[1].trim().replace(/\s+/g, ' ').substring(0, 5000);

  // Département from lieu_travail
  if (data.lieu_travail) {
    const deptMatch = data.lieu_travail.match(/\((\d{2,3}[AB]?)\)\s*\)?$/);
    if (deptMatch) data.departement_code = deptMatch[1];

    const deptNameMatch = data.lieu_travail.match(/\(([^(]+)\s*\(\d{2,3}[AB]?\)\s*\)/);
    if (deptNameMatch) data.departement_nom = deptNameMatch[1].trim();
  }

  return data;
}

// ---------------------------------------------------------------------------
// Fetch listing page (proven version)
// ---------------------------------------------------------------------------
async function fetchListingPage(page) {
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

  if (page === 1) {
    const res = await fetch(LISTING_URL, { headers });
    return res.text();
  } else {
    const res = await fetch(LISTING_URL, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: `page=${page}&ajax=1`
    });
    return res.text();
  }
}

// ---------------------------------------------------------------------------
// Main sync function
// ---------------------------------------------------------------------------
async function main() {
  console.log('🚀 Starting cron sync for emploi-territorial.fr offers...\n');
  
  const startTime = Date.now();
  let report = {
    newOffers: 0,
    detailsFetched: 0,
    detailErrors: 0,
    imported: 0,
    importErrors: 0,
    expiredMarked: 0,
    totalInDb: 0,
    errors: []
  };

  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // ---------------------------------------------------------------------------
    // PHASE 1: Import new offers
    // ---------------------------------------------------------------------------
    console.log('📋 PHASE 1: Fetching new offers...');
    
    // Load existing references (paginated with .range() — Supabase limits to 1000)
    console.log('🔍 Loading existing references...');
    const allReferences = new Set();
    let from = 0;
    const PAGE_SIZE = 1000;
    
    while (true) {
      const { data, error } = await supabase
        .from('offres')
        .select('reference')
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      data.forEach(r => allReferences.add(r.reference));
      from += PAGE_SIZE;
      if (data.length < PAGE_SIZE) break;
    }
    
    console.log(`📊 Found ${allReferences.size} existing references`);

    // Scrape listing pages
    const newOffers = [];
    let page = 1;
    let consecutivePagesWithoutNew = 0;
    
    while (consecutivePagesWithoutNew < MAX_PAGES_WITHOUT_NEW) {
      console.log(`📄 Scraping page ${page}...`);
      
      let html;
      try {
        html = await fetchListingPage(page);
      } catch (err) {
        console.error(`❌ Failed to fetch page ${page}: ${err.message}`);
        break;
      }
      const pageOffers = parseListingPage(html);
      
      if (pageOffers.length === 0) {
        console.log(`⚠️ No offers found on page ${page}`);
        break;
      }
      
      const newOffersOnPage = pageOffers.filter(offer => !allReferences.has(offer.reference));
      
      if (newOffersOnPage.length === 0) {
        consecutivePagesWithoutNew++;
        console.log(`📄 Page ${page}: 0 new offers (${consecutivePagesWithoutNew}/${MAX_PAGES_WITHOUT_NEW} consecutive)`);
      } else {
        consecutivePagesWithoutNew = 0;
        newOffers.push(...newOffersOnPage);
        console.log(`📄 Page ${page}: ${newOffersOnPage.length} new offers`);
      }
      
      page++;
      await sleep(RATE_LIMIT_MS);
    }
    
    report.newOffers = newOffers.length;
    console.log(`✅ Found ${newOffers.length} new offers total`);

    // Fetch details for new offers
    if (newOffers.length > 0) {
      console.log(`\n🔍 Fetching details for ${newOffers.length} offers...`);
      
      const fullOffers = [];
      for (let i = 0; i < newOffers.length; i++) {
        const offer = newOffers[i];
        console.log(`📋 ${i + 1}/${newOffers.length}: ${offer.reference} - ${offer.titre.substring(0, 60)}`);
        
        let details = {};
        if (offer.url) {
          try {
            details = await fetchAndParseDetail(offer.url) || {};
            if (details && Object.keys(details).length > 0) {
              report.detailsFetched++;
            } else {
              report.detailErrors++;
            }
          } catch (err) {
            console.error(`   ❌ Error fetching detail: ${err.message}`);
            report.detailErrors++;
          }
          await sleep(RATE_LIMIT_MS);
        }
        
        // Build full offer object — merge listing data + detail data
        const lieu_travail = details.lieu_travail || null;
        const ville_clean = extractFromLieuTravail(lieu_travail) || (offer.employeur ? normalize(offer.employeur) : null);
        
        // Département: prefer detail page (has code), fallback to listing dept name
        let departement = details.departement_code || deptNameToCode(offer.deptName) || null;

        const slug = generateSlug(offer.titre, departement, offer.reference);
        
        // Type emploi
        let type_emploi = null;
        const rawType = details.type_emploi_raw || offer.typeRecrutement || '';
        if (/permanent/i.test(rawType)) type_emploi = 'Titulaire';
        else if (/temporaire|contractuel|remplacement/i.test(rawType)) type_emploi = 'Contractuel';
        
        // Temps travail
        let temps_travail = null;
        const rawTemps = details.temps_travail_raw || '';
        if (/complet/i.test(rawTemps)) temps_travail = 'Complet';
        else if (/partiel|incomplet/i.test(rawTemps)) temps_travail = 'Non complet';
        
        // Catégorie
        let categorie = null;
        const catRaw = offer.catTitle || offer.catText || '';
        const catMatch = catRaw.match(/cat[ée]gorie\s*([ABC])/i);
        if (catMatch) categorie = catMatch[1].toUpperCase();
        else if (/^[ABC]$/.test(catRaw.trim())) categorie = catRaw.trim();
        
        // Filière
        let filiere = (offer.filiereTitle || offer.filiereText || '').replace(/^Filière\s+/i, '').trim() || null;
        
        // Truncate helper to respect varchar limits
        const t = (val, max) => val ? val.substring(0, max) : null;

        fullOffers.push({
          reference: t(offer.reference, 30),
          slug: t(slug, 255),
          titre: t(offer.titre, 500),
          employeur: t(offer.employeur, 500),
          lieu_travail: t(lieu_travail, 1000),
          ville: null,
          departement: t(departement, 5),
          departement_nom: t(details.departement_nom || offer.deptName, 100),
          categorie: t(categorie, 1),
          filiere: t(filiere, 100),
          famille_metiers: t(details.famille_metiers, 200),
          grades: t(details.grades || offer.grade, 500),
          metiers: t(details.metiers, 500),
          type_emploi: t(type_emploi, 100),
          type_emploi_raw: t(details.type_emploi_raw || offer.typeRecrutement, 200),
          ouvert_contractuels: details.ouvert_contractuels ?? null,
          temps_travail: t(temps_travail, 50),
          temps_travail_raw: t(details.temps_travail_raw, 200),
          teletravail: details.teletravail ?? null,
          management: details.management ?? null,
          experience: t(details.experience, 100),
          descriptif_emploi: details.descriptif_emploi || null,
          profil_recherche: details.profil_recherche || null,
          date_poste: details.date_poste || null,
          date_limite: details.date_limite || offer.dateLimite || null,
          source_url: t(offer.url, 500),
          ville_clean: t(ville_clean, 200),
        });
      }

      // Import to Supabase in batches
      console.log(`\n💾 Importing ${fullOffers.length} offers to Supabase...`);
      
      for (let i = 0; i < fullOffers.length; i += BATCH_SIZE) {
        const batch = fullOffers.slice(i, i + BATCH_SIZE);
        
        try {
          const { error } = await supabase
            .from('offres')
            .upsert(batch, { onConflict: 'reference' });
          
          if (error) throw error;
          
          report.imported += batch.length;
          console.log(`✅ Imported batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} offers`);
        } catch (error) {
          console.error(`❌ Error importing batch:`, error);
          report.importErrors += batch.length;
          report.errors.push(`Import batch error: ${error.message}`);
        }
      }
    }

    // ---------------------------------------------------------------------------
    // PHASE 2: Mark expired offers
    // ---------------------------------------------------------------------------
    console.log('\n📅 PHASE 2: Marking expired offers...');
    
    try {
      // Check if expired column exists
      const { data: sample } = await supabase.from('offres').select('expired').limit(1);
      const hasExpiredColumn = sample && sample.length > 0 && 'expired' in sample[0];
      
      if (!hasExpiredColumn) {
        console.log('⚠️ Column "expired" not found — skipping. Run this SQL in Supabase dashboard:');
        console.log('   ALTER TABLE offres ADD COLUMN IF NOT EXISTS expired BOOLEAN DEFAULT FALSE;');
      } else {
        const today = new Date().toISOString().split('T')[0];
        
        const { count: expiredCount, error: expiredError } = await supabase
          .from('offres')
          .update({ expired: true }, { count: 'exact' })
          .lt('date_limite', today)
          .not('date_limite', 'is', null)
          .or('expired.is.null,expired.eq.false');
        
        if (expiredError) {
          console.error('⚠️ Error marking expired offers:', expiredError);
          report.errors.push(`Expired marking error: ${expiredError.message}`);
        } else {
          report.expiredMarked = expiredCount || 0;
          console.log(`✅ Marked ${report.expiredMarked} offers as expired`);
        }
      }
    } catch (error) {
      console.error('⚠️ Error in expired marking phase:', error);
      report.errors.push(`Expired phase error: ${error.message}`);
    }

    // ---------------------------------------------------------------------------
    // PHASE 3: Final report
    // ---------------------------------------------------------------------------
    console.log('\n📊 PHASE 3: Generating report...');
    
    const { count: totalCount } = await supabase
      .from('offres')
      .select('*', { count: 'exact', head: true });
    
    report.totalInDb = totalCount || 0;
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 RAPPORT FINAL CRON SYNC');
    console.log('='.repeat(60));
    console.log(`Nouvelles offres trouvées     : ${report.newOffers}`);
    console.log(`Détails récupérés            : ${report.detailsFetched}`);
    console.log(`Erreurs détails              : ${report.detailErrors}`);
    console.log(`Offres importées             : ${report.imported}`);
    console.log(`Erreurs import               : ${report.importErrors}`);
    console.log(`Offres marquées expirées     : ${report.expiredMarked}`);
    console.log(`Total en base                : ${report.totalInDb}`);
    console.log(`Durée                        : ${duration}s`);
    
    if (report.errors.length > 0) {
      console.log(`Erreurs                      : ${report.errors.length}`);
      report.errors.forEach(err => console.log(`  - ${err}`));
    }
    console.log('='.repeat(60));

    // Output JSON report for monitoring
    process.stdout.write('\n' + JSON.stringify(report) + '\n');
    
    // Exit with appropriate code
    const hasErrors = report.importErrors > 0 || report.errors.length > 0;
    process.exit(hasErrors ? 1 : 0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    report.errors.push(`Fatal error: ${error.message}`);
    process.stdout.write('\n' + JSON.stringify(report) + '\n');
    process.exit(1);
  }
}

main();