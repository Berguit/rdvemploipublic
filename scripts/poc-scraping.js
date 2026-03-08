const https = require('https');
const http = require('http');
const fs = require('fs');

// ============================================
// POC - Scraping emploi-territorial.fr
// ============================================

function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function decodeHtml(str) {
  return str
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n));
}

function cleanHtml(str) {
  return decodeHtml(str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

// Parse RSS feed to get offer URLs
function parseRSS(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  return items.map(item => {
    const content = item[1];
    const title = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i);
    const link = content.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i);
    const guid = content.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
    const pubDate = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    
    // Extract ref from guid (e.g. :O064260305001172)
    const ref = guid ? guid[1].match(/:([A-Z0-9]+)$/i) : null;
    
    return {
      title: title ? title[1].trim() : '',
      url: link ? link[1].trim().replace('?mtm_campaign=rss', '') : '',
      ref: ref ? ref[1] : '',
      pubDate: pubDate ? pubDate[1].trim() : ''
    };
  });
}

// Parse individual offer page
function parseOffer(html, url) {
  const offer = { url };
  
  // Reference number
  const ref = html.match(/Offre\s+n[°º]\s*([A-Z0-9]+)/i);
  if (ref) offer.reference = ref[1];
  
  // Publication date
  const pubDate = html.match(/Publi[ée]+e?\s+le\s+(\d{2}\/\d{2}\/\d{4})/i);
  if (pubDate) offer.datePublication = pubDate[1];
  
  // Title from h2
  const title = html.match(/<h2[^>]*class="[^"]*set-font[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
  if (title) offer.titre = cleanHtml(title[1]);
  
  // Extract label-value pairs
  const labels = [...html.matchAll(/<div[^>]*class="offre-item-label[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];
  const values = [...html.matchAll(/<div[^>]*class="offre-item-value[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];
  
  const fieldMap = {
    'Employeur': 'employeur',
    'Lieu de travail': 'lieuTravail',
    'Poste à pourvoir le': 'datePoste',
    'Date limite de candidature': 'dateLimite',
    "Type d'emploi": 'typeEmploi',
    'Famille de métiers': 'familleMetiers',
    'Grade(s) recherché(s)': 'grades',
    'Métier(s)': 'metiers',
    'Ouvert aux contractuels': 'contractuels',
    'Temps de travail': 'tempsTravail',
    'Télétravail': 'teletravail',
    'Management': 'management',
    'Experience souhaitée': 'experience',
    'Rémunération indicative': 'remuneration',
    'Descriptif de l\'emploi': 'descriptif',
    'Lien de candidature': 'lienCandidature',
  };
  
  for (let i = 0; i < labels.length && i < values.length; i++) {
    const label = cleanHtml(labels[i][1]);
    const value = cleanHtml(values[i][1]);
    const key = fieldMap[label];
    if (key) {
      offer[key] = value;
    } else {
      // Store unknown fields too
      offer[label.replace(/[^a-zA-Z0-9]/g, '_')] = value;
    }
  }
  
  // Extract text blocks (descriptions)
  const textBlocks = [...html.matchAll(/<div[^>]*class="offre-item-text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];
  const textLabels = ['descriptionEmployeur', 'descriptifEmploi', 'missions', 'profilRecherche', 'modalitesCandidature', 'handicap'];
  
  textBlocks.forEach((t, i) => {
    const text = cleanHtml(t[1]);
    if (text.length > 10) {
      const key = i < textLabels.length ? textLabels[i] : `texte_${i}`;
      offer[key] = text;
    }
  });
  
  return offer;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🔍 POC Scraping emploi-territorial.fr');
  console.log('=====================================\n');
  
  // Step 1: Fetch RSS
  console.log('📡 Récupération du flux RSS...');
  const rss = await fetch('https://www.emploi-territorial.fr/rss?');
  const rssOffers = parseRSS(rss.body);
  console.log(`   → ${rssOffers.length} offres dans le RSS\n`);
  
  // Step 2: Scrape first 20 offers
  const toScrape = rssOffers.slice(0, 20);
  const results = [];
  let errors = 0;
  
  console.log(`🕷️  Scraping de ${toScrape.length} offres...\n`);
  
  for (let i = 0; i < toScrape.length; i++) {
    const item = toScrape[i];
    const url = item.url;
    
    try {
      process.stdout.write(`   [${i + 1}/${toScrape.length}] ${item.title.substring(0, 50)}...`);
      const page = await fetch(url);
      
      if (page.status === 200) {
        const offer = parseOffer(page.body, url);
        results.push(offer);
        console.log(' ✅');
      } else {
        console.log(` ❌ HTTP ${page.status}`);
        errors++;
      }
    } catch (e) {
      console.log(` ❌ ${e.message}`);
      errors++;
    }
    
    // Rate limiting - 500ms between requests
    if (i < toScrape.length - 1) await sleep(500);
  }
  
  // Step 3: Results
  console.log('\n=====================================');
  console.log(`✅ ${results.length} offres scrapées avec succès`);
  console.log(`❌ ${errors} erreurs`);
  
  // Show fields coverage
  const allKeys = new Set();
  results.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)));
  
  console.log(`\n📊 Champs récupérés (${allKeys.size} champs uniques):`);
  allKeys.forEach(key => {
    const count = results.filter(r => r[key] && r[key].length > 0).length;
    const pct = Math.round(count / results.length * 100);
    console.log(`   ${key}: ${count}/${results.length} (${pct}%)`);
  });
  
  // Show sample offer
  console.log('\n📋 Exemple d\'offre complète:');
  console.log(JSON.stringify(results[0], null, 2));
  
  // Save results
  const outPath = 'C:/Users/adrie/.openclaw/workspace/poc-resultats.json';
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n💾 Résultats sauvegardés dans ${outPath}`);
}

main().catch(console.error);
