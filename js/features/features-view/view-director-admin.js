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
  toggleUserStatus
} from '../features-control/feature-admin.js';
import { getAllSchools, getActiveSchool, setActiveSchoolId } from '../features-control/store-multischool.js';
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
                      ${school.classesCount || 0} classe${school.classesCount > 1 ? 's' : ''} • ${school.usersCount || 0} utilisateur${school.usersCount > 1 ? 's' : ''}
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
      // Utiliser la fonction existante de view-admin.js
      const tempContainer = document.createElement('div');
      renderAdminView(tempContainer);
      // Simuler le clic sur le bouton créer établissement
      setTimeout(() => {
        const createSchoolBtn = document.getElementById('btn-create-school');
        if (createSchoolBtn) createSchoolBtn.click();
      }, 100);
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
          Gérez les classes de votre établissement
        </p>
      </div>
      
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="font-size: 1.25rem; margin: 0;">Liste des classes</h2>
          <button class="btn primary" id="btn-create-class">+ Créer une classe</button>
        </div>
        
        <div style="display: grid; gap: 12px;">
          ${classes.length > 0 ? classes.map(cls => `
            <div class="card" style="border-left: 4px solid var(--accent);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 4px;">
                    ${escapeHtml(cls.name)}
                  </h3>
                  <div style="font-size: 0.85rem; color: var(--muted);">
                    ${cls.studentsCount || 0} élève${cls.studentsCount > 1 ? 's' : ''}
                  </div>
                </div>
                <button class="btn ghost" data-edit-class="${cls.id}">
                  Modifier
                </button>
              </div>
            </div>
          `).join('') : `
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
      // Utiliser la fonction existante
      const tempContainer = document.createElement('div');
      renderAdminView(tempContainer);
      setTimeout(() => {
        const createClassBtn = document.getElementById('btn-create-class');
        if (createClassBtn) createClassBtn.click();
      }, 100);
    });
  }
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
                    <span class="badge" style="background: ${user.active ? 'var(--success)' : 'var(--muted)'}; color: white;">
                      ${user.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style="padding: 10px; text-align: center;">
                    <button class="btn ghost" data-toggle-user="${user.id}" style="font-size: 0.85rem;">
                      ${user.active ? 'Désactiver' : 'Activer'}
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
      const tempContainer = document.createElement('div');
      renderAdminView(tempContainer);
      setTimeout(() => {
        const createUserBtn = document.getElementById('btn-create-user');
        if (createUserBtn) createUserBtn.click();
      }, 100);
    });
  }
  
  container.querySelectorAll('[data-toggle-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      const userId = btn.dataset.toggleUser;
      toggleUserStatus(userId);
      renderUsersView(container);
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

// Export global pour app.js
window.renderDirectorAdminView = renderDirectorAdminView;
export default { renderDirectorAdminView };

