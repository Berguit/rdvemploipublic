# ROADMAP — rdvemploipublic.fr

> Objectif : transformer rdvemploipublic.fr en portail de référence pour l'emploi public, optimisé SEO, avec un pipeline de données automatisé, et le préparer à la revente.

---

## Vue d'ensemble des phases

| Phase | Quoi | Durée estimée | Dépendances |
|---|---|---|---|
| 0 | Fondations techniques | ✅ Fait | - |
| 1 | Pipeline données : offres d'emploi | 1 semaine | Phase 0 |
| 2 | Pipeline données : grilles indiciaires | 1 semaine | Phase 0 |
| 3 | Pages offres + moteur de recherche | 1-2 semaines | Phase 1 |
| 4 | Pages grilles + simulateur | 1 semaine | Phase 2 |
| 5 | SEO technique (Schema.org, meta, sitemap) | 1 semaine | Phases 3+4 |
| 6 | Migration contenu WP + reformulation articles | 1-2 semaines | Phase 0 |
| 7 | Capture emails + alertes Brevo | 3-4 jours | Phase 1 |
| 8 | Monétisation (AdSense + affiliation) | 3-4 jours | Phase 5 |
| 9 | Tests, perfs, accessibilité, mise en prod | 1 semaine | Tout |

**Durée totale estimée : 6-8 semaines** (en parallélisant les phases indépendantes)

---

## Phase 0 — Fondations techniques ✅

> Statut : FAIT (sessions du 8-9 mars 2026)

- [x] Repo GitHub créé (`Berguit/rdvemploipublic`)
- [x] Next.js 15 + TypeScript + Tailwind + shadcn/ui
- [x] Homepage mobile first codée (hero, recherche, carte SVG, stats, offres, outils, footer)
- [x] Carte SVG France interactive (96 départements, heatmap, tooltips)
- [x] POC scraping emploi-territorial validé (20/20 offres, 0 erreur)
- [x] Structure grilles indiciaires analysée (emploi-collectivites.fr)
- [x] Architecture validée : WordPress headless + Next.js front
- [x] Déploiement preprod configuré (dev.rdvemploipublic.fr)
- [x] Node.js v20 installé sur le serveur

### Reste à faire Phase 0
- [ ] Configurer Supabase (nouveau projet dédié)
- [ ] Connecter Next.js à l'API REST WordPress existant
- [ ] Mettre en place le `.env.local` avec toutes les clés

---

## Phase 1 — Pipeline données : offres d'emploi

> Objectif : alimenter la base avec 25 000+ offres et maintenir le flux en continu

### 1.1 Base de données Supabase
- [ ] Créer la table `offres` avec tous les champs :
  ```
  id, reference, titre, employeur, lieu, departement, region,
  type_emploi, famille_metiers, sous_famille, metier, grades,
  categorie, filiere, ouvert_contractuels, temps_travail,
  teletravail, management, experience, remuneration,
  description_employeur, descriptif_emploi, missions,
  profil_recherche, modalites_candidature, lien_candidature,
  date_publication, date_limite, date_poste,
  url_source, created_at, updated_at, status
  ```
- [ ] Index sur : departement, filiere, categorie, type_emploi, date_publication
- [ ] Full-text search index sur : titre, descriptif_emploi, missions, profil_recherche
- [ ] RLS policies

### 1.2 Scraper offres — script complet ✅
- [x] Refactorer le POC en script production (`scripts/scrape-offres.ts`)
- [x] Fixer le bug du mapping blocs texte (matcher par titres de section, pas par position)
- [x] Ajouter la gestion des erreurs, retries, rate limiting (1 req/500ms)
- [x] Logging + rapport d'exécution
- [x] Déduplication (vérifier si offre déjà en base par référence)
- [ ] Détection des offres expirées (marquer status = 'expired')

### 1.3 Bootstrap initial — ✅ (1000 offres scrapées le 10/03/2026)
- [x] Scraper les 1000 offres les plus récentes depuis la liste HTML
- [x] Scraper le détail complet de chacune → `data/offres.json`
- [ ] Insérer en base Supabase (en attente config Supabase)

### 1.4 Collecte continue
- [ ] Script RSS (`scripts/rss-sync.js`) : parse le flux toutes les heures
- [ ] Pour chaque nouvelle offre : scraper le détail → insérer en base
- [ ] Cron job (OpenClaw cron ou cron système) toutes les heures
- [ ] Nettoyage automatique des offres expirées (date_limite dépassée)

### 1.5 Reformulation des offres (IA)
- [ ] Script de reformulation via Claude/OpenRouter
- [ ] Réécrire : titre (SEO-friendly), description (unique, pas duplicate content)
- [ ] Conserver les données factuelles (salaire, lieu, dates) intactes
- [ ] Stocker le contenu reformulé dans des champs séparés (`titre_seo`, `description_seo`, etc.)
- [ ] Batch processing : reformuler par lots de 50, rate limiting OpenRouter
- [ ] ⚠️ Ne PAS reformuler les infos légales/administratives (grades, indices, conditions statutaires)

---

## Phase 2 — Pipeline données : grilles indiciaires

> Objectif : avoir toutes les grilles des 4 fonctions publiques en base

### 2.1 Base de données
- [ ] Table `filieres` : id, fonction_publique, nom, slug
- [ ] Table `cadres_emploi` : id, filiere_id, nom, slug, categorie (A/B/C), url_source
- [ ] Table `grades` : id, cadre_emploi_id, nom, slug
- [ ] Table `echelons` : id, grade_id, echelon, indice_brut, indice_majore, duree, salaire_brut, salaire_net
- [ ] Table `valeur_point` : date, valeur (4.92278 au 01/01/2024)

### 2.2 Scraper grilles ✅ (10/03/2026)
- [x] Script `scripts/scrape-grilles.ts`
- [x] Étape 1 : scraper les pages listing des 4 fonctions publiques → extraire filières + cadres d'emploi + liens
- [x] Étape 2 : pour chaque cadre d'emploi → scraper la page détail → extraire grades + échelons
- [x] 4 FP complètes : 40 filières, 1297 cadres, 2003 grades, 16262 échelons → `data/grilles.json`
- [ ] Parser les tableaux HTML (échelon, indices, durée, salaires)
- [ ] Gérer les cas spéciaux (échelons spéciaux HEA, grades en voie d'extinction)
- [ ] Insérer en base Supabase

### 2.3 Mise à jour
- [ ] Les grilles changent rarement (~1-2 fois/an lors des décrets)
- [ ] Script de re-sync mensuel pour détecter les changements
- [ ] Mettre à jour la valeur du point quand elle change

### 2.4 Simulateur de salaire
- [ ] Recréer le simulateur en React (component `SalaryCalculator`)
- [ ] Inputs : statut (titulaire CNRACL / contractuel CNAV-IRCANTEC), indice majoré, NBI, régime indemnitaire, supplément familial
- [ ] Calcul en temps réel (pas de submit, réactif)
- [ ] Afficher : brut, net avant impôt, net après impôt (avec taux moyen configurable)
- [ ] Mobile first, accessible
- [ ] Lien depuis chaque grille vers le simulateur pré-rempli

---

## Phase 3 — Pages offres + moteur de recherche

> Objectif : les visiteurs trouvent et consultent les offres facilement

### 3.1 Page offre individuelle (`/offres/[slug]`)
- [ ] Template : titre, employeur (avec blason Wikidata si dispo), lieu, carte mini, toutes les infos
- [ ] Bouton "Postuler" (lien vers la source)
- [ ] Bloc "Offres similaires" (même département ou même métier) → maillage interne
- [ ] Breadcrumb : Accueil > Offres > [Département] > [Titre]
- [ ] Schema.org JobPosting (voir Phase 5)
- [ ] Bouton partage (copier lien, réseaux)

### 3.2 Page recherche (`/offres`)
- [ ] Barre de recherche texte libre avec autocomplete (métiers, villes)
- [ ] Filtres combinables :
  - Département / Région
  - Famille de métiers / Sous-famille / Métier
  - Catégorie (A, B, C)
  - Filière (Administrative, Technique, Médico-sociale...)
  - Type d'emploi (permanent, temporaire, vacation)
  - Temps de travail (complet, partiel)
  - Ouvert aux contractuels (oui/non)
  - Télétravail (oui/non)
  - Expérience
- [ ] Compteurs live par filtre ("Technique (7 212)")
- [ ] Tri : par date, par pertinence
- [ ] Pagination (20 offres/page)
- [ ] URL persistante SEO (`/offres?dept=75&filiere=technique`) → bookmarkable
- [ ] Résultats : cards offres (titre, employeur, lieu, type, date)
- [ ] Version mobile : filtres dans un drawer/bottom sheet

### 3.3 Pages landing SEO
- [ ] Pages par département (`/emploi-public-paris/`, `/emploi-public-rhone/`)
  - H1 optimisé, texte éditorial, offres filtrées, stats locales
  - 101 pages générées automatiquement
- [ ] Pages par métier (`/offres-secretaire-mairie/`, `/offres-atsem/`)
  - Top métiers les plus recherchés (~50 pages)
- [ ] Pages par filière (`/offres-filiere-technique/`, `/offres-filiere-administrative/`)
- [ ] Toutes générées en SSG (Static Site Generation) pour les perfs

### 3.4 Blasons / logos communes
- [ ] Script pour récupérer les blasons via Wikidata API (par nom de commune)
- [ ] Stocker les images dans Supabase Storage ou `/public/blasons/`
- [ ] Afficher sur la card offre et la page offre

---

## Phase 4 — Pages grilles + simulateur

> Objectif : les pages outils qui génèrent du trafic récurrent

### 4.1 Page listing grilles (`/grilles-indiciaires`)
- [ ] Navigation par fonction publique (territoriale, hospitalière, État, Paris)
- [ ] Puis par filière → cadres d'emploi → grades
- [ ] Barre de recherche rapide (taper "attaché" → résultats instantanés)

### 4.2 Page grille individuelle (`/grilles-indiciaires/[fonction]/[cadre]/[grade]`)
- [ ] Tableau responsive des échelons (indice brut, majoré, durée, salaires)
- [ ] Tri par colonne
- [ ] Lien "Calculer mon salaire net" → simulateur pré-rempli
- [ ] Lien vers les offres correspondant à ce grade
- [ ] Breadcrumb SEO
- [ ] Schema.org (structured data pour les tableaux de salaires)

### 4.3 Page simulateur (`/calculateur-salaire`)
- [ ] Composant React interactif
- [ ] Résultat en temps réel
- [ ] Explication du calcul (cotisations, retenues)
- [ ] Partage du résultat (URL avec paramètres)
- [ ] Mobile first, gros boutons, accessible

---

## Phase 5 — SEO technique

> Objectif : dominer Google sur les requêtes emploi public

### 5.1 Schema.org sur chaque type de page
- [ ] **Offres** : `JobPosting` (title, description, datePosted, validThrough, employmentType, hiringOrganization, jobLocation, baseSalary)
- [ ] **Grilles** : `Table` ou `Dataset`
- [ ] **Simulateur** : `WebApplication`
- [ ] **Articles blog** : `Article` avec `author`, `datePublished`, `dateModified`
- [ ] **Homepage** : `WebSite` + `SearchAction` (sitelinks searchbox)
- [ ] **Breadcrumbs** : `BreadcrumbList` sur toutes les pages

### 5.2 Meta tags dynamiques
- [ ] Title : optimisé par page type (ex: "Offre Attaché Territorial à Paris - rdvemploipublic.fr")
- [ ] Meta description : générée dynamiquement avec les données clés
- [ ] Open Graph : titre, description, image dynamique par page
- [ ] Twitter Cards
- [ ] Canonical URLs systématiques

### 5.3 Performance
- [ ] next/image partout (WebP, lazy loading, responsive)
- [ ] Fonts optimisés (next/font, preload)
- [ ] Code splitting automatique (Next.js App Router)
- [ ] Cible : Lighthouse 95+ sur mobile
- [ ] Core Web Vitals : LCP < 2.5s, CLS < 0.1, INP < 200ms

### 5.4 Sitemap + robots
- [ ] Sitemap XML dynamique (offres, grilles, articles, landing pages)
- [ ] Robots.txt optimisé
- [ ] Soumettre à Google Search Console
- [ ] Indexation des 25 000+ pages offres

### 5.5 Maillage interne
- [ ] Offre → offres similaires (même lieu, même métier)
- [ ] Offre → grille indiciaire du grade correspondant
- [ ] Grille → offres qui recrutent ce grade
- [ ] Article → offres et grilles liées
- [ ] Landing page département → offres du département + grilles
- [ ] Footer : liens vers les top départements et top métiers

---

## Phase 6 — Migration contenu WP + reformulation

> Objectif : récupérer le contenu existant et l'optimiser SEO

### 6.1 Migration articles
- [ ] Connecter Next.js à l'API REST WordPress
- [ ] Récupérer tous les articles existants (~50+)
- [ ] Mapper les catégories WP vers la nouvelle navigation
- [ ] Conserver les URLs existantes (redirections 301 si changement)
- [ ] Templates articles : blog layout, auteur, date, catégorie, tags

### 6.2 Reformulation SEO des articles existants
- [ ] Audit des articles actuels (titres, meta, contenu)
- [ ] Pour chaque article : reformuler title + meta description + H1 pour le SEO
- [ ] Ajouter des liens internes vers offres et grilles pertinentes
- [ ] Ajouter Schema.org Article
- [ ] Batch via Claude/OpenRouter : ~50 articles × 1 appel = rapide
- [ ] ⚠️ Garder le sens et les faits, juste optimiser la structure SEO

### 6.3 Nouveaux contenus à créer
- [ ] Pages "Comment postuler dans la fonction publique"
- [ ] Pages "Guide des concours [catégorie A/B/C]"
- [ ] FAQ emploi public (rich snippets FAQ schema)
- [ ] Fiches métiers enrichies (salaires moyens tirés des grilles, offres en cours)

---

## Phase 7 — Capture emails + alertes Brevo

> Objectif : construire la base email dès le jour 1

### 7.1 Inscription alertes
- [ ] Formulaire simple : email + département + métier (optionnel)
- [ ] Intégré dans : homepage (hero), page recherche (sidebar), page offre (bas de page)
- [ ] Double opt-in (RGPD obligatoire)
- [ ] Stockage : Supabase table `subscribers` + sync Brevo

### 7.2 Brevo setup
- [ ] Créer compte Brevo (gratuit 300 emails/jour)
- [ ] Configurer le domaine d'envoi (rdvemploipublic.fr)
- [ ] SPF + DKIM + DMARC
- [ ] Template email alerte (responsive, sobre, institutionnel)

### 7.3 Envoi des alertes
- [ ] Cron quotidien : nouvelles offres du jour
- [ ] Matcher offres vs préférences subscribers (département, métier)
- [ ] Envoyer via Brevo API
- [ ] Lien de désinscription dans chaque email
- [ ] Tracking : taux d'ouverture, clics

### 7.4 Lead magnets
- [ ] Pop-up non intrusif après 30s ou scroll 50%
- [ ] "Recevez les nouvelles offres de votre département chaque jour"
- [ ] Page dédiée `/alertes` expliquant le service

---

## Phase 8 — Monétisation

> Objectif : premiers revenus passifs

### 8.1 Google AdSense
- [ ] Créer/configurer le compte AdSense
- [ ] Placements : bannière header, entre les résultats de recherche (toutes les 5 offres), sidebar articles
- [ ] Pas d'ads sur la homepage (UX propre pour la première impression)
- [ ] Responsive ad units

### 8.2 Affiliation formations
- [ ] Identifier les programmes d'affiliation :
  - Prépas concours (Carrières Publiques, Prépa Concours, etc.)
  - Formations CPF (reconversion vers le public)
  - Livres/manuels concours (Amazon Partenaires)
- [ ] Intégrer les liens dans :
  - Articles pertinents
  - Pages grilles ("Préparez le concours d'attaché territorial")
  - Fiches métiers
- [ ] Disclosure : mention "liens affiliés" (obligation légale)

### 8.3 Préparer les offres sponsorisées (Phase 2 monétisation)
- [ ] Concevoir le format "offre mise en avant" (badge, position top, encadré)
- [ ] Page `/recruteurs` expliquant les tarifs
- [ ] Formulaire de contact recruteurs
- [ ] ⚠️ Ne pas activer avant d'avoir du trafic significatif (>5K visites/mois)

---

## Phase 9 — Tests, perfs, prod

> Objectif : lancer proprement

### 9.1 Tests
- [ ] Test responsive : 375px (mobile), 768px (tablette), 1280px (desktop)
- [ ] Test navigateurs : Chrome, Safari, Firefox
- [ ] Test accessibilité : Lighthouse, axe-core
- [ ] Test SEO : screaming frog crawl, schema validator
- [ ] Test perfs : Lighthouse mobile 95+, WebPageTest

### 9.2 Déploiement
- [ ] Configurer Vercel (ou VPS si besoin de cron)
- [ ] Domaine rdvemploipublic.fr → pointer vers le nouveau front
- [ ] Redirections 301 de toutes les anciennes URLs WP
- [ ] SSL / HTTPS
- [ ] WordPress headless accessible uniquement en API (pas de front WP public)

### 9.3 Monitoring post-launch
- [ ] Google Search Console : indexation, erreurs
- [ ] Google Analytics 4 : trafic, conversions
- [ ] Uptime monitoring (UptimeRobot gratuit)
- [ ] Alertes si le scraping tombe en panne

### 9.4 Itérations post-launch
- [ ] Analyser les requêtes Search Console → créer du contenu ciblé
- [ ] A/B test CTA alertes email
- [ ] Ajouter les offres d'autres sources (emploi-collectivites.fr, Place de l'Emploi Public)
- [ ] App PWA (Progressive Web App) pour mobile

---

## Planning parallélisé

```
Semaine 1-2 :  Phase 1 (scraping offres) + Phase 2 (scraping grilles)
               → En parallèle, les deux pipelines sont indépendants

Semaine 2-3 :  Phase 3 (pages offres + recherche) + Phase 6.1 (migration WP)
               → Les offres sont en base, on peut coder les pages

Semaine 3-4 :  Phase 4 (pages grilles + simulateur) + Phase 7 (emails Brevo)
               → Les grilles sont en base, le simulateur peut se connecter

Semaine 4-5 :  Phase 5 (SEO technique) + Phase 1.5 (reformulation IA)
               → Tout le contenu est là, on optimise

Semaine 5-6 :  Phase 6.2 (reformulation articles) + Phase 8 (monétisation)
               → Polissage du contenu existant + setup revenus

Semaine 6-7 :  Phase 9 (tests + prod)
               → Go live !

Post-launch :  Itérations continues, nouveaux contenus, scaling
```

---

## Métriques de succès

| Métrique | M+1 | M+3 | M+6 |
|---|---|---|---|
| Offres en base | 25 000+ | 25 000+ (actualisé) | 25 000+ |
| Pages indexées | 5 000+ | 15 000+ | 30 000+ |
| Visites/mois | 1 000 | 10 000 | 50 000 |
| Subscribers email | 100 | 1 000 | 5 000 |
| Revenu mensuel | 0€ | 200-500€ | 2 000-3 000€ |
| Lighthouse mobile | 95+ | 95+ | 95+ |

---

*Dernière mise à jour : 9 mars 2026*
