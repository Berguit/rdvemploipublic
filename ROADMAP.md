# ROADMAP — rdvemploipublic.fr

_Dernière mise à jour : 2026-03-11_

## ✅ Livré (11 mars 2026)

- [x] Import 26 085 offres emploi-territorial.fr
- [x] Scrape ciblé Corse (2A + 2B) — 77 offres
- [x] Carte de France interactive (départements + DOM-TOM + IDF)
- [x] Carte visible sur mobile
- [x] Grilles indiciaires (4 FP, 16 232 échelons)
- [x] Calculateur salaire net fonction publique
- [x] Recherche full-text (RPC Supabase)
- [x] Nettoyage noms de villes (`ville_clean`, 98.6%)
- [x] Pages SEO ville — hub + détail (`/emploi-public/[ville]`)
- [x] Étiquettes top villes sur homepage
- [x] Sitemap dynamique (7 sitemaps, 26K+ URLs)
- [x] Schema.org JobPosting (JSON-LD)
- [x] Blasons Wikidata (662 villes avec blason)

---

## 🔥 Phase 2 — SEO & Trafic (priorité haute)

### 2.1 Finir les blasons Wikidata
- [ ] Relancer l'agent pour les ~1700 villes restantes
- **Effort** : 1h (agent automatisé, rate limit Wikidata)
- **Impact** : visuel, confiance utilisateur

### 2.2 Pages SEO métier
- [ ] Créer `/metier/[slug]/` — page par famille de métiers
- [ ] Hub `/metiers/` — liste toutes les familles avec nb offres
- [ ] Étiquettes métiers sur homepage (comme les villes)
- **Effort** : 2-3h (même pattern que pages ville)
- **Impact** : ++ longue traîne SEO ("emploi agent technique territorial")

### 2.3 Pages SEO département
- [ ] Créer `/departement/[code]/` — offres par département
- [ ] Lien depuis la carte interactive
- **Effort** : 2h
- **Impact** : ++ SEO géo ("emploi public Hauts-de-Seine")

### 2.4 Liens internes
- [ ] Sur chaque offre : liens vers offres similaires (même ville, même métier)
- [ ] Sur chaque page ville : liens vers villes voisines (même département)
- [ ] Maillage offre ↔ grille indiciaire (grade mentionné → lien grille)
- **Effort** : 3-4h
- **Impact** : ++ maillage interne, temps sur site, SEO

### 2.5 OG tags / images sociales
- [ ] Générer des images OG dynamiques (ville + nb offres + blason)
- [ ] Meta tags Twitter Card
- **Effort** : 2h
- **Impact** : meilleur partage social

---

## ⚙️ Phase 3 — Automatisation & Fraîcheur (priorité moyenne)

### 3.1 Cron sync offres ✅
- [x] Script `cron-sync-offres.js` : listing + détails + marquage expired
- [x] Déployé sur Hetzner, crontab toutes les heures (`0 * * * *`)
- [x] Colonne `expired` ajoutée, 943 offres marquées
- [x] Front : bandeau expirée + noindex + hide CTA + pas de Schema.org
- [x] > 30j : 404 (TODO: middleware 410)
- **Total en base : 27 005 offres**

### 3.2 Cron sync blasons
- [ ] Quand nouvelles villes apparaissent → scraper blason Wikidata
- **Effort** : 1h (intégrer dans le cron sync offres)

### 3.3 Fix offres sans département ✅
- [x] 291/293 corrigés (2 restants = postes à l'étranger)

---

## 🎨 Phase 4 — UX & Fonctionnel (nice-to-have)

### 4.1 Filtres carte interactive
- [ ] Clic sur département → filtre les offres
- [ ] Clic sur DOM-TOM → page département
- **Effort** : 2h

### 4.2 DOM-TOM vrais contours
- [ ] Remplacer les cards HTML par des mini-SVG (GeoJSON → SVG)
- **Effort** : 3h
- **Impact** : visuel

### 4.3 Alertes email
- [ ] Inscription par ville/métier/département
- [ ] Email quotidien avec nouvelles offres matchant les critères
- **Effort** : 5-8h
- **Impact** : ++ rétention, valeur pour revente

### 4.4 Comparateur villes
- [ ] Page `/comparer/[ville1]-vs-[ville2]/`
- [ ] Nb offres, filières, salaires moyens, coût de la vie
- **Effort** : 4h
- **Impact** : SEO + engagement

### 4.5 Fix SSR chart warning
- [ ] `dynamic(() => import('...'), { ssr: false })` pour Recharts
- **Effort** : 15 min

---

## 💰 Phase 5 — Monétisation & Revente

### 5.1 Analytics
- [ ] Intégrer Plausible ou Umami (privacy-friendly)
- [ ] Tracker pages les plus visitées

### 5.2 SEO technique
- [ ] Canonical URLs
- [ ] Robots.txt optimisé
- [ ] Google Search Console
- [ ] Soumettre sitemaps

### 5.3 Contenu éditorial
- [ ] Pages guides ("Comment devenir agent territorial", "Concours fonction publique")
- [ ] FAQ dynamique par métier/grade

### 5.4 Transition WordPress → Next.js
- [ ] Migrer rdvemploipublic.fr (prod) de WordPress vers Next.js
- [ ] Redirections 301 des anciennes URLs
- [ ] DNS switch

---

## 📊 Métriques actuelles

| Métrique | Valeur |
|----------|--------|
| Offres en base | 27 005 |
| Villes avec blason | 3 610 / 5 625 |
| Villes nettoyées | 25 718 (98.6%) |
| Offres expirées marquées | 943 |
| Grilles indiciaires | 16 232 échelons |
| Filières | 40 |
| Pages indexables | ~28 000+ |
| Sitemaps | 7 × 5000 URLs |

---

_Prochaine action recommandée : **Pages SEO métier** (2.2) — même pattern que les pages ville, gros impact SEO._
