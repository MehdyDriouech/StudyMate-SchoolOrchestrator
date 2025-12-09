/**
 * View Campus Admin Users - Gestion des utilisateurs
 */

import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllSchools
} from '../features-control/store-campus-admin.js';

/**
 * Rend la vue de gestion des utilisateurs
 */
export function renderCampusAdminUsersView(container) {
  console.log('[View Campus Admin Users] Rendu de la vue utilisateurs');
  
  const users = getAllUsers();
  const schools = getAllSchools();
  
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          👥 Gestion des utilisateurs
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Gérez tous les utilisateurs du campus
        </p>
      </div>
      
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; gap: 12px; flex: 1;">
            <input type="text" id="search-users" placeholder="Rechercher..." style="flex: 1; padding: 8px 12px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
            <select id="filter-role" style="padding: 8px 12px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
              <option value="">Tous les rôles</option>
              <option value="student">Étudiant</option>
              <option value="teacher">Enseignant</option>
              <option value="director">Directeur</option>
              <option value="pedago">Pédago</option>
            </select>
            <select id="filter-school" style="padding: 8px 12px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
              <option value="">Tous les établissements</option>
              ${schools.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
            </select>
          </div>
          <button class="btn primary" id="btn-create-user">+ Créer un utilisateur</button>
        </div>
        
        <div style="display: grid; gap: 12px;">
          ${users.length > 0 ? users.map(user => `
            <div class="card" style="border-left: 4px solid ${user.status === 'active' ? 'var(--success)' : 'var(--muted)'};">
              <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px; flex-wrap: wrap;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0;">
                      ${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}
                    </h3>
                    <span class="badge" style="background: var(--accent); color: white;">${getRoleLabel(user.role)}</span>
                    ${user.status === 'active' ? 
                      '<span class="badge" style="background: var(--success); color: white;">Actif</span>' : 
                      '<span class="badge" style="background: var(--muted); color: white;">Inactif</span>'
                    }
                  </div>
                  <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 4px;">
                    ${escapeHtml(user.email)}
                  </div>
                  <div style="font-size: 0.85rem; color: var(--muted);">
                    ${escapeHtml(user.school_name || 'Aucun établissement')}
                  </div>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn ghost" data-edit-user="${user.id}">Modifier</button>
                  ${user.status === 'active' ? 
                    `<button class="btn ghost" data-deactivate-user="${user.id}" style="color: var(--warning);">Désactiver</button>` :
                    `<button class="btn ghost" data-activate-user="${user.id}" style="color: var(--success);">Activer</button>`
                  }
                </div>
              </div>
            </div>
          `).join('') : `
            <div style="text-align: center; padding: 40px; color: var(--muted);">
              <div style="font-size: 3rem; margin-bottom: 16px;">👥</div>
              <p>Aucun utilisateur trouvé</p>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
  
  setupEventListeners(container, schools);
}

function setupEventListeners(container, schools) {
  // Recherche et filtres
  const searchInput = document.getElementById('search-users');
  const filterRole = document.getElementById('filter-role');
  const filterSchool = document.getElementById('filter-school');
  
  const applyFilters = () => {
    const { getAllUsers } = require('../features-control/store-campus-admin.js');
    const users = getAllUsers({
      search: searchInput.value,
      role: filterRole.value || undefined,
      school_id: filterSchool.value ? parseInt(filterSchool.value) : undefined
    });
    // Re-rendre avec les filtres (simplifié pour l'instant)
    renderCampusAdminUsersView(container);
  };
  
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (filterRole) filterRole.addEventListener('change', applyFilters);
  if (filterSchool) filterSchool.addEventListener('change', applyFilters);
  
  // Bouton créer
  const btnCreate = document.getElementById('btn-create-user');
  if (btnCreate) {
    btnCreate.addEventListener('click', () => openCreateUserModal(container, schools));
  }
  
  // Boutons modifier
  container.querySelectorAll('[data-edit-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = parseInt(btn.dataset.editUser);
      openEditUserModal(container, userId, schools);
    });
  });
  
  // Boutons activer/désactiver
  container.querySelectorAll('[data-deactivate-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = parseInt(btn.dataset.deactivateUser);
      if (confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) {
        deleteUser(userId);
        renderCampusAdminUsersView(container);
      }
    });
  });
  
  container.querySelectorAll('[data-activate-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = parseInt(btn.dataset.activateUser);
      updateUser(userId, { status: 'active' });
      renderCampusAdminUsersView(container);
    });
  });
}

function openCreateUserModal(container, schools) {
  const modal = createModal(`
    <h2 style="margin: 0 0 16px;">Créer un utilisateur</h2>
    <form id="create-user-form" style="display: grid; gap: 16px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Prénom *</label>
          <input type="text" name="first_name" required style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
        </div>
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Nom *</label>
          <input type="text" name="last_name" required style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
        </div>
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Email *</label>
        <input type="email" name="email" required style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Rôle *</label>
        <select name="role" required style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
          <option value="student">Étudiant</option>
          <option value="teacher">Enseignant</option>
          <option value="director">Directeur</option>
          <option value="pedago">Pédago</option>
        </select>
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Établissement</label>
        <select name="school_id" style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
          <option value="">Aucun</option>
          ${schools.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
        </select>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
        <button type="button" class="btn ghost" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button type="submit" class="btn primary">Créer</button>
      </div>
    </form>
  `);
  
  document.body.appendChild(modal);
  
  const form = modal.querySelector('#create-user-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    createUser({
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      role: formData.get('role'),
      school_id: formData.get('school_id') ? parseInt(formData.get('school_id')) : null
    });
    modal.remove();
    renderCampusAdminUsersView(container);
  });
}

function openEditUserModal(container, userId, schools) {
  const { getUserById } = require('../features-control/store-campus-admin.js');
  const user = getUserById(userId);
  if (!user) return;
  
  const modal = createModal(`
    <h2 style="margin: 0 0 16px;">Modifier l'utilisateur</h2>
    <form id="edit-user-form" style="display: grid; gap: 16px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Prénom *</label>
          <input type="text" name="first_name" value="${escapeHtml(user.first_name)}" required style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
        </div>
        <div>
          <label style="display: block; margin-bottom: 4px; font-weight: 500;">Nom *</label>
          <input type="text" name="last_name" value="${escapeHtml(user.last_name)}" required style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
        </div>
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Email *</label>
        <input type="email" name="email" value="${escapeHtml(user.email)}" required style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Rôle *</label>
        <select name="role" required style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
          <option value="student" ${user.role === 'student' ? 'selected' : ''}>Étudiant</option>
          <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Enseignant</option>
          <option value="director" ${user.role === 'director' ? 'selected' : ''}>Directeur</option>
          <option value="pedago" ${user.role === 'pedago' ? 'selected' : ''}>Pédago</option>
        </select>
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-weight: 500;">Établissement</label>
        <select name="school_id" style="width: 100%; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
          <option value="">Aucun</option>
          ${schools.map(s => `<option value="${s.id}" ${user.school_id === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
        </select>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
        <button type="button" class="btn ghost" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
        <button type="submit" class="btn primary">Enregistrer</button>
      </div>
    </form>
  `);
  
  document.body.appendChild(modal);
  
  const form = modal.querySelector('#edit-user-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    updateUser(userId, {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      role: formData.get('role'),
      school_id: formData.get('school_id') ? parseInt(formData.get('school_id')) : null
    });
    modal.remove();
    renderCampusAdminUsersView(container);
  });
}

function getRoleLabel(role) {
  const labels = {
    student: 'Étudiant',
    teacher: 'Enseignant',
    director: 'Directeur',
    pedago: 'Pédago',
    campus_admin: 'Admin Campus'
  };
  return labels[role] || role;
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

