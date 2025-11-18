/**
 * View Student Social - Vue sociale pour les élèves
 */

import { getClassSocialLeaderboard, getSocialComparisonData } from '../features-control/feature-social.js';
import { getCurrentUser } from '../features-control/feature-auth.js';

/**
 * Rend la vue sociale de l'élève
 * @param {HTMLElement} container - Conteneur de la vue
 */
export function renderStudentSocialView(container) {
  console.log('[View Student Social] Rendu du social');
  
  const currentUser = getCurrentUser();
  const leaderboard = getClassSocialLeaderboard();
  const comparisonData = getSocialComparisonData();
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          👥 Social
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Comparez vos performances avec vos camarades
        </p>
      </div>
      
      <!-- Comparaison sociale -->
      <div class="card" style="margin-bottom: 24px;">
        <h2 style="font-size: 1.25rem; margin-bottom: 16px;">Comparaison sociale</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          ${comparisonData.labels.map((label, idx) => {
            const score = comparisonData.scores[idx];
            return `
              <div class="card" style="text-align: center; padding: 20px; border-left: 4px solid var(--accent);">
                <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 8px;">
                  ${escapeHtml(label)}
                </div>
                <div style="font-size: 2rem; font-weight: 700; color: var(--accent);">
                  ${score}/100
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <!-- Leaderboard -->
      <div class="card">
        <h2 style="font-size: 1.25rem; margin-bottom: 16px;">Classement</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--card-border);">
                <th style="padding: 10px; text-align: left;">Rang</th>
                <th style="padding: 10px; text-align: left;">Élève</th>
                <th style="padding: 10px; text-align: center;">Score</th>
                <th style="padding: 10px; text-align: center;">Temps</th>
              </tr>
            </thead>
            <tbody>
              ${leaderboard.map((student, idx) => {
                const isCurrentUser = currentUser && student.name === currentUser.name;
                return `
                  <tr style="border-bottom: 1px solid var(--card-border); ${isCurrentUser ? 'background: var(--card-hover);' : ''}">
                    <td style="padding: 10px; font-weight: 600;">${idx + 1}</td>
                    <td style="padding: 10px; font-weight: ${isCurrentUser ? '600' : '400'};">
                      ${escapeHtml(student.name)} ${isCurrentUser ? '<span class="badge" style="background: var(--accent); color: white; margin-left: 8px;">Vous</span>' : ''}
                    </td>
                    <td style="padding: 10px; text-align: center; font-weight: 600;">${student.score}/100</td>
                    <td style="padding: 10px; text-align: center; color: var(--muted);">${student.avgTime}s</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Export global pour app.js
window.renderStudentSocialView = renderStudentSocialView;
export default { renderStudentSocialView };

