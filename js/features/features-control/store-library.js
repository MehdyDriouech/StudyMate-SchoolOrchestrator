/**
 * Store de bibliothèque - Gestion des ressources de contenu validées/publiées
 * Permet de parcourir, rechercher, noter et importer des contenus
 */

// Données mockées pour la bibliothèque
const libraryStore = {
  resources: [
    {
      id: "theme_suites_001",
      title: "Suites numériques",
      description: "Introduction aux suites arithmétiques et géométriques, avec exercices pratiques et applications concrètes.",
      subject: "Mathématiques",
      level: "Terminale",
      tags: ["analyse", "arithmétique", "suites"],
      status: "published",
      isInLibrary: true,
      formats: ["quiz", "flashcards", "revision_sheet"],
      avgRating: 4.6,
      ratingsCount: 18,
      usageCount: 32,
      createdAt: "2024-10-15T10:00:00Z",
      author: "Prof. Martin",
      origin: "ai_theme_studio",
      quiz: [
        {
          id: "q1",
          prompt: "Qu'est-ce qu'une suite arithmétique ?",
          choices: ["Une suite où chaque terme est obtenu en ajoutant une constante", "Une suite où chaque terme est obtenu en multipliant par une constante", "Une suite infinie", "Une suite décroissante"],
          answer: 0
        },
        {
          id: "q2",
          prompt: "Quelle est la formule de récurrence d'une suite arithmétique de raison r ?",
          choices: ["u(n+1) = u(n) + r", "u(n+1) = u(n) * r", "u(n+1) = u(n) - r", "u(n+1) = u(n) / r"],
          answer: 0
        }
      ],
      flashcards: [
        {
          id: "fc1",
          front: "Suite arithmétique",
          back: "Suite où chaque terme est obtenu en ajoutant une constante (la raison) au terme précédent."
        },
        {
          id: "fc2",
          front: "Suite géométrique",
          back: "Suite où chaque terme est obtenu en multipliant le terme précédent par une constante (la raison)."
        }
      ],
      revision_sheet: {
        blocks: [
          { id: "rev1", type: "title", text: "Suites numériques - Résumé" },
          { id: "rev2", type: "paragraph", text: "Les suites numériques sont des listes ordonnées de nombres. On distingue principalement les suites arithmétiques et géométriques." }
        ]
      },
      comments: [
        {
          id: "c1",
          authorRole: "teacher",
          authorName: "Mme Martin",
          rating: 5,
          comment: "Très bon support pour introduire le chapitre. Les exercices sont bien calibrés.",
          createdAt: "2024-11-01T10:15:00Z"
        },
        {
          id: "c2",
          authorRole: "pedago",
          authorName: "Référent pédagogique",
          rating: 4,
          comment: "Contenu solide, pourrait bénéficier de plus d'exemples concrets.",
          createdAt: "2024-11-05T14:30:00Z"
        }
      ]
    },
    {
      id: "theme_derivation_002",
      title: "Dérivation et applications",
      description: "Notions de dérivée, règles de dérivation, étude de fonctions et applications pratiques.",
      subject: "Mathématiques",
      level: "Terminale",
      tags: ["analyse", "dérivation", "fonctions"],
      status: "published",
      isInLibrary: true,
      formats: ["quiz", "revision_sheet"],
      avgRating: 4.8,
      ratingsCount: 25,
      usageCount: 45,
      createdAt: "2024-10-20T09:00:00Z",
      author: "Prof. Dubois",
      origin: "ai_theme_studio",
      quiz: [
        {
          id: "q1",
          prompt: "Quelle est la dérivée de f(x) = x² ?",
          choices: ["2x", "x", "2x²", "x²"],
          answer: 0
        }
      ],
      flashcards: [],
      revision_sheet: {
        blocks: [
          { id: "rev1", type: "title", text: "Dérivation" },
          { id: "rev2", type: "paragraph", text: "La dérivée d'une fonction mesure le taux de variation instantané." }
        ]
      },
      comments: [
        {
          id: "c1",
          authorRole: "teacher",
          authorName: "Prof. Bernard",
          rating: 5,
          comment: "Excellent contenu, très complet.",
          createdAt: "2024-11-10T11:00:00Z"
        }
      ]
    },
    {
      id: "theme_conscience_003",
      title: "La conscience",
      description: "Introduction à la philosophie de la conscience, approches classiques et contemporaines.",
      subject: "Philosophie",
      level: "Terminale",
      tags: ["philosophie", "conscience", "psychologie"],
      status: "published",
      isInLibrary: true,
      formats: ["quiz", "flashcards"],
      avgRating: 4.3,
      ratingsCount: 12,
      usageCount: 28,
      createdAt: "2024-10-25T14:00:00Z",
      author: "Prof. Rousseau",
      origin: "ai_theme_studio",
      quiz: [
        {
          id: "q1",
          prompt: "Qu'est-ce que la conscience selon Descartes ?",
          choices: ["Je pense donc je suis", "L'être en soi", "La perception", "L'inconscient"],
          answer: 0
        }
      ],
      flashcards: [
        {
          id: "fc1",
          front: "Cogito ergo sum",
          back: "Je pense donc je suis - principe fondamental de la philosophie cartésienne."
        }
      ],
      revision_sheet: {
        blocks: []
      },
      comments: []
    },
    {
      id: "theme_guerre_froide_004",
      title: "La Guerre Froide",
      description: "Conflit idéologique entre les États-Unis et l'URSS de 1947 à 1991, événements clés et conséquences.",
      subject: "Histoire-Géographie",
      level: "Terminale",
      tags: ["histoire", "guerre froide", "XXe siècle"],
      status: "published",
      isInLibrary: true,
      formats: ["quiz", "flashcards", "revision_sheet"],
      avgRating: 4.5,
      ratingsCount: 20,
      usageCount: 38,
      createdAt: "2024-10-30T10:30:00Z",
      author: "Prof. Durand",
      origin: "ai_theme_studio",
      quiz: [
        {
          id: "q1",
          prompt: "Quand a commencé la Guerre Froide ?",
          choices: ["1945", "1947", "1950", "1960"],
          answer: 1
        }
      ],
      flashcards: [
        {
          id: "fc1",
          front: "Doctrine Truman",
          back: "Politique américaine de containment visant à endiguer l'expansion du communisme."
        }
      ],
      revision_sheet: {
        blocks: [
          { id: "rev1", type: "title", text: "La Guerre Froide (1947-1991)" },
          { id: "rev2", type: "paragraph", text: "Conflit idéologique entre les deux superpuissances sans affrontement direct majeur." }
        ]
      },
      comments: [
        {
          id: "c1",
          authorRole: "teacher",
          authorName: "Prof. Martin",
          rating: 4,
          comment: "Bon contenu, bien structuré.",
          createdAt: "2024-11-08T09:20:00Z"
        }
      ]
    },
    {
      id: "theme_probabilites_005",
      title: "Probabilités conditionnelles",
      description: "Introduction aux probabilités conditionnelles, formule de Bayes et applications.",
      subject: "Mathématiques",
      level: "Première",
      tags: ["probabilités", "statistiques"],
      status: "published",
      isInLibrary: true,
      formats: ["quiz", "flashcards"],
      avgRating: 4.2,
      ratingsCount: 15,
      usageCount: 22,
      createdAt: "2024-11-01T08:00:00Z",
      author: "Prof. Petit",
      origin: "ai_theme_studio",
      quiz: [
        {
          id: "q1",
          prompt: "Qu'est-ce qu'une probabilité conditionnelle ?",
          choices: ["P(A|B) = P(A et B) / P(B)", "P(A|B) = P(A) * P(B)", "P(A|B) = P(A) + P(B)", "P(A|B) = P(A) - P(B)"],
          answer: 0
        }
      ],
      flashcards: [],
      revision_sheet: {
        blocks: []
      },
      comments: []
    }
  ]
};

/**
 * Retourne tous les ressources de la bibliothèque
 * @returns {Array}
 */
export function getAllResources() {
  return [...libraryStore.resources];
}

/**
 * Recherche et filtre les ressources
 * @param {object} filters - Filtres de recherche
 * @param {string} filters.text - Texte de recherche
 * @param {string} filters.subject - Matière
 * @param {string} filters.level - Niveau
 * @param {string} filters.format - Type de contenu (quiz, flashcards, revision_sheet)
 * @returns {Array}
 */
export function searchResources(filters = {}) {
  let results = [...libraryStore.resources];
  
  // Filtre par texte
  if (filters.text && filters.text.trim()) {
    const searchText = filters.text.toLowerCase();
    results = results.filter(resource => 
      resource.title.toLowerCase().includes(searchText) ||
      resource.description.toLowerCase().includes(searchText) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchText))
    );
  }
  
  // Filtre par matière
  if (filters.subject) {
    results = results.filter(resource => resource.subject === filters.subject);
  }
  
  // Filtre par niveau
  if (filters.level) {
    results = results.filter(resource => resource.level === filters.level);
  }
  
  // Filtre par format
  if (filters.format) {
    results = results.filter(resource => resource.formats.includes(filters.format));
  }
  
  return results;
}

/**
 * Retourne une ressource par son ID
 * @param {string} id - ID de la ressource
 * @returns {object|null}
 */
export function getResourceById(id) {
  return libraryStore.resources.find(r => r.id === id) || null;
}

/**
 * Note et commente une ressource
 * @param {string} id - ID de la ressource
 * @param {number} rating - Note (1-5)
 * @param {string} comment - Commentaire
 * @param {object} contextUser - Utilisateur courant { userId, displayName, role }
 * @returns {object}
 */
export function rateResource(id, rating, comment, contextUser) {
  const resource = getResourceById(id);
  if (!resource) {
    throw new Error(`Ressource ${id} introuvable`);
  }
  
  if (rating < 1 || rating > 5) {
    throw new Error('La note doit être entre 1 et 5');
  }
  
  // Ajouter le commentaire
  const newComment = {
    id: `comment_${Date.now()}`,
    authorRole: contextUser.role || 'teacher',
    authorName: contextUser.displayName || 'Utilisateur',
    rating: rating,
    comment: comment || '',
    createdAt: new Date().toISOString()
  };
  
  resource.comments.push(newComment);
  
  // Recalculer la moyenne et le nombre d'avis
  const allRatings = resource.comments.map(c => c.rating);
  resource.avgRating = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
  resource.ratingsCount = allRatings.length;
  
  console.log('[Store Library] ✅ Ressource notée:', id, 'Note:', rating);
  
  return {
    success: true,
    resource: { ...resource },
    comment: newComment
  };
}

/**
 * Importe une ressource dans le curriculum
 * @param {object} params - Paramètres d'import
 * @param {string} params.resourceId - ID de la ressource
 * @param {string} params.classId - ID de la classe
 * @param {string} params.period - ID de la période
 * @returns {object}
 */
export function importResourceToCurriculum({ resourceId, classId, period }) {
  const resource = getResourceById(resourceId);
  if (!resource) {
    throw new Error(`Ressource ${resourceId} introuvable`);
  }
  
  // Incrémenter le compteur d'utilisation
  resource.usageCount = (resource.usageCount || 0) + 1;
  
  console.log('[Store Library] ✅ Ressource importée dans curriculum:', resourceId, 'Classe:', classId, 'Période:', period);
  
  return {
    success: true,
    message: `Contenu "${resource.title}" importé dans le curriculum (démo)`,
    resource: { ...resource }
  };
}

/**
 * Importe une ressource dans AI Theme Studio
 * @param {string} resourceId - ID de la ressource
 * @returns {object}
 */
export function importResourceToAIStudio(resourceId) {
  const resource = getResourceById(resourceId);
  if (!resource) {
    throw new Error(`Ressource ${resourceId} introuvable`);
  }
  
  // Convertir la ressource en format thème pour AI Studio
  const theme = {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    classes: [], // Sera rempli par l'utilisateur
    contentTypes: {
      quiz: resource.formats.includes('quiz'),
      flashcards: resource.formats.includes('flashcards'),
      revision_sheet: resource.formats.includes('revision_sheet')
    },
    quiz: resource.quiz || [],
    flashcards: resource.flashcards || [],
    revision_sheet: resource.revision_sheet || { blocks: [] },
    status: 'demo',
    origin: 'library_import',
    importedAt: new Date().toISOString()
  };
  
  console.log('[Store Library] ✅ Ressource importée dans AI Studio:', resourceId);
  
  return {
    success: true,
    theme: theme,
    message: `Contenu "${resource.title}" importé dans AI Theme Studio (démo)`
  };
}

/**
 * Retourne les matières disponibles
 * @returns {Array<string>}
 */
export function getAvailableSubjects() {
  const subjects = new Set();
  libraryStore.resources.forEach(r => {
    if (r.subject) subjects.add(r.subject);
  });
  return Array.from(subjects).sort();
}

/**
 * Retourne les niveaux disponibles
 * @returns {Array<string>}
 */
export function getAvailableLevels() {
  const levels = new Set();
  libraryStore.resources.forEach(r => {
    if (r.level) levels.add(r.level);
  });
  return Array.from(levels).sort();
}

export default {
  getAllResources,
  searchResources,
  getResourceById,
  rateResource,
  importResourceToCurriculum,
  importResourceToAIStudio,
  getAvailableSubjects,
  getAvailableLevels
};

