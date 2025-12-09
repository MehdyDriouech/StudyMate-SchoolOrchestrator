/**
 * View Campus Admin Schools - Gestion des établissements
 */

import {
  getAllSchools,
  createSchool,
  updateSchool,
  deleteSchool
} from '../features-control/store-campus-admin.js';
import { navigateTo } from '../../app.js';

/**
 * Rend la vue de gestion des établissements
 */
export function renderCampusAdminSchoolsView(container) {
  console.log('[View Campus Admin Schools] Rendu de la vue établissements');
  
  const schools = getAllSchools();
  
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          🏫 Gestion des établissements
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Gérez tous les établissements du campus
        </p>
      </div>
      
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <h2 style="font-size: 1.25rem; margin: 0;">Liste des établissements</h2>
          <button class="btn primary" id="btn-create-school">+ Créer un établissement</button>
        </div>
        
        <div style="display: grid; gap: 16px;">
          ${schools.length > 0 ? schools.map(school => `
            <div class="card" style="border-left: 4px solid ${school.is_active ? 'var(--accent)' : 'var(--muted)'};">
              <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px; flex-wrap: wrap;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                    <h3 style="font-size: 1.2rem; font-weight: 600; margin: 0;">
                      ${escapeHtml(school.name)}
                    </h3>
                    ${school.is_active ? 
                      '<span style="background: #10b981; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; white-space: nowrap;">Actif</span>' : 
                      '<span style="background: #6b7280; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; white-space: nowrap;">Inactif</span>'
                    }
                    ${school.code ? `<span style="font-size: 0.85rem; color: var(--muted);">(${escapeHtml(school.code)})</span>` : ''}
                  </div>
                  <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 4px;">
                    ${school.address ? escapeHtml(school.address) : ''}
                    ${school.postal_code && school.city ? `, ${escapeHtml(school.postal_code)} ${escapeHtml(school.city)}` : ''}
                    ${school.country ? `, ${escapeHtml(school.country)}` : ''}
                  </div>
                  <div style="font-size: 0.85rem; color: var(--muted);">
                    ${school.stats?.users_count || 0} utilisateur${(school.stats?.users_count || 0) > 1 ? 's' : ''} • 
                    ${school.stats?.classes_count || 0} classe${(school.stats?.classes_count || 0) > 1 ? 's' : ''} • 
                    ${school.stats?.students_count || 0} étudiant${(school.stats?.students_count || 0) > 1 ? 's' : ''}
                  </div>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn ghost" data-edit-school="${school.id}">Modifier</button>
                  ${school.is_active ? 
                    `<button class="btn ghost" data-archive-school="${school.id}" style="color: var(--warning);">Archiver</button>` :
                    `<button class="btn ghost" data-activate-school="${school.id}" style="color: var(--success);">Activer</button>`
                  }
                </div>
              </div>
            </div>
          `).join('') : `
            <div style="text-align: center; padding: 40px; color: var(--muted);">
              <div style="font-size: 3rem; margin-bottom: 16px;">🏫</div>
              <p>Aucun établissement enregistré</p>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
  
  setupEventListeners(container);
}

function setupEventListeners(container) {
  // Bouton créer
  const btnCreate = document.getElementById('btn-create-school');
  if (btnCreate) {
    btnCreate.addEventListener('click', () => openCreateSchoolModal(container));
  }
  
  // Boutons modifier
  container.querySelectorAll('[data-edit-school]').forEach(btn => {
    btn.addEventListener('click', () => {
      const schoolId = parseInt(btn.dataset.editSchool);
      openEditSchoolModal(container, schoolId);
    });
  });
  
  // Boutons archiver/activer
  container.querySelectorAll('[data-archive-school]').forEach(btn => {
    btn.addEventListener('click', () => {
      const schoolId = parseInt(btn.dataset.archiveSchool);
      if (confirm('Êtes-vous sûr de vouloir archiver cet établissement ?')) {
        deleteSchool(schoolId);
        renderCampusAdminSchoolsView(container);
      }
    });
  });
  
  container.querySelectorAll('[data-activate-school]').forEach(btn => {
    btn.addEventListener('click', () => {
      const schoolId = parseInt(btn.dataset.activateSchool);
      updateSchool(schoolId, { is_active: true });
      renderCampusAdminSchoolsView(container);
    });
  });
}

function openCreateSchoolModal(container) {
  const modal = createModal(`
    <h2 style="margin: 0 0 16px;">Créer un établissement</h2>
    <form id="create-school-form" style="display: grid; gap: 16px;">
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Nom *</label>
        <input type="text" name="name" required style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Code</label>
        <input type="text" name="code" style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Adresse</label>
        <input type="text" name="address" style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Code postal</label>
          <input type="text" name="postal_code" style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
        </div>
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Ville</label>
          <input type="text" name="city" style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
        </div>
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Pays</label>
        <input type="text" name="country" value="FR" style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
        <button type="button" class="btn ghost" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button type="submit" class="btn primary">Créer</button>
      </div>
    </form>
  `);
  
  document.body.appendChild(modal);
  
  const form = modal.querySelector('#create-school-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    createSchool({
      name: formData.get('name'),
      code: formData.get('code') || null,
      address: formData.get('address') || null,
      postal_code: formData.get('postal_code') || null,
      city: formData.get('city') || null,
      country: formData.get('country') || 'FR',
      is_active: true
    });
    modal.remove();
    renderCampusAdminSchoolsView(container);
  });
}

function openEditSchoolModal(container, schoolId) {
  const { getSchoolById } = require('../features-control/store-campus-admin.js');
  const school = getSchoolById(schoolId);
  if (!school) return;
  
  const modal = createModal(`
    <h2 style="margin: 0 0 16px;">Modifier l'établissement</h2>
    <form id="edit-school-form" style="display: grid; gap: 16px;">
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Nom *</label>
        <input type="text" name="name" value="${escapeHtml(school.name)}" required style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Code</label>
        <input type="text" name="code" value="${escapeHtml(school.code || '')}" style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Adresse</label>
        <input type="text" name="address" value="${escapeHtml(school.address || '')}" style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Code postal</label>
          <input type="text" name="postal_code" value="${escapeHtml(school.postal_code || '')}" style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
        </div>
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Ville</label>
          <input type="text" name="city" value="${escapeHtml(school.city || '')}" style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
        </div>
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Pays</label>
        <input type="text" name="country" value="${escapeHtml(school.country || 'FR')}" style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
        <button type="button" class="btn ghost" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button type="submit" class="btn primary">Enregistrer</button>
      </div>
    </form>
  `);
  
  document.body.appendChild(modal);
  
  const form = modal.querySelector('#edit-school-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    updateSchool(schoolId, {
      name: formData.get('name'),
      code: formData.get('code') || null,
      address: formData.get('address') || null,
      postal_code: formData.get('postal_code') || null,
      city: formData.get('city') || null,
      country: formData.get('country') || 'FR'
    });
    modal.remove();
    renderCampusAdminSchoolsView(container);
  });
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
    max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;
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

