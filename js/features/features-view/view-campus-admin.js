/**
 * View Campus Admin - Conteneur pour l'administration campus
 * Gère les sous-routes : schools, users, imports, settings, audit-logs
 */

import { getSubRoute } from '../../components/NavigationManager.js';
import { navigateTo } from '../../app.js';

let adminContainer = null;

/**
 * Rend la vue d'administration campus
 * @param {HTMLElement} container - Conteneur de la vue
 * @param {string} route - Route actuelle
 */
export function renderCampusAdminView(container, route = 'campus-admin') {
  console.log('[View Campus Admin] Rendu de l\'administration campus, route:', route);
  
  adminContainer = container;
  const subRoute = getSubRoute(route);
  
  // Si pas de sous-route, rediriger vers le dashboard
  if (!subRoute) {
    navigateTo('dashboard-campus-admin');
    return;
  }
  
  // Router vers la bonne vue selon la sous-route
  switch (subRoute) {
    case 'schools':
      import('./view-campus-admin-schools.js').then(m => {
        m.renderCampusAdminSchoolsView(container);
      });
      break;
    case 'users':
      import('./view-campus-admin-users.js').then(m => {
        m.renderCampusAdminUsersView(container);
      });
      break;
    case 'imports':
      import('./view-campus-admin-imports.js').then(m => {
        m.renderCampusAdminImportsView(container);
      });
      break;
    case 'settings':
      import('./view-campus-admin-settings.js').then(m => {
        m.renderCampusAdminSettingsView(container);
      });
      break;
    case 'audit-logs':
      import('./view-campus-admin-auditlogs.js').then(m => {
        m.renderCampusAdminAuditLogsView(container);
      });
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

// Export global
window.renderCampusAdminView = renderCampusAdminView;

export default { renderCampusAdminView };

