/**
 * Feature Training - Logique métier pour le mode entraînement élève
 */

import { getThemeById } from './store-themes.js';
import { getResourceById } from './store-library.js';
import { getCurrentUser } from './feature-auth.js';
import ActivityTimelineStore from './store-timeline.js';

// État local de la session d'entraînement
let trainingState = {
  theme: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {}, // { questionId: answer }
  feedbacks: {}, // { questionId: { isCorrect, correctAnswer } }
  startedAt: null
};

/**
 * Initialise une session d'entraînement
 * @returns {object|null}
 */
export function initTrainingSession() {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'student') {
    console.warn('[Training] Aucun étudiant connecté');
    return null;
  }
  
  // Récupérer le themeId depuis l'URL
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const themeId = urlParams.get('themeId');
  
  if (!themeId) {
    console.warn('[Training] Aucun themeId fourni');
    return null;
  }
  
  // Charger le thème (chercher dans store-themes puis dans library)
  let theme = getThemeById(themeId);
  if (!theme) {
    // Essayer dans la bibliothèque
    const libraryResource = getResourceById(themeId);
    if (libraryResource) {
      theme = libraryResource;
    }
  }
  
  if (!theme) {
    console.warn('[Training] Thème introuvable:', themeId);
    return null;
  }
  
  // Extraire les questions du thème
  let questions = theme.questions || [];
  
  // Si pas de questions mais des quiz, convertir
  if (questions.length === 0 && theme.quiz && theme.quiz.length > 0) {
    questions = theme.quiz.map(q => ({
      id: q.id,
      stem: q.prompt || q.stem || '',
      type: q.choices && q.choices.length > 0 ? 'mcq' : 'open',
      choices: q.choices || [],
      correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : (q.answer !== undefined ? q.answer : null)
    }));
  }
  
  if (questions.length === 0) {
    console.warn('[Training] Aucune question disponible dans le thème');
    return null;
  }
  
  // Initialiser l'état
  trainingState = {
    theme,
    questions,
    currentQuestionIndex: 0,
    answers: {},
    feedbacks: {},
    startedAt: Date.now()
  };
  
  // Logger l'événement de démarrage de session d'entraînement
  ActivityTimelineStore.logEvent('student_training_session', currentUser.email, currentUser.role, {
    themeId: theme.id,
    themeTitle: theme.title,
    questionsCount: questions.length
  });
  
  console.log('[Training] ✅ Session d\'entraînement initialisée:', themeId, questions.length, 'questions');
  
  return trainingState;
}

/**
 * Retourne l'état actuel de la session
 * @returns {object}
 */
export function getTrainingState() {
  return trainingState;
}

/**
 * Retourne la question courante
 * @returns {object|null}
 */
export function getCurrentQuestion() {
  if (!trainingState.questions || trainingState.questions.length === 0) {
    return null;
  }
  
  return trainingState.questions[trainingState.currentQuestionIndex] || null;
}

/**
 * Retourne le nombre total de questions
 * @returns {number}
 */
export function getTotalQuestions() {
  return trainingState.questions ? trainingState.questions.length : 0;
}

/**
 * Retourne l'index de la question courante (1-based)
 * @returns {number}
 */
export function getCurrentQuestionNumber() {
  return trainingState.currentQuestionIndex + 1;
}

/**
 * Vérifie si c'est la dernière question
 * @returns {boolean}
 */
export function isLastQuestion() {
  return trainingState.currentQuestionIndex >= trainingState.questions.length - 1;
}

/**
 * Vérifie si c'est la première question
 * @returns {boolean}
 */
export function isFirstQuestion() {
  return trainingState.currentQuestionIndex === 0;
}

/**
 * Soumet une réponse pour la question courante
 * @param {any} answer - Réponse de l'élève
 * @returns {object} { isCorrect, correctAnswer }
 */
export function submitAnswer(answer) {
  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) {
    return null;
  }
  
  // Stocker la réponse
  trainingState.answers[currentQuestion.id] = answer;
  
  // Vérifier si la réponse est correcte
  const isCorrect = checkAnswer(currentQuestion, answer);
  const correctAnswer = getCorrectAnswer(currentQuestion);
  
  // Stocker le feedback
  trainingState.feedbacks[currentQuestion.id] = {
    isCorrect,
    correctAnswer
  };
  
  return {
    isCorrect,
    correctAnswer
  };
}

/**
 * Vérifie si une réponse est correcte
 * @param {object} question - Question
 * @param {any} answer - Réponse de l'élève
 * @returns {boolean}
 */
function checkAnswer(question, answer) {
  const correctAnswer = question.correctAnswer !== undefined ? question.correctAnswer : question.answer;
  
  if (question.type === 'mcq' || (question.choices && question.choices.length > 0)) {
    // Question à choix multiples
    // La réponse peut être un index, une lettre, ou une valeur
    if (typeof answer === 'number') {
      return answer === correctAnswer;
    }
    
    if (typeof answer === 'string' && answer.length === 1) {
      const answerIndex = answer.toLowerCase().charCodeAt(0) - 97;
      const correctIndex = typeof correctAnswer === 'number' ? correctAnswer : 
                          (typeof correctAnswer === 'string' && correctAnswer.length === 1 ? correctAnswer.charCodeAt(0) - 97 : null);
      return answerIndex === correctIndex;
    }
    
    // Comparaison de chaînes (insensible à la casse)
    if (typeof answer === 'string' && typeof correctAnswer === 'string') {
      return answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    }
  } else {
    // Question ouverte - comparaison simple (insensible à la casse)
    if (typeof answer === 'string' && typeof correctAnswer === 'string') {
      return answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    }
  }
  
  return false;
}

/**
 * Retourne la bonne réponse formatée
 * @param {object} question - Question
 * @returns {string}
 */
function getCorrectAnswer(question) {
  const correctAnswer = question.correctAnswer !== undefined ? question.correctAnswer : question.answer;
  
  if (question.type === 'mcq' || (question.choices && question.choices.length > 0)) {
    // Pour MCQ, retourner le label de la bonne réponse
    if (typeof correctAnswer === 'number' && question.choices[correctAnswer]) {
      const choice = question.choices[correctAnswer];
      return typeof choice === 'string' ? choice : (choice.label || choice);
    }
    
    if (typeof correctAnswer === 'string' && correctAnswer.length === 1) {
      const index = correctAnswer.toLowerCase().charCodeAt(0) - 97;
      if (question.choices[index]) {
        const choice = question.choices[index];
        return typeof choice === 'string' ? choice : (choice.label || choice);
      }
    }
  }
  
  return String(correctAnswer || 'Réponse non disponible');
}

/**
 * Passe à la question suivante
 * @returns {boolean} true si succès, false si dernière question
 */
export function nextQuestion() {
  if (isLastQuestion()) {
    return false;
  }
  
  trainingState.currentQuestionIndex++;
  return true;
}

/**
 * Retourne à la question précédente
 * @returns {boolean} true si succès, false si première question
 */
export function previousQuestion() {
  if (isFirstQuestion()) {
    return false;
  }
  
  trainingState.currentQuestionIndex--;
  return true;
}

/**
 * Retourne le feedback d'une question
 * @param {string} questionId - ID de la question
 * @returns {object|null}
 */
export function getQuestionFeedback(questionId) {
  return trainingState.feedbacks[questionId] || null;
}

/**
 * Retourne les statistiques de la session
 * @returns {object}
 */
export function getTrainingStats() {
  const total = trainingState.questions.length;
  const answered = Object.keys(trainingState.answers).length;
  const correct = Object.values(trainingState.feedbacks).filter(f => f.isCorrect).length;
  
  return {
    total,
    answered,
    correct,
    incorrect: answered - correct,
    percentage: answered > 0 ? Math.round((correct / answered) * 100) : 0
  };
}

export default {
  initTrainingSession,
  getTrainingState,
  getCurrentQuestion,
  getTotalQuestions,
  getCurrentQuestionNumber,
  isLastQuestion,
  isFirstQuestion,
  submitAnswer,
  nextQuestion,
  previousQuestion,
  getQuestionFeedback,
  getTrainingStats
};

