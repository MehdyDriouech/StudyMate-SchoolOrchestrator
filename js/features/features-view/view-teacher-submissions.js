/**
 * View Teacher Submissions - Vue des rendus et corrections pour l'enseignant
 */

import { loadSubmissionsData } from '../features-control/feature-teacher-submissions.js';
import ActivityTimelineStore from '../features-control/store-timeline.js';
import { getCurrentUser } from '../features-control/feature-auth.js';

let submissionsContainer = null;

/**
 * Rend la vue soumissions enseignant
 * @param {HTMLElement} container - Conteneur de la vue
 */
export function renderTeacherSubmissionsView(container) {
  console.log('[View Teacher Submissions] Rendu des soumissions');
  
  submissionsContainer = container;
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="text-align: center; padding: 40px; color: var(--muted);">
        Chargement des soumissions...
      </div>
    </div>
  `;
  
  // Logger l'événement de consultation
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.role === 'teacher') {
    ActivityTimelineStore.logEvent('teacher_viewed_submissions', currentUser.email, currentUser.role, {});
  }
  
  // Charger les données
  setTimeout(() => {
    renderSubmissionsContent();
  }, 100);
}

/**
 * Rend le contenu des soumissions
 */
function renderSubmissionsContent() {
  const submissions = loadSubmissionsData();
  
  if (!submissions || submissions.length === 0) {
    submissionsContainer.innerHTML = `
      <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
            📋 Rendus / Corrections
          </h1>
          <p style="color: var(--muted); font-size: 1.05rem;">
            Gestion des devoirs rendus par vos élèves
          </p>
        </div>
        
        <div class="card" style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 3rem; margin-bottom: 16px;">📭</div>
          <h2 style="color: var(--muted); margin-bottom: 8px;">Aucun rendu</h2>
          <p style="color: var(--muted);">
            Aucun devoir n'a encore été rendu par vos élèves.
          </p>
        </div>
      </div>
    `;
    return;
  }
  
  submissionsContainer.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          📋 Rendus / Corrections
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Gestion des devoirs rendus par vos élèves
        </p>
      </div>
      
      <div class="card">
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--card-border);">
                <th style="padding: 12px; text-align: left;">Élève</th>
                <th style="padding: 12px; text-align: left;">Thème</th>
                <th style="padding: 12px; text-align: center;">Date rendu</th>
                <th style="padding: 12px; text-align: center;">Score</th>
                <th style="padding: 12px; text-align: center;">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${submissions.map(submission => `
                <tr style="border-bottom: 1px solid var(--card-border);">
                  <td style="padding: 12px;">
                    <div style="font-weight: 600;">${escapeHtml(submission.studentName || submission.studentId)}</div>
                    <div style="font-size: 0.85rem; color: var(--muted);">${escapeHtml(submission.className || submission.classId)}</div>
                  </td>
                  <td style="padding: 12px;">
                    <div style="font-weight: 600;">${escapeHtml(submission.themeTitle || submission.themeId)}</div>
                    ${submission.themeSubject ? `
                      <div style="font-size: 0.85rem; color: var(--muted);">${escapeHtml(submission.themeSubject)}</div>
                    ` : ''}
                  </td>
                  <td style="padding: 12px; text-align: center; color: var(--muted);">
                    ${formatDate(new Date(submission.submittedAt))}
                  </td>
                  <td style="padding: 12px; text-align: center;">
                    ${submission.status === 'graded' && submission.score !== null ? `
                      <span style="font-weight: 700; font-size: 1.1rem; color: ${getScoreColor(submission.score)};">
                        ${submission.score}%
                      </span>
                    ` : '<span style="color: var(--muted);">—</span>'}
                  </td>
                  <td style="padding: 12px; text-align: center;">
                    ${renderStatusBadge(submission.status)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Statistiques -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 24px;">
        <div class="card" style="text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 8px;">📝</div>
          <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;">
            ${submissions.length}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">Total rendus</div>
        </div>
        <div class="card" style="text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 8px;">✅</div>
          <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;">
            ${submissions.filter(s => s.status === 'graded').length}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">Corrigés</div>
        </div>
        <div class="card" style="text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 8px;">⏳</div>
          <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;">
            ${submissions.filter(s => s.status === 'submitted').length}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">En attente</div>
        </div>
        ${(() => {
          const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.score !== null);
          const avgScore = gradedSubmissions.length > 0
            ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length)
            : 0;
          return `
            <div class="card" style="text-align: center;">
              <div style="font-size: 2rem; margin-bottom: 8px;">📊</div>
              <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;">
                ${avgScore}%
              </div>
              <div style="font-size: 0.9rem; color: var(--muted);">Moyenne</div>
            </div>
          `;
        })()}
      </div>
    </div>
  `;
}

/**
 * Rend un badge de statut
 * @param {string} status - Statut
 * @returns {string}
 */
function renderStatusBadge(status) {
  const badges = {
    'submitted': '<span class="badge" style="background: var(--warning); color: white;">Rendu</span>',
    'graded': '<span class="badge" style="background: var(--success); color: white;">Corrigé</span>'
  };
  
  return badges[status] || '<span class="badge ghost">Inconnu</span>';
}

/**
 * Retourne la couleur selon le score
 * @param {number} score - Score
 * @returns {string}
 */
function getScoreColor(score) {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  return 'var(--danger)';
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
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

window.renderTeacherSubmissionsView = renderTeacherSubmissionsView;
export default { renderTeacherSubmissionsView };

