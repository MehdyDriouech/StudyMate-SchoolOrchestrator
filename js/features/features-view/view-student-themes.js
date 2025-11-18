/**
 * View Student Themes - Vue fusionnée pour les thèmes de l'élève
 * Fusionne : Catalogue, Entraînement, Annales en onglets
 */

import {
  getAssignmentsToDo,
  getAssignmentsAnnals,
  getAssignmentWithThemeById,
  isStudent
} from '../features-control/feature-student-catalog.js';
import { navigateTo } from '../../app.js';
import { getCurrentUser } from '../features-control/feature-auth.js';
import StudentSubmissionsStore from '../features-control/store-submissions.js';
import ActivityTimelineStore from '../features-control/store-timeline.js';
import { renderTrainingView } from './view-training.js';

let currentView = 'list'; // 'list' ou 'detail'
let currentAssignmentId = null;
let activeTab = 'todo'; // 'todo', 'training', ou 'annals'

/**
 * Rend la vue des thèmes étudiant
 * @param {HTMLElement} container - Conteneur de la vue
 * @param {string} route - Route actuelle (pour gérer les sous-routes)
 */
export function renderStudentThemesView(container, route = 'student-themes') {
  console.log('[View Student Themes] Rendu des thèmes');
  
  // Vérifier que l'utilisateur est un étudiant
  if (!isStudent()) {
    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 16px;">🔒</div>
        <h2>Accès réservé</h2>
        <p style="color: var(--muted); margin: 16px 0;">
          Cette page est réservée aux étudiants.
        </p>
        <button class="btn primary" onclick="window.location.hash='dashboard-student'">
          Retour au dashboard
        </button>
      </div>
    `;
    return;
  }
  
  // Rendre la vue
  if (currentView === 'detail' && currentAssignmentId) {
    renderDetailView(container);
  } else {
    renderListView(container);
  }
}

/**
 * Rend la vue liste avec onglets
 * @param {HTMLElement} container - Conteneur
 */
function renderListView(container) {
  const assignmentsToDo = getAssignmentsToDo();
  const assignmentsAnnals = getAssignmentsAnnals();
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <!-- En-tête -->
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          📚 Mes Thèmes
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Consultez vos thèmes assignés, entraînez-vous et accédez aux annales
        </p>
      </div>
      
      <!-- Onglets -->
      <div style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid var(--card-border); flex-wrap: wrap;">
        <button 
          class="btn ghost themes-tab ${activeTab === 'todo' ? 'active' : ''}" 
          data-tab="todo"
          style="border-bottom: 2px solid transparent; border-radius: 0; margin-bottom: -2px;"
        >
          📝 À faire / en cours
          ${assignmentsToDo.length > 0 ? `<span class="badge" style="margin-left: 8px;">${assignmentsToDo.length}</span>` : ''}
        </button>
        <button 
          class="btn ghost themes-tab ${activeTab === 'training' ? 'active' : ''}" 
          data-tab="training"
          style="border-bottom: 2px solid transparent; border-radius: 0; margin-bottom: -2px;"
        >
          🎯 Entraînement
        </button>
        <button 
          class="btn ghost themes-tab ${activeTab === 'annals' ? 'active' : ''}" 
          data-tab="annals"
          style="border-bottom: 2px solid transparent; border-radius: 0; margin-bottom: -2px;"
        >
          📖 Annales
          ${assignmentsAnnals.length > 0 ? `<span class="badge" style="margin-left: 8px;">${assignmentsAnnals.length}</span>` : ''}
        </button>
      </div>
      
      <!-- Contenu des onglets -->
      <div id="themes-content">
        ${activeTab === 'todo' ? renderToDoList(assignmentsToDo) : 
          activeTab === 'training' ? renderTrainingTab() : 
          renderAnnalsList(assignmentsAnnals)}
      </div>
    </div>
    
    <style>
      .themes-tab.active {
        border-bottom-color: var(--accent) !important;
        color: var(--accent);
        font-weight: 600;
      }
    </style>
  `;
  
  // Event listeners
  setupListViewListeners(container);
}

/**
 * Rend l'onglet Entraînement
 * @returns {string}
 */
function renderTrainingTab() {
  const assignmentsToDo = getAssignmentsToDo();
  
  if (assignmentsToDo.length === 0) {
    return `
      <div class="card" style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">🎯</div>
        <h3>Aucun thème disponible pour l'entraînement</h3>
        <p style="color: var(--muted); margin-top: 12px;">
          Vous devez avoir des thèmes assignés pour vous entraîner.
        </p>
      </div>
    `;
  }
  
  return `
    <div class="card">
      <h2 style="font-size: 1.25rem; margin-bottom: 16px;">🎯 Mode Entraînement</h2>
      <p style="color: var(--muted); margin-bottom: 24px;">
        Choisissez un thème pour commencer une session d'entraînement. Vous pourrez répondre aux questions et obtenir un feedback immédiat.
      </p>
      <div style="display: grid; gap: 16px;">
        ${assignmentsToDo.map(assignment => {
          const theme = assignment.theme;
          return `
            <div class="card" style="border-left: 4px solid var(--accent);">
              <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px; flex-wrap: wrap;">
                <div style="flex: 1;">
                  <h3 style="font-size: 1.2rem; font-weight: 600; margin-bottom: 8px;">
                    ${escapeHtml(theme.title || 'Thème sans titre')}
                  </h3>
                  <div style="display: flex; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
                    <span class="badge" style="background: var(--card-hover); font-size: 0.85rem;">
                      ${escapeHtml(theme.subject || 'Matière non spécifiée')}
                    </span>
                    <span class="badge ghost" style="font-size: 0.85rem;">
                      ${escapeHtml(theme.level || 'Niveau non spécifié')}
                    </span>
                  </div>
                  ${theme.description ? `
                    <p style="font-size: 0.9rem; color: var(--muted); margin-top: 8px; line-height: 1.5;">
                      ${escapeHtml(theme.description.substring(0, 150))}${theme.description.length > 150 ? '...' : ''}
                    </p>
                  ` : ''}
                </div>
                <button 
                  class="btn primary" 
                  data-start-training="${assignment.id}"
                  style="white-space: nowrap;"
                >
                  ▶ Commencer l'entraînement
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Rend la liste "À faire"
 * @param {Array} assignments - Assignations
 * @returns {string}
 */
function renderToDoList(assignments) {
  if (assignments.length === 0) {
    return `
      <div class="card" style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">📭</div>
        <h3>Aucun thème à faire</h3>
        <p style="color: var(--muted); margin-top: 12px;">
          Vous n'avez actuellement aucun thème assigné à faire.
        </p>
      </div>
    `;
  }
  
  const now = new Date();
  
  return `
    <div style="display: grid; gap: 16px;">
      ${assignments.map(assignment => {
        const theme = assignment.theme;
        const startDate = new Date(assignment.startAt);
        const dueDate = new Date(assignment.dueAt);
        const isUpcoming = now < startDate;
        const isActive = now >= startDate && now <= dueDate;
        
        return `
          <div class="card" style="border-left: 4px solid ${isUpcoming ? 'var(--muted)' : 'var(--accent)'};">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px; flex-wrap: wrap;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <h3 style="font-size: 1.2rem; font-weight: 600; margin: 0;">
                    ${escapeHtml(theme.title || 'Thème sans titre')}
                  </h3>
                  ${isUpcoming ? '<span class="badge ghost">À venir</span>' : '<span class="badge" style="background: var(--accent); color: white;">En cours</span>'}
                </div>
                <div style="display: flex; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
                  <span class="badge" style="background: var(--card-hover); font-size: 0.85rem;">
                    ${escapeHtml(theme.subject || 'Matière non spécifiée')}
                  </span>
                  <span class="badge ghost" style="font-size: 0.85rem;">
                    ${escapeHtml(theme.level || 'Niveau non spécifié')}
                  </span>
                </div>
                <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 8px;">
                  <strong>Date de rendu :</strong> ${formatDate(dueDate)}
                </div>
                ${theme.description ? `
                  <p style="font-size: 0.9rem; color: var(--muted); margin-top: 12px; line-height: 1.5;">
                    ${escapeHtml(theme.description.substring(0, 150))}${theme.description.length > 150 ? '...' : ''}
                  </p>
                ` : ''}
              </div>
              <button 
                class="btn primary" 
                data-view-detail="${assignment.id}"
                style="white-space: nowrap;"
              >
                Voir le thème
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Rend la liste "Annales"
 * @param {Array} assignments - Assignations
 * @returns {string}
 */
function renderAnnalsList(assignments) {
  if (assignments.length === 0) {
    return `
      <div class="card" style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">📖</div>
        <h3>Aucune annales disponible</h3>
        <p style="color: var(--muted); margin-top: 12px;">
          Les thèmes dont la date de rendu est passée apparaîtront ici avec leurs corrigés.
        </p>
      </div>
    `;
  }
  
  return `
    <div style="display: grid; gap: 16px;">
      ${assignments.map(assignment => {
        const theme = assignment.theme;
        const dueDate = new Date(assignment.dueAt);
        
        return `
          <div class="card" style="border-left: 4px solid var(--success);">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px; flex-wrap: wrap;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <h3 style="font-size: 1.2rem; font-weight: 600; margin: 0;">
                    ${escapeHtml(theme.title || 'Thème sans titre')}
                  </h3>
                  <span class="badge" style="background: var(--success); color: white;">Annales</span>
                </div>
                <div style="display: flex; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
                  <span class="badge" style="background: var(--card-hover); font-size: 0.85rem;">
                    ${escapeHtml(theme.subject || 'Matière non spécifiée')}
                  </span>
                  <span class="badge ghost" style="font-size: 0.85rem;">
                    ${escapeHtml(theme.level || 'Niveau non spécifié')}
                  </span>
                </div>
                <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 8px;">
                  <strong>Date de rendu :</strong> ${formatDate(dueDate)} <span style="color: var(--danger);">(dépassée)</span>
                </div>
                ${theme.description ? `
                  <p style="font-size: 0.9rem; color: var(--muted); margin-top: 12px; line-height: 1.5;">
                    ${escapeHtml(theme.description.substring(0, 150))}${theme.description.length > 150 ? '...' : ''}
                  </p>
                ` : ''}
              </div>
              <button 
                class="btn success" 
                data-view-detail="${assignment.id}"
                style="white-space: nowrap;"
              >
                Voir le corrigé
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Rend la vue détail d'un thème
 * @param {HTMLElement} container - Conteneur
 */
function renderDetailView(container) {
  const assignment = getAssignmentWithThemeById(currentAssignmentId);
  
  if (!assignment) {
    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
        <h2>Thème introuvable</h2>
        <button class="btn primary" onclick="window.location.hash='student-themes'">
          Retour aux thèmes
        </button>
      </div>
    `;
    return;
  }
  
  const theme = assignment.theme;
  const now = new Date();
  const dueDate = new Date(assignment.dueAt);
  const isAnnalsMode = now > dueDate;
  
  container.innerHTML = `
    <div style="max-width: 1000px; margin: 24px auto; padding: 0 16px;">
      <!-- Bouton retour -->
      <button 
        class="btn ghost" 
        id="themes-back-btn"
        style="margin-bottom: 20px;"
      >
        ← Retour aux thèmes
      </button>
      
      <!-- En-tête -->
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; align-items: start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 16px;">
          <div style="flex: 1;">
            <h1 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 12px;">
              ${escapeHtml(theme.title || 'Thème sans titre')}
            </h1>
            <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
              <span class="badge" style="background: var(--accent); color: white;">
                ${escapeHtml(theme.subject || 'Matière non spécifiée')}
              </span>
              <span class="badge ghost">
                ${escapeHtml(theme.level || 'Niveau non spécifié')}
              </span>
              ${isAnnalsMode ? '<span class="badge" style="background: var(--success); color: white;">Annales</span>' : ''}
            </div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; padding-top: 16px; border-top: 1px solid var(--card-border);">
          <div>
            <div style="font-size: 0.85rem; color: var(--muted); margin-bottom: 4px;">Date de rendu</div>
            <div style="font-weight: 600;">${formatDate(dueDate)}</div>
            ${isAnnalsMode ? '<div style="font-size: 0.8rem; color: var(--danger); margin-top: 4px;">(dépassée)</div>' : ''}
          </div>
          ${assignment.startAt ? `
            <div>
              <div style="font-size: 0.85rem; color: var(--muted); margin-bottom: 4px;">Période d'accessibilité</div>
              <div style="font-weight: 600;">
                ${formatDateShort(new Date(assignment.startAt))} → ${assignment.endAt ? formatDateShort(new Date(assignment.endAt)) : '—'}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Description -->
      ${theme.description ? `
        <div class="card" style="margin-bottom: 24px;">
          <h2 style="font-size: 1.2rem; margin-bottom: 12px;">Description</h2>
          <p style="color: var(--muted); line-height: 1.6;">
            ${escapeHtml(theme.description)}
          </p>
        </div>
      ` : ''}
      
      <!-- Contenu selon le mode -->
      ${isAnnalsMode ? renderAnnalsContent(theme) : renderToDoContent(theme, assignment)}
    </div>
  `;
  
  // Event listener pour le bouton retour
  document.getElementById('themes-back-btn')?.addEventListener('click', () => {
    currentView = 'list';
    currentAssignmentId = null;
    renderStudentThemesView(container);
  });
  
  // Event listener pour le bouton "S'entraîner maintenant"
  const trainingBtn = document.getElementById('training-btn');
  if (trainingBtn) {
    trainingBtn.addEventListener('click', () => {
      navigateTo('training', false, { themeId: assignment.themeId });
    });
  }
  
  // Event listener pour le bouton "Marquer comme fait"
  const submitBtn = document.getElementById('submit-assignment-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      handleSubmitAssignment(assignment);
    });
  }
}

/**
 * Rend le contenu en mode "À faire"
 */
function renderToDoContent(theme, assignment) {
  const currentUser = getCurrentUser();
  const existingSubmission = currentUser ? StudentSubmissionsStore.getSubmission(currentUser.email, assignment.id) : null;
  const isSubmitted = existingSubmission !== null;
  
  return `
    <div class="card">
      <h2 style="font-size: 1.2rem; margin-bottom: 12px;">📝 Informations sur le thème</h2>
      <p style="color: var(--muted); line-height: 1.6; margin-bottom: 16px;">
        Ce thème vous a été assigné. Vous pouvez le consulter, mais les réponses correctes ne seront disponibles qu'après la date de rendu.
      </p>
      ${theme.quiz && theme.quiz.length > 0 ? `
        <div style="padding: 12px; background: var(--card-hover); border-radius: var(--radius-md); margin-top: 16px;">
          <div style="font-weight: 600; margin-bottom: 8px;">Type d'activité :</div>
          <div style="font-size: 0.9rem; color: var(--muted);">
            Ce thème contient ${theme.quiz.length} question${theme.quiz.length > 1 ? 's' : ''} de type quiz.
          </div>
        </div>
      ` : ''}
      
      ${!isSubmitted ? `
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--card-border);">
          ${(() => {
            const now = new Date();
            const dueDate = new Date(assignment.dueAt);
            const canTrain = now <= dueDate && (theme.quiz && theme.quiz.length > 0 || theme.questions && theme.questions.length > 0);
            
            return canTrain ? `
              <button 
                id="training-btn"
                class="btn primary" 
                style="width: 100%; font-size: 1rem; padding: 12px; margin-bottom: 12px;"
              >
                ▶ S'entraîner maintenant
              </button>
            ` : '';
          })()}
          
          <button 
            id="submit-assignment-btn"
            class="btn success" 
            style="width: 100%; font-size: 1rem; padding: 12px;"
          >
            ✔ Marquer comme fait (Démo)
          </button>
          <p style="font-size: 0.85rem; color: var(--muted); margin-top: 8px; text-align: center;">
            En mode démo, le devoir sera automatiquement corrigé.
          </p>
        </div>
      ` : `
        <div style="margin-top: 24px; padding: 16px; background: rgba(16, 185, 129, 0.1); border: 2px solid var(--success); border-radius: var(--radius-md);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span style="font-size: 1.5rem;">✅</span>
            <div style="font-weight: 600; font-size: 1.1rem;">Devoir déjà rendu</div>
          </div>
          ${existingSubmission.status === 'graded' && existingSubmission.score !== null ? `
            <div style="margin-top: 12px; padding: 12px; background: var(--card); border-radius: var(--radius-md);">
              <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 4px;">Score obtenu :</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">
                ${existingSubmission.score}%
              </div>
            </div>
          ` : `
            <div style="font-size: 0.9rem; color: var(--muted);">
              En attente de correction...
            </div>
          `}
          <button 
            class="btn primary" 
            style="width: 100%; margin-top: 12px;"
            onclick="window.location.hash='student-result?assignmentId=${assignment.id}'"
          >
            Voir le résultat
          </button>
        </div>
      `}
    </div>
  `;
}

/**
 * Rend le contenu en mode "Annales" (avec corrigé)
 */
function renderAnnalsContent(theme) {
  // Convertir quiz en questions si nécessaire
  let questions = theme.questions || [];
  
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
    return `
      <div class="card">
        <h2 style="font-size: 1.2rem; margin-bottom: 12px;">📖 Annales d'examen</h2>
        <p style="color: var(--muted);">
          Aucune question disponible pour ce thème.
        </p>
      </div>
    `;
  }
  
  return `
    <div class="card">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px; padding: 12px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%); border: 2px solid var(--success); border-radius: var(--radius-md);">
        <span style="font-size: 1.5rem;">📖</span>
        <div>
          <div style="font-weight: 600; font-size: 1.1rem;">Annales d'examen - Corrigé</div>
          <div style="font-size: 0.85rem; color: var(--muted); margin-top: 4px;">
            Toutes les questions avec leurs réponses correctes
          </div>
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 24px;">
        ${questions.map((question, index) => {
          const questionNumber = index + 1;
          const questionType = question.type || (question.choices && question.choices.length > 0 ? 'mcq' : 'open');
          const correctAnswer = question.correctAnswer !== undefined ? question.correctAnswer : question.answer;
          
          return `
            <div style="padding: 16px; background: var(--card-hover); border-radius: var(--radius-md); border-left: 3px solid var(--success);">
              <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 12px;">
                Question ${questionNumber}
              </div>
              <div style="font-size: 1rem; margin-bottom: 16px; line-height: 1.6;">
                ${escapeHtml(question.stem || question.prompt || 'Question sans énoncé')}
              </div>
              
              ${questionType === 'mcq' && question.choices && question.choices.length > 0 ? `
                <div style="margin-bottom: 16px;">
                  <div style="font-size: 0.9rem; font-weight: 500; margin-bottom: 8px; color: var(--muted);">Options :</div>
                  <div style="display: flex; flex-direction: column; gap: 6px;">
                    ${question.choices.map((choice, idx) => {
                      const choiceLabel = typeof choice === 'string' ? choice : (choice.label || choice);
                      const choiceLetter = String.fromCharCode(97 + idx);
                      const isCorrect = (
                        correctAnswer === idx || 
                        correctAnswer === choiceLetter || 
                        correctAnswer === choiceLetter.toUpperCase() ||
                        (typeof correctAnswer === 'string' && correctAnswer.toLowerCase() === choiceLabel.toLowerCase())
                      );
                      
                      return `
                        <div style="
                          padding: 8px 12px;
                          background: ${isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'var(--card)'};
                          border: 1px solid ${isCorrect ? 'var(--success)' : 'var(--card-border)'};
                          border-radius: var(--radius-md);
                          display: flex; align-items: center; gap: 8px;
                        ">
                          <span style="font-weight: 600; color: ${isCorrect ? 'var(--success)' : 'var(--muted)'};">
                            ${choiceLetter.toUpperCase()}.
                          </span>
                          <span>${escapeHtml(choiceLabel)}</span>
                          ${isCorrect ? '<span style="margin-left: auto; color: var(--success); font-weight: 600;">✓ Correcte</span>' : ''}
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : ''}
              
              <div style="padding: 12px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid var(--success); border-radius: var(--radius-md);">
                <div style="font-weight: 600; margin-bottom: 6px; color: var(--success);">
                  Réponse correcte :
                </div>
                <div style="line-height: 1.6;">
                  ${questionType === 'mcq' && question.choices && correctAnswer !== null && correctAnswer !== undefined ? (
                    (() => {
                      const answerIdx = typeof correctAnswer === 'number' ? correctAnswer : 
                                       (typeof correctAnswer === 'string' && correctAnswer.length === 1 ? correctAnswer.charCodeAt(0) - 97 : null);
                      if (answerIdx !== null && question.choices[answerIdx]) {
                        const choiceLabel = typeof question.choices[answerIdx] === 'string' ? 
                                          question.choices[answerIdx] : 
                                          (question.choices[answerIdx].label || question.choices[answerIdx]);
                        return escapeHtml(choiceLabel);
                      }
                      return escapeHtml(String(correctAnswer));
                    })()
                  ) : (
                    escapeHtml(String(correctAnswer || 'Réponse non disponible'))
                  )}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Configure les event listeners de la vue liste
 */
function setupListViewListeners(container) {
  // Onglets
  container.querySelectorAll('.themes-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      renderStudentThemesView(container);
    });
  });
  
  // Boutons "Voir le thème" / "Voir le corrigé"
  container.querySelectorAll('[data-view-detail]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentAssignmentId = btn.dataset.viewDetail;
      currentView = 'detail';
      renderStudentThemesView(container);
    });
  });
  
  // Boutons "Commencer l'entraînement"
  container.querySelectorAll('[data-start-training]').forEach(btn => {
    btn.addEventListener('click', () => {
      const assignmentId = btn.dataset.startTraining;
      const assignment = getAssignmentWithThemeById(assignmentId);
      if (assignment) {
        navigateTo('training', false, { themeId: assignment.themeId });
      }
    });
  });
}

/**
 * Gère la soumission d'un devoir
 */
function handleSubmitAssignment(assignment) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'student') {
    alert('Erreur : vous devez être connecté en tant qu\'étudiant');
    return;
  }
  
  const existingSubmission = StudentSubmissionsStore.getSubmission(currentUser.email, assignment.id);
  if (existingSubmission) {
    navigateTo('student-result', false, { assignmentId: assignment.id });
    return;
  }
  
  const submission = StudentSubmissionsStore.submitAssignment({
    assignmentId: assignment.id,
    studentId: currentUser.email,
    classId: assignment.classId,
    themeId: assignment.themeId,
    answers: []
  });
  
  setTimeout(() => {
    StudentSubmissionsStore.autoGrade(submission.id);
    
    ActivityTimelineStore.logEvent('student_submitted_assignment', currentUser.email, currentUser.role, {
      assignmentId: assignment.id,
      themeId: assignment.themeId,
      themeTitle: assignment.theme?.title || assignment.themeId,
      submissionId: submission.id
    });
    
    const gradedSubmission = StudentSubmissionsStore.getSubmission(currentUser.email, assignment.id);
    if (gradedSubmission && gradedSubmission.status === 'graded') {
      ActivityTimelineStore.logEvent('student_auto_graded', currentUser.email, currentUser.role, {
        assignmentId: assignment.id,
        themeId: assignment.themeId,
        themeTitle: assignment.theme?.title || assignment.themeId,
        submissionId: submission.id,
        score: gradedSubmission.score
      });
    }
    
    navigateTo('student-result', false, { assignmentId: assignment.id });
  }, 500);
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

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateShort(date) {
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Export global pour app.js
window.renderStudentThemesView = renderStudentThemesView;
export default { renderStudentThemesView };

