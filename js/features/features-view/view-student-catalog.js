/**
 * View Student Catalog - Catalogue & Annales pour les élèves
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

let currentView = 'list'; // 'list' ou 'detail'
let currentAssignmentId = null;
let activeTab = 'todo'; // 'todo' ou 'annals'

/**
 * Rend la vue du catalogue étudiant
 * @param {HTMLElement} container - Conteneur de la vue
 */
export function renderStudentCatalogView(container) {
  console.log('[View Student Catalog] Rendu du catalogue');
  
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
 * Rend la vue liste (onglets)
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
          📚 Catalogue & Annales
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Consultez vos thèmes assignés et accédez aux annales après la date de rendu
        </p>
      </div>
      
      <!-- Onglets -->
      <div style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid var(--card-border);">
        <button 
          class="btn ghost catalog-tab ${activeTab === 'todo' ? 'active' : ''}" 
          data-tab="todo"
          style="border-bottom: 2px solid transparent; border-radius: 0; margin-bottom: -2px;"
        >
          📝 À faire / en cours
          ${assignmentsToDo.length > 0 ? `<span class="badge" style="margin-left: 8px;">${assignmentsToDo.length}</span>` : ''}
        </button>
        <button 
          class="btn ghost catalog-tab ${activeTab === 'annals' ? 'active' : ''}" 
          data-tab="annals"
          style="border-bottom: 2px solid transparent; border-radius: 0; margin-bottom: -2px;"
        >
          📖 Annales (thèmes passés)
          ${assignmentsAnnals.length > 0 ? `<span class="badge" style="margin-left: 8px;">${assignmentsAnnals.length}</span>` : ''}
        </button>
      </div>
      
      <!-- Contenu des onglets -->
      <div id="catalog-content">
        ${activeTab === 'todo' ? renderToDoList(assignmentsToDo) : renderAnnalsList(assignmentsAnnals)}
      </div>
    </div>
    
    <style>
      .catalog-tab.active {
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
                ${assignment.endAt ? `
                  <div style="font-size: 0.85rem; color: var(--muted);">
                    Période : ${formatDateShort(startDate)} → ${formatDateShort(new Date(assignment.endAt))}
                  </div>
                ` : ''}
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
        <button class="btn primary" onclick="window.location.hash='student-catalog'">
          Retour au catalogue
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
        id="catalog-back-btn"
        style="margin-bottom: 20px;"
      >
        ← Retour au catalogue
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
  document.getElementById('catalog-back-btn')?.addEventListener('click', () => {
    currentView = 'list';
    currentAssignmentId = null;
    renderStudentCatalogView(container);
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
 * @param {object} theme - Thème
 * @param {object} assignment - Assignation
 * @returns {string}
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
      ${(!theme.quiz || theme.quiz.length === 0) && (!theme.questions || theme.questions.length === 0) ? `
        <div style="padding: 12px; background: var(--card-hover); border-radius: var(--radius-md); margin-top: 16px;">
          <div style="font-size: 0.9rem; color: var(--muted);">
            Les questions de ce thème seront disponibles prochainement.
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
 * Gère la soumission d'un devoir
 * @param {object} assignment - Assignation
 */
function handleSubmitAssignment(assignment) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'student') {
    alert('Erreur : vous devez être connecté en tant qu\'étudiant');
    return;
  }
  
  // Vérifier si déjà soumis
  const existingSubmission = StudentSubmissionsStore.getSubmission(currentUser.email, assignment.id);
  if (existingSubmission) {
    navigateTo('student-result', false, { assignmentId: assignment.id });
    return;
  }
  
  // Soumettre le devoir (fake)
  const submission = StudentSubmissionsStore.submitAssignment({
    assignmentId: assignment.id,
    studentId: currentUser.email,
    classId: assignment.classId,
    themeId: assignment.themeId,
    answers: [] // Fake answers
  });
  
  // Correction automatique (fake)
  setTimeout(() => {
    StudentSubmissionsStore.autoGrade(submission.id);
    
    // Logger l'événement de soumission
    ActivityTimelineStore.logEvent('student_submitted_assignment', currentUser.email, currentUser.role, {
      assignmentId: assignment.id,
      themeId: assignment.themeId,
      themeTitle: assignment.theme?.title || assignment.themeId,
      submissionId: submission.id
    });
    
    // Logger l'événement de correction
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
    
    // Rediriger vers la vue résultat
    navigateTo('student-result', false, { assignmentId: assignment.id });
  }, 500);
}

/**
 * Rend le contenu en mode "Annales" (avec corrigé)
 * @param {object} theme - Thème
 * @returns {string}
 */
function renderAnnalsContent(theme) {
  // Convertir quiz en questions si nécessaire
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
                      // Vérifier si c'est la bonne réponse (peut être index, lettre, ou valeur)
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
  container.querySelectorAll('.catalog-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      renderStudentCatalogView(container);
    });
  });
  
  // Boutons "Voir le thème" / "Voir le corrigé"
  container.querySelectorAll('[data-view-detail]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentAssignmentId = btn.dataset.viewDetail;
      currentView = 'detail';
      renderStudentCatalogView(container);
    });
  });
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
window.renderStudentCatalogView = renderStudentCatalogView;
export default { renderStudentCatalogView };

