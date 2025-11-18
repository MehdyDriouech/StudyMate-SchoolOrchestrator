/**
 * View Admin - Administration de l'établissement
 */

import {
  getSchoolInfo,
  updateSchoolInfo,
  getClasses,
  createClass,
  updateClass,
  getUsers,
  createUser,
  toggleUserStatus,
  getApprovedThemes,
  publishTheme,
  createSchool
} from '../features-control/feature-admin.js';

import { getActiveSchool, getAllSchools } from '../features-control/store-multischool.js';

let adminContainer = null;
let adminNotificationTimer = null;

export function renderAdminView(container) {
  adminContainer = container;
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px; text-align:center;">
      <div style="font-size:3rem; margin-bottom:12px; animation:pulse 1.5s infinite;">🏛️</div>
      <p style="color:var(--muted);">Chargement des informations établissement...</p>
    </div>
    <style>
      @keyframes pulse {
        0%,100% { opacity:1; transform:scale(1); }
        50% { opacity:.5; transform:scale(1.05); }
      }
    </style>
  `;

  setTimeout(() => {
    renderAdminContent();
  }, 150);
  
  // Écouter les changements d'établissement pour recharger
  window.addEventListener('schoolChanged', () => {
    renderAdminContent();
  });
}

function renderAdminContent() {
  const school = getSchoolInfo();
  const classes = getClasses();
  const users = getUsers();
  const approvedThemes = getApprovedThemes();

  adminContainer.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div>
          <h1 style="font-size:2rem; margin:0;">🏛️ Administration de l'établissement</h1>
          <p style="color:var(--muted); margin:4px 0 0;">
            Centralisez les informations clés et gérez vos équipes.
            ${(() => {
              const activeSchool = getActiveSchool();
              return activeSchool ? `<br/><strong>Établissement actif:</strong> ${activeSchool.name} (${activeSchool.city})` : '';
            })()}
          </p>
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
          <button class="btn primary" id="btn-create-school">🏫 Créer un nouvel établissement (démo)</button>
          <span class="badge ghost">Version démo</span>
        </div>
      </div>

      <div id="admin-notification" class="admin-notification" aria-live="polite"></div>

      <!-- Section Infos établissement -->
      <div class="card" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="margin:0 0 6px; font-size:1.25rem;">A) Infos de l'établissement</h2>
            <p style="color:var(--muted); margin:0;">Résumé général et contact</p>
          </div>
          <button class="btn ghost" id="btn-edit-school">Modifier</button>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:16px; margin-top:16px;">
          <div style="background:var(--card-hover); padding:12px; border-radius:var(--radius-md);">
            <strong>Nom</strong>
            <div>${school.name}</div>
          </div>
          <div style="background:var(--card-hover); padding:12px; border-radius:var(--radius-md);">
            <strong>Adresse</strong>
            <div>${school.address}</div>
          </div>
          <div style="background:var(--card-hover); padding:12px; border-radius:var(--radius-md);">
            <strong>Directeur</strong>
            <div>${school.director}</div>
          </div>
          <div style="background:var(--card-hover); padding:12px; border-radius:var(--radius-md);">
            <strong>Classes</strong>
            <div>${school.classesCount}</div>
          </div>
          <div style="background:var(--card-hover); padding:12px; border-radius:var(--radius-md);">
            <strong>Élèves</strong>
            <div>${school.studentsCount}</div>
          </div>
        </div>
      </div>

      <!-- Section classes -->
      <div class="card" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="margin:0 0 6px; font-size:1.25rem;">B) Gestion des classes</h2>
            <p style="color:var(--muted); margin:0;">Filières et effectifs</p>
          </div>
          <button class="btn primary" id="btn-create-class">Créer une classe</button>
        </div>
        <div style="overflow-x:auto; margin-top:16px;">
          <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
            <thead>
              <tr style="border-bottom:2px solid var(--card-border);">
                <th style="padding:10px; text-align:left;">Nom</th>
                <th style="padding:10px;">Filière</th>
                <th style="padding:10px;">Année</th>
                <th style="padding:10px;">Élèves</th>
                <th style="padding:10px;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${classes.map(cls => `
                <tr style="border-bottom:1px solid var(--card-border);">
                  <td style="padding:10px; font-weight:600;">${cls.name}</td>
                  <td style="padding:10px; text-align:center;">${cls.track}</td>
                  <td style="padding:10px; text-align:center;">${cls.year}</td>
                  <td style="padding:10px; text-align:center;">${cls.students}</td>
                  <td style="padding:10px; text-align:center;">
                    <button class="btn ghost" data-edit-class="${cls.id}">Modifier</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section publication thèmes -->
      <div class="card" style="margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="margin:0 0 6px; font-size:1.25rem;">📤 Thèmes en attente de publication</h2>
            <p style="color:var(--muted); margin:0;">Thèmes validés par le directeur pédagogique, prêts à être publiés</p>
          </div>
        </div>
        ${approvedThemes.length > 0 ? `
          <div style="overflow-x:auto; margin-top:16px;">
            <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
              <thead>
                <tr style="border-bottom:2px solid var(--card-border);">
                  <th style="padding:10px; text-align:left;">Titre</th>
                  <th style="padding:10px;">Matière</th>
                  <th style="padding:10px;">Auteur</th>
                  <th style="padding:10px;">Classes cibles</th>
                  <th style="padding:10px;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${approvedThemes.map(theme => `
                  <tr style="border-bottom:1px solid var(--card-border);">
                    <td style="padding:10px; font-weight:600;">${theme.title}</td>
                    <td style="padding:10px; text-align:center;">${theme.subject || '—'}</td>
                    <td style="padding:10px; text-align:center;">${theme.author || '—'}</td>
                    <td style="padding:10px; text-align:center;">
                      ${theme.classes && theme.classes.length > 0 
                        ? theme.classes.map(c => `<span class="badge ghost" style="font-size:0.75rem; margin:2px;">${c.label || c}</span>`).join('')
                        : '—'}
                    </td>
                    <td style="padding:10px; text-align:center;">
                      <button class="btn primary" data-publish-theme="${theme.id}" style="font-size:0.85rem;">
                        🚀 Publier
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div style="text-align:center; padding:32px; color:var(--muted);">
            <div style="font-size:2rem; margin-bottom:8px;">📭</div>
            <p>Aucun thème en attente de publication</p>
          </div>
        `}
      </div>

      <!-- Section utilisateurs -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="margin:0 0 6px; font-size:1.25rem;">C) Gestion des utilisateurs</h2>
            <p style="color:var(--muted); margin:0;">Suivi des accès par rôle</p>
          </div>
          <button class="btn primary" id="btn-create-user">Créer un utilisateur</button>
        </div>
        <div style="overflow-x:auto; margin-top:16px;">
          <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
            <thead>
              <tr style="border-bottom:2px solid var(--card-border);">
                <th style="padding:10px; text-align:left;">Nom</th>
                <th style="padding:10px;">Email</th>
                <th style="padding:10px;">Rôle</th>
                <th style="padding:10px;">Classe</th>
                <th style="padding:10px;">Statut</th>
                <th style="padding:10px;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(user => `
                <tr style="border-bottom:1px solid var(--card-border);">
                  <td style="padding:10px; font-weight:600;">${user.name}</td>
                  <td style="padding:10px; text-align:center;">${user.email}</td>
                  <td style="padding:10px; text-align:center;">${user.role}</td>
                  <td style="padding:10px; text-align:center;">${user.className}</td>
                  <td style="padding:10px; text-align:center;">
                    <span class="badge ${user.status === 'actif' ? 'success' : 'danger'}" style="font-size:0.75rem;">
                      ${user.status}
                    </span>
                  </td>
                  <td style="padding:10px; text-align:center;">
                    <button class="btn ghost" data-toggle-user="${user.id}">
                      ${user.status === 'actif' ? 'Désactiver' : 'Réactiver'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <style>
      .admin-notification {
        min-height: 32px;
        margin-bottom: 16px;
        border-radius: var(--radius-md);
        background: rgba(14,165,233,0.15);
        color: var(--accent);
        font-weight: 600;
        padding: 8px 16px;
        display: none;
      }
      .admin-notification.visible {
        display: block;
      }
    </style>
  `;

  bindAdminEvents();
}

function bindAdminEvents() {
  const editBtn = document.getElementById('btn-edit-school');
  if (editBtn) editBtn.addEventListener('click', openEditSchoolModal);

  const createSchoolBtn = document.getElementById('btn-create-school');
  if (createSchoolBtn) createSchoolBtn.addEventListener('click', openCreateSchoolModal);

  const createClassBtn = document.getElementById('btn-create-class');
  if (createClassBtn) createClassBtn.addEventListener('click', () => openClassModal());

  document.querySelectorAll('[data-edit-class]').forEach(btn => {
    btn.addEventListener('click', () => openClassModal(btn.dataset.editClass));
  });

  const createUserBtn = document.getElementById('btn-create-user');
  if (createUserBtn) createUserBtn.addEventListener('click', openUserModal);

  document.querySelectorAll('[data-toggle-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleUserStatus(btn.dataset.toggleUser);
      renderAdminContent();
      showAdminNotification('👤 Statut utilisateur mis à jour');
    });
  });

  document.querySelectorAll('[data-publish-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      const themeId = btn.dataset.publishTheme;
      openPublishThemeModal(themeId);
    });
  });
}

function openEditSchoolModal() {
  const school = getSchoolInfo();
  const modal = buildModal(`
    <h3 style="margin-top:0;">Modifier l'établissement</h3>
    <form id="school-form" class="admin-form">
      ${renderInput('name', 'Nom', school.name, true)}
      ${renderInput('address', 'Adresse', school.address, true)}
      ${renderInput('director', 'Directeur', school.director, true)}
      ${renderInput('classesCount', 'Nombre de classes', school.classesCount, true, 'number')}
      ${renderInput('studentsCount', 'Nombre d\'élèves', school.studentsCount, true, 'number')}
      <div class="admin-modal-actions">
        <button type="submit" class="btn primary">Enregistrer</button>
        <button type="button" class="btn ghost" data-close-modal>Annuler</button>
      </div>
    </form>
  `);

  document.body.appendChild(modal);

  modal.querySelector('[data-close-modal]').addEventListener('click', () => modal.remove());
  modal.querySelector('#school-form').addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    data.classesCount = Number(data.classesCount);
    data.studentsCount = Number(data.studentsCount);
    updateSchoolInfo(data);
    modal.remove();
    renderAdminContent();
    showAdminNotification('🏫 Informations établissement mises à jour');
  });
}

function openClassModal(classId) {
  const existing = classId ? getClasses().find(cls => cls.id === classId) : null;
  const modal = buildModal(`
    <h3 style="margin-top:0;">${existing ? 'Modifier la classe' : 'Créer une classe'}</h3>
    <form id="class-form" class="admin-form">
      ${renderInput('name', 'Nom de la classe', existing?.name || '', true)}
      ${renderInput('track', 'Filière', existing?.track || '', true)}
      ${renderInput('year', 'Année', existing?.year || '', true)}
      ${renderInput('students', 'Nombre d\'élèves', existing?.students || 25, true, 'number')}
      <div class="admin-modal-actions">
        <button type="submit" class="btn primary">${existing ? 'Mettre à jour' : 'Créer'}</button>
        <button type="button" class="btn ghost" data-close-modal>Annuler</button>
      </div>
    </form>
  `);
  document.body.appendChild(modal);

  modal.querySelector('[data-close-modal]').addEventListener('click', () => modal.remove());
  modal.querySelector('#class-form').addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    if (existing) {
      updateClass(existing.id, { ...data, students: Number(data.students) });
      showAdminNotification(`📚 ${data.name} mise à jour`);
    } else {
      createClass(data);
      showAdminNotification(`📚 Classe ${data.name} créée`);
    }
    modal.remove();
    renderAdminContent();
  });
}

function openUserModal() {
  const modal = buildModal(`
    <h3 style="margin-top:0;">Créer un utilisateur</h3>
    <form id="user-form" class="admin-form">
      ${renderInput('name', 'Nom complet', '', true)}
      ${renderInput('email', 'Email', '', true, 'email')}
      ${renderInput('role', 'Rôle', 'Enseignant', true)}
      ${renderInput('className', 'Classe', '', false)}
      <div class="admin-modal-actions">
        <button type="submit" class="btn primary">Créer</button>
        <button type="button" class="btn ghost" data-close-modal>Annuler</button>
      </div>
    </form>
  `);
  document.body.appendChild(modal);

  modal.querySelector('[data-close-modal]').addEventListener('click', () => modal.remove());
  modal.querySelector('#user-form').addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    createUser(data);
    modal.remove();
    renderAdminContent();
    showAdminNotification(`👥 ${data.name} ajouté`);
  });
}

function buildModal(content) {
  const wrapper = document.createElement('div');
  wrapper.className = 'admin-modal';
  wrapper.innerHTML = `
    <div class="admin-modal__backdrop" data-close-modal></div>
    <div class="card admin-modal__dialog">
      ${content}
    </div>
    <style>
      .admin-modal {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .admin-modal__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15,23,42,0.6);
        backdrop-filter: blur(4px);
      }
      .admin-modal__dialog {
        position: relative;
        max-width: 520px;
        width: calc(100% - 32px);
        max-height: 90vh;
        overflow-y: auto;
        z-index: 1;
      }
      .admin-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .admin-form label span {
        font-weight: 600;
      }
      .admin-modal-actions {
        display: flex;
        gap: 12px;
        margin-top: 12px;
      }
      .admin-input {
        width: 100%;
        border: 2px solid var(--card-border);
        border-radius: var(--radius-md);
        padding: 10px 12px;
        background: var(--card);
        color: var(--fg);
      }
      .admin-input:focus {
        outline: none;
        border-color: var(--accent);
      }
      @media (max-width:540px) {
        .admin-modal-actions {
          flex-direction: column;
        }
      }
    </style>
  `;
  wrapper.addEventListener('click', e => {
    if (e.target.dataset.closeModal !== undefined) {
      wrapper.remove();
    }
  });
  return wrapper;
}

function renderInput(name, label, value = '', required = false, type = 'text') {
  return `
    <label>
      <span style="display:block; margin-bottom:4px;">${label}${required ? ' *' : ''}</span>
      ${type === 'textarea'
        ? `<textarea name="${name}" class="admin-input" ${required ? 'required' : ''}>${value || ''}</textarea>`
        : `<input type="${type}" name="${name}" value="${value ?? ''}" class="admin-input" ${required ? 'required' : ''}/>`
      }
    </label>
  `;
}

function openCreateSchoolModal() {
  const modal = buildModal(`
    <h3 style="margin-top:0;">🏫 Créer un nouvel établissement (démo)</h3>
    <p style="color:var(--muted); margin-bottom:16px;">
      Ajoutez un établissement de démonstration avec des données mockées.
    </p>
    <form id="create-school-form" class="admin-form">
      ${renderInput('name', 'Nom de l\'établissement', '', true)}
      ${renderInput('city', 'Ville', '', true)}
      ${renderInput('address', 'Adresse', '', false)}
      ${renderInput('director', 'Directeur', '', false)}
      <div class="admin-modal-actions">
        <button type="submit" class="btn primary">Créer</button>
        <button type="button" class="btn ghost" data-close-modal>Annuler</button>
      </div>
    </form>
  `);
  
  document.body.appendChild(modal);
  
  modal.querySelector('[data-close-modal]').addEventListener('click', () => modal.remove());
  modal.querySelector('#create-school-form').addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      const newSchool = createSchool(data);
      showAdminNotification(`🏫 Établissement ${newSchool.name} créé (démo)`);
      modal.remove();
      renderAdminContent();
      
      // Optionnel : basculer vers le nouvel établissement
      if (confirm(`Voulez-vous basculer vers ${newSchool.name} ?`)) {
        import('../features-control/store-multischool.js').then(({ setActiveSchoolId }) => {
          setActiveSchoolId(newSchool.id);
          renderAdminContent();
        });
      }
    } catch (error) {
      console.error('[Admin] Erreur création établissement', error);
      alert('Erreur lors de la création : ' + error.message);
    }
  });
}

function openPublishThemeModal(themeId) {
  const approvedThemes = getApprovedThemes();
  const theme = approvedThemes.find(t => t.id === themeId);
  if (!theme) {
    showAdminNotification('❌ Thème introuvable');
    return;
  }

  const classes = getClasses();
  const modal = buildModal(`
    <h3 style="margin-top:0;">🚀 Publier le thème</h3>
    <p style="color:var(--muted); margin-bottom:16px;">
      <strong>${theme.title}</strong><br/>
      ${theme.subject || 'Matière non spécifiée'} • ${theme.author || 'Auteur inconnu'}
    </p>
    <form id="publish-theme-form" class="admin-form">
      <label>
        <span style="display:block; margin-bottom:4px; font-weight:600;">Classes cibles *</span>
        <div style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto; padding:8px; background:var(--card-hover); border-radius:var(--radius-md);">
          ${classes.map(cls => `
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" name="classes" value="${cls.id}" ${theme.classes && theme.classes.some(c => (c.id || c) === cls.id) ? 'checked' : ''} />
              <span>${cls.name} (${cls.track || '—'})</span>
            </label>
          `).join('')}
        </div>
      </label>
      <div class="admin-modal-actions">
        <button type="submit" class="btn primary" style="flex:1;">🚀 Publier</button>
        <button type="button" class="btn ghost" data-close-modal style="flex:1;">Annuler</button>
      </div>
    </form>
  `);

  document.body.appendChild(modal);

  const form = modal.querySelector('#publish-theme-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(form);
    const selectedClassIds = formData.getAll('classes');
    
    if (selectedClassIds.length === 0) {
      alert('Veuillez sélectionner au moins une classe.');
      return;
    }

    try {
      publishTheme(themeId, selectedClassIds);
      showAdminNotification(`✅ Thème publié pour ${selectedClassIds.length} classe(s) (démo)`);
      modal.remove();
      renderAdminContent();
    } catch (error) {
      console.error('[Admin] Erreur publication', error);
      alert('Erreur lors de la publication : ' + error.message);
    }
  });
}

function showAdminNotification(message) {
  const banner = document.getElementById('admin-notification');
  if (!banner) return;
  banner.textContent = message;
  banner.classList.add('visible');
  clearTimeout(adminNotificationTimer);
  adminNotificationTimer = setTimeout(() => {
    banner.classList.remove('visible');
  }, 3200);
}

window.renderAdminView = renderAdminView;
export default { renderAdminView };

