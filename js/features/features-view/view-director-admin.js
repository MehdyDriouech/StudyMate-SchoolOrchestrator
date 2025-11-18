/**
 * View Director Admin - Conteneur pour l'administration du directeur
 * Gère les sous-routes : schools, classes, users
 */

import { renderAdminView } from './view-admin.js';
import { getSubRoute } from '../../components/NavigationManager.js';
import {
  getSchoolInfo,
  getClasses,
  createClass,
  updateClass,
  getUsers,
  createUser,
  toggleUserStatus,
  createSchool
} from '../features-control/feature-admin.js';
import { 
  getAllSchools, 
  getActiveSchool, 
  setActiveSchoolId,
  getStudents,
  getStudentsByClass,
  createStudent,
  createStudents,
  assignStudentToClass
} from '../features-control/store-multischool.js';
import { navigateTo } from '../../app.js';

let adminContainer = null;

/**
 * Rend la vue d'administration du directeur
 * @param {HTMLElement} container - Conteneur de la vue
 * @param {string} route - Route actuelle
 */
export function renderDirectorAdminView(container, route = 'director-admin') {
  console.log('[View Director Admin] Rendu de l\'administration, route:', route);
  
  adminContainer = container;
  const subRoute = getSubRoute(route);
  
  // Si pas de sous-route, rendre directement la première (schools) au lieu de rediriger
  const routeToRender = subRoute || 'schools';
  
  // Router vers la bonne vue selon la sous-route
  switch (routeToRender) {
    case 'schools':
      renderSchoolsView(container);
      break;
    case 'classes':
      renderClassesView(container);
      break;
    case 'users':
      renderUsersView(container);
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

/**
 * Rend la vue des établissements
 */
function renderSchoolsView(container) {
  const schools = getAllSchools();
  const activeSchool = getActiveSchool();
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          🏫 Établissements
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Gérez vos établissements et basculez entre eux
        </p>
      </div>
      
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 1.25rem; margin: 0;">Liste des établissements</h2>
          <button class="btn primary" id="btn-create-school">+ Créer un établissement</button>
        </div>
        
        <div style="display: grid; gap: 16px;">
          ${schools.map(school => {
            const isActive = activeSchool && activeSchool.id === school.id;
            return `
              <div class="card" style="border-left: 4px solid ${isActive ? 'var(--accent)' : 'var(--card-border)'};">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px; flex-wrap: wrap;">
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                      <h3 style="font-size: 1.2rem; font-weight: 600; margin: 0;">
                        ${escapeHtml(school.name)}
                      </h3>
                      ${isActive ? '<span class="badge" style="background: var(--accent); color: white;">Actif</span>' : ''}
                    </div>
                    <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 4px;">
                      ${escapeHtml(school.address || '')}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--muted);">
                      ${school.classesCount || 0} classe${school.classesCount > 1 ? 's' : ''} • ${school.studentsCount || 0} élève${school.studentsCount > 1 ? 's' : ''} • ${school.usersCount || 0} enseignant${school.usersCount > 1 ? 's' : ''}
                    </div>
                  </div>
                  ${!isActive ? `
                    <button class="btn ghost" data-switch-school="${school.id}">
                      Activer
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
  
  // Event listeners
  container.querySelectorAll('[data-switch-school]').forEach(btn => {
    btn.addEventListener('click', () => {
      const schoolId = btn.dataset.switchSchool;
      setActiveSchoolId(schoolId);
      window.dispatchEvent(new CustomEvent('schoolChanged', { detail: { schoolId } }));
      renderSchoolsView(container);
    });
  });
  
  const createBtn = document.getElementById('btn-create-school');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      openCreateSchoolModal(container);
    });
  }
}

/**
 * Rend la vue des classes
 */
function renderClassesView(container) {
  const classes = getClasses();
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          👥 Classes
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Gérez les classes et les élèves de votre établissement
        </p>
      </div>
      
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <h2 style="font-size: 1.25rem; margin: 0;">Liste des classes</h2>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn primary" id="btn-create-class">+ Créer une classe</button>
            <button class="btn ghost" id="btn-create-student">+ Ajouter un élève</button>
            <button class="btn ghost" id="btn-import-csv">📥 Importer CSV</button>
          </div>
        </div>
        
        <div style="display: grid; gap: 16px;">
          ${classes.length > 0 ? classes.map(cls => {
            const students = getStudentsByClass(cls.name);
            return `
              <div class="card" style="border-left: 4px solid var(--accent);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px; flex-wrap: wrap; gap: 12px;">
                  <div style="flex: 1;">
                    <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 4px;">
                      ${escapeHtml(cls.name)}
                    </h3>
                    <div style="font-size: 0.85rem; color: var(--muted); margin-bottom: 8px;">
                      ${cls.students || 0} élève${(cls.students || 0) > 1 ? 's' : ''} • ${escapeHtml(cls.track || '')} • ${escapeHtml(cls.year || '')}
                    </div>
                    ${students.length > 0 ? `
                      <div style="margin-top: 12px;">
                        <details style="cursor: pointer;">
                          <summary style="font-size: 0.9rem; color: var(--accent); font-weight: 600; user-select: none;">
                            Voir les élèves (${students.length})
                          </summary>
                          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--card-border);">
                            <div style="display: grid; gap: 8px;">
                              ${students.map(student => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--card-hover); border-radius: var(--radius-md);">
                                  <div>
                                    <div style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(student.name)}</div>
                                    <div style="font-size: 0.8rem; color: var(--muted);">${escapeHtml(student.email || '')}</div>
                                  </div>
                                  <button class="btn ghost" style="font-size: 0.85rem; padding: 4px 12px;" data-reassign-student="${student.id}" data-current-class="${escapeHtml(cls.name)}">
                                    Réassigner
                                  </button>
                                </div>
                              `).join('')}
                            </div>
                          </div>
                        </details>
                      </div>
                    ` : `
                      <div style="font-size: 0.85rem; color: var(--muted); font-style: italic; margin-top: 8px;">
                        Aucun élève assigné
                      </div>
                    `}
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button class="btn ghost" data-edit-class="${cls.id}" data-class-id="${cls.id}">
                      Modifier
                    </button>
                    <button class="btn ghost" data-assign-students="${cls.id}" data-class-name="${escapeHtml(cls.name)}">
                      Assigner élèves
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('') : `
            <div style="text-align: center; padding: 40px; color: var(--muted);">
              Aucune classe créée
            </div>
          `}
        </div>
      </div>
    </div>
  `;
  
  // Event listeners
  const createBtn = document.getElementById('btn-create-class');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      openCreateClassModal(container);
    });
  }
  
  const createStudentBtn = document.getElementById('btn-create-student');
  if (createStudentBtn) {
    createStudentBtn.addEventListener('click', () => {
      openCreateStudentModal(container);
    });
  }
  
  const importCsvBtn = document.getElementById('btn-import-csv');
  if (importCsvBtn) {
    importCsvBtn.addEventListener('click', () => {
      openImportCsvModal(container);
    });
  }
  
  // Event listeners pour les boutons "Modifier"
  container.querySelectorAll('[data-edit-class]').forEach(btn => {
    btn.addEventListener('click', () => {
      const classId = btn.dataset.classId;
      if (classId) {
        openCreateClassModal(container, classId);
      }
    });
  });
  
  // Event listeners pour les boutons "Assigner élèves"
  container.querySelectorAll('[data-assign-students]').forEach(btn => {
    btn.addEventListener('click', () => {
      const className = btn.dataset.className;
      if (className) {
        openAssignStudentsModal(container, className);
      }
    });
  });
  
  // Event listeners pour les boutons "Réassigner"
  container.querySelectorAll('[data-reassign-student]').forEach(btn => {
    btn.addEventListener('click', () => {
      const studentId = btn.dataset.reassignStudent;
      const currentClass = btn.dataset.currentClass;
      if (studentId) {
        openReassignStudentModal(container, studentId, currentClass);
      }
    });
  });
}

/**
 * Rend la vue des utilisateurs
 */
function renderUsersView(container) {
  const users = getUsers();
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          👤 Utilisateurs
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Gérez les utilisateurs de votre établissement
        </p>
      </div>
      
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 1.25rem; margin: 0;">Liste des utilisateurs</h2>
          <button class="btn primary" id="btn-create-user">+ Créer un utilisateur</button>
        </div>
        
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--card-border);">
                <th style="padding: 10px; text-align: left;">Nom</th>
                <th style="padding: 10px; text-align: left;">Email</th>
                <th style="padding: 10px; text-align: center;">Rôle</th>
                <th style="padding: 10px; text-align: center;">Statut</th>
                <th style="padding: 10px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.length > 0 ? users.map(user => `
                <tr style="border-bottom: 1px solid var(--card-border);">
                  <td style="padding: 10px;">${escapeHtml(user.name || '')}</td>
                  <td style="padding: 10px;">${escapeHtml(user.email || '')}</td>
                  <td style="padding: 10px; text-align: center;">
                    <span class="badge" style="background: var(--card-hover);">
                      ${escapeHtml(user.role || '')}
                    </span>
                  </td>
                  <td style="padding: 10px; text-align: center;">
                    <span class="badge" style="background: ${(user.active || user.status === 'actif') ? '#22c55e' : '#ef4444'}; color: white; font-weight: 600; padding: 6px 12px; border-radius: 6px; display: inline-block;">
                      ${(user.active || user.status === 'actif') ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style="padding: 10px; text-align: center;">
                    <button class="btn ghost" data-toggle-user="${user.id}" style="font-size: 0.85rem;">
                      ${(user.active || user.status === 'actif') ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="5" style="padding: 40px; text-align: center; color: var(--muted);">
                    Aucun utilisateur
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  // Event listeners
  const createBtn = document.getElementById('btn-create-user');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      openCreateUserModal(container);
    });
  }
  
  container.querySelectorAll('[data-toggle-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.dataset.toggleUser;
      const user = users.find(u => u.id === userId);
      if (user) {
        const isCurrentlyActive = user.active || user.status === 'actif';
        if (isCurrentlyActive) {
          openDeactivateUserModal(container, user);
        } else {
          openActivateUserModal(container, user);
        }
      }
    });
  });
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Ouvre la modale de création de classe
 * @param {HTMLElement} container - Conteneur pour re-rendre après création
 * @param {string} classId - ID de la classe à modifier (optionnel)
 */
function openCreateClassModal(container, classId = null) {
  const existing = classId ? getClasses().find(cls => cls.id === classId) : null;
  
  // Créer l'overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  // Créer la modale
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  `;
  
  modal.innerHTML = `
    <h3 style="margin-top: 0; font-size: 1.5rem;">${existing ? 'Modifier la classe' : 'Créer une classe'}</h3>
    <p style="color: var(--muted); margin-bottom: 20px;">
      ${existing ? 'Modifiez les informations de la classe.' : 'Ajoutez une nouvelle classe à votre établissement.'}
    </p>
    <form id="create-class-form">
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Nom de la classe *
        </label>
        <input 
          type="text" 
          name="name" 
          value="${escapeHtml(existing?.name || '')}"
          required
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        />
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Filière *
        </label>
        <input 
          type="text" 
          name="track" 
          value="${escapeHtml(existing?.track || '')}"
          required
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        />
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Année *
        </label>
        <input 
          type="text" 
          name="year" 
          value="${escapeHtml(existing?.year || '')}"
          required
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        />
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Nombre d'élèves *
        </label>
        <input 
          type="number" 
          name="students" 
          value="${existing?.students || 25}"
          required
          min="1"
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        />
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button type="button" class="btn ghost" data-close-modal>Annuler</button>
        <button type="submit" class="btn primary">${existing ? 'Mettre à jour' : 'Créer'}</button>
      </div>
    </form>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Fermer la modale
  const closeModal = () => {
    overlay.remove();
  };
  
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // Soumettre le formulaire
  modal.querySelector('#create-class-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    data.students = Number(data.students);
    
    try {
      if (existing) {
        updateClass(existing.id, data);
      } else {
        createClass(data);
      }
      closeModal();
      
      // Re-rendre la vue
      renderClassesView(container);
    } catch (error) {
      console.error('[Director Admin] Erreur création/modification classe', error);
      alert('Erreur lors de la création/modification : ' + error.message);
    }
  });
}

/**
 * Ouvre la modale de création d'établissement
 * @param {HTMLElement} container - Conteneur pour re-rendre après création
 */
function openCreateSchoolModal(container) {
  // Créer l'overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  // Créer la modale
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  `;
  
  modal.innerHTML = `
    <h3 style="margin-top: 0; font-size: 1.5rem;">🏫 Créer un nouvel établissement</h3>
    <p style="color: var(--muted); margin-bottom: 20px;">
      Ajoutez un établissement de démonstration avec des données mockées.
    </p>
    <form id="create-school-form">
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Nom de l'établissement *
        </label>
        <input 
          type="text" 
          name="name" 
          required
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        />
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Ville *
        </label>
        <input 
          type="text" 
          name="city" 
          required
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        />
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Adresse
        </label>
        <input 
          type="text" 
          name="address"
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        />
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Directeur
        </label>
        <input 
          type="text" 
          name="director"
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        />
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button type="button" class="btn ghost" data-close-modal>Annuler</button>
        <button type="submit" class="btn primary">Créer</button>
      </div>
    </form>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Fermer la modale
  const closeModal = () => {
    overlay.remove();
  };
  
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // Soumettre le formulaire
  modal.querySelector('#create-school-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      const newSchool = createSchool(data);
      closeModal();
      
      // Re-rendre la vue
      renderSchoolsView(container);
      
      // Optionnel : basculer vers le nouvel établissement
      if (confirm(`Voulez-vous basculer vers ${newSchool.name} ?`)) {
        setActiveSchoolId(newSchool.id);
        window.dispatchEvent(new CustomEvent('schoolChanged', { detail: { schoolId: newSchool.id } }));
        renderSchoolsView(container);
      }
    } catch (error) {
      console.error('[Director Admin] Erreur création établissement', error);
      alert('Erreur lors de la création : ' + error.message);
    }
  });
}

/**
 * Ouvre la modale de création d'élève
 * @param {HTMLElement} container - Conteneur pour re-rendre après création
 */
function openCreateStudentModal(container) {
  const classes = getClasses();
  
  // Créer l'overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  // Créer la modale
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  `;
  
  modal.innerHTML = `
    <h3 style="margin-top: 0; font-size: 1.5rem;">👤 Ajouter un élève</h3>
    <p style="color: var(--muted); margin-bottom: 20px;">
      Créez un nouvel élève et assignez-le à une classe.
    </p>
    <form id="create-student-form">
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Nom complet *
        </label>
        <input 
          type="text" 
          name="name" 
          required
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        />
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Email *
        </label>
        <input 
          type="email" 
          name="email" 
          required
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        />
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Classe
        </label>
        <select 
          name="className"
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        >
          <option value="">Aucune classe (non assigné)</option>
          ${classes.map(cls => `
            <option value="${escapeHtml(cls.name)}">${escapeHtml(cls.name)}</option>
          `).join('')}
        </select>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button type="button" class="btn ghost" data-close-modal>Annuler</button>
        <button type="submit" class="btn primary">Créer</button>
      </div>
    </form>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Fermer la modale
  const closeModal = () => {
    overlay.remove();
  };
  
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // Soumettre le formulaire
  modal.querySelector('#create-student-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      createStudent(data);
      closeModal();
      renderClassesView(container);
    } catch (error) {
      console.error('[Director Admin] Erreur création élève', error);
      alert('Erreur lors de la création : ' + error.message);
    }
  });
}

/**
 * Parse un fichier CSV et retourne un tableau d'objets
 * @param {string} csvText - Contenu du CSV
 * @returns {Array<object>}
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Première ligne = en-têtes
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Vérifier que les colonnes nécessaires existent
  const nameIndex = headers.findIndex(h => h.includes('nom') || h.includes('name'));
  const emailIndex = headers.findIndex(h => h.includes('email') || h.includes('mail'));
  const classIndex = headers.findIndex(h => h.includes('classe') || h.includes('class'));
  
  if (nameIndex === -1) {
    throw new Error('Le CSV doit contenir une colonne "nom" ou "name"');
  }
  
  // Parser les lignes
  const students = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length === 0 || !values[nameIndex]) continue;
    
    students.push({
      name: values[nameIndex] || '',
      email: emailIndex !== -1 ? (values[emailIndex] || '') : '',
      className: classIndex !== -1 ? (values[classIndex] || '') : ''
    });
  }
  
  return students;
}

/**
 * Ouvre la modale d'import CSV
 * @param {HTMLElement} container - Conteneur pour re-rendre après import
 */
function openImportCsvModal(container) {
  const classes = getClasses();
  
  // Créer l'overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  // Créer la modale
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  `;
  
  modal.innerHTML = `
    <h3 style="margin-top: 0; font-size: 1.5rem;">📥 Importer des élèves depuis un CSV</h3>
    <p style="color: var(--muted); margin-bottom: 20px;">
      Format attendu : <code style="background: var(--card-hover); padding: 2px 6px; border-radius: 4px;">nom,email,classe</code>
    </p>
    <div style="margin-bottom: 16px; padding: 12px; background: var(--card-hover); border-radius: var(--radius-md); font-size: 0.9rem;">
      <strong>Exemple :</strong><br>
      <code style="display: block; margin-top: 8px; padding: 8px; background: var(--card); border-radius: 4px;">
        nom,email,classe<br>
        Jean Dupont,jean.dupont@ecole.fr,Tle2 – Spé Maths<br>
        Marie Martin,marie.martin@ecole.fr,Tle2 – Spé Maths
      </code>
    </div>
    <form id="import-csv-form">
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Fichier CSV *
        </label>
        <input 
          type="file" 
          name="csvFile" 
          accept=".csv,.txt"
          required
          id="csv-file-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        />
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Classe par défaut (si non spécifiée dans le CSV)
        </label>
        <select 
          name="defaultClass"
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        >
          <option value="">Aucune classe</option>
          ${classes.map(cls => `
            <option value="${escapeHtml(cls.name)}">${escapeHtml(cls.name)}</option>
          `).join('')}
        </select>
      </div>
      <div id="csv-preview" style="margin-bottom: 20px; display: none;">
        <strong>Aperçu :</strong>
        <div id="csv-preview-content" style="margin-top: 8px; padding: 12px; background: var(--card-hover); border-radius: var(--radius-md); max-height: 200px; overflow-y: auto; font-size: 0.85rem;"></div>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button type="button" class="btn ghost" data-close-modal>Annuler</button>
        <button type="submit" class="btn primary">Importer</button>
      </div>
    </form>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Fermer la modale
  const closeModal = () => {
    overlay.remove();
  };
  
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // Aperçu du fichier CSV
  const fileInput = modal.querySelector('#csv-file-input');
  const previewDiv = modal.querySelector('#csv-preview');
  const previewContent = modal.querySelector('#csv-preview-content');
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target.result;
        const students = parseCSV(csvText);
        
        if (students.length > 0) {
          previewDiv.style.display = 'block';
          previewContent.innerHTML = `
            <strong>${students.length} élève(s) trouvé(s) :</strong><br>
            ${students.slice(0, 5).map(s => `
              • ${escapeHtml(s.name)} ${s.email ? `(${escapeHtml(s.email)})` : ''} ${s.className ? `→ ${escapeHtml(s.className)}` : ''}
            `).join('<br>')}
            ${students.length > 5 ? `<br>... et ${students.length - 5} autre(s)` : ''}
          `;
        } else {
          previewDiv.style.display = 'block';
          previewContent.innerHTML = '<span style="color: var(--warning);">Aucun élève trouvé dans le fichier</span>';
        }
      } catch (error) {
        previewDiv.style.display = 'block';
        previewContent.innerHTML = `<span style="color: var(--error);">Erreur : ${escapeHtml(error.message)}</span>`;
      }
    };
    reader.readAsText(file);
  });
  
  // Soumettre le formulaire
  modal.querySelector('#import-csv-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('csvFile');
    const defaultClass = formData.get('defaultClass');
    
    if (!file) {
      alert('Veuillez sélectionner un fichier CSV');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target.result;
        let students = parseCSV(csvText);
        
        // Appliquer la classe par défaut si nécessaire
        if (defaultClass) {
          students = students.map(s => ({
            ...s,
            className: s.className || defaultClass
          }));
        }
        
        if (students.length === 0) {
          alert('Aucun élève trouvé dans le fichier CSV');
          return;
        }
        
        createStudents(students);
        closeModal();
        renderClassesView(container);
        alert(`${students.length} élève(s) importé(s) avec succès !`);
      } catch (error) {
        console.error('[Director Admin] Erreur import CSV', error);
        alert('Erreur lors de l\'import : ' + error.message);
      }
    };
    reader.readAsText(file);
  });
}

/**
 * Ouvre la modale pour assigner des élèves à une classe
 * @param {HTMLElement} container - Conteneur pour re-rendre après assignation
 * @param {string} className - Nom de la classe
 */
function openAssignStudentsModal(container, className) {
  const allStudents = getStudents();
  const unassignedStudents = allStudents.filter(s => !s.className || s.className === '');
  const classes = getClasses();
  
  // Créer l'overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  // Créer la modale
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  `;
  
  modal.innerHTML = `
    <h3 style="margin-top: 0; font-size: 1.5rem;">👥 Assigner des élèves à ${escapeHtml(className)}</h3>
    <p style="color: var(--muted); margin-bottom: 20px;">
      Sélectionnez les élèves à assigner à cette classe.
    </p>
    <div style="max-height: 400px; overflow-y: auto; margin-bottom: 20px;">
      ${unassignedStudents.length > 0 ? `
        <div style="display: grid; gap: 8px;">
          ${unassignedStudents.map(student => `
            <label style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--card-hover); border-radius: var(--radius-md); cursor: pointer;">
              <input type="checkbox" name="student" value="${student.id}" style="cursor: pointer;">
              <div style="flex: 1;">
                <div style="font-weight: 600;">${escapeHtml(student.name)}</div>
                <div style="font-size: 0.85rem; color: var(--muted);">${escapeHtml(student.email || '')}</div>
              </div>
            </label>
          `).join('')}
        </div>
      ` : `
        <div style="text-align: center; padding: 40px; color: var(--muted);">
          Tous les élèves sont déjà assignés à une classe
        </div>
      `}
    </div>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button type="button" class="btn ghost" data-close-modal>Annuler</button>
      <button type="button" class="btn primary" id="btn-assign-selected">Assigner les élèves sélectionnés</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Fermer la modale
  const closeModal = () => {
    overlay.remove();
  };
  
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // Assigner les élèves sélectionnés
  modal.querySelector('#btn-assign-selected').addEventListener('click', () => {
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedIds.length === 0) {
      alert('Veuillez sélectionner au moins un élève');
      return;
    }
    
    try {
      selectedIds.forEach(studentId => {
        assignStudentToClass(studentId, className);
      });
      closeModal();
      renderClassesView(container);
      alert(`${selectedIds.length} élève(s) assigné(s) à ${escapeHtml(className)}`);
    } catch (error) {
      console.error('[Director Admin] Erreur assignation élèves', error);
      alert('Erreur lors de l\'assignation : ' + error.message);
    }
  });
}

/**
 * Ouvre la modale pour réassigner un élève à une autre classe
 * @param {HTMLElement} container - Conteneur pour re-rendre après réassignation
 * @param {string} studentId - ID de l'élève
 * @param {string} currentClass - Classe actuelle
 */
function openReassignStudentModal(container, studentId, currentClass) {
  const classes = getClasses();
  const allStudents = getStudents();
  const student = allStudents.find(s => s.id === studentId);
  
  if (!student) {
    alert('Élève introuvable');
    return;
  }
  
  // Créer l'overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  // Créer la modale
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  `;
  
  modal.innerHTML = `
    <h3 style="margin-top: 0; font-size: 1.5rem;">🔄 Réassigner un élève</h3>
    <p style="color: var(--muted); margin-bottom: 20px;">
      <strong>${escapeHtml(student.name)}</strong><br>
      Classe actuelle : ${escapeHtml(currentClass || 'Aucune')}
    </p>
    <form id="reassign-student-form">
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Nouvelle classe
        </label>
        <select 
          name="newClass"
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        >
          <option value="">Aucune classe (retirer de la classe actuelle)</option>
          ${classes.filter(cls => cls.name !== currentClass).map(cls => `
            <option value="${escapeHtml(cls.name)}">${escapeHtml(cls.name)}</option>
          `).join('')}
        </select>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button type="button" class="btn ghost" data-close-modal>Annuler</button>
        <button type="submit" class="btn primary">Réassigner</button>
      </div>
    </form>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Fermer la modale
  const closeModal = () => {
    overlay.remove();
  };
  
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // Soumettre le formulaire
  modal.querySelector('#reassign-student-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newClass = formData.get('newClass');
    
    try {
      if (newClass) {
        assignStudentToClass(studentId, newClass);
      } else {
        // Retirer de la classe actuelle
        assignStudentToClass(studentId, '');
      }
      closeModal();
      renderClassesView(container);
    } catch (error) {
      console.error('[Director Admin] Erreur réassignation élève', error);
      alert('Erreur lors de la réassignation : ' + error.message);
    }
  });
}

/**
 * Ouvre la modale de création d'utilisateur
 * @param {HTMLElement} container - Conteneur pour re-rendre après création
 */
function openCreateUserModal(container) {
  const classes = getClasses();
  
  // Créer l'overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  // Créer la modale
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  `;
  
  modal.innerHTML = `
    <h3 style="margin-top: 0; font-size: 1.5rem;">👤 Créer un utilisateur</h3>
    <p style="color: var(--muted); margin-bottom: 20px;">
      Créez un nouvel utilisateur (enseignant ou autre rôle).
    </p>
    <form id="create-user-form">
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Nom complet *
        </label>
        <input 
          type="text" 
          name="name" 
          required
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        />
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Email *
        </label>
        <input 
          type="email" 
          name="email" 
          required
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        />
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Rôle *
        </label>
        <select 
          name="role"
          required
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        >
          <option value="Enseignant">Enseignant</option>
          <option value="Directeur">Directeur</option>
          <option value="Directeur pédagogique">Directeur pédagogique</option>
          <option value="Administrateur">Administrateur</option>
        </select>
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 6px; font-weight: 600;">
          Classe (pour les enseignants)
        </label>
        <select 
          name="className"
          class="admin-input"
          style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--card-border); background: var(--card-hover); color: var(--fg);"
        >
          <option value="">Aucune classe</option>
          ${classes.map(cls => `
            <option value="${escapeHtml(cls.name)}">${escapeHtml(cls.name)}</option>
          `).join('')}
        </select>
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button type="button" class="btn ghost" data-close-modal>Annuler</button>
        <button type="submit" class="btn primary">Créer</button>
      </div>
    </form>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Fermer la modale
  const closeModal = () => {
    overlay.remove();
  };
  
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
  
  // Soumettre le formulaire
  modal.querySelector('#create-user-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      createUser(data);
      closeModal();
      renderUsersView(container);
    } catch (error) {
      console.error('[Director Admin] Erreur création utilisateur', error);
      alert('Erreur lors de la création : ' + error.message);
    }
  });
}

/**
 * Ouvre la modale d'activation d'utilisateur
 * @param {HTMLElement} container - Conteneur pour re-rendre après activation
 * @param {object} user - Utilisateur à activer
 */
function openActivateUserModal(container, user) {
  // Créer l'overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  // Créer la modale
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  `;
  
  modal.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 3rem; margin-bottom: 16px;">✅</div>
      <h3 style="margin-top: 0; font-size: 1.5rem;">Utilisateur activé</h3>
    </div>
    <p style="color: var(--muted); margin-bottom: 20px; text-align: center;">
      <strong>${escapeHtml(user.name)}</strong> est à présent actif.
    </p>
    <div style="padding: 16px; background: var(--card-hover); border-radius: var(--radius-md); margin-bottom: 20px;">
      <p style="margin: 0; font-size: 0.9rem; color: var(--fg);">
        📧 L'utilisateur va recevoir un email avec un lien de création de mot de passe.
      </p>
    </div>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button type="button" class="btn primary" data-close-modal>Fermer</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Fermer la modale
  const closeModal = () => {
    overlay.remove();
    // Activer l'utilisateur après fermeture de la modale
    toggleUserStatus(user.id);
    renderUsersView(container);
  };
  
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
}

/**
 * Ouvre la modale de désactivation d'utilisateur
 * @param {HTMLElement} container - Conteneur pour re-rendre après désactivation
 * @param {object} user - Utilisateur à désactiver
 */
function openDeactivateUserModal(container, user) {
  // Créer l'overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  // Créer la modale
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  `;
  
  modal.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 3rem; margin-bottom: 16px;">🔒</div>
      <h3 style="margin-top: 0; font-size: 1.5rem;">Utilisateur désactivé</h3>
    </div>
    <p style="color: var(--muted); margin-bottom: 20px; text-align: center;">
      <strong>${escapeHtml(user.name)}</strong> a bien été désactivé.
    </p>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button type="button" class="btn primary" data-close-modal>Fermer</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Fermer la modale
  const closeModal = () => {
    overlay.remove();
    // Désactiver l'utilisateur après fermeture de la modale
    toggleUserStatus(user.id);
    renderUsersView(container);
  };
  
  modal.querySelector('[data-close-modal]').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });
}

// Export global pour app.js
window.renderDirectorAdminView = renderDirectorAdminView;
export default { renderDirectorAdminView };

