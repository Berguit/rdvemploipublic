import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";

// ============================================
// RSS Sync - emploi-territorial.fr
// Collecte continue des nouvelles offres
// ============================================

const BASE_URL = "https://www.emploi-territorial.fr";
const RSS_URL = `${BASE_URL}/rss?`;
const DATA_DIR = path.resolve(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "offres.json");
const RATE_LIMIT_MS = 500;
const MAX_RETRIES = 3;

// --- Reuse HTTP helpers from scrape-offres ---

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
      if (result.status === 404) return result;
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

// --- RSS Parser ---

interface RSSItem {
  title: string;
  url: string;
  ref: string;
  pubDate: string;
}

function parseRSS(xml: string): RSSItem[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  return items.map((item) => {
    const content = item[1];
    const title = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)
      || content.match(/<title>([\s\S]*?)<\/title>/i);
    const link = content.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i)
      || content.match(/<link>([\s\S]*?)<\/link>/i);
    const guid = content.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
    const pubDate = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

    const ref = guid ? guid[1].match(/:([A-Z0-9]+)$/i) : null;

    return {
      title: title ? title[1].trim() : "",
      url: link ? link[1].trim().replace(/\?mtm_campaign=rss$/, "") : "",
      ref: ref ? ref[1] : "",
      pubDate: pubDate ? pubDate[1].trim() : "",
    };
  });
}

// --- Field mapping (same as scrape-offres.ts) ---

const FIELD_MAP: Record<string, string> = {
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

const SECTION_TITLE_MAP: Record<string, string> = {
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

function extractDepartement(lieu: string): string {
  const match = lieu.match(/\((\d{2,3})\)/);
  if (match) return match[1];
  const deptMatch = lieu.match(/\b(\d{2,3})\b/);
  return deptMatch ? deptMatch[1] : "";
}

function parseOffer(html: string, url: string): Record<string, string> {
  const $ = cheerio.load(html);
  const offer: Record<string, string> = { url };

  const refMatch = html.match(/Offre\s+n[°º]\s*([A-Z0-9]+)/i);
  if (refMatch) {
    offer.reference = refMatch[1];
  } else {
    const urlRef = url.match(/\/offre\/(o\d+)/i);
    if (urlRef) offer.reference = urlRef[1].toUpperCase();
  }

  const pubMatch = html.match(/Publi[ée]+e?\s+le\s+(\d{2}\/\d{2}\/\d{4})/i);
  if (pubMatch) offer.datePublication = pubMatch[1];

  const h2 = $("h2").first();
  if (h2.length) offer.titre = h2.text().trim();

  // Label/value pairs
  $(".offre-item-label").each((_, el) => {
    const label = $(el).text().trim();
    const valueEl = $(el).nextAll(".offre-item-value").first();
    if (!valueEl.length) return;
    const value = valueEl.text().replace(/\s+/g, " ").trim();
    const key = FIELD_MAP[label];
    if (key) {
      offer[key] = value;
    } else {
      offer[label.replace(/[^a-zA-Z0-9]/g, "_")] = value;
    }
  });

  // Text blocks - matched by section title (FIX)
  $(".offre-item-text").each((_, el) => {
    const textContent = $(el).text().replace(/\s+/g, " ").trim();
    if (textContent.length < 10) return;

    const prevLabel = $(el).prevAll(".offre-item-label, h3, h4, strong").first();
    let sectionTitle = prevLabel.length ? prevLabel.text().trim() : "";

    if (!sectionTitle) {
      const parent = $(el).parent();
      const parentLabel = parent.find(".offre-item-label").first();
      if (parentLabel.length) sectionTitle = parentLabel.text().trim();
    }

    if (!sectionTitle) {
      const prev = $(el).prev();
      if (prev.length) sectionTitle = prev.text().trim();
    }

    const normalized = normalizeTitle(sectionTitle);
    let mapped = false;

    for (const [pattern, key] of Object.entries(SECTION_TITLE_MAP)) {
      if (normalized.includes(normalizeTitle(pattern))) {
        if (!offer[key] || textContent.length > offer[key].length) {
          offer[key] = textContent;
        }
        mapped = true;
        break;
      }
    }

    if (!mapped && textContent.length > 20) {
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

  if (offer.lieuTravail) {
    offer.departement = extractDepartement(offer.lieuTravail);
  }

  return offer;
}

// --- Main ---

async function main() {
  const startTime = Date.now();
  console.log("=== RSS Sync emploi-territorial.fr ===\n");

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Load existing data
  let offres: Record<string, string>[] = [];
  const existingRefs = new Set<string>();

  if (fs.existsSync(OUTPUT_FILE)) {
    offres = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
    for (const o of offres) {
      if (o.reference) existingRefs.add(o.reference);
    }
    console.log(`Existing: ${offres.length} offres (${existingRefs.size} refs)\n`);
  } else {
    console.log("No existing data file. Starting fresh.\n");
  }

  // Fetch RSS feed
  console.log("[1/3] Fetching RSS feed...");
  const rss = await fetchWithRetry(RSS_URL);
  if (rss.status !== 200) {
    console.error(`RSS feed returned HTTP ${rss.status}`);
    process.exit(1);
  }

  const rssItems = parseRSS(rss.body);
  console.log(`  ${rssItems.length} items in RSS feed\n`);

  // Filter new offers
  const newItems = rssItems.filter((item) => {
    if (item.ref && existingRefs.has(item.ref)) return false;
    // Also check URL-based ref
    const urlRef = item.url.match(/o(\d+)/)?.[1];
    if (urlRef && existingRefs.has(urlRef)) return false;
    return item.url.length > 0;
  });

  console.log(`[2/3] ${newItems.length} new offers to scrape\n`);

  if (newItems.length === 0) {
    console.log("Nothing new. Done.");
    return;
  }

  // Scrape new offers
  let scraped = 0;
  let errors = 0;

  for (let i = 0; i < newItems.length; i++) {
    const item = newItems[i];

    try {
      process.stdout.write(`  [${i + 1}/${newItems.length}] ${item.title.substring(0, 50)}...`);
      const page = await fetchWithRetry(item.url);

      if (page.status === 200) {
        const offer = parseOffer(page.body, item.url);
        if (offer.reference && existingRefs.has(offer.reference)) {
          console.log(" (duplicate)");
        } else {
          offres.push(offer);
          if (offer.reference) existingRefs.add(offer.reference);
          scraped++;
          console.log(" OK");
        }
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

  // Save
  console.log(`\n[3/3] Saving...`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(offres, null, 2), "utf8");

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n=== Rapport ===");
  console.log(`Nouvelles offres: ${scraped}`);
  console.log(`Erreurs: ${errors}`);
  console.log(`Total en base: ${offres.length}`);
  console.log(`Duree: ${elapsed}s`);
  console.log(`Fichier: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
