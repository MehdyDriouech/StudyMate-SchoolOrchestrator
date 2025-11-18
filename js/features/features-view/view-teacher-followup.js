/**
 * View Teacher Followup - Conteneur pour le suivi des élèves
 * Gère les sous-routes : submissions, social
 */

import { renderTeacherSubmissionsView } from './view-teacher-submissions.js';
import { getSubRoute } from '../../components/NavigationManager.js';
import { getClassSocialDynamics, getClassSocialLeaderboard } from '../features-control/feature-social.js';
import { getClasses } from '../features-control/store-multischool.js';
import { navigateTo } from '../../app.js';

/**
 * Rend la vue de suivi des élèves
 * @param {HTMLElement} container - Conteneur de la vue
 * @param {string} route - Route actuelle
 */
export function renderTeacherFollowupView(container, route = 'teacher-followup') {
  console.log('[View Teacher Followup] Rendu du suivi, route:', route);
  
  const subRoute = getSubRoute(route);
  
  // Si pas de sous-route, rendre directement la première (submissions) au lieu de rediriger
  const routeToRender = subRoute || 'submissions';
  
  // Router vers la bonne vue selon la sous-route
  switch (routeToRender) {
    case 'submissions':
      renderTeacherSubmissionsView(container);
      break;
    case 'social':
      renderTeacherFollowupSocialView(container);
      break;
    default:
      container.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
          <h2>Sous-route inconnue</h2>
          <p style="color: var(--muted); margin: 16px 0;">
            La route "${subRoute}" n'existe pas.
          </p>
        </div>
      `;
  }
}

/**
 * Rend la vue analytics/social pour le suivi
 */
function renderTeacherFollowupSocialView(container) {
  const classes = getClasses();
  const firstClass = classes[0];
  
  if (!firstClass) {
    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 16px;">📊</div>
        <h2>Aucune classe disponible</h2>
        <p style="color: var(--muted); margin: 16px 0;">
          Vous devez avoir au moins une classe pour voir les analytics sociales.
        </p>
      </div>
    `;
    return;
  }
  
  const dynamics = getClassSocialDynamics();
  const leaderboard = getClassSocialLeaderboard().filter(student => student.name !== 'Moi');
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          📊 Analytics / Social Classe
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Analyse de la dynamique sociale et des performances de votre classe
        </p>
      </div>
      
      <!-- Statistiques principales -->
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      ">
        <div class="card" style="text-align: center; padding: 20px;">
          <div style="font-size: 2rem; font-weight: 700; color: var(--success); margin-bottom: 4px;">
            ${dynamics.progressingRegularly}%
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">
            Progressent régulièrement
          </div>
        </div>
        
        <div class="card" style="text-align: center; padding: 20px;">
          <div style="font-size: 2rem; font-weight: 700; color: var(--accent); margin-bottom: 4px;">
            ${dynamics.fastLearners}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">
            Apprenants rapides
          </div>
        </div>
        
        <div class="card" style="text-align: center; padding: 20px;">
          <div style="font-size: 2rem; font-weight: 700; color: var(--warning); margin-bottom: 4px;">
            ${dynamics.belowGroup}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">
            En dessous du groupe
          </div>
        </div>
      </div>
      
      <!-- Leaderboard -->
      <div class="card">
        <h2 style="font-size: 1.25rem; margin-bottom: 16px;">Classement social</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--card-border);">
                <th style="padding: 10px; text-align: left;">Élève</th>
                <th style="padding: 10px; text-align: center;">Score</th>
                <th style="padding: 10px; text-align: center;">Temps</th>
                <th style="padding: 10px; text-align: center;">Rang</th>
              </tr>
            </thead>
            <tbody>
              ${leaderboard.map((student, idx) => `
                <tr style="border-bottom: 1px solid var(--card-border);">
                  <td style="padding: 10px; font-weight: 400;">${student.name}</td>
                  <td style="padding: 10px; text-align: center;">${student.score}/100</td>
                  <td style="padding: 10px; text-align: center;">${student.avgTime}s</td>
                  <td style="padding: 10px; text-align: center;">
                    <span class="badge" style="
                      background: ${getRankColor(student.socialRank)};
                      color: white;
                      font-size: 0.75rem;
                      padding: 4px 8px;
                    ">
                      ${student.socialRank}${getOrdinalSuffix(student.socialRank)}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function getRankColor(rank) {
  if (rank === 1) return 'var(--warning, #f59e0b)';
  if (rank === 2) return 'var(--muted, #64748b)';
  if (rank === 3) return 'var(--info, #3b82f6)';
  return 'var(--accent, #0ea5e9)';
}

function getOrdinalSuffix(num) {
  if (num === 1) return 'er';
  return 'e';
}

// Export global pour app.js
window.renderTeacherFollowupView = renderTeacherFollowupView;
export default { renderTeacherFollowupView };

