/**
 * View Social Admin - Interface d'administration des entrées sociales
 * Accessible aux rôles Direction/Admin/Pedago
 * PUT/DELETE réservés au Directeur uniquement
 */

import {
  fetchSocialEntries,
  createSocialEntry,
  updateSocialEntry,
  deleteSocialEntry,
  getSocialEntries,
  isLoading,
  getError
} from '../features-control/store-social-entries.js';
import { getUserRole } from '../features-control/feature-auth.js';

let socialAdminContainer = null;
let socialAdminModal = null;
let currentEditingEntry = null;

/**
 * Rend la vue Social Admin
 * @param {HTMLElement} container - Conteneur de la vue
 */
export async function renderSocialAdminView(container) {
  console.log('[View Social Admin] Rendu de la vue Social Admin');
  socialAdminContainer = container;
  
  const role = getUserRole();
  const canAccess = ['director', 'admin', 'pedago'].includes(role);
  const canEdit = role === 'director'; // PUT/DELETE réservés au Directeur
  
  if (!canAccess) {
    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 16px;">🔒</div>
        <h2>Accès réservé</h2>
        <p style="color: var(--muted); margin: 16px 0;">
          Cette page est réservée aux rôles Direction, Admin et Référent Pédagogique.
        </p>
        <button class="btn primary" onclick="window.location.hash='dashboard-director'">
          Retour au dashboard
        </button>
      </div>
    `;
    return;
  }
  
  // Afficher un loader
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px; text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 16px; animation: pulse 1.5s ease-in-out infinite;">⏳</div>
      <p style="color: var(--muted);">Chargement des entrées sociales...</p>
    </div>
  `;
  
  try {
    await fetchSocialEntries();
    renderSocialAdminContent(container, canEdit);
  } catch (error) {
    console.error('[View Social Admin] Erreur:', error);
    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
        <h2>Erreur de chargement</h2>
        <p style="color: var(--danger); margin: 16px 0;">
          ${escapeHtml(getError() || error.message)}
        </p>
        <button class="btn primary" onclick="location.reload()">Réessayer</button>
      </div>
    `;
  }
}

/**
 * Rend le contenu de la vue Social Admin
 * @param {HTMLElement} container - Conteneur
 * @param {boolean} canEdit - Si l'utilisateur peut éditer/supprimer
 */
function renderSocialAdminContent(container, canEdit) {
  const entries = getSocialEntries();
  const role = getUserRole();
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
        <div>
          <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
            ⚙️ Administration Social
          </h1>
          <p style="color: var(--muted);">
            Gérez les configurations, règles et messages sociaux
          </p>
        </div>
        ${['director', 'admin', 'pedago'].includes(role) ? `
          <button id="btn-create-entry" class="btn primary">
            ➕ Nouvelle entrée
          </button>
        ` : ''}
      </div>
      
      <div id="social-admin-notification" class="social-admin-notification" aria-live="polite"></div>
      
      ${entries.length === 0 ? `
        <div class="card" style="text-align: center; padding: 40px;">
          <div style="font-size: 3rem; margin-bottom: 16px;">📭</div>
          <h3>Aucune entrée sociale</h3>
          <p style="color: var(--muted); margin: 16px 0;">
            Créez votre première entrée sociale pour commencer.
          </p>
        </div>
      ` : `
        <div class="card">
          <h2 style="font-size: 1.25rem; margin-bottom: 16px;">Entrées sociales</h2>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
              <thead>
                <tr style="border-bottom: 2px solid var(--card-border);">
                  <th style="padding: 10px; text-align: left;">Type</th>
                  <th style="padding: 10px; text-align: left;">Titre</th>
                  <th style="padding: 10px; text-align: left;">Description</th>
                  <th style="padding: 10px; text-align: center;">École</th>
                  <th style="padding: 10px; text-align: center;">Créé le</th>
                  <th style="padding: 10px; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${entries.map(entry => renderEntryRow(entry, canEdit)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `}
    </div>
    
    <style>
      .social-admin-notification {
        min-height: 32px;
        margin-bottom: 16px;
        border-radius: var(--radius-md);
        padding: 8px 16px;
        background: rgba(16,185,129,0.15);
        color: var(--success, #16a34a);
        font-weight: 600;
        display: none;
      }
      .social-admin-notification.visible {
        display: block;
      }
      .social-admin-notification.error {
        background: rgba(239,68,68,0.15);
        color: var(--danger);
      }
    </style>
  `;
  
  // Bind events
  const createBtn = container.querySelector('#btn-create-entry');
  if (createBtn) {
    createBtn.addEventListener('click', () => openEntryModal(null, canEdit));
  }
  
  container.querySelectorAll('[data-edit-entry]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.editEntry);
      const entry = entries.find(e => e.id === id);
      if (entry) {
        openEntryModal(entry, canEdit);
      }
    });
  });
  
  container.querySelectorAll('[data-delete-entry]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.deleteEntry);
      if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée sociale ?')) {
        try {
          await deleteSocialEntry(id);
          showNotification('✅ Entrée sociale supprimée avec succès');
          await fetchSocialEntries();
          renderSocialAdminContent(container, canEdit);
        } catch (error) {
          showNotification(`❌ Erreur: ${error.message}`, true);
        }
      }
    });
  });
}

/**
 * Rend une ligne du tableau d'entrées
 */
function renderEntryRow(entry, canEdit) {
  const typeLabels = {
    rule: { label: 'Règle', icon: '📋', color: 'var(--accent)' },
    message: { label: 'Message', icon: '💬', color: 'var(--success, #16a34a)' },
    config: { label: 'Config', icon: '⚙️', color: 'var(--warning)' }
  };
  
  const typeInfo = typeLabels[entry.type] || { label: entry.type, icon: '📝', color: 'var(--muted)' };
  
  return `
    <tr style="border-bottom: 1px solid var(--card-border);">
      <td style="padding: 10px;">
        <span class="badge" style="background: ${typeInfo.color}; color: white;">
          ${typeInfo.icon} ${typeInfo.label}
        </span>
      </td>
      <td style="padding: 10px; font-weight: 600;">${escapeHtml(entry.title)}</td>
      <td style="padding: 10px; color: var(--muted);">
        ${escapeHtml(entry.description || '—')}
      </td>
      <td style="padding: 10px; text-align: center;">
        ${entry.school_id ? `École ${entry.school_id}` : '<span style="color: var(--muted);">Global</span>'}
      </td>
      <td style="padding: 10px; text-align: center; color: var(--muted); font-size: 0.85rem;">
        ${formatDate(entry.created_at)}
      </td>
      <td style="padding: 10px; text-align: center;">
        <div style="display: flex; gap: 8px; justify-content: center;">
          <button class="btn ghost" data-edit-entry="${entry.id}">
            👁️ Voir
          </button>
          ${canEdit ? `
            <button class="btn ghost" data-edit-entry="${entry.id}">
              ✏️ Modifier
            </button>
            <button class="btn ghost" data-delete-entry="${entry.id}" style="color: var(--danger);">
              🗑️ Supprimer
            </button>
          ` : `
            <span style="color: var(--muted); font-size: 0.85rem;">
              (Directeur uniquement)
            </span>
          `}
        </div>
      </td>
    </tr>
  `;
}

/**
 * Ouvre la modale de création/édition d'entrée
 */
function openEntryModal(entry, canEdit) {
  currentEditingEntry = entry;
  const isEdit = entry !== null;
  
  socialAdminModal?.remove();
  socialAdminModal = document.createElement('div');
  socialAdminModal.className = 'social-admin-modal';
  socialAdminModal.innerHTML = `
    <div class="social-admin-modal__backdrop" data-close></div>
    <div class="card social-admin-modal__dialog">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0;">${isEdit ? 'Modifier l\'entrée' : 'Nouvelle entrée sociale'}</h3>
        <button class="btn ghost" data-close>✕</button>
      </div>
      
      ${!canEdit && isEdit ? `
        <div style="padding: 12px; background: rgba(239,68,68,0.1); border-radius: var(--radius-md); margin-bottom: 16px; color: var(--danger);">
          ⚠️ Seul le Directeur peut modifier ou supprimer cette configuration sociale.
        </div>
      ` : ''}
      
      <form id="social-entry-form">
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Type *</label>
          <select id="entry-type" required ${!canEdit && isEdit ? 'disabled' : ''} style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
            <option value="">Sélectionner un type</option>
            <option value="rule" ${entry?.type === 'rule' ? 'selected' : ''}>Règle</option>
            <option value="message" ${entry?.type === 'message' ? 'selected' : ''}>Message</option>
            <option value="config" ${entry?.type === 'config' ? 'selected' : ''}>Configuration</option>
          </select>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Titre *</label>
          <input type="text" id="entry-title" required ${!canEdit && isEdit ? 'disabled' : ''} value="${escapeHtml(entry?.title || '')}" style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Description</label>
          <textarea id="entry-description" rows="3" ${!canEdit && isEdit ? 'disabled' : ''} style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md); resize: vertical;">${escapeHtml(entry?.description || '')}</textarea>
        </div>
        
        <div style="margin-bottom: 16px;">
          <label style="display: block; margin-bottom: 4px; font-weight: 600;">Payload (JSON)</label>
          <textarea id="entry-payload" rows="4" ${!canEdit && isEdit ? 'disabled' : ''} style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md); font-family: monospace; font-size: 0.85rem; resize: vertical;">${entry?.payload ? JSON.stringify(entry.payload, null, 2) : ''}</textarea>
          <small style="color: var(--muted);">Format JSON valide (optionnel)</small>
        </div>
        
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button type="button" class="btn ghost" data-close>Annuler</button>
          ${isEdit && canEdit ? `
            <button type="submit" class="btn primary">Enregistrer</button>
          ` : !isEdit ? `
            <button type="submit" class="btn primary">Créer</button>
          ` : ''}
        </div>
      </form>
    </div>
    
    <style>
      .social-admin-modal {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1100;
      }
      .social-admin-modal__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15,23,42,0.6);
        backdrop-filter: blur(4px);
      }
      .social-admin-modal__dialog {
        position: relative;
        width: calc(100% - 32px);
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        z-index: 1;
      }
    </style>
  `;
  
  document.body.appendChild(socialAdminModal);
  
  // Bind form submit
  const form = socialAdminModal.querySelector('#social-entry-form');
  if (form && (!isEdit || canEdit)) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const type = socialAdminModal.querySelector('#entry-type').value;
      const title = socialAdminModal.querySelector('#entry-title').value;
      const description = socialAdminModal.querySelector('#entry-description').value;
      let payload = null;
      
      const payloadText = socialAdminModal.querySelector('#entry-payload').value.trim();
      if (payloadText) {
        try {
          payload = JSON.parse(payloadText);
        } catch (error) {
          alert('Erreur: Le payload JSON est invalide');
          return;
        }
      }
      
      try {
        if (isEdit) {
          await updateSocialEntry(entry.id, { type, title, description, payload });
          showNotification('✅ Entrée sociale mise à jour avec succès');
        } else {
          await createSocialEntry({ type, title, description, payload });
          showNotification('✅ Entrée sociale créée avec succès');
        }
        
        closeEntryModal();
        await fetchSocialEntries();
        renderSocialAdminContent(socialAdminContainer, canEdit);
      } catch (error) {
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          showNotification('❌ Seul le Directeur peut modifier ou supprimer cette configuration sociale.', true);
        } else {
          showNotification(`❌ Erreur: ${error.message}`, true);
        }
      }
    });
  }
  
  // Bind close
  socialAdminModal.addEventListener('click', (e) => {
    if (e.target.dataset.close !== undefined) {
      closeEntryModal();
    }
  });
}

function closeEntryModal() {
  socialAdminModal?.remove();
  socialAdminModal = null;
  currentEditingEntry = null;
}

function showNotification(message, isError = false) {
  const banner = socialAdminContainer?.querySelector('#social-admin-notification');
  if (!banner) return;
  banner.textContent = message;
  banner.classList.add('visible');
  if (isError) {
    banner.classList.add('error');
  }
  setTimeout(() => {
    banner.classList.remove('visible', 'error');
  }, 4000);
}

function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export global pour app.js
if (typeof window !== 'undefined') {
  window.renderSocialAdminView = renderSocialAdminView;
}

export default { renderSocialAdminView };

