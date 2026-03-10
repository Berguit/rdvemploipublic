import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";

// ============================================
// Scraper de production - emploi-territorial.fr
// ============================================

const BASE_URL = "https://www.emploi-territorial.fr";
const LIST_URL = `${BASE_URL}/emploi-mobilite/`;
const DATA_DIR = path.resolve(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "offres.json");
const RATE_LIMIT_MS = 500;
const MAX_RETRIES = 3;
const MAX_OFFRES = 1000;

interface Offre {
  reference: string;
  url: string;
  titre: string;
  employeur: string;
  siteWebEmployeur: string;
  lieuTravail: string;
  departement: string;
  datePublication: string;
  datePoste: string;
  dateLimite: string;
  typeEmploi: string;
  nombrePostes: string;
  familleMetiers: string;
  grades: string;
  metiers: string;
  contractuels: string;
  tempsTravail: string;
  teletravail: string;
  management: string;
  experience: string;
  remuneration: string;
  descriptionEmployeur: string;
  descriptifEmploi: string;
  missions: string;
  profilRecherche: string;
  modalitesCandidature: string;
  lienCandidature: string;
  handicap: string;
  duree: string;
  contact: string;
  adresseEmployeur: string;
  [key: string]: string;
}

// --- HTTP fetch with redirect support ---

function fetchPage(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 (rdvemploipublic.fr bot)" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirect = res.headers.location.startsWith("http")
            ? res.headers.location
            : `${BASE_URL}${res.headers.location}`;
          return fetchPage(redirect).then(resolve).catch(reject);
        }
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode || 0, body: data }));
      })
      .on("error", reject);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<{ status: number; body: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await fetchPage(url);
      if (result.status === 200) return result;
      if (result.status === 404) return result; // no point retrying
      if (attempt < retries) {
        console.log(`  Retry ${attempt}/${retries} for ${url} (HTTP ${result.status})`);
        await sleep(1000 * attempt);
      }
    } catch (err: any) {
      if (attempt < retries) {
        console.log(`  Retry ${attempt}/${retries} for ${url} (${err.message})`);
        await sleep(1000 * attempt);
      } else {
        throw err;
      }
    }
  }
  return fetchPage(url);
}

// --- Extract offer IDs/URLs from list page ---

async function getOfferUrls(limit: number, maxPages: number = 50): Promise<string[]> {
  const urls: string[] = [];
  let page = 1;
  const target = Math.min(limit, MAX_OFFRES);

  while (urls.length < target) {
    const listUrl = page === 1 ? LIST_URL : `${LIST_URL}?page=${page}`;
    console.log(`  Fetching list page ${page}...`);

    const res = await fetchWithRetry(listUrl);
    if (res.status !== 200) {
      console.log(`  List page ${page} returned HTTP ${res.status}, stopping.`);
      break;
    }

    const $ = cheerio.load(res.body);
    const links: string[] = [];

    $('a[href*="/offre/"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href && /\/offre\/o\d+/.test(href)) {
        const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        // Remove tracking params
        const clean = fullUrl.split("?")[0];
        links.push(clean);
      }
    });

    if (links.length === 0) {
      console.log(`  No offers found on page ${page}, stopping.`);
      break;
    }

    for (const link of links) {
      if (!urls.includes(link) && urls.length < target) {
        urls.push(link);
      }
    }

    console.log(`  Page ${page}: ${links.length} links found, total unique: ${urls.length}`);

    if (page >= maxPages) break;
    page++;
    await sleep(RATE_LIMIT_MS);
  }

  return urls;
}

// --- Field mapping for label/value pairs ---

const FIELD_MAP: Record<string, keyof Offre> = {
  "Employeur": "employeur",
  "Lieu de travail": "lieuTravail",
  "Poste à pourvoir le": "datePoste",
  "Date limite de candidature": "dateLimite",
  "Type d'emploi": "typeEmploi",
  "Nombre de postes": "nombrePostes",
  "Famille de métiers": "familleMetiers",
  "Grade(s) recherché(s)": "grades",
  "Métier(s)": "metiers",
  "Ouvert aux contractuels": "contractuels",
  "Temps de travail": "tempsTravail",
  "Télétravail": "teletravail",
  "Management": "management",
  "Experience souhaitée": "experience",
  "Expérience souhaitée": "experience",
  "Rémunération indicative": "remuneration",
  "Descriptif de l'emploi": "lienCandidature",
  "Lien de candidature": "lienCandidature",
  "Site web de l'employeur": "siteWebEmployeur",
  "Durée de la mission": "duree",
  "Contact": "contact",
  "Adresse de l'employeur": "adresseEmployeur",
};

// --- Section title mapping for text blocks (FIX for POC bug) ---

const SECTION_TITLE_MAP: Record<string, keyof Offre> = {
  "description de l'employeur": "descriptionEmployeur",
  "descriptif de l'emploi": "descriptifEmploi",
  "descriptif du poste": "descriptifEmploi",
  "missions / conditions d'exercice": "missions",
  "missions": "missions",
  "profil recherché": "profilRecherche",
  "profils recherchés": "profilRecherche",
  "conditions particulières d'exercice": "missions",
  "modalités de candidature": "modalitesCandidature",
  "informations complémentaires": "modalitesCandidature",
  "travailleurs handicapés": "handicap",
};

function normalizeTitle(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s'/]/g, "")
    .trim();
}

// --- Extract department code from location string ---

function extractDepartement(lieu: string): string {
  const match = lieu.match(/\((\d{2,3})\)/);
  if (match) return match[1];
  const deptMatch = lieu.match(/\b(\d{2,3})\b/);
  return deptMatch ? deptMatch[1] : "";
}

// --- Parse an offer detail page ---

function parseOffer(html: string, url: string): Partial<Offre> {
  const $ = cheerio.load(html);
  const offer: Partial<Offre> = { url };

  // Reference - try from HTML first, fallback to URL
  const refMatch = html.match(/Offre\s+n[°º]\s*([A-Z0-9]+)/i);
  if (refMatch) {
    offer.reference = refMatch[1];
  } else {
    const urlRef = url.match(/\/offre\/(o\d+)/i);
    if (urlRef) offer.reference = urlRef[1].toUpperCase();
  }

  // Publication date
  const pubMatch = html.match(/Publi[ée]+e?\s+le\s+(\d{2}\/\d{2}\/\d{4})/i);
  if (pubMatch) offer.datePublication = pubMatch[1];

  // Title from h2
  const h2 = $("h2").first();
  if (h2.length) offer.titre = h2.text().trim();

  // Parse label/value pairs using CSS classes
  $(".offre-item-label").each((i, el) => {
    const label = $(el).text().trim();
    const valueEl = $(el).nextAll(".offre-item-value").first();
    if (!valueEl.length) return;

    const value = valueEl.text().replace(/\s+/g, " ").trim();
    const key = FIELD_MAP[label];
    if (key) {
      offer[key] = value;
    } else {
      // Store with sanitized key name
      const sanitized = label.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/g, "_");
      offer[sanitized] = value;
    }
  });

  // FIX: Parse text blocks by matching section titles instead of by position
  // Look for section headers (h3, h4, or strong tags) preceding text blocks
  $(".offre-item-text").each((_, el) => {
    const textContent = $(el).text().replace(/\s+/g, " ").trim();
    if (textContent.length < 10) return;

    // Find the preceding section title
    const prevLabel = $(el).prevAll(".offre-item-label, h3, h4, strong").first();
    let sectionTitle = "";

    if (prevLabel.length) {
      sectionTitle = prevLabel.text().trim();
    }

    // Also check the parent or preceding sibling for a label
    if (!sectionTitle) {
      const parent = $(el).parent();
      const parentLabel = parent.find(".offre-item-label").first();
      if (parentLabel.length) {
        sectionTitle = parentLabel.text().trim();
      }
    }

    // Also look at the closest preceding h3/h4 in the DOM
    if (!sectionTitle) {
      const prev = $(el).prev();
      if (prev.length) {
        sectionTitle = prev.text().trim();
      }
    }

    const normalized = normalizeTitle(sectionTitle);
    let mapped = false;

    for (const [pattern, key] of Object.entries(SECTION_TITLE_MAP)) {
      if (normalized.includes(normalizeTitle(pattern))) {
        // Don't overwrite if already set with longer content
        if (!offer[key] || textContent.length > (offer[key] as string).length) {
          offer[key] = textContent;
        }
        mapped = true;
        break;
      }
    }

    if (!mapped && textContent.length > 20) {
      // Attempt heuristic: if content mentions "handicap", map it
      const lower = textContent.toLowerCase();
      if (lower.includes("travailleurs handicap")) {
        offer.handicap = textContent;
      } else if (!offer.descriptifEmploi) {
        offer.descriptifEmploi = textContent;
      } else if (!offer.missions) {
        offer.missions = textContent;
      } else if (!offer.profilRecherche) {
        offer.profilRecherche = textContent;
      } else if (!offer.modalitesCandidature) {
        offer.modalitesCandidature = textContent;
      }
    }
  });

  // Extract department from lieu
  if (offer.lieuTravail) {
    offer.departement = extractDepartement(offer.lieuTravail);
  }

  return offer;
}

// --- Main ---

async function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : MAX_OFFRES;

  console.log("=== Scraper emploi-territorial.fr ===");
  console.log(`Limit: ${limit} offres\n`);

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Load existing offres for deduplication
  let existingOffres: Partial<Offre>[] = [];
  const existingRefs = new Set<string>();

  if (fs.existsSync(OUTPUT_FILE)) {
    existingOffres = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
    for (const o of existingOffres) {
      if (o.reference) existingRefs.add(o.reference);
    }
    console.log(`Existing data: ${existingOffres.length} offres (${existingRefs.size} refs)\n`);
  }

  // Step 1: Get offer URLs from list pages
  console.log("[1/3] Fetching offer list...");
  const offerUrls = await getOfferUrls(limit);
  console.log(`Found ${offerUrls.length} unique offer URLs\n`);

  // Limit
  const toScrape = offerUrls.slice(0, limit);

  // Step 2: Scrape detail pages
  console.log(`[2/3] Scraping ${toScrape.length} offers...\n`);
  const results: Partial<Offre>[] = [];
  let errors = 0;
  let skipped = 0;

  for (let i = 0; i < toScrape.length; i++) {
    const url = toScrape[i];

    // Extract ref from URL for dedup check
    const urlRef = url.match(/o(\d+)/)?.[1];
    if (urlRef && existingRefs.has(urlRef)) {
      skipped++;
      continue;
    }

    try {
      const shortUrl = url.replace(BASE_URL, "").substring(0, 60);
      process.stdout.write(`  [${i + 1}/${toScrape.length}] ${shortUrl}...`);

      const page = await fetchWithRetry(url);

      if (page.status === 200) {
        const offer = parseOffer(page.body, url);

        // Dedup by reference
        if (offer.reference && existingRefs.has(offer.reference)) {
          console.log(" (duplicate, skipped)");
          skipped++;
        } else {
          results.push(offer);
          if (offer.reference) existingRefs.add(offer.reference);
          console.log(` OK [${offer.titre?.substring(0, 40) || "?"}]`);
        }
      } else if (page.status === 404) {
        console.log(" 404 (not found)");
        errors++;
      } else {
        console.log(` HTTP ${page.status}`);
        errors++;
      }
    } catch (err: any) {
      console.log(` ERROR: ${err.message}`);
      errors++;
    }

    await sleep(RATE_LIMIT_MS);
  }

  // Step 3: Save results
  console.log(`\n[3/3] Saving results...`);
  const allOffres = [...existingOffres, ...results];

  // Deduplicate final array by reference
  const seen = new Set<string>();
  const deduped = allOffres.filter((o) => {
    if (!o.reference) return true;
    if (seen.has(o.reference)) return false;
    seen.add(o.reference);
    return true;
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(deduped, null, 2), "utf8");

  // Report
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n=== Rapport ===");
  console.log(`Offres scrapees: ${results.length}`);
  console.log(`Erreurs: ${errors}`);
  console.log(`Doublons ignores: ${skipped}`);
  console.log(`Total en base: ${deduped.length}`);
  console.log(`Duree: ${elapsed}s`);
  console.log(`Fichier: ${OUTPUT_FILE}`);

  // Field coverage
  if (results.length > 0) {
    const allKeys = new Set<string>();
    results.forEach((r) => Object.keys(r).forEach((k) => allKeys.add(k)));
    console.log(`\nCouverture champs (${allKeys.size} champs):`);
    const coreFields = [
      "reference", "titre", "employeur", "lieuTravail", "departement",
      "typeEmploi", "grades", "metiers", "familleMetiers", "contractuels",
      "tempsTravail", "teletravail", "descriptionEmployeur", "descriptifEmploi",
      "missions", "profilRecherche", "modalitesCandidature",
    ];
    for (const key of coreFields) {
      const count = results.filter((r) => r[key] && (r[key] as string).length > 0).length;
      const pct = Math.round((count / results.length) * 100);
      console.log(`  ${key}: ${count}/${results.length} (${pct}%)`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
