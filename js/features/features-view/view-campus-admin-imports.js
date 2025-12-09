/**
 * View Campus Admin Imports - Gestion des imports utilisateurs
 */

import { getAllImports, getImportById, createImport } from '../features-control/store-campus-admin.js';

export function renderCampusAdminImportsView(container) {
  console.log('[View Campus Admin Imports] Rendu de la vue imports');
  
  const imports = getAllImports();
  
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          📥 Imports d'utilisateurs
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Gérez les imports d'utilisateurs en masse
        </p>
      </div>
      
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 1.25rem; margin: 0;">Historique des imports</h2>
          <button class="btn primary" id="btn-new-import">+ Nouvel import</button>
        </div>
        
        <div style="display: grid; gap: 12px;">
          ${imports.map(imp => `
            <div class="card" style="border-left: 4px solid ${getStatusColor(imp.status)};">
              <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px; flex-wrap: wrap;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0;">
                      ${escapeHtml(imp.file_name || 'Import sans nom')}
                    </h3>
                    <span class="badge" style="background: ${getStatusColor(imp.status)}; color: white;">
                      ${getStatusLabel(imp.status)}
                    </span>
                  </div>
                  <div style="font-size: 0.85rem; color: var(--muted); margin-bottom: 4px;">
                    Type: ${getTypeLabel(imp.type)} • ${formatDate(imp.created_at)}
                  </div>
                  ${imp.summary ? `
                    <div style="font-size: 0.85rem; color: var(--muted);">
                      ${imp.summary.total} total • ${imp.summary.success} réussis • ${imp.summary.errors} erreurs
                    </div>
                  ` : ''}
                </div>
                <button class="btn ghost" data-view-import="${imp.id}">Détails</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  setupEventListeners(container);
}

function setupEventListeners(container) {
  const btnNew = document.getElementById('btn-new-import');
  if (btnNew) {
    btnNew.addEventListener('click', () => openNewImportModal(container));
  }
  
  container.querySelectorAll('[data-view-import]').forEach(btn => {
    btn.addEventListener('click', () => {
      const importId = parseInt(btn.dataset.viewImport);
      openImportDetailsModal(importId);
    });
  });
}

function openNewImportModal(container) {
  const modal = createModal(`
    <h2 style="margin: 0 0 16px;">Nouvel import</h2>
    <form id="new-import-form" style="display: grid; gap: 16px;">
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Type *</label>
        <select name="type" required style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
          <option value="users_students">Étudiants</option>
          <option value="users_teachers">Enseignants</option>
          <option value="users_directors">Directeurs</option>
        </select>
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Fichier (JSON)</label>
        <textarea name="users_json" placeholder='[{"first_name":"John","last_name":"Doe","email":"john@example.com","role":"student","school_id":1}]' 
                  style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md); min-height: 150px; font-family: monospace; font-size: 0.85rem;"></textarea>
        <div style="font-size: 0.75rem; color: var(--muted); margin-top: 4px;">
          Format JSON : tableau d'objets utilisateurs
        </div>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
        <button type="button" class="btn ghost" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button type="submit" class="btn primary">Importer</button>
      </div>
    </form>
  `);
  
  document.body.appendChild(modal);
  
  const form = modal.querySelector('#new-import-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    try {
      const usersJson = formData.get('users_json');
      const users = usersJson ? JSON.parse(usersJson) : [];
      createImport({
        type: formData.get('type'),
        file_name: `import_${new Date().toISOString().split('T')[0]}.json`,
        users
      });
      modal.remove();
      setTimeout(() => renderCampusAdminImportsView(container), 500);
    } catch (error) {
      alert('Erreur : Format JSON invalide');
    }
  });
}

function openImportDetailsModal(importId) {
  const importItem = getImportById(importId);
  if (!importItem) return;
  
  const modal = createModal(`
    <h2 style="margin: 0 0 16px;">Détails de l'import</h2>
    <div style="display: grid; gap: 12px;">
      <div>
        <strong>Fichier:</strong> ${escapeHtml(importItem.file_name || 'N/A')}
      </div>
      <div>
        <strong>Type:</strong> ${getTypeLabel(importItem.type)}
      </div>
      <div>
        <strong>Statut:</strong> <span class="badge" style="background: ${getStatusColor(importItem.status)}; color: white;">${getStatusLabel(importItem.status)}</span>
      </div>
      <div>
        <strong>Date:</strong> ${formatDate(importItem.created_at)}
      </div>
      ${importItem.summary ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--card-border);">
          <strong>Résumé:</strong>
          <div style="margin-top: 8px;">
            <div>Total: ${importItem.summary.total}</div>
            <div style="color: var(--success);">Réussis: ${importItem.summary.success}</div>
            <div style="color: var(--danger);">Erreurs: ${importItem.summary.errors}</div>
          </div>
          ${importItem.summary.errors_list && importItem.summary.errors_list.length > 0 ? `
            <div style="margin-top: 12px;">
              <strong>Erreurs:</strong>
              <ul style="margin-top: 8px; padding-left: 20px;">
                ${importItem.summary.errors_list.map(err => `<li>Ligne ${err.line}: ${err.reason || err.email}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      ` : ''}
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;">
        <button type="button" class="btn ghost" onclick="this.closest('.modal-overlay').remove()">Fermer</button>
      </div>
    </div>
  `);
  
  document.body.appendChild(modal);
}

function getStatusColor(status) {
  const colors = {
    pending: 'var(--warning)',
    running: 'var(--accent)',
    completed: 'var(--success)',
    failed: 'var(--danger)'
  };
  return colors[status] || 'var(--muted)';
}

function getStatusLabel(status) {
  const labels = {
    pending: 'En attente',
    running: 'En cours',
    completed: 'Terminé',
    failed: 'Échoué'
  };
  return labels[status] || status;
}

function getTypeLabel(type) {
  const labels = {
    users_students: 'Étudiants',
    users_teachers: 'Enseignants',
    users_directors: 'Directeurs'
  };
  return labels[type] || type;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('fr-FR');
}

function createModal(content) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center;
    z-index: 10000; padding: 20px; backdrop-filter: blur(4px);
  `;
  
  const modal = document.createElement('div');
  modal.className = 'modal-content';
  modal.style.cssText = `
    background: var(--card); border-radius: var(--radius-lg); padding: 24px;
    max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  `;
  modal.innerHTML = content;
  overlay.appendChild(modal);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  
  return overlay;
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

