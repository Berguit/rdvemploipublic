/**
 * Fast cron sync script for offers from emploi-territorial.fr
 * Listing pages only (no detail pages)
 * Phase 1: Import new offers (listing data only)
 * Phase 2: Mark expired offers
 * Phase 3: Report
 * 
 * Usage: npx dotenvx run -f .env.local -- node scripts/cron-sync-offres-fast.js
 */
const { createClient } = require('@supabase/supabase-js');
const cheerio = require('cheerio');

const BASE_URL = 'https://www.emploi-territorial.fr';
const LISTING_URL = `${BASE_URL}/emploi-mobilite/`;
const MAX_PAGES_WITHOUT_NEW = 3; // Stop after 3 consecutive pages without new offers
const RATE_LIMIT_MS = 1100; // 1.1s between requests
const BATCH_SIZE = 100;

// ---------------------------------------------------------------------------
// Utils (from import-listing-fast.js)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Parse listing page
// ---------------------------------------------------------------------------
function parseListingPage(html) {
  const $ = cheerio.load(html);
  const offers = [];

  const cards = $('[class*="offre"]').filter((i, el) => $(el).find('.numOf').length > 0);

  cards.each((i, el) => {
    const $card = $(el);
    const reference = $card.find('.numOf').text().trim().replace(/^Offre\s*n°?\s*/, '');
    if (!reference) return;

    const $titleLink = $card.find('h2 a, h3 a').first();
    const titre = $titleLink.text().trim();
    const href = $titleLink.attr('href');
    const url = href ? (href.startsWith('http') ? href : BASE_URL + href) : null;

    const $details = $card.find('[class*="detail"], .detail-offre, .infos-offre');
    let employeur = '', lieu = '', departement = '', typeRecrutement = '', grade = '', categorie = '', filiere = '';

    $details.each((j, detailEl) => {
      const text = $(detailEl).text().trim();
      if (text.includes('Employeur')) employeur = text.replace(/Employeur\s*:?\s*/i, '').trim();
      else if (text.includes('Lieu')) lieu = text.replace(/Lieu\s*:?\s*/i, '').trim();
      else if (text.includes('Département')) departement = text.replace(/Département\s*:?\s*/i, '').trim();
      else if (text.includes('Type de recrutement')) typeRecrutement = text.replace(/Type\s+de\s+recrutement\s*:?\s*/i, '').trim();
      else if (text.includes('Grade')) grade = text.replace(/Grade\s*:?\s*/i, '').trim();
      else if (text.includes('Catégorie')) categorie = text.replace(/Catégorie\s*:?\s*/i, '').trim();
      else if (text.includes('Filière')) filiere = text.replace(/Filière\s*:?\s*/i, '').trim();
    });

    offers.push({
      reference,
      titre,
      url,
      employeur: employeur || null,
      lieu,
      departement: departement || null,
      typeRecrutement: typeRecrutement || null,
      grade: grade || null,
      categorie: categorie || null,
      filiere: filiere || null
    });
  });

  return offers;
}

// ---------------------------------------------------------------------------
// Main sync function
// ---------------------------------------------------------------------------
async function main() {
  console.log('🚀 Starting FAST cron sync for emploi-territorial.fr offers...\n');
  
  const startTime = Date.now();
  let report = {
    newOffers: 0,
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
    // PHASE 1: Import new offers (listing only)
    // ---------------------------------------------------------------------------
    console.log('📋 PHASE 1: Fetching new offers from listings...');
    
    // Load existing references
    console.log('🔍 Loading existing references...');
    const allReferences = new Set();
    let hasMore = true;
    let lastRef = null;
    
    while (hasMore) {
      const query = supabase.from('offres').select('reference').limit(1000);
      if (lastRef) query.gt('reference', lastRef);
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (data && data.length > 0) {
        data.forEach(row => allReferences.add(row.reference));
        lastRef = data[data.length - 1].reference;
        hasMore = data.length === 1000;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`📊 Found ${allReferences.size} existing references`);

    // Scrape listing pages
    const newOffers = [];
    let page = 1;
    let consecutivePagesWithoutNew = 0;
    
    while (consecutivePagesWithoutNew < MAX_PAGES_WITHOUT_NEW) {
      console.log(`📄 Scraping page ${page}...`);
      
      let url, options;
      if (page === 1) {
        url = LISTING_URL;
        options = { method: 'GET' };
      } else {
        url = LISTING_URL;
        options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: `page=${page}&ajax=1`
        };
      }
      
      const response = await fetch(url, options);
      if (!response.ok) {
        console.error(`❌ Failed to fetch page ${page}: ${response.statusText}`);
        break;
      }
      
      const html = await response.text();
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

    // Process and import new offers
    if (newOffers.length > 0) {
      console.log(`\n💾 Processing ${newOffers.length} offers for import...`);
      
      const processedOffers = newOffers.map(offer => {
        const departement = deptNameToCode(offer.departement);
        const slug = generateSlug(offer.titre, departement, offer.reference);
        
        // Process type_emploi from typeRecrutement
        let type_emploi = null;
        if (/titulaire|statutaire/i.test(offer.typeRecrutement || '')) {
          type_emploi = 'Titulaire';
        } else if (/contractuel|contrat/i.test(offer.typeRecrutement || '')) {
          type_emploi = 'Contractuel';
        }
        
        // Process categorie
        let categorie = null;
        const catRaw = offer.categorie || '';
        if (/cat[ée]gorie\s*A\b|^A$/i.test(catRaw)) categorie = 'A';
        else if (/cat[ée]gorie\s*B\b|^B$/i.test(catRaw)) categorie = 'B';
        else if (/cat[ée]gorie\s*C\b|^C$/i.test(catRaw)) categorie = 'C';
        else if (/^[ABC]$/.test(catRaw)) categorie = catRaw;
        
        // Process filiere
        let filiere = offer.filiere || null;
        if (filiere) filiere = filiere.replace(/^Filière\s+/i, '');
        
        return {
          reference: offer.reference,
          slug,
          titre: offer.titre,
          employeur: offer.employeur,
          lieu_travail: offer.lieu || null,
          ville: null,
          departement,
          departement_nom: offer.departement,
          categorie,
          filiere,
          famille_metiers: null,
          grades: offer.grade,
          metiers: null,
          type_emploi,
          type_emploi_raw: offer.typeRecrutement,
          ouvert_contractuels: null,
          temps_travail: null,
          temps_travail_raw: null,
          teletravail: null,
          management: null,
          experience: null,
          descriptif_emploi: null,
          profil_recherche: null,
          date_poste: null,
          date_limite: null,
          source_url: offer.url,
          ville_clean: null,
          expired: false
        };
      });

      // Import to Supabase in batches
      console.log(`💾 Importing ${processedOffers.length} offers to Supabase...`);
      
      for (let i = 0; i < processedOffers.length; i += BATCH_SIZE) {
        const batch = processedOffers.slice(i, i + BATCH_SIZE);
        
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
      const today = new Date().toISOString().split('T')[0];
      
      const { count: expiredCount, error: expiredError } = await supabase
        .from('offres')
        .update({ expired: true })
        .lt('date_limite', today)
        .not('date_limite', 'is', null)
        .neq('expired', true);
      
      if (expiredError) {
        console.error('⚠️ Error marking expired offers:', expiredError);
        report.errors.push(`Expired marking error: ${expiredError.message}`);
      } else {
        report.expiredMarked = expiredCount || 0;
        console.log(`✅ Marked ${report.expiredMarked} offers as expired`);
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
    console.log('📋 RAPPORT FINAL CRON SYNC FAST');
    console.log('='.repeat(60));
    console.log(`Nouvelles offres trouvées     : ${report.newOffers}`);
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