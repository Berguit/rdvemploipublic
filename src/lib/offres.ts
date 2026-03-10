export interface Offre {
  id: number;
  slug: string;
  title: string;
  employer: string;
  location: string;
  department: string;
  departmentName: string;
  region: string;
  categorie: 'A' | 'B' | 'C';
  filiere: string;
  typeEmploi: string;
  tempsTravail: 'Temps complet' | 'Temps partiel' | 'Temps non complet';
  ouvertContractuels: boolean;
  description: string;
  missions: string[];
  profil: string[];
  candidature: string;
  sourceUrl: string;
  publishedAt: string;
}

export const FILIERES = [
  'Administrative',
  'Technique',
  'Médico-sociale',
  'Culturelle',
  'Sportive',
  'Animation',
  'Police municipale',
  'Sapeurs-pompiers',
] as const;

export const TYPES_EMPLOI = [
  'Titulaire',
  'Contractuel',
  'Vacataire',
  'Apprenti',
] as const;

export const REGIONS: Record<string, string[]> = {
  'Île-de-France': ['75', '77', '78', '91', '92', '93', '94', '95'],
  'Auvergne-Rhône-Alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
  'Provence-Alpes-Côte d\'Azur': ['04', '05', '06', '13', '83', '84'],
  'Occitanie': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
  'Nouvelle-Aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
  'Bretagne': ['22', '29', '35', '56'],
  'Pays de la Loire': ['44', '49', '53', '72', '85'],
  'Hauts-de-France': ['02', '59', '60', '62', '80'],
  'Grand Est': ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
  'Normandie': ['14', '27', '50', '61', '76'],
  'Bourgogne-Franche-Comté': ['21', '25', '39', '58', '70', '71', '89', '90'],
  'Centre-Val de Loire': ['18', '28', '36', '37', '41', '45'],
  'Corse': ['2A', '2B'],
};

const mockOffres: Offre[] = [
  {
    id: 1, slug: 'agent-police-municipale-lyon-69',
    title: 'Agent de police municipale', employer: 'Mairie de Lyon',
    location: 'Lyon', department: '69', departmentName: 'Rhône',
    region: 'Auvergne-Rhône-Alpes', categorie: 'C', filiere: 'Police municipale',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: false,
    description: "La Ville de Lyon recrute un agent de police municipale pour renforcer son équipe de sécurité. Vous assurerez la tranquillité publique, ferez respecter les arrêtés municipaux et contribuerez à la prévention de la délinquance sur le terrain.",
    missions: ["Assurer la surveillance et la sécurité des espaces publics", "Faire respecter les arrêtés municipaux et la réglementation", "Rédiger les procès-verbaux d'infractions", "Participer aux actions de prévention et de médiation"],
    profil: ["Concours de gardien de police municipale requis", "Bonne condition physique", "Sens du service public et de la médiation"],
    candidature: "Envoyer CV et lettre de motivation à recrutement@lyon.fr",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-08',
  },
  {
    id: 2, slug: 'responsable-espaces-verts-annecy-74',
    title: 'Responsable des espaces verts', employer: 'Communauté de communes du lac d\'Annecy',
    location: 'Annecy', department: '74', departmentName: 'Haute-Savoie',
    region: 'Auvergne-Rhône-Alpes', categorie: 'B', filiere: 'Technique',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: true,
    description: "La Communauté de communes recrute un responsable des espaces verts pour piloter l'entretien et l'aménagement paysager du territoire. Vous encadrerez une équipe de 8 agents et serez garant de la qualité environnementale.",
    missions: ["Piloter la gestion et l'entretien des espaces verts communautaires", "Encadrer une équipe de 8 agents techniques", "Concevoir les plans d'aménagement paysager", "Gérer le budget du service et les marchés publics"],
    profil: ["Diplôme en aménagement paysager ou équivalent", "Expérience en management d'équipe", "Maîtrise des techniques d'entretien écologique"],
    candidature: "Candidature en ligne sur le site de la communauté de communes",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-07',
  },
  {
    id: 3, slug: 'assistant-administratif-toulouse-31',
    title: 'Assistant administratif', employer: 'Conseil départemental de Haute-Garonne',
    location: 'Toulouse', department: '31', departmentName: 'Haute-Garonne',
    region: 'Occitanie', categorie: 'C', filiere: 'Administrative',
    typeEmploi: 'Contractuel', tempsTravail: 'Temps complet', ouvertContractuels: true,
    description: "Le Conseil départemental recherche un assistant administratif pour le service des ressources humaines. Vous assurerez le suivi administratif des dossiers du personnel et l'accueil des agents.",
    missions: ["Assurer l'accueil physique et téléphonique des agents", "Gérer le courrier et le classement des dossiers", "Saisir et mettre à jour les données administratives", "Préparer les documents pour les commissions"],
    profil: ["Bac ou équivalent en secrétariat/administration", "Maîtrise des outils bureautiques", "Rigueur et sens de l'organisation"],
    candidature: "Postuler via la plateforme de recrutement du département",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-07',
  },
  {
    id: 4, slug: 'educateur-specialise-marseille-13',
    title: 'Éducateur spécialisé', employer: 'CCAS de Marseille',
    location: 'Marseille', department: '13', departmentName: 'Bouches-du-Rhône',
    region: 'Provence-Alpes-Côte d\'Azur', categorie: 'B', filiere: 'Médico-sociale',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: true,
    description: "Le CCAS de Marseille recrute un éducateur spécialisé pour accompagner les publics en difficulté. Vous interviendrez au sein d'une équipe pluridisciplinaire dans le cadre de la protection de l'enfance.",
    missions: ["Accompagner les familles en situation de fragilité sociale", "Élaborer et suivre les projets éducatifs individualisés", "Animer des activités socio-éducatives collectives", "Participer aux réunions d'équipe et aux synthèses"],
    profil: ["Diplôme d'État d'éducateur spécialisé", "Expérience en protection de l'enfance souhaitée", "Capacités rédactionnelles et relationnelles"],
    candidature: "Envoyer candidature à drh@ccas-marseille.fr",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-06',
  },
  {
    id: 5, slug: 'agent-entretien-batiments-nantes-44',
    title: 'Agent d\'entretien des bâtiments', employer: 'Mairie de Nantes',
    location: 'Nantes', department: '44', departmentName: 'Loire-Atlantique',
    region: 'Pays de la Loire', categorie: 'C', filiere: 'Technique',
    typeEmploi: 'Contractuel', tempsTravail: 'Temps non complet', ouvertContractuels: true,
    description: "La Ville de Nantes recrute un agent d'entretien des bâtiments pour assurer la maintenance préventive et curative des équipements municipaux. Vous interviendrez en plomberie, électricité et petite maçonnerie.",
    missions: ["Réaliser les travaux de maintenance courante des bâtiments", "Diagnostiquer les pannes et effectuer les réparations", "Assurer le suivi des interventions et la traçabilité", "Veiller au respect des normes de sécurité"],
    profil: ["CAP/BEP en maintenance du bâtiment", "Polyvalence en corps d'état secondaires", "Permis B obligatoire"],
    candidature: "Postuler sur nantes.fr/recrutement",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-06',
  },
  {
    id: 6, slug: 'bibliothecaire-bordeaux-33',
    title: 'Bibliothécaire', employer: 'Médiathèque intercommunale de Bordeaux',
    location: 'Bordeaux', department: '33', departmentName: 'Gironde',
    region: 'Nouvelle-Aquitaine', categorie: 'A', filiere: 'Culturelle',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: false,
    description: "La Médiathèque intercommunale de Bordeaux recrute un bibliothécaire pour développer les collections et les actions culturelles. Vous contribuerez à la politique documentaire et à la médiation numérique.",
    missions: ["Développer et gérer les collections documentaires", "Organiser des animations et actions culturelles", "Accueillir et conseiller les usagers", "Participer à la médiation numérique"],
    profil: ["Concours de bibliothécaire territorial", "Formation en sciences de l'information", "Goût pour la médiation culturelle et le numérique"],
    candidature: "Candidature via le portail RH de Bordeaux Métropole",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-05',
  },
  {
    id: 7, slug: 'directeur-general-services-paris-75',
    title: 'Directeur général des services', employer: 'Mairie du 15e arrondissement',
    location: 'Paris', department: '75', departmentName: 'Paris',
    region: 'Île-de-France', categorie: 'A', filiere: 'Administrative',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: false,
    description: "La Mairie du 15e arrondissement de Paris recherche son DGS pour piloter l'ensemble des services municipaux. Poste stratégique à forte responsabilité managériale et décisionnelle.",
    missions: ["Piloter l'ensemble des services de la mairie d'arrondissement", "Conseiller les élus et préparer les décisions du conseil", "Manager les cadres et coordonner les projets transversaux", "Assurer la gestion budgétaire et administrative"],
    profil: ["Administrateur territorial ou équivalent", "Expérience significative en direction générale", "Leadership et capacité de négociation"],
    candidature: "Envoyer CV et lettre de motivation à dgs@mairie15.paris.fr",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-05',
  },
  {
    id: 8, slug: 'animateur-territorial-rennes-35',
    title: 'Animateur territorial', employer: 'Ville de Rennes',
    location: 'Rennes', department: '35', departmentName: 'Ille-et-Vilaine',
    region: 'Bretagne', categorie: 'B', filiere: 'Animation',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: true,
    description: "La Ville de Rennes recrute un animateur territorial pour développer les activités périscolaires et de loisirs. Vous serez responsable d'un accueil de loisirs et encadrerez une équipe d'animateurs.",
    missions: ["Concevoir et mettre en œuvre le projet pédagogique", "Encadrer une équipe de 6 animateurs", "Organiser les activités périscolaires et extrascolaires", "Assurer la relation avec les familles et les partenaires"],
    profil: ["BPJEPS Animation sociale ou équivalent", "Expérience en direction d'accueil de loisirs", "Créativité et sens du travail en équipe"],
    candidature: "Postuler sur metropole.rennes.fr/emploi",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-04',
  },
  {
    id: 9, slug: 'infirmier-territorial-lille-59',
    title: 'Infirmier territorial', employer: 'Centre de santé municipal de Lille',
    location: 'Lille', department: '59', departmentName: 'Nord',
    region: 'Hauts-de-France', categorie: 'B', filiere: 'Médico-sociale',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: true,
    description: "Le Centre de santé municipal de Lille recrute un infirmier territorial pour renforcer son équipe soignante. Vous assurerez les soins infirmiers et participerez aux actions de prévention santé.",
    missions: ["Réaliser les soins infirmiers prescrits", "Participer aux campagnes de vaccination et dépistage", "Assurer le suivi des patients chroniques", "Contribuer à l'éducation thérapeutique"],
    profil: ["Diplôme d'État infirmier", "Inscription à l'Ordre des infirmiers", "Sens de l'écoute et du travail en équipe"],
    candidature: "Envoyer candidature à recrutement@mairie-lille.fr",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-04',
  },
  {
    id: 10, slug: 'technicien-informatique-strasbourg-67',
    title: 'Technicien informatique', employer: 'Eurométropole de Strasbourg',
    location: 'Strasbourg', department: '67', departmentName: 'Bas-Rhin',
    region: 'Grand Est', categorie: 'B', filiere: 'Technique',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: true,
    description: "L'Eurométropole de Strasbourg recherche un technicien informatique pour son service numérique. Vous assurerez le support utilisateur, la maintenance du parc et le déploiement de nouvelles solutions.",
    missions: ["Assurer le support technique de niveau 2", "Administrer et maintenir le parc informatique", "Déployer les nouvelles applications métier", "Rédiger la documentation technique"],
    profil: ["BTS ou DUT informatique", "Connaissance des environnements Windows et Linux", "Certifications ITIL appréciées"],
    candidature: "Candidature en ligne sur strasbourg.eu/emploi",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-03',
  },
  {
    id: 11, slug: 'charge-communication-montpellier-34',
    title: 'Chargé de communication', employer: 'Montpellier Méditerranée Métropole',
    location: 'Montpellier', department: '34', departmentName: 'Hérault',
    region: 'Occitanie', categorie: 'A', filiere: 'Administrative',
    typeEmploi: 'Contractuel', tempsTravail: 'Temps complet', ouvertContractuels: true,
    description: "Montpellier Méditerranée Métropole recrute un chargé de communication pour concevoir et déployer la stratégie de communication institutionnelle. Poste créatif au cœur de la direction de la communication.",
    missions: ["Concevoir les supports de communication print et digital", "Gérer les réseaux sociaux institutionnels", "Organiser les événements et conférences de presse", "Coordonner les prestataires graphiques et vidéo"],
    profil: ["Master en communication ou journalisme", "Maîtrise de la suite Adobe et des CMS", "Excellentes capacités rédactionnelles"],
    candidature: "Postuler via montpellier3m.fr/recrutement",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-03',
  },
  {
    id: 12, slug: 'agent-accueil-nice-06',
    title: 'Agent d\'accueil', employer: 'Mairie de Nice',
    location: 'Nice', department: '06', departmentName: 'Alpes-Maritimes',
    region: 'Provence-Alpes-Côte d\'Azur', categorie: 'C', filiere: 'Administrative',
    typeEmploi: 'Contractuel', tempsTravail: 'Temps partiel', ouvertContractuels: true,
    description: "La Mairie de Nice recrute un agent d'accueil pour ses services à la population. Vous serez le premier contact des usagers et assurerez leur orientation vers les services compétents.",
    missions: ["Accueillir et orienter les usagers", "Répondre aux demandes d'information par téléphone et en présentiel", "Gérer les rendez-vous et plannings", "Distribuer les documents administratifs"],
    profil: ["Niveau Bac souhaité", "Aisance relationnelle", "Maîtrise de l'outil informatique"],
    candidature: "Envoyer CV à emploi@ville-nice.fr",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-02',
  },
  {
    id: 13, slug: 'educateur-activites-physiques-sportives-dijon-21',
    title: 'Éducateur des activités physiques et sportives', employer: 'Ville de Dijon',
    location: 'Dijon', department: '21', departmentName: 'Côte-d\'Or',
    region: 'Bourgogne-Franche-Comté', categorie: 'B', filiere: 'Sportive',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: false,
    description: "La Ville de Dijon recrute un ETAPS pour encadrer les activités sportives municipales. Vous interviendrez dans les écoles, les centres de loisirs et les équipements sportifs de la ville.",
    missions: ["Encadrer les activités sportives scolaires et périscolaires", "Concevoir des cycles d'apprentissage adaptés", "Gérer les équipements sportifs municipaux", "Organiser les manifestations sportives"],
    profil: ["Concours d'ETAPS ou équivalent", "BEESAN, BPJEPS ou licence STAPS", "Polyvalence sportive et pédagogique"],
    candidature: "Candidature sur dijon.fr/emploi",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-02',
  },
  {
    id: 14, slug: 'gestionnaire-rh-rouen-76',
    title: 'Gestionnaire ressources humaines', employer: 'Métropole Rouen Normandie',
    location: 'Rouen', department: '76', departmentName: 'Seine-Maritime',
    region: 'Normandie', categorie: 'B', filiere: 'Administrative',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: true,
    description: "La Métropole Rouen Normandie recherche un gestionnaire RH pour assurer la gestion administrative et la paie d'un portefeuille de 200 agents. Poste au sein de la DRH mutualisée.",
    missions: ["Gérer la carrière et la paie d'un portefeuille d'agents", "Établir les actes administratifs (arrêtés, contrats)", "Conseiller les agents et les managers sur le statut", "Assurer la veille réglementaire statutaire"],
    profil: ["Formation en RH ou droit public", "Connaissance du statut de la FPT", "Maîtrise d'un logiciel de paie (CIRIL, SEDIT)"],
    candidature: "Postuler via metropole-rouen-normandie.fr",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-01',
  },
  {
    id: 15, slug: 'auxiliaire-puericulture-tours-37',
    title: 'Auxiliaire de puériculture', employer: 'Ville de Tours',
    location: 'Tours', department: '37', departmentName: 'Indre-et-Loire',
    region: 'Centre-Val de Loire', categorie: 'C', filiere: 'Médico-sociale',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: true,
    description: "La Ville de Tours recrute une auxiliaire de puériculture pour sa crèche municipale Les Petits Explorateurs. Vous accompagnerez les enfants de 3 mois à 3 ans dans leur développement.",
    missions: ["Assurer les soins quotidiens aux enfants", "Proposer des activités d'éveil adaptées à l'âge", "Accompagner les repas et les temps de repos", "Communiquer avec les familles sur le suivi de l'enfant"],
    profil: ["Diplôme d'État d'auxiliaire de puériculture", "Connaissance du développement de l'enfant", "Patience et bienveillance"],
    candidature: "Envoyer candidature à petite-enfance@tours.fr",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-03-01',
  },
  {
    id: 16, slug: 'ingenieur-territorial-voirie-clermont-ferrand-63',
    title: 'Ingénieur territorial voirie et réseaux', employer: 'Clermont Auvergne Métropole',
    location: 'Clermont-Ferrand', department: '63', departmentName: 'Puy-de-Dôme',
    region: 'Auvergne-Rhône-Alpes', categorie: 'A', filiere: 'Technique',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: true,
    description: "Clermont Auvergne Métropole recrute un ingénieur territorial spécialisé en voirie et réseaux divers. Vous piloterez les projets d'aménagement routier et superviserez les chantiers.",
    missions: ["Piloter les études et projets d'aménagement de voirie", "Superviser les chantiers et contrôler la qualité", "Rédiger les pièces techniques des marchés publics", "Coordonner les concessionnaires de réseaux"],
    profil: ["Ingénieur territorial ou diplôme d'ingénieur TP/GC", "Expérience en maîtrise d'œuvre VRD", "Maîtrise d'AutoCAD et des logiciels de conception"],
    candidature: "Candidature sur clermontmetropole.eu/emploi",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-02-28',
  },
  {
    id: 17, slug: 'sapeur-pompier-professionnel-ajaccio-2a',
    title: 'Sapeur-pompier professionnel', employer: 'SDIS de Corse-du-Sud',
    location: 'Ajaccio', department: '2A', departmentName: 'Corse-du-Sud',
    region: 'Corse', categorie: 'C', filiere: 'Sapeurs-pompiers',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: false,
    description: "Le SDIS de Corse-du-Sud recrute un sapeur-pompier professionnel par voie de concours. Vous intégrerez le centre de secours principal d'Ajaccio pour assurer les missions de secours.",
    missions: ["Assurer les interventions de secours à personnes", "Participer à la lutte contre les incendies", "Réaliser les opérations de secours routier", "Maintenir sa condition physique et ses compétences"],
    profil: ["Concours de sapeur-pompier professionnel", "Excellente condition physique", "Permis B obligatoire, permis PL souhaité"],
    candidature: "Inscription au concours sur sdis2a.fr",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-02-28',
  },
  {
    id: 18, slug: 'redacteur-territorial-metz-57',
    title: 'Rédacteur territorial', employer: 'Ville de Metz',
    location: 'Metz', department: '57', departmentName: 'Moselle',
    region: 'Grand Est', categorie: 'B', filiere: 'Administrative',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: true,
    description: "La Ville de Metz recrute un rédacteur territorial pour son service finances. Vous serez en charge de l'exécution budgétaire et du suivi comptable des dépenses et recettes.",
    missions: ["Assurer l'exécution budgétaire des services", "Contrôler les engagements et mandatements", "Suivre les subventions et les recettes", "Participer à la préparation budgétaire annuelle"],
    profil: ["Cadre d'emplois des rédacteurs territoriaux", "Formation en finances publiques ou comptabilité", "Connaissance des règles de la comptabilité M57"],
    candidature: "Postuler sur metz.fr/emploi",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-02-27',
  },
  {
    id: 19, slug: 'atsem-grenoble-38',
    title: 'ATSEM', employer: 'Ville de Grenoble',
    location: 'Grenoble', department: '38', departmentName: 'Isère',
    region: 'Auvergne-Rhône-Alpes', categorie: 'C', filiere: 'Médico-sociale',
    typeEmploi: 'Titulaire', tempsTravail: 'Temps complet', ouvertContractuels: false,
    description: "La Ville de Grenoble recrute un ATSEM pour accompagner les enseignants de maternelle. Vous assisterez l'équipe pédagogique et veillerez à l'hygiène et à la sécurité des enfants.",
    missions: ["Assister l'enseignant dans les activités pédagogiques", "Assurer l'hygiène et la propreté des locaux", "Accompagner les enfants lors des repas et de la sieste", "Préparer le matériel pour les activités"],
    profil: ["Concours d'ATSEM ou CAP Petite Enfance", "Expérience auprès de jeunes enfants", "Patience et sens de l'observation"],
    candidature: "Candidature sur grenoble.fr/emplois",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-02-27',
  },
  {
    id: 20, slug: 'archiviste-orleans-45',
    title: 'Archiviste', employer: 'Archives départementales du Loiret',
    location: 'Orléans', department: '45', departmentName: 'Loiret',
    region: 'Centre-Val de Loire', categorie: 'A', filiere: 'Culturelle',
    typeEmploi: 'Contractuel', tempsTravail: 'Temps complet', ouvertContractuels: true,
    description: "Les Archives départementales du Loiret recrutent un archiviste pour la collecte, le classement et la valorisation des fonds d'archives publiques et privées du département.",
    missions: ["Collecter et classer les fonds d'archives", "Réaliser les instruments de recherche", "Accueillir et orienter les chercheurs en salle de lecture", "Participer à la numérisation et à la mise en ligne des fonds"],
    profil: ["Master en archivistique ou sciences de l'information", "Connaissance des normes ISAD(G) et EAD", "Rigueur et méthode"],
    candidature: "Envoyer candidature à archives@loiret.fr",
    sourceUrl: 'https://emploi-territorial.fr', publishedAt: '2026-02-26',
  },
];

export function generateSlug(title: string, location: string, department: string): string {
  return `${title}-${location}-${department}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getOffres(): Offre[] {
  return mockOffres;
}

export function getOffreBySlug(slug: string): Offre | undefined {
  return mockOffres.find((o) => o.slug === slug);
}

export interface FiltresOffres {
  q?: string;
  dept?: string;
  region?: string;
  categorie?: string;
  filiere?: string;
  typeEmploi?: string;
  tempsTravail?: string;
  contractuels?: string;
  tri?: 'date' | 'pertinence';
  page?: number;
}

export function filtrerOffres(filtres: FiltresOffres): { offres: Offre[]; total: number } {
  let result = [...mockOffres];

  if (filtres.q) {
    const q = filtres.q.toLowerCase();
    result = result.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.employer.toLowerCase().includes(q) ||
        o.location.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q)
    );
  }

  if (filtres.dept) {
    result = result.filter((o) => o.department === filtres.dept);
  }

  if (filtres.region) {
    const depts = REGIONS[filtres.region];
    if (depts) {
      result = result.filter((o) => depts.includes(o.department));
    }
  }

  if (filtres.categorie) {
    result = result.filter((o) => o.categorie === filtres.categorie);
  }

  if (filtres.filiere) {
    result = result.filter((o) => o.filiere === filtres.filiere);
  }

  if (filtres.typeEmploi) {
    result = result.filter((o) => o.typeEmploi === filtres.typeEmploi);
  }

  if (filtres.tempsTravail) {
    result = result.filter((o) => o.tempsTravail === filtres.tempsTravail);
  }

  if (filtres.contractuels === 'oui') {
    result = result.filter((o) => o.ouvertContractuels);
  }

  // Sort
  if (filtres.tri === 'pertinence' && filtres.q) {
    const q = filtres.q.toLowerCase();
    result.sort((a, b) => {
      const scoreA = (a.title.toLowerCase().includes(q) ? 10 : 0) + (a.employer.toLowerCase().includes(q) ? 5 : 0);
      const scoreB = (b.title.toLowerCase().includes(q) ? 10 : 0) + (b.employer.toLowerCase().includes(q) ? 5 : 0);
      return scoreB - scoreA;
    });
  } else {
    result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  const total = result.length;
  const page = filtres.page || 1;
  const perPage = 20;
  const start = (page - 1) * perPage;
  result = result.slice(start, start + perPage);

  return { offres: result, total };
}

export function compterParFiltre(offres: Offre[]) {
  const compteurs = {
    categorie: {} as Record<string, number>,
    filiere: {} as Record<string, number>,
    typeEmploi: {} as Record<string, number>,
    tempsTravail: {} as Record<string, number>,
    contractuels: { oui: 0, non: 0 },
  };

  for (const o of offres) {
    compteurs.categorie[o.categorie] = (compteurs.categorie[o.categorie] || 0) + 1;
    compteurs.filiere[o.filiere] = (compteurs.filiere[o.filiere] || 0) + 1;
    compteurs.typeEmploi[o.typeEmploi] = (compteurs.typeEmploi[o.typeEmploi] || 0) + 1;
    compteurs.tempsTravail[o.tempsTravail] = (compteurs.tempsTravail[o.tempsTravail] || 0) + 1;
    if (o.ouvertContractuels) compteurs.contractuels.oui++;
    else compteurs.contractuels.non++;
  }

  return compteurs;
}

export function getOffresSimilaires(offre: Offre, limit = 3): Offre[] {
  return mockOffres
    .filter(
      (o) =>
        o.id !== offre.id &&
        (o.department === offre.department || o.filiere === offre.filiere)
    )
    .slice(0, limit);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
}
