/**
 * View Dashboard Campus Admin - Interface du dashboard administrateur campus
 */

import { getCampusAdminStats } from '../features-control/store-campus-admin.js';
import { navigateTo } from '../../app.js';

/**
 * Rend la vue du dashboard administrateur campus
 * @param {HTMLElement} container - Conteneur de la vue
 */
export async function renderDashboardCampusAdminView(container) {
  console.log('[View Dashboard Campus Admin] Rendu du dashboard administrateur campus');
  
  // Charger les statistiques
  const stats = getCampusAdminStats();
  
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <!-- En-tête -->
      <div style="margin-bottom: 32px;">
        <h1 style="
          font-size: 2rem;
          font-weight: 700;
          background: var(--btn-bg);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        ">
          🏛️ Administration Campus
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Gestion globale des établissements et utilisateurs
        </p>
      </div>

      <!-- Cartes de statistiques -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 32px;">
        <div class="card" style="text-align: center; padding: 24px; cursor: pointer; transition: transform 0.2s;" 
             onmouseover="this.style.transform='scale(1.02)'" 
             onmouseout="this.style.transform='scale(1)'"
             onclick="window.navigateTo('campus-admin/schools')">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🏫</div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--accent); margin-bottom: 4px;">${stats.total_schools}</div>
          <div style="color: var(--muted); font-size: 0.9rem;">
            Établissements
            <div style="font-size: 0.75rem; margin-top: 4px; color: var(--success);">
              ${stats.active_schools} actifs
            </div>
          </div>
        </div>
        
        <div class="card" style="text-align: center; padding: 24px; cursor: pointer; transition: transform 0.2s;" 
             onmouseover="this.style.transform='scale(1.02)'" 
             onmouseout="this.style.transform='scale(1)'"
             onclick="window.navigateTo('campus-admin/users')">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">👥</div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--accent); margin-bottom: 4px;">${stats.total_users}</div>
          <div style="color: var(--muted); font-size: 0.9rem;">
            Utilisateurs
            <div style="font-size: 0.75rem; margin-top: 4px; color: var(--success);">
              ${stats.active_users} actifs
            </div>
          </div>
        </div>
        
        <div class="card" style="text-align: center; padding: 24px;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">📚</div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--accent); margin-bottom: 4px;">${stats.total_classes}</div>
          <div style="color: var(--muted); font-size: 0.9rem;">Classes</div>
        </div>
        
        <div class="card" style="text-align: center; padding: 24px;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🎓</div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--accent); margin-bottom: 4px;">${stats.total_students}</div>
          <div style="color: var(--muted); font-size: 0.9rem;">Étudiants</div>
        </div>
      </div>

      <!-- Actions rapides -->
      <div class="card" style="margin-bottom: 32px;">
        <h2 style="margin: 0 0 16px; font-size: 1.25rem;">Actions rapides</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <button class="btn primary" id="btn-manage-schools">
            🏫 Gérer les établissements
          </button>
          <button class="btn primary" id="btn-manage-users">
            👥 Gérer les utilisateurs
          </button>
          <button class="btn primary" id="btn-import-users">
            📥 Importer des utilisateurs
          </button>
          <button class="btn primary" id="btn-settings">
            ⚙️ Paramètres globaux
          </button>
          <button class="btn primary" id="btn-audit-logs">
            📋 Logs d'audit
          </button>
        </div>
      </div>

      <!-- Activité récente -->
      <div class="card" style="margin-bottom: 32px;">
        <h2 style="margin: 0 0 16px; font-size: 1.25rem;">Activité récente</h2>
        <div style="display: grid; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--card); border-radius: var(--radius-md);">
            <span style="font-size: 1.5rem;">📥</span>
            <div style="flex: 1;">
              <div style="font-weight: 500;">${stats.recent_imports} import(s) cette semaine</div>
              <div style="font-size: 0.85rem; color: var(--muted);">${stats.pending_imports} en cours</div>
            </div>
            <button class="btn ghost" onclick="window.navigateTo('campus-admin/imports')">Voir</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Event listeners pour les boutons
  setupEventListeners();
}

/**
 * Configure les event listeners
 */
function setupEventListeners() {
  const btnManageSchools = document.getElementById('btn-manage-schools');
  const btnManageUsers = document.getElementById('btn-manage-users');
  const btnImportUsers = document.getElementById('btn-import-users');
  const btnSettings = document.getElementById('btn-settings');
  const btnAuditLogs = document.getElementById('btn-audit-logs');
  
  if (btnManageSchools) {
    btnManageSchools.addEventListener('click', () => {
      navigateTo('campus-admin/schools');
    });
  }
  
  if (btnManageUsers) {
    btnManageUsers.addEventListener('click', () => {
      navigateTo('campus-admin/users');
    });
  }
  
  if (btnImportUsers) {
    btnImportUsers.addEventListener('click', () => {
      navigateTo('campus-admin/imports');
    });
  }
  
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      navigateTo('campus-admin/settings');
    });
  }
  
  if (btnAuditLogs) {
    btnAuditLogs.addEventListener('click', () => {
      navigateTo('campus-admin/audit-logs');
    });
  }
}

// Export global pour que app.js puisse l'appeler
window.renderDashboardCampusAdminView = renderDashboardCampusAdminView;
window.navigateTo = navigateTo;

export default { renderDashboardCampusAdminView };

