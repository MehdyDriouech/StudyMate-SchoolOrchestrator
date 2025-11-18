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
  
  // Nettoyer la route en enlevant les query params avant d'extraire la sous-route
  const cleanRoute = route.includes('?') ? route.split('?')[0] : route;
  const subRoute = getSubRoute(cleanRoute);
  
  // Si pas de sous-route, rendre directement la première (studio) au lieu de rediriger
  // La redirection est gérée dans app.js pour éviter les boucles
  const routeToRender = subRoute || 'studio';
  
  // Extraire les query params depuis l'URL
  const hash = window.location.hash.slice(1);
  const queryString = hash.includes('?') ? hash.split('?')[1] : null;
  const queryParams = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : null;
  
  // Router vers la bonne vue selon la sous-route
  switch (routeToRender) {
    case 'studio':
      renderAiThemeStudioView(container, route, queryParams);
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

