/**
 * View Teacher Analytics - Conteneur pour la section Analytics enseignant
 * Gère les sous-routes : class-summary, social, submissions
 */

console.log('[View Teacher Analytics] Module en cours de chargement...');

import { renderClassSummaryView } from './view-class-summary.js';
import { renderTeacherFollowupSocialView } from './view-teacher-followup.js';
import { renderTeacherSubmissionsView } from './view-teacher-submissions.js';
import { getSubRoute } from '../../components/NavigationManager.js';

console.log('[View Teacher Analytics] Imports terminés');

/**
 * Rend la vue Analytics enseignant
 * @param {HTMLElement} container - Conteneur de la vue
 * @param {string} route - Route actuelle
 */
export function renderTeacherAnalyticsView(container, route = 'teacher-analytics') {
  console.log('[View Teacher Analytics] Rendu de l\'analytics, route:', route);
  
  const subRoute = getSubRoute(route);
  
  // Si pas de sous-route, rendre directement le résumé de classe par défaut
  const routeToRender = subRoute || 'class-summary';
  
  // Router vers la bonne vue selon la sous-route
  switch (routeToRender) {
    case 'class-summary':
      renderClassSummaryView(container);
      break;
    case 'social':
      // Rediriger vers la vue social existante
      renderTeacherFollowupSocialView(container);
      break;
    case 'submissions':
      // Rediriger vers la vue submissions existante
      renderTeacherSubmissionsView(container);
      break;
    default:
      container.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
          <h2>Sous-route inconnue</h2>
          <p style="color: var(--muted); margin: 16px 0;">
            La route "${routeToRender}" n'existe pas.
          </p>
        </div>
      `;
  }
}

// Export global pour app.js (doit être fait immédiatement au niveau du module)
try {
  window.renderTeacherAnalyticsView = renderTeacherAnalyticsView;
  console.log('[View Teacher Analytics] ✅ Fonction exportée globalement: renderTeacherAnalyticsView');
  console.log('[View Teacher Analytics] Vérification:', typeof window.renderTeacherAnalyticsView === 'function' ? 'OK' : 'ERREUR');
} catch (error) {
  console.error('[View Teacher Analytics] ❌ Erreur lors de l\'export global:', error);
}

// Export par défaut aussi
export default { renderTeacherAnalyticsView };

