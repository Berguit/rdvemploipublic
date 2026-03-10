-- ============================================
-- Schema: Grilles indiciaires
-- Base: Supabase (PostgreSQL)
-- ============================================

-- Valeur du point d'indice (historique)
CREATE TABLE IF NOT EXISTS valeur_point_indice (
  id SERIAL PRIMARY KEY,
  valeur NUMERIC(8,5) NOT NULL,
  date_effet DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO valeur_point_indice (valeur, date_effet) VALUES (4.92278, '2024-01-01')
ON CONFLICT (date_effet) DO NOTHING;

-- Fonctions publiques
CREATE TABLE IF NOT EXISTS fonctions_publiques (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO fonctions_publiques (nom, slug) VALUES
  ('Fonction Publique Territoriale', 'territoriale'),
  ('Fonction Publique Hospitalière', 'hospitaliere'),
  ('Fonction Publique d''État', 'etat'),
  ('Ville de Paris', 'ville-paris')
ON CONFLICT (slug) DO NOTHING;

-- Filières
CREATE TABLE IF NOT EXISTS filieres (
  id SERIAL PRIMARY KEY,
  fonction_publique_id INT NOT NULL REFERENCES fonctions_publiques(id) ON DELETE CASCADE,
  nom VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fonction_publique_id, nom)
);

-- Cadres d'emploi
CREATE TABLE IF NOT EXISTS cadres_emploi (
  id SERIAL PRIMARY KEY,
  filiere_id INT NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
  nom VARCHAR(300) NOT NULL,
  categorie CHAR(1) CHECK (categorie IN ('A', 'B', 'C')),
  url_source VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(filiere_id, nom)
);

-- Grades
CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  cadre_emploi_id INT NOT NULL REFERENCES cadres_emploi(id) ON DELETE CASCADE,
  nom VARCHAR(300) NOT NULL,
  est_en_extinction BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cadre_emploi_id, nom)
);

-- Échelons
CREATE TABLE IF NOT EXISTS echelons (
  id SERIAL PRIMARY KEY,
  grade_id INT NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  echelon VARCHAR(30) NOT NULL, -- "1", "2", "HEA", "Echelon spécial", etc.
  indice_brut INT,
  indice_majore INT,
  duree_mois INT,             -- durée en mois (NULL = échelon terminal)
  salaire_brut NUMERIC(8,2),  -- salaire mensuel brut en euros
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grade_id, echelon)
);

-- Index pour les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_filieres_fp ON filieres(fonction_publique_id);
CREATE INDEX IF NOT EXISTS idx_cadres_filiere ON cadres_emploi(filiere_id);
CREATE INDEX IF NOT EXISTS idx_cadres_categorie ON cadres_emploi(categorie);
CREATE INDEX IF NOT EXISTS idx_grades_cadre ON grades(cadre_emploi_id);
CREATE INDEX IF NOT EXISTS idx_echelons_grade ON echelons(grade_id);
CREATE INDEX IF NOT EXISTS idx_echelons_indice_majore ON echelons(indice_majore);

-- Vue pratique : grille complète avec salaires
CREATE OR REPLACE VIEW v_grilles_completes AS
SELECT
  fp.nom AS fonction_publique,
  f.nom AS filiere,
  ce.nom AS cadre_emploi,
  ce.categorie,
  g.nom AS grade,
  e.echelon,
  e.indice_brut,
  e.indice_majore,
  e.duree_mois,
  e.salaire_brut,
  ROUND(e.indice_majore * vp.valeur, 2) AS salaire_brut_calcule
FROM echelons e
JOIN grades g ON g.id = e.grade_id
JOIN cadres_emploi ce ON ce.id = g.cadre_emploi_id
JOIN filieres f ON f.id = ce.filiere_id
JOIN fonctions_publiques fp ON fp.id = f.fonction_publique_id
CROSS JOIN (SELECT valeur FROM valeur_point_indice ORDER BY date_effet DESC LIMIT 1) vp;

-- RLS (Row Level Security) pour Supabase
ALTER TABLE fonctions_publiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE filieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadres_emploi ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE echelons ENABLE ROW LEVEL SECURITY;
ALTER TABLE valeur_point_indice ENABLE ROW LEVEL SECURITY;

-- Politique de lecture publique
CREATE POLICY "Lecture publique fonctions_publiques" ON fonctions_publiques FOR SELECT USING (true);
CREATE POLICY "Lecture publique filieres" ON filieres FOR SELECT USING (true);
CREATE POLICY "Lecture publique cadres_emploi" ON cadres_emploi FOR SELECT USING (true);
CREATE POLICY "Lecture publique grades" ON grades FOR SELECT USING (true);
CREATE POLICY "Lecture publique echelons" ON echelons FOR SELECT USING (true);
CREATE POLICY "Lecture publique valeur_point_indice" ON valeur_point_indice FOR SELECT USING (true);
