import * as fs from 'fs';
import * as cheerio from 'cheerio';
import puppeteer, { type Browser, type Page } from 'puppeteer-core';

// ============================================
// Scraper - Grilles indiciaires
// Source : emploi-collectivites.fr
// ============================================

const BASE_URL = 'https://www.emploi-collectivites.fr';
const RATE_LIMIT_MS = 500;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ---------- Types ----------

interface Echelon {
  echelon: string;
  indice_brut: number | null;
  indice_majore: number | null;
  duree_mois: number | null;
  salaire_brut: number | null;
}

interface Grade {
  nom: string;
  echelons: Echelon[];
}

interface CadreEmploi {
  nom: string;
  categorie: string;
  url: string;
  grades: Grade[];
}

interface Filiere {
  nom: string;
  cadres_emploi: CadreEmploi[];
}

interface FonctionPublique {
  nom: string;
  slug: string;
  url: string;
  filieres: Filiere[];
}

interface GrillesData {
  metadata: {
    source: string;
    date_scraping: string;
    valeur_point_indice: number;
    date_point_indice: string;
  };
  fonctions_publiques: FonctionPublique[];
}

// ---------- Config ----------

const FONCTIONS_PUBLIQUES: { nom: string; slug: string; url: string }[] = [
  {
    nom: 'Fonction Publique Territoriale',
    slug: 'territoriale',
    url: `${BASE_URL}/grille-indiciaire-territoriale`,
  },
  {
    nom: 'Fonction Publique Hospitalière',
    slug: 'hospitaliere',
    url: `${BASE_URL}/grille-indiciaire-hospitaliere`,
  },
  {
    nom: "Fonction Publique d'État",
    slug: 'etat',
    url: `${BASE_URL}/grille-indiciaire-etat`,
  },
  {
    nom: 'Ville de Paris',
    slug: 'ville-paris',
    url: `${BASE_URL}/grille-indiciaire-ville-paris`,
  },
];

// ---------- HTTP (via Puppeteer to bypass Akamai Bot Manager) ----------

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
let browserInstance: Browser | null = null;
let pageInstance: Page | null = null;

async function getBrowser(): Promise<{ browser: Browser; page: Page }> {
  if (browserInstance && pageInstance) return { browser: browserInstance, page: pageInstance };
  browserInstance = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  pageInstance = await browserInstance.newPage();
  await pageInstance.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
  return { browser: browserInstance, page: pageInstance };
}

async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    pageInstance = null;
  }
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<string> {
  const { page } = await getBrowser();
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      if (!response) throw new Error(`No response for ${url}`);
      // Wait for Akamai challenge to resolve (page may redirect)
      await page.waitForFunction(
        () => !document.querySelector('title')?.textContent?.includes('\u00a0') && document.querySelector('table, h1, h2, .grid') !== null,
        { timeout: 15000 }
      ).catch(() => { /* ok if timeout, page may not have expected elements */ });
      const html = await page.content();
      if (html.includes('Powered and protected by') || html.includes('bm-verify')) {
        throw new Error(`Akamai challenge not resolved for ${url}`);
      }
      return html;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt === retries) throw new Error(`Failed after ${retries} attempts: ${msg}`);
      console.log(`   ⚠ Attempt ${attempt} failed (${msg}), retrying in ${RETRY_DELAY_MS}ms...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw new Error('Unreachable');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- HTML utils ----------

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function cleanText(str: string): string {
  return decodeHtmlEntities(str.replace(/\s+/g, ' ').trim());
}

// ---------- Parsing listing pages ----------

function parseListingPage(html: string, _fpSlug: string): Filiere[] {
  const $ = cheerio.load(html);
  const filieres: Filiere[] = [];
  let currentFiliere: Filiere | null = null;

  // Structure: <table class="grid"> with:
  //   <tr class="filiere"> containing <h2>Filière X Name</h2>
  //   <tr class="even|odd" filid="X" catid="Y"> containing:
  //     <td class="colorA|colorB|colorC">A|B|C</td>  (category)
  //     <td class="CadreEmploi"><a class="Grade" href="...">Name</a></td>
  $('table.grid tr').each((_, tr) => {
    const $tr = $(tr);

    // Filière header row
    if ($tr.hasClass('filiere')) {
      const h2 = $tr.find('h2');
      if (h2.length) {
        let filiereName = cleanText(h2.text())
          .replace(/^Fili[èe]re\s+(?:territoriale|hospitali[èe]re|de l[''\u2019][EÉ]tat|Ville de Paris)\s+/i, '')
          .replace(/^Grilles?\s+indiciaires?\s+/i, '')
          .trim();
        if (!filiereName || filiereName.length < 2) filiereName = cleanText(h2.text());

        currentFiliere = { nom: filiereName, cadres_emploi: [] };
        filieres.push(currentFiliere);
      }
      return;
    }

    // Cadre d'emploi row
    if (!currentFiliere) return;

    const link = $tr.find('a.Grade');
    if (link.length === 0) return;

    const href = link.attr('href') || '';
    if (!href.endsWith('.htm')) return;

    // Extract category from first td (colorA/B/C class)
    const catTd = $tr.find('td').first();
    const categorie = cleanText(catTd.text()).toUpperCase();

    const nom = cleanText(link.text());
    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;

    currentFiliere.cadres_emploi.push({
      nom,
      categorie: /^[ABC]$/.test(categorie) ? categorie : 'N/A',
      url: fullUrl,
      grades: [],
    });
  });

  return filieres.filter((f) => f.cadres_emploi.length > 0);
}

// ---------- Parsing detail pages (cadre d'emploi -> grades -> echelons) ----------

function parseDureeToMonths(duree: string): number | null {
  if (!duree || duree === '—' || duree === '-' || duree.trim() === '') return null;

  let totalMonths = 0;
  const ansMatch = duree.match(/(\d+)\s*an/i);
  const moisMatch = duree.match(/(\d+)\s*mois/i);

  if (ansMatch) totalMonths += parseInt(ansMatch[1], 10) * 12;
  if (moisMatch) totalMonths += parseInt(moisMatch[1], 10);

  return totalMonths > 0 ? totalMonths : null;
}

function parseSalaire(salaire: string): number | null {
  if (!salaire || salaire === '—' || salaire === '-') return null;
  // Format: "1 944,50 €" or "1944,50 €"
  const cleaned = salaire.replace(/[€\s]/g, '').replace(',', '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : Math.round(val * 100) / 100;
}

function parseIndice(val: string): number | null {
  if (!val || val === '—' || val === '-' || val.trim() === '') return null;
  const num = parseInt(val.replace(/\s/g, ''), 10);
  return isNaN(num) ? null : num;
}

function parseDetailPage(html: string): Grade[] {
  const $ = cheerio.load(html);
  const grades: Grade[] = [];

  // Extract grade names from "Grille indiciaire du grade X" text in the HTML
  const gradeNames: string[] = [];
  const gradeNameRegex = /Grille indiciaire du grade\s+([^<\n]+)/gi;
  let gradeMatch;
  while ((gradeMatch = gradeNameRegex.exec(html)) !== null) {
    const name = cleanText(gradeMatch[1]);
    if (name && !gradeNames.includes(name)) {
      gradeNames.push(name);
    }
  }

  // Find echelon data tables: <table id="indexGrid"> (id repeated per grade, invalid HTML but that's the source)
  // Also match tables with cols="6" as fallback
  let gradeIdx = 0;
  $('table').filter((_, el) => {
    const id = $(el).attr('id') || '';
    const cols = $(el).attr('cols') || '';
    return id === 'indexGrid' || cols === '6';
  }).each((_, table) => {
    const $table = $(table);
    const rows = $table.find('tr');
    if (rows.length < 2) return;

    // Determine column mapping from header row
    const headerRow = rows.first();
    const headers: string[] = [];
    headerRow.find('th, td').each((_, cell) => {
      headers.push(cleanText($(cell).text()).toLowerCase());
    });

    // Verify this is an echelon table
    if (!headers.some((h) => h.includes('chelon') || h.includes('indice'))) return;

    const colMap = {
      echelon: headers.findIndex((h) => h.includes('chelon')),
      indiceBrut: headers.findIndex((h) => h.includes('brut') && h.includes('indice')),
      indiceMajore: headers.findIndex((h) => h.includes('major')),
      duree: headers.findIndex((h) => h.includes('dur')),
      salaireBrut: headers.findIndex((h) => h.includes('salaire') && h.includes('brut')),
    };

    if (colMap.indiceBrut === -1) {
      colMap.indiceBrut = headers.findIndex((h) => h.includes('indice') && !h.includes('major'));
    }

    const echelons: Echelon[] = [];

    rows.each((rowIdx, row) => {
      if (rowIdx === 0) return;
      const cells = $(row).find('td');
      if (cells.length < 3) return;

      const getCellText = (idx: number): string => {
        if (idx < 0 || idx >= cells.length) return '';
        return cleanText($(cells[idx]).text());
      };

      const echelonText = getCellText(colMap.echelon >= 0 ? colMap.echelon : 0);
      if (!echelonText) return;

      echelons.push({
        echelon: echelonText,
        indice_brut: parseIndice(getCellText(colMap.indiceBrut >= 0 ? colMap.indiceBrut : 1)),
        indice_majore: parseIndice(getCellText(colMap.indiceMajore >= 0 ? colMap.indiceMajore : 2)),
        duree_mois: parseDureeToMonths(getCellText(colMap.duree >= 0 ? colMap.duree : 3)),
        salaire_brut: parseSalaire(getCellText(colMap.salaireBrut >= 0 ? colMap.salaireBrut : 4)),
      });
    });

    if (echelons.length > 0) {
      const gradeName = gradeIdx < gradeNames.length ? gradeNames[gradeIdx] : `Grade inconnu ${gradeIdx + 1}`;
      grades.push({ nom: gradeName, echelons });
      gradeIdx++;
    }
  });

  return grades;
}

// ---------- Main ----------

async function scrapeFonctionPublique(fp: { nom: string; slug: string; url: string }): Promise<FonctionPublique> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 ${fp.nom}`);
  console.log(`   ${fp.url}`);
  console.log('='.repeat(60));

  // Step 1: Fetch listing page
  console.log('\n📄 Récupération de la page listing...');
  const listingHtml = await fetchWithRetry(fp.url);
  const filieres = parseListingPage(listingHtml, fp.slug);

  const totalCadres = filieres.reduce((sum, f) => sum + f.cadres_emploi.length, 0);
  console.log(`   → ${filieres.length} filières, ${totalCadres} cadres d'emploi trouvés`);

  for (const filiere of filieres) {
    console.log(`   - ${filiere.nom}: ${filiere.cadres_emploi.length} cadres`);
  }

  // Step 2: Scrape each cadre d'emploi detail page
  let scraped = 0;
  let errors = 0;

  for (const filiere of filieres) {
    console.log(`\n📁 Filière: ${filiere.nom}`);

    for (const cadre of filiere.cadres_emploi) {
      scraped++;
      const progress = `[${scraped}/${totalCadres}]`;

      try {
        process.stdout.write(`   ${progress} ${cadre.nom} (${cadre.categorie})...`);
        const detailHtml = await fetchWithRetry(cadre.url);
        const grades = parseDetailPage(detailHtml);
        cadre.grades = grades;

        const totalEchelons = grades.reduce((sum, g) => sum + g.echelons.length, 0);
        console.log(` ✅ ${grades.length} grades, ${totalEchelons} échelons`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(` ❌ ${msg}`);
        errors++;
      }

      await sleep(RATE_LIMIT_MS);
    }
  }

  console.log(`\n✅ ${fp.nom}: ${scraped - errors}/${scraped} cadres scrapés avec succès`);
  if (errors > 0) console.log(`❌ ${errors} erreurs`);

  return {
    nom: fp.nom,
    slug: fp.slug,
    url: fp.url,
    filieres,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const onlySlug = args.find((a) => !a.startsWith('-'));
  const dryRun = args.includes('--dry-run');

  console.log('🏛️  Scraper Grilles Indiciaires - emploi-collectivites.fr');
  console.log('=========================================================\n');

  const targets = onlySlug
    ? FONCTIONS_PUBLIQUES.filter((fp) => fp.slug === onlySlug)
    : FONCTIONS_PUBLIQUES;

  if (targets.length === 0) {
    console.error(`❌ Slug inconnu: ${onlySlug}`);
    console.error(`   Slugs valides: ${FONCTIONS_PUBLIQUES.map((fp) => fp.slug).join(', ')}`);
    process.exit(1);
  }

  console.log(`📌 Cibles: ${targets.map((fp) => fp.nom).join(', ')}`);

  if (dryRun) {
    console.log('\n⚠️  Mode dry-run: seules les pages listing seront scrapées\n');
    for (const fp of targets) {
      const html = await fetchWithRetry(fp.url);
      const filieres = parseListingPage(html, fp.slug);
      const total = filieres.reduce((s, f) => s + f.cadres_emploi.length, 0);
      console.log(`\n${fp.nom}: ${filieres.length} filières, ${total} cadres d'emploi`);
      for (const f of filieres) {
        console.log(`  ${f.nom}:`);
        for (const c of f.cadres_emploi) {
          console.log(`    [${c.categorie}] ${c.nom}`);
        }
      }
      await sleep(RATE_LIMIT_MS);
    }
    await closeBrowser();
    return;
  }

  const result: GrillesData = {
    metadata: {
      source: 'emploi-collectivites.fr',
      date_scraping: new Date().toISOString(),
      valeur_point_indice: 4.92278,
      date_point_indice: '2024-01-01',
    },
    fonctions_publiques: [],
  };

  const startTime = Date.now();

  for (const fp of targets) {
    const fpData = await scrapeFonctionPublique(fp);
    result.fonctions_publiques.push(fpData);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Save
  const outDir = 'data';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = `${outDir}/grilles.json`;
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');

  // Final report
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 RAPPORT FINAL');
  console.log('='.repeat(60));

  let totalFilieres = 0;
  let totalCadres = 0;
  let totalGrades = 0;
  let totalEchelons = 0;
  let cadresWithErrors = 0;

  for (const fp of result.fonctions_publiques) {
    totalFilieres += fp.filieres.length;
    for (const f of fp.filieres) {
      totalCadres += f.cadres_emploi.length;
      for (const c of f.cadres_emploi) {
        totalGrades += c.grades.length;
        if (c.grades.length === 0) cadresWithErrors++;
        for (const g of c.grades) {
          totalEchelons += g.echelons.length;
        }
      }
    }
  }

  console.log(`\n   Fonctions publiques: ${result.fonctions_publiques.length}`);
  console.log(`   Filières:            ${totalFilieres}`);
  console.log(`   Cadres d'emploi:     ${totalCadres}`);
  console.log(`   Grades:              ${totalGrades}`);
  console.log(`   Échelons:            ${totalEchelons}`);
  if (cadresWithErrors > 0) {
    console.log(`   ⚠ Cadres sans grades: ${cadresWithErrors}`);
  }
  console.log(`\n   Durée:    ${elapsed}s`);
  console.log(`   Fichier:  ${outPath}`);
  console.log('');

  await closeBrowser();
}

main().catch((err) => {
  console.error('\n💥 Erreur fatale:', err);
  process.exit(1);
});
