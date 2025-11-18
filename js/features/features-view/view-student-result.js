/**
 * View Student Result - Résultat du devoir pour l'étudiant
 */

import { loadResultData } from '../features-control/feature-student-result.js';
import { navigateTo } from '../../app.js';

let resultContainer = null;

/**
 * Rend la vue résultat étudiant
 * @param {HTMLElement} container - Conteneur de la vue
 */
export function renderStudentResultView(container) {
  console.log('[View Student Result] Rendu du résultat');
  
  resultContainer = container;
  
  container.innerHTML = `
    <div style="max-width: 800px; margin: 24px auto; padding: 0 16px;">
      <div style="text-align: center; padding: 40px; color: var(--muted);">
        Chargement du résultat...
      </div>
    </div>
  `;
  
  // Charger les données
  setTimeout(() => {
    renderResultContent();
  }, 100);
}

/**
 * Rend le contenu du résultat
 */
function renderResultContent() {
  const resultData = loadResultData();
  
  if (!resultData) {
    resultContainer.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
        <h2>Résultat introuvable</h2>
        <p style="color: var(--muted); margin: 16px 0;">
          Impossible de charger le résultat de ce devoir.
        </p>
        <button class="btn primary" onclick="window.location.hash='student-catalog'">
          Retour au catalogue
        </button>
      </div>
    `;
    return;
  }
  
  const { assignment, submission, theme } = resultData;
  const now = new Date();
  const dueDate = new Date(assignment.dueAt);
  const isAnnalsMode = now > dueDate;
  
  resultContainer.innerHTML = `
    <div style="max-width: 800px; margin: 24px auto; padding: 0 16px;">
      <!-- Bouton retour -->
      <button 
        class="btn ghost" 
        onclick="window.location.hash='student-catalog'"
        style="margin-bottom: 20px;"
      >
        ← Retour au catalogue
      </button>
      
      <!-- En-tête -->
      <div class="card" style="margin-bottom: 24px; text-align: center;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 16px;">
          ${escapeHtml(theme.title || 'Thème sans titre')}
        </h1>
        <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
          <span class="badge" style="background: var(--accent); color: white;">
            ${escapeHtml(theme.subject || 'Matière non spécifiée')}
          </span>
          ${isAnnalsMode ? '<span class="badge" style="background: var(--success); color: white;">Annales</span>' : ''}
        </div>
      </div>
      
      <!-- Résultat -->
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
          <span style="font-size: 2.5rem;">${submission.status === 'graded' ? '✅' : '⏳'}</span>
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 600; margin: 0;">
              ${submission.status === 'graded' ? 'Devoir corrigé' : 'Devoir rendu'}
            </h2>
            <div style="font-size: 0.9rem; color: var(--muted); margin-top: 4px;">
              Rendu le ${formatDate(new Date(submission.submittedAt))}
            </div>
          </div>
        </div>
        
        ${submission.status === 'graded' && submission.score !== null ? `
          <div style="padding: 24px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%); border: 2px solid var(--success); border-radius: var(--radius-md); text-align: center;">
            <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 8px;">Score obtenu</div>
            <div style="font-size: 3rem; font-weight: 700; color: var(--success); margin-bottom: 8px;">
              ${submission.score}%
            </div>
            <div style="font-size: 0.9rem; color: var(--muted);">
              ${getScoreMessage(submission.score)}
            </div>
          </div>
        ` : `
          <div style="padding: 24px; background: var(--card-hover); border-radius: var(--radius-md); text-align: center;">
            <div style="font-size: 1.1rem; color: var(--muted);">
              ⏳ En attente de correction automatique...
            </div>
          </div>
        `}
      </div>
      
      <!-- Informations -->
      <div class="card" style="margin-bottom: 24px;">
        <h3 style="font-size: 1.2rem; margin-bottom: 16px;">Informations</h3>
        <div style="display: grid; gap: 12px;">
          <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--card-hover); border-radius: var(--radius-md);">
            <span style="color: var(--muted);">Date de rendu</span>
            <span style="font-weight: 600;">${formatDate(dueDate)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--card-hover); border-radius: var(--radius-md);">
            <span style="color: var(--muted);">Date de soumission</span>
            <span style="font-weight: 600;">${formatDate(new Date(submission.submittedAt))}</span>
          </div>
          ${submission.status === 'graded' && submission.gradedAt ? `
            <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--card-hover); border-radius: var(--radius-md);">
              <span style="color: var(--muted);">Date de correction</span>
              <span style="font-weight: 600;">${formatDate(new Date(submission.gradedAt))}</span>
            </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Bouton Annales si applicable -->
      ${isAnnalsMode ? `
        <div class="card">
          <div style="text-align: center;">
            <h3 style="font-size: 1.2rem; margin-bottom: 12px;">📖 Accéder aux Annales</h3>
            <p style="color: var(--muted); margin-bottom: 16px;">
              La date de rendu est passée. Vous pouvez maintenant consulter le corrigé complet.
            </p>
            <button 
              class="btn success" 
              onclick="window.location.hash='student-catalog'"
            >
              Voir les Annales
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Retourne un message selon le score
 * @param {number} score - Score en pourcentage
 * @returns {string}
 */
function getScoreMessage(score) {
  if (score >= 90) return 'Excellent travail ! 🎉';
  if (score >= 80) return 'Très bien ! 👍';
  if (score >= 70) return 'Bien ! Continuez ainsi.';
  if (score >= 60) return 'Correct, mais peut mieux faire.';
  return 'À améliorer.';
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

window.renderStudentResultView = renderStudentResultView;
export default { renderStudentResultView };

