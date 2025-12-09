/**
 * View Campus Admin Audit Logs - Logs d'audit
 */

import { getAuditLogs } from '../features-control/store-campus-admin.js';

export function renderCampusAdminAuditLogsView(container) {
  console.log('[View Campus Admin Audit Logs] Rendu de la vue logs d\'audit');
  
  const logs = getAuditLogs();
  
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          📋 Logs d'audit
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Historique des actions administratives
        </p>
      </div>
      
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; gap: 12px; flex: 1;">
            <select id="filter-action" style="padding: 8px 12px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
              <option value="">Toutes les actions</option>
              <option value="CREATE_SCHOOL">Créer établissement</option>
              <option value="UPDATE_SCHOOL">Modifier établissement</option>
              <option value="DELETE_SCHOOL">Supprimer établissement</option>
              <option value="CREATE_USER">Créer utilisateur</option>
              <option value="UPDATE_USER">Modifier utilisateur</option>
              <option value="DELETE_USER">Supprimer utilisateur</option>
              <option value="IMPORT_USERS">Importer utilisateurs</option>
              <option value="UPDATE_SETTINGS">Modifier paramètres</option>
            </select>
            <input type="date" id="filter-date-from" style="padding: 8px 12px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
            <input type="date" id="filter-date-to" style="padding: 8px 12px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
          </div>
        </div>
        
        <div style="display: grid; gap: 12px;">
          ${logs.length > 0 ? logs.map(log => `
            <div class="card" style="border-left: 4px solid var(--accent);">
              <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px; flex-wrap: wrap;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span class="badge" style="background: var(--accent); color: white;">${getActionLabel(log.action)}</span>
                    <span style="font-size: 0.85rem; color: var(--muted);">${formatDate(log.created_at)}</span>
                  </div>
                  <div style="font-size: 0.9rem; margin-bottom: 4px;">
                    <strong>${escapeHtml(log.user_name)}</strong>
                    ${log.entity_type && log.entity_id ? ` • ${getEntityTypeLabel(log.entity_type)} #${log.entity_id}` : ''}
                  </div>
                  ${log.metadata ? `
                    <div style="font-size: 0.85rem; color: var(--muted); margin-top: 8px; padding: 8px; background: var(--card-hover); border-radius: var(--radius-md);">
                      <details>
                        <summary style="cursor: pointer; font-weight: 500;">Voir les détails</summary>
                        <pre style="margin-top: 8px; font-size: 0.8rem; overflow-x: auto;">${escapeHtml(JSON.stringify(log.metadata, null, 2))}</pre>
                      </details>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('') : `
            <div style="text-align: center; padding: 40px; color: var(--muted);">
              <div style="font-size: 3rem; margin-bottom: 16px;">📋</div>
              <p>Aucun log d'audit</p>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
  
  setupEventListeners(container);
}

function setupEventListeners(container) {
  const filterAction = document.getElementById('filter-action');
  const filterDateFrom = document.getElementById('filter-date-from');
  const filterDateTo = document.getElementById('filter-date-to');
  
  const applyFilters = () => {
    const logs = getAuditLogs({
      action: filterAction.value || undefined,
      date_from: filterDateFrom.value || undefined,
      date_to: filterDateTo.value || undefined
    });
    // Re-rendre avec les filtres (simplifié pour l'instant)
    renderCampusAdminAuditLogsView(container);
  };
  
  if (filterAction) filterAction.addEventListener('change', applyFilters);
  if (filterDateFrom) filterDateFrom.addEventListener('change', applyFilters);
  if (filterDateTo) filterDateTo.addEventListener('change', applyFilters);
}

function getActionLabel(action) {
  const labels = {
    CREATE_SCHOOL: 'Créer établissement',
    UPDATE_SCHOOL: 'Modifier établissement',
    DELETE_SCHOOL: 'Supprimer établissement',
    CREATE_USER: 'Créer utilisateur',
    UPDATE_USER: 'Modifier utilisateur',
    DELETE_USER: 'Supprimer utilisateur',
    IMPORT_USERS: 'Importer utilisateurs',
    UPDATE_SETTINGS: 'Modifier paramètres'
  };
  return labels[action] || action;
}

function getEntityTypeLabel(type) {
  const labels = {
    school: 'Établissement',
    user: 'Utilisateur',
    settings: 'Paramètres',
    import: 'Import'
  };
  return labels[type] || type;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('fr-FR');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

