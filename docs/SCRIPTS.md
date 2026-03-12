# 🔧 Documentation des scripts

Tous les scripts sont dans `scripts/` et s'exécutent avec `npx tsx` ou `npm run`.

---

## Vue d'ensemble

| Script | Source | Output | Dépendance externe |
|---|---|---|---|
| `scrape-offres.ts` | emploi-territorial.fr | `data/offres.json` | HTTP (pas de navigateur) |
| `rss-sync.ts` | emploi-territorial.fr RSS | `data/offres.json` (merge) | HTTP |
| `scrape-grilles.ts` | emploi-collectivites.fr | `data/grilles.json` | Puppeteer (navigateur) |
| `scrape-blasons.ts` | Wikidata API | `data/blasons.json` | HTTP (API Wikidata) |
| `import-offres-supabase.ts` | `data/offres.json` | Supabase `offres` | Supabase API |
| `import-grilles-supabase.ts` | `data/grilles.json` | Supabase grilles | Supabase API |
| `import-villes.ts` | `data/blasons.json` | Supabase `villes` | Supabase API |

---

## Scripts de scraping

### `scrape-offres.ts` — Scraping des offres d'emploi

**Source** : emploi-territorial.fr (pages HTML listing + détail)

**Commande** :
```bash
npm run scrape:offres
```

**Fonctionnement** :
1. Parcourt les pages listing d'emploi-territorial.fr (pagination HTML)
2. Extrait les URLs de chaque offre
3. Scrape le détail de chaque offre (30+ champs)
4. Sauvegarde dans `data/offres.json`

**Configuration** :
| Paramètre | Valeur | Description |
|---|---|---|
| `MAX_OFFRES` | 1 000 | Nombre max d'offres à scraper |
| `RATE_LIMIT_MS` | 500 ms | Délai entre chaque requête |
| `MAX_RETRIES` | 3 | Nombre de tentatives par page |

**Champs extraits** : référence, titre, employeur, lieu, département, dates, type emploi, grades, métiers, temps de travail, télétravail, management, expérience, description, missions, profil, candidature, contact, handicap, etc.

**User-Agent** : `Mozilla/5.0 (rdvemploipublic.fr bot)`

**Durée estimée** : ~10-15 minutes pour 1 000 offres

**Output** : `data/offres.json` — tableau JSON d'objets offre

---

### `rss-sync.ts` — Synchronisation RSS

**Source** : Flux RSS d'emploi-territorial.fr

**Commande** :
```bash
npm run rss:sync
```

**Fonctionnement** :
1. Parse le flux RSS d'emploi-territorial.fr
2. Identifie les nouvelles offres (non présentes dans `data/offres.json`)
3. Scrape le détail de chaque nouvelle offre
4. Merge dans `data/offres.json` (sans doublons, par référence)

**Configuration** :
| Paramètre | Valeur | Description |
|---|---|---|
| `RATE_LIMIT_MS` | 500 ms | Délai entre chaque requête |
| `MAX_RETRIES` | 3 | Tentatives par page |

**Fréquence recommandée** : Toutes les heures via cron

```bash
# Exemple cron
0 * * * * cd /path/to/rdvemploipublic && npx tsx scripts/rss-sync.ts >> logs/rss.log 2>&1
```

---

### `scrape-grilles.ts` — Scraping des grilles indiciaires

**Source** : emploi-collectivites.fr

**Commande** :
```bash
# Toutes les fonctions publiques
npm run scrape:grilles

# Mode dry-run (affiche sans sauvegarder)
npm run scrape:grilles:dry

# Une seule FP
npm run scrape:grilles:territoriale
```

**Fonctionnement** :
1. Liste les 4 fonctions publiques et leurs URLs
2. Pour chaque FP, scrape les pages listing → extrait filières + cadres d'emploi + liens
3. Pour chaque cadre d'emploi, scrape la page détail → extrait grades + échelons
4. Sauvegarde dans `data/grilles.json`

**⚠️ Puppeteer requis** : Ce script utilise Puppeteer Core car emploi-collectivites.fr utilise du JS côté client pour rendre les tableaux. Il faut un navigateur Chrome/Chromium installé.

**Configuration** :
| Paramètre | Valeur | Description |
|---|---|---|
| `RATE_LIMIT_MS` | 500 ms | Délai entre chaque page |
| `MAX_RETRIES` | 3 | Tentatives par page |
| `RETRY_DELAY_MS` | 2 000 ms | Délai avant retry |

**Durée estimée** : ~30-45 minutes (1 297 pages cadre à scraper)

**Fréquence recommandée** : Mensuelle (les grilles changent rarement, 1-2 fois par an)

**Output** : `data/grilles.json` — structure hiérarchique :
```json
{
  "metadata": {
    "source": "emploi-collectivites.fr",
    "date_scraping": "2026-03-10",
    "valeur_point_indice": 4.92278,
    "date_point_indice": "2024-01-01"
  },
  "fonctions_publiques": [
    {
      "nom": "Fonction Publique Territoriale",
      "slug": "territoriale",
      "filieres": [
        {
          "nom": "Administrative",
          "cadres_emploi": [
            {
              "nom": "Attachés territoriaux",
              "categorie": "A",
              "grades": [
                {
                  "nom": "Attaché",
                  "echelons": [
                    { "echelon": "1", "indice_brut": 444, "indice_majore": 390, "duree_mois": 12, "salaire_brut": 1920.05 }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

### `scrape-blasons.ts` — Récupération des blasons

**Source** : API Wikidata + Wikimedia Commons

**Commande** :
```bash
npx tsx scripts/scrape-blasons.ts
```

**Fonctionnement** :
1. Lit les offres en base Supabase pour extraire les villes uniques
2. Pour chaque ville, cherche l'entité Wikidata correspondante (priorité aux résultats "commune de France")
3. Récupère la propriété P94 (blason) ou P18 (image) via l'API Wikidata
4. Sauvegarde dans `data/blasons.json`

**Prérequis** : `.env.local` configuré avec les clés Supabase (lit les offres en base)

**Rate limit** : 200 ms entre chaque requête Wikidata (API publique)

**User-Agent** : `rdvemploipublic-bot/1.0 (contact@rdvemploipublic.fr)`

**Couverture actuelle** : 581 villes, ~83 % avec blason trouvé

**Fréquence recommandée** : Après chaque import d'offres (pour les nouvelles villes)

---

## Scripts d'import

### `import-offres-supabase.ts` — Import des offres

**Commande** :
```bash
npx tsx scripts/import-offres-supabase.ts
```

**Fonctionnement** :
1. Lit `data/offres.json`
2. Pour chaque offre, extrait la ville et le département du champ `lieuTravail`
3. Mappe le département vers la région
4. Génère un slug URL-friendly
5. Upsert dans Supabase (déduplique par `reference`)

**Prérequis** : `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`

**Mapping département → région** : 13 régions + Corse, 101 départements mappés dans le script

**Gestion des slugs** : Génération automatique à partir du titre + ville + référence

---

### `import-grilles-supabase.ts` — Import des grilles

**Commande** :
```bash
npx tsx scripts/import-grilles-supabase.ts
```

**Fonctionnement** :
1. Lit `data/grilles.json`
2. Met à jour la valeur du point d'indice
3. Pour chaque FP → filière → cadre → grade → échelon : upsert dans les tables correspondantes
4. Affiche un rapport de progression

**Prérequis** : Les tables grilles doivent exister (exécuter `database/schema-grilles.sql` avant)

**Important** : Les 4 fonctions publiques doivent être insérées par le schéma SQL avant l'import (le script les cherche par slug)

---

### `import-villes.ts` — Import des blasons

**Commande** :
```bash
npx tsx scripts/import-villes.ts
```

**Fonctionnement** :
1. Lit `data/blasons.json`
2. Upsert par batch de 50 dans la table `villes`
3. Déduplique par `(ville, departement)`

---

## Variables d'environnement requises

| Variable | Scripts | Description |
|---|---|---|
| `SUPABASE_URL` | import-*, scrape-blasons | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | import-*, scrape-blasons | Clé service_role (écriture) |

Les scripts de scraping (offres, grilles) ne nécessitent **aucune** variable d'environnement — ils écrivent en local dans `data/`.

---

## Ordre d'exécution recommandé

Pour un setup from scratch :

```bash
# 1. Scraper les données
npm run scrape:offres          # ~15 min → data/offres.json
npm run scrape:grilles         # ~30 min → data/grilles.json

# 2. Créer les tables (via Supabase SQL Editor)
# → database/schema-offres.sql
# → database/schema-grilles.sql

# 3. Importer dans Supabase
npx tsx scripts/import-offres-supabase.ts
npx tsx scripts/import-grilles-supabase.ts

# 4. Scraper et importer les blasons (nécessite les offres en base)
npx tsx scripts/scrape-blasons.ts
npx tsx scripts/import-villes.ts
```

---

## Scripts de synchronisation cron

### Configuration de la colonne `expired`

Avant d'utiliser les scripts cron, il faut ajouter la colonne `expired` à la table `offres` :

```bash
npx dotenvx run -f .env.local -- node scripts/add-expired-column.js
```

Ce script :
1. Vérifie si la colonne `expired` existe déjà
2. L'ajoute si nécessaire (type `boolean`, défaut `false`)
3. Marque comme expirées toutes les offres avec `date_limite < aujourd'hui`

**Note** : Si l'ajout automatique via RPC échoue, le script affiche les commandes SQL à exécuter manuellement.

---

### `cron-sync-offres.js` — Synchronisation complète

**Usage** : Script pour synchronisation automatique avec récupération des détails complets

**Commande** :
```bash
npx dotenvx run -f .env.local -- node scripts/cron-sync-offres.js
```

**Fonctionnement en 3 phases** :

**Phase 1 - Import nouvelles offres** :
- Charge toutes les références existantes depuis Supabase (paginé par 1000)
- Scrape les pages listing d'emploi-territorial.fr
- Arrêt après 3 pages consécutives sans nouvelles offres
- Pour chaque nouvelle offre : fetch de la page détail complète
- Upsert par batch de 100

**Phase 2 - Marquage offres expirées** :
- Met à jour `expired = true` pour les offres avec `date_limite < CURRENT_DATE`

**Phase 3 - Rapport JSON** :
- Log détaillé + JSON final pour monitoring
- Exit code 0 si OK, 1 si erreur

**Configuration** :
| Paramètre | Valeur | Description |
|---|---|---|
| `MAX_PAGES_WITHOUT_NEW` | 3 | Pages consécutives vides avant arrêt |
| `RATE_LIMIT_MS` | 1100 ms | Délai entre requêtes (respectueux) |
| `BATCH_SIZE` | 100 | Taille des batches d'insertion |

**Durée estimée** : 5-15 minutes selon le nombre de nouvelles offres

**Fréquence recommandée** : **Toutes les heures** en production

---

### `cron-sync-offres-fast.js` — Synchronisation rapide

**Usage** : Version allégée, listing uniquement (pas de pages détail)

**Commande** :
```bash
npx dotenvx run -f .env.local -- node scripts/cron-sync-offres-fast.js
```

**Différences avec la version complète** :
- ❌ Pas de récupération des pages détail
- ❌ Pas de `descriptif_emploi`, `profil_recherche`, `date_limite`
- ✅ Import des métadonnées de listing uniquement
- ✅ 5x plus rapide (1-3 minutes)
- ✅ Même logique d'arrêt et marquage expired

**Cas d'usage** :
- Tests et validation rapide
- Synchronisation légère quand les détails ne sont pas critiques
- Backup/fallback si la version complète échoue

**Fréquence recommandée** : Toutes les 30 minutes ou comme backup

---

### Configuration cron sur serveur

**Cron principal** (production) :
```bash
# Sync complète toutes les heures
0 * * * * cd /path/to/rdvemploipublic && npx dotenvx run -f .env.local -- node scripts/cron-sync-offres.js >> logs/cron-sync.log 2>&1

# Backup rapide toutes les 30 min
15,45 * * * * cd /path/to/rdvemploipublic && npx dotenvx run -f .env.local -- node scripts/cron-sync-offres-fast.js >> logs/cron-fast.log 2>&1
```

**Monitoring avec le JSON de sortie** :
```bash
# Extraction du rapport JSON depuis les logs
tail -1 logs/cron-sync.log | jq '.'

# Exemple de sortie :
{
  "newOffers": 42,
  "detailsFetched": 40,
  "detailErrors": 2,
  "imported": 42,
  "importErrors": 0,
  "expiredMarked": 15,
  "totalInDb": 27284,
  "errors": []
}
```

**Contraintes serveur Hetzner** :
- Rate limit respectueux : 1.1s entre chaque requête
- Gestion d'erreurs robuste (try/catch partout)
- Exit codes appropriés pour monitoring cron
- Les scripts ne crashent jamais complètement

**Logs recommandés** :
- `logs/cron-sync.log` — script principal
- `logs/cron-fast.log` — script rapide
- `logs/cron-expired.log` — script colonne expired
- Rotation automatique via logrotate

---

*Dernière mise à jour : 12 mars 2026*
