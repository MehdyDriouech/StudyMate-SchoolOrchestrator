/**
 * View Teacher Content - Conteneur pour les contenus et curriculum de l'enseignant
 * Gère les sous-routes : studio, library, curriculum
 */

import { renderAiThemeStudioView } from './view-ai-theme-studio.js';
import { renderLibraryView } from './view-library.js';
import { renderCurriculumView } from './view-curriculum-builder.js';
import { getSubRoute } from '../../components/NavigationManager.js';
import { navigateTo } from '../../app.js';

/**
 * Rend la vue des contenus enseignant
 * @param {HTMLElement} container - Conteneur de la vue
 * @param {string} route - Route actuelle
 */
export function renderTeacherContentView(container, route = 'teacher-content') {
  console.log('[View Teacher Content] Rendu des contenus, route:', route);
  
  const subRoute = getSubRoute(route);
  
  // Si pas de sous-route, rendre directement la première (studio) au lieu de rediriger
  // La redirection est gérée dans app.js pour éviter les boucles
  const routeToRender = subRoute || 'studio';
  
  // Router vers la bonne vue selon la sous-route
  switch (routeToRender) {
    case 'studio':
      renderAiThemeStudioView(container);
      break;
    case 'library':
      renderLibraryView(container);
      break;
    case 'curriculum':
      renderCurriculumView(container);
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

// Export global pour app.js
window.renderTeacherContentView = renderTeacherContentView;
export default { renderTeacherContentView };

