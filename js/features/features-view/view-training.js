/**
 * View Training - Mode entraînement pour les élèves
 */

import {
  initTrainingSession,
  getCurrentQuestion,
  getTotalQuestions,
  getCurrentQuestionNumber,
  isLastQuestion,
  isFirstQuestion,
  submitAnswer,
  nextQuestion,
  previousQuestion,
  getQuestionFeedback,
  getTrainingStats,
  getTrainingState
} from '../features-control/feature-training.js';
import { navigateTo } from '../../app.js';

let trainingContainer = null;
let currentAnswer = null;

/**
 * Rend la vue entraînement
 * @param {HTMLElement} container - Conteneur de la vue
 */
export function renderTrainingView(container) {
  console.log('[View Training] Rendu du mode entraînement');
  
  trainingContainer = container;
  
  container.innerHTML = `
    <div style="max-width: 800px; margin: 24px auto; padding: 0 16px;">
      <div style="text-align: center; padding: 40px; color: var(--muted);">
        Chargement de l'entraînement...
      </div>
    </div>
  `;
  
  // Initialiser la session
  setTimeout(() => {
    const session = initTrainingSession();
    if (!session) {
      renderError();
      return;
    }
    
    renderTrainingContent();
  }, 100);
}

/**
 * Rend le contenu de l'entraînement
 */
function renderTrainingContent() {
  const state = getTrainingState();
  const currentQuestion = getCurrentQuestion();
  
  if (!currentQuestion) {
    renderError();
    return;
  }
  
  const questionNumber = getCurrentQuestionNumber();
  const totalQuestions = getTotalQuestions();
  const feedback = getQuestionFeedback(currentQuestion.id);
  const stats = getTrainingStats();
  
  trainingContainer.innerHTML = `
    <div style="max-width: 800px; margin: 24px auto; padding: 0 16px;">
      <!-- En-tête -->
      <div style="margin-bottom: 24px;">
        <button 
          class="btn ghost" 
          onclick="window.location.hash='student-catalog'"
          style="margin-bottom: 16px;"
        >
          ← Retour au catalogue
        </button>
        
        <div class="card" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;">
                🎯 Mode Entraînement
              </h1>
              <div style="font-size: 0.9rem; color: var(--muted);">
                ${escapeHtml(state.theme.title || 'Thème sans titre')}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.2rem; font-weight: 600; color: var(--accent);">
                Question ${questionNumber} / ${totalQuestions}
              </div>
              <div style="font-size: 0.85rem; color: var(--muted); margin-top: 4px;">
                ${stats.answered} répondu${stats.answered > 1 ? 'es' : 'e'} • ${stats.correct} correcte${stats.correct > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Question -->
      <div class="card" style="margin-bottom: 24px;">
        <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--card-border);">
          Question ${questionNumber}
        </div>
        
        <div style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 24px;">
          ${escapeHtml(currentQuestion.stem || currentQuestion.prompt || 'Question sans énoncé')}
        </div>
        
        ${renderQuestionInput(currentQuestion, feedback)}
        
        ${feedback ? renderFeedback(feedback, currentQuestion) : ''}
      </div>
      
      <!-- Navigation -->
      <div style="display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
        <button 
          id="training-prev-btn"
          class="btn ghost"
          ${isFirstQuestion() ? 'disabled' : ''}
          style="flex: 1; min-width: 120px;"
        >
          ← Précédent
        </button>
        
        ${feedback ? `
          ${!isLastQuestion() ? `
            <button 
              id="training-next-btn"
              class="btn primary"
              style="flex: 2; min-width: 200px;"
            >
              Suivant →
            </button>
          ` : `
            <button 
              id="training-finish-btn"
              class="btn success"
              style="flex: 2; min-width: 200px;"
            >
              Terminer l'entraînement
            </button>
          `}
        ` : `
          <button 
            id="training-submit-btn"
            class="btn primary"
            style="flex: 2; min-width: 200px;"
            ${currentAnswer === null ? 'disabled' : ''}
          >
            Valider la réponse
          </button>
        `}
      </div>
    </div>
  `;
  
  // Event listeners
  setupEventListeners();
}

/**
 * Rend l'input de la question
 * @param {object} question - Question
 * @param {object|null} feedback - Feedback existant
 * @returns {string}
 */
function renderQuestionInput(question, feedback) {
  const questionType = question.type || (question.choices && question.choices.length > 0 ? 'mcq' : 'open');
  const existingAnswer = currentAnswer !== null ? currentAnswer : (feedback ? trainingContainer.querySelector(`[data-question-id="${question.id}"]`)?.value : null);
  
  if (questionType === 'mcq' && question.choices && question.choices.length > 0) {
    // Question à choix multiples
    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${question.choices.map((choice, idx) => {
          const choiceLabel = typeof choice === 'string' ? choice : (choice.label || choice);
          const choiceLetter = String.fromCharCode(97 + idx);
          const choiceId = `choice_${question.id}_${idx}`;
          const isSelected = existingAnswer === idx || existingAnswer === choiceLetter || existingAnswer === choiceLetter.toUpperCase();
          
          return `
            <label 
              style="
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                background: ${isSelected ? 'var(--card-hover)' : 'var(--card)'};
                border: 2px solid ${isSelected ? 'var(--accent)' : 'var(--card-border)'};
                border-radius: var(--radius-md);
                cursor: ${feedback ? 'default' : 'pointer'};
                transition: all 0.2s;
              "
              ${feedback ? '' : `onclick="selectChoice('${question.id}', ${idx})"`}
            >
              <input 
                type="radio" 
                name="question_${question.id}" 
                id="${choiceId}"
                value="${idx}"
                data-question-id="${question.id}"
                ${isSelected ? 'checked' : ''}
                ${feedback ? 'disabled' : ''}
                style="cursor: pointer;"
              />
              <span style="font-weight: 600; min-width: 24px;">${choiceLetter.toUpperCase()}.</span>
              <span style="flex: 1;">${escapeHtml(choiceLabel)}</span>
            </label>
          `;
        }).join('')}
      </div>
    `;
  } else {
    // Question ouverte
    return `
      <div>
        <textarea 
          id="open-answer-${question.id}"
          data-question-id="${question.id}"
          class="input" 
          rows="4" 
          placeholder="Votre réponse..."
          ${feedback ? 'disabled' : ''}
          style="width: 100%; font-size: 1rem;"
          oninput="updateOpenAnswer('${question.id}')"
        >${existingAnswer || ''}</textarea>
      </div>
    `;
  }
}

/**
 * Rend le feedback
 * @param {object} feedback - Feedback
 * @param {object} question - Question
 * @returns {string}
 */
function renderFeedback(feedback, question) {
  if (feedback.isCorrect) {
    return `
      <div style="
        margin-top: 20px;
        padding: 16px;
        background: rgba(16, 185, 129, 0.1);
        border: 2px solid var(--success);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        gap: 12px;
      ">
        <span style="font-size: 1.5rem;">✔</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: var(--success); margin-bottom: 4px;">
            Correct !
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">
            Excellente réponse.
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div style="
        margin-top: 20px;
        padding: 16px;
        background: rgba(239, 68, 68, 0.1);
        border: 2px solid var(--danger);
        border-radius: var(--radius-md);
        display: flex;
        align-items: flex-start;
        gap: 12px;
      ">
        <span style="font-size: 1.5rem;">✖</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: var(--danger); margin-bottom: 8px;">
            Incorrect
          </div>
          <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 8px;">
            La bonne réponse est :
          </div>
          <div style="
            padding: 8px 12px;
            background: var(--card);
            border-radius: var(--radius-md);
            font-weight: 600;
            color: var(--success);
          ">
            ${escapeHtml(feedback.correctAnswer)}
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Configure les event listeners
 */
function setupEventListeners() {
  // Bouton précédent
  const prevBtn = document.getElementById('training-prev-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (previousQuestion()) {
        currentAnswer = null;
        renderTrainingContent();
      }
    });
  }
  
  // Bouton suivant
  const nextBtn = document.getElementById('training-next-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (nextQuestion()) {
        currentAnswer = null;
        renderTrainingContent();
      }
    });
  }
  
  // Bouton terminer
  const finishBtn = document.getElementById('training-finish-btn');
  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      navigateTo('student-catalog', false);
    });
  }
  
  // Bouton valider
  const submitBtn = document.getElementById('training-submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      handleSubmitAnswer();
    });
  }
}

/**
 * Gère la soumission d'une réponse
 */
function handleSubmitAnswer() {
  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) {
    return;
  }
  
  // Récupérer la réponse
  let answer = currentAnswer;
  
  if (answer === null) {
    // Essayer de récupérer depuis les inputs
    const questionType = currentQuestion.type || (currentQuestion.choices && currentQuestion.choices.length > 0 ? 'mcq' : 'open');
    
    if (questionType === 'mcq') {
      const selected = trainingContainer.querySelector(`input[name="question_${currentQuestion.id}"]:checked`);
      if (selected) {
        answer = parseInt(selected.value);
      }
    } else {
      const textarea = document.getElementById(`open-answer-${currentQuestion.id}`);
      if (textarea) {
        answer = textarea.value.trim();
      }
    }
  }
  
  if (answer === null || answer === '') {
    alert('Veuillez sélectionner ou saisir une réponse');
    return;
  }
  
  // Soumettre la réponse
  const feedback = submitAnswer(answer);
  
  // Re-rendre pour afficher le feedback
  renderTrainingContent();
}

/**
 * Sélectionne un choix (pour MCQ)
 * @param {string} questionId - ID de la question
 * @param {number} choiceIndex - Index du choix
 */
window.selectChoice = function(questionId, choiceIndex) {
  currentAnswer = choiceIndex;
  const submitBtn = document.getElementById('training-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = false;
  }
};

/**
 * Met à jour la réponse ouverte
 * @param {string} questionId - ID de la question
 */
window.updateOpenAnswer = function(questionId) {
  const textarea = document.getElementById(`open-answer-${questionId}`);
  if (textarea) {
    currentAnswer = textarea.value.trim();
    const submitBtn = document.getElementById('training-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = currentAnswer === '';
    }
  }
};

/**
 * Rend une erreur
 */
function renderError() {
  trainingContainer.innerHTML = `
    <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
      <h2>Erreur de chargement</h2>
      <p style="color: var(--muted); margin: 16px 0;">
        Impossible de charger l'entraînement. Le thème est peut-être introuvable ou ne contient pas de questions.
      </p>
      <button class="btn primary" onclick="window.location.hash='student-catalog'">
        Retour au catalogue
      </button>
    </div>
  `;
}

/**
 * Utilitaires
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.renderTrainingView = renderTrainingView;
export default { renderTrainingView };

