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
 * @param {HTMLElement} container - Conteneur de la vue
 */
export function renderTeacherFollowupSocialView(container) {
  const classes = getClasses();
  
  // Récupérer la classe sélectionnée depuis le localStorage
  const savedClassId = localStorage.getItem('SM_SO_SELECTED_CLASS_ID');
  let selectedClassId = null;
  if (savedClassId && classes.find(c => c.id === savedClassId)) {
    selectedClassId = savedClassId;
  } else if (classes.length > 0) {
    selectedClassId = classes[0].id;
    localStorage.setItem('SM_SO_SELECTED_CLASS_ID', selectedClassId);
  }
  
  if (!selectedClassId || classes.length === 0) {
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
  
  // Utiliser les stats sociales (pour l'instant, les fonctions ne filtrent pas encore par classe)
  const dynamics = getClassSocialDynamics();
  const leaderboard = getClassSocialLeaderboard().filter(student => student.name !== 'Moi');
  
  container.innerHTML = `
    <div style="width: 100%; max-width: 100%; margin: 0; padding: 24px 32px; box-sizing: border-box;">
      <div style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
        <div style="flex: 1; min-width: 200px;">
          <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
            📊 Analytics / Social Classe
          </h1>
          <p style="color: var(--muted); font-size: 1.05rem;">
            Analyse de la dynamique sociale et des performances de votre classe
          </p>
        </div>
        ${classes.length > 1 ? `
          <div style="display: flex; align-items: center; gap: 12px;">
            <label for="class-selector-social" style="font-weight: 600; color: var(--fg); white-space: nowrap;">
              Classe :
            </label>
            <select 
              id="class-selector-social" 
              style="
                padding: 10px 16px;
                border-radius: var(--radius-md);
                border: 1px solid var(--card-border);
                background: var(--card);
                color: var(--fg);
                font-size: 1rem;
                font-family: inherit;
                cursor: pointer;
                min-width: 250px;
                transition: all var(--transition-base);
              "
              onmouseover="this.style.borderColor='var(--accent)'"
              onmouseout="this.style.borderColor='var(--card-border)'"
              onfocus="this.style.borderColor='var(--accent)'; this.style.outline='2px solid var(--accent)'; this.style.outlineOffset='2px'"
              onblur="this.style.borderColor='var(--card-border)'; this.style.outline='none'"
            >
              ${classes.map(c => `
                <option value="${c.id}" ${c.id === selectedClassId ? 'selected' : ''}>
                  ${c.name || c.id}
                </option>
              `).join('')}
            </select>
          </div>
        ` : ''}
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
        <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; table-layout: fixed;">
            <colgroup>
              <col style="width: 40%;">
              <col style="width: 20%;">
              <col style="width: 20%;">
              <col style="width: 20%;">
            </colgroup>
            <thead>
              <tr style="border-bottom: 2px solid var(--card-border);">
                <th style="padding: 12px; text-align: left;">Élève</th>
                <th style="padding: 12px; text-align: center;">Score</th>
                <th style="padding: 12px; text-align: center;">Temps</th>
                <th style="padding: 12px; text-align: center;">Rang</th>
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
  
  // Event listener pour le sélecteur de classe
  if (classes.length > 1) {
    const classSelector = container.querySelector('#class-selector-social');
    if (classSelector) {
      classSelector.addEventListener('change', (e) => {
        const selectedClassId = e.target.value;
        localStorage.setItem('SM_SO_SELECTED_CLASS_ID', selectedClassId);
        // Re-rendre la vue avec la nouvelle classe
        renderTeacherFollowupSocialView(container);
      });
    }
  }
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

