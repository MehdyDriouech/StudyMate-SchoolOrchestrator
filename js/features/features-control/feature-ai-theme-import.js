/**
 * Feature AI Theme Import - Logique métier pour l'import de PDF et génération de thème (mode démo)
 */

import { setLastImportedFileName, setLastExtractionText, setLastGeneratedThemeId } from './store-ai-theme-studio.js';
import { setCurrentTheme } from './feature-ai-theme-studio.js';
import ActivityTimelineStore from './store-timeline.js';
import { getCurrentUser } from './feature-auth.js';
import { navigateTo } from '../../app.js';

/**
 * Génère un texte d'extraction fake basé sur le nom du fichier PDF
 * @param {string} fileName - Nom du fichier PDF
 * @returns {string}
 */
function generateFakeExtraction(fileName) {
  // Nettoyer le nom du fichier (enlever l'extension)
  const cleanName = fileName.replace(/\.pdf$/i, '').trim();
  
  // Générer un texte fake basé sur le nom
  // Exemple: "Derivees_Sujets_2024.pdf" -> "Ce PDF contient des exercices sur les dérivées..."
  const keywords = extractKeywords(cleanName);
  
  if (keywords.length === 0) {
    return `Ce PDF contient du contenu pédagogique. Les informations extraites indiquent qu'il s'agit d'un document éducatif avec des exercices et des explications sur le sujet abordé.`;
  }
  
  const subject = keywords.subject || 'mathématiques';
  const topic = keywords.topic || cleanName;
  const year = keywords.year || '2024';
  
  return `Ce PDF contient des exercices et des sujets sur ${topic} en ${subject}. Le document inclut des problèmes pratiques, des explications théoriques et des applications concrètes. Les sujets abordés couvrent les notions fondamentales nécessaires à la compréhension et à la maîtrise de ${topic}. Le contenu est adapté pour l'année ${year} et suit le programme en vigueur.`;
}

/**
 * Extrait des mots-clés du nom de fichier
 * @param {string} fileName - Nom du fichier
 * @returns {object}
 */
function extractKeywords(fileName) {
  const keywords = {
    subject: null,
    topic: null,
    year: null
  };
  
  // Matières courantes
  const subjects = {
    'math': 'mathématiques',
    'maths': 'mathématiques',
    'mathematique': 'mathématiques',
    'physique': 'physique',
    'chimie': 'chimie',
    'svt': 'SVT',
    'biologie': 'SVT',
    'histoire': 'histoire',
    'geo': 'géographie',
    'geographie': 'géographie',
    'francais': 'français',
    'anglais': 'anglais',
    'espagnol': 'espagnol',
    'philo': 'philosophie',
    'philosophie': 'philosophie'
  };
  
  // Sujets mathématiques courants
  const mathTopics = {
    'derivee': 'les dérivées',
    'derivees': 'les dérivées',
    'limite': 'les limites',
    'limites': 'les limites',
    'suites': 'les suites numériques',
    'fonction': 'les fonctions',
    'integral': 'les intégrales',
    'trigono': 'la trigonométrie',
    'geometrie': 'la géométrie',
    'algebre': 'l\'algèbre',
    'probabilite': 'les probabilités'
  };
  
  const lowerName = fileName.toLowerCase();
  
  // Chercher la matière
  for (const [key, value] of Object.entries(subjects)) {
    if (lowerName.includes(key)) {
      keywords.subject = value;
      break;
    }
  }
  
  // Chercher le sujet (mathématiques)
  if (keywords.subject === 'mathématiques') {
    for (const [key, value] of Object.entries(mathTopics)) {
      if (lowerName.includes(key)) {
        keywords.topic = value;
        break;
      }
    }
  }
  
  // Si pas de sujet trouvé, essayer d'extraire quelque chose du nom
  if (!keywords.topic) {
    // Enlever les mots communs
    const words = lowerName.split(/[_\-\s]+/).filter(w => 
      !['pdf', 'sujet', 'sujets', 'exercice', 'exercices', 'devoir', 'devoirs', '2024', '2023', '2025'].includes(w)
    );
    if (words.length > 0) {
      keywords.topic = words[0];
    }
  }
  
  // Chercher l'année
  const yearMatch = lowerName.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    keywords.year = yearMatch[1];
  }
  
  return keywords;
}

/**
 * Génère un thème fake à partir du nom du fichier PDF
 * @param {string} fileName - Nom du fichier PDF
 * @param {string} extractionText - Texte d'extraction (fake)
 * @returns {object}
 */
function generateThemeFromPDF(fileName, extractionText) {
  const cleanName = fileName.replace(/\.pdf$/i, '').trim();
  const keywords = extractKeywords(cleanName);
  
  // Générer un titre
  let title = cleanName;
  if (keywords.topic && keywords.subject) {
    title = `${capitalizeFirst(keywords.topic.replace(/^les?\s+|^la\s+|^l['']/, ''))} — ${keywords.subject}`;
  } else if (keywords.topic) {
    title = capitalizeFirst(keywords.topic.replace(/^les?\s+|^la\s+|^l['']/, ''));
  }
  
  // Générer un ID unique
  const themeId = `theme_pdf_${Date.now()}`;
  
  // Générer des questions fake
  const quiz = generateFakeQuiz(keywords);
  const flashcards = generateFakeFlashcards(keywords);
  const revisionSheet = generateFakeRevisionSheet(keywords);
  
  const theme = {
    id: themeId,
    title: title,
    description: `Thème généré automatiquement depuis le PDF "${fileName}". ${extractionText}`,
    type: 'quiz',
    quiz: quiz,
    flashcards: flashcards,
    revision_sheet: revisionSheet,
    tags: keywords.subject ? [keywords.subject.toLowerCase(), keywords.topic ? keywords.topic.replace(/^les?\s+|^la\s+|^l['']/, '').toLowerCase() : 'pdf'] : ['pdf'],
    status: 'draft',
    source: 'pdf',
    sourceFileName: fileName,
    generatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    contentTypes: {
      quiz: true,
      flashcards: true,
      revision_sheet: true
    },
    classes: [],
    generatedFromPDF: true
  };
  
  return theme;
}

/**
 * Génère des questions fake pour le quiz
 * @param {object} keywords - Mots-clés extraits
 * @returns {Array}
 */
function generateFakeQuiz(keywords) {
  const topic = keywords.topic || 'le sujet';
  
  return [
    {
      id: `q_pdf_${Date.now()}_1`,
      prompt: `Quelle est la définition principale de ${topic} ?`,
      choices: [
        `Une approche fondamentale de ${topic}`,
        `Une méthode alternative`,
        `Une exception à la règle`,
        `Un cas particulier`
      ],
      answer: 0
    },
    {
      id: `q_pdf_${Date.now()}_2`,
      prompt: `Quels sont les éléments clés à retenir sur ${topic} ?`,
      choices: [
        `Les principes de base et leurs applications`,
        `Seulement la théorie`,
        `Uniquement les exemples`,
        `Aucun élément particulier`
      ],
      answer: 0
    },
    {
      id: `q_pdf_${Date.now()}_3`,
      prompt: `Dans quel contexte ${topic} est-il utilisé ?`,
      choices: [
        `Dans divers contextes pratiques`,
        `Uniquement en théorie`,
        `Jamais`,
        `Seulement dans des cas rares`
      ],
      answer: 0
    }
  ];
}

/**
 * Génère des flashcards fake
 * @param {object} keywords - Mots-clés extraits
 * @returns {Array}
 */
function generateFakeFlashcards(keywords) {
  const topic = keywords.topic || 'le sujet';
  
  return [
    {
      id: `fc_pdf_${Date.now()}_1`,
      front: `Qu'est-ce que ${topic} ?`,
      back: `${capitalizeFirst(topic)} est un concept important abordé dans le PDF. Il s'agit d'une notion fondamentale nécessitant une compréhension approfondie pour maîtriser le sujet.`
    },
    {
      id: `fc_pdf_${Date.now()}_2`,
      front: `Applications de ${topic}`,
      back: `Les applications de ${topic} sont nombreuses et variées. Elles permettent de résoudre des problèmes pratiques et de comprendre des concepts plus complexes.`
    }
  ];
}

/**
 * Génère une fiche de révision fake
 * @param {object} keywords - Mots-clés extraits
 * @returns {object}
 */
function generateFakeRevisionSheet(keywords) {
  const topic = keywords.topic || 'le sujet';
  const subject = keywords.subject || 'la matière';
  
  return {
    blocks: [
      {
        id: `rev_pdf_${Date.now()}_title`,
        type: 'title',
        text: `${capitalizeFirst(topic)} — Fiche de révision`
      },
      {
        id: `rev_pdf_${Date.now()}_intro`,
        type: 'paragraph',
        text: `Cette fiche de révision porte sur ${topic} en ${subject}. Elle résume les points essentiels à retenir.`
      },
      {
        id: `rev_pdf_${Date.now()}_content`,
        type: 'paragraph',
        text: `Les notions clés abordées dans le document incluent les concepts fondamentaux, les méthodes de résolution et les applications pratiques de ${topic}. Il est important de comprendre ces éléments pour maîtriser le sujet.`
      }
    ]
  };
}

/**
 * Capitalise la première lettre d'une chaîne
 * @param {string} str - Chaîne à capitaliser
 * @returns {string}
 */
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Simule l'import d'un fichier PDF et l'extraction de son contenu
 * @param {File} file - Fichier PDF
 * @returns {Promise<object>}
 */
export async function importPDF(file) {
  if (!file) {
    throw new Error('Aucun fichier sélectionné');
  }
  
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Le fichier doit être un PDF');
  }
  
  // Simuler un délai d'extraction
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Générer l'extraction fake
  const extractionText = generateFakeExtraction(file.name);
  
  // Sauvegarder dans le store
  setLastImportedFileName(file.name);
  setLastExtractionText(extractionText);
  
  // Logger l'événement
  const currentUser = getCurrentUser();
  if (currentUser) {
    ActivityTimelineStore.logEvent('teacher_imported_pdf', currentUser.email, currentUser.role, {
      fileName: file.name,
      fileSize: file.size
    });
  }
  
  return {
    fileName: file.name,
    fileSize: file.size,
    extractionText: extractionText
  };
}

/**
 * Génère un thème à partir du PDF importé
 * @param {string} fileName - Nom du fichier PDF
 * @param {string} extractionText - Texte d'extraction
 * @returns {object}
 */
export function generateThemeFromPDFImport(fileName, extractionText) {
  // Générer le thème
  const theme = generateThemeFromPDF(fileName, extractionText);
  
  // Définir comme thème courant
  setCurrentTheme(theme);
  
  // Sauvegarder l'ID dans le store
  setLastGeneratedThemeId(theme.id);
  
  // Logger l'événement
  const currentUser = getCurrentUser();
  if (currentUser) {
    ActivityTimelineStore.logEvent('teacher_generated_theme_from_pdf', currentUser.email, currentUser.role, {
      themeId: theme.id,
      themeTitle: theme.title,
      fileName: fileName
    });
  }
  
  return theme;
}

/**
 * Ouvre le thème dans l'éditeur
 * @param {string} themeId - ID du thème
 */
export function openThemeInEditor(themeId) {
  // Pour l'instant, rediriger vers l'AI Theme Studio avec le thème chargé
  // TODO: Implémenter un éditeur de thème dédié
  navigateTo(`teacher-content/studio?tab=manual`);
  
  // Charger le thème dans le store
  // Le thème est déjà chargé via setCurrentTheme dans generateThemeFromPDFImport
}

export default {
  importPDF,
  generateThemeFromPDFImport,
  openThemeInEditor
};

