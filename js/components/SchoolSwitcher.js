/**
 * SchoolSwitcher - Composant de sélection d'établissement
 */

import { getAllSchools, getActiveSchoolId, setActiveSchoolId } from '../features/features-control/store-multischool.js';
import { navigateTo } from '../app.js';
import { getUserRole } from '../features/features-control/feature-auth.js';

/**
 * Rend le sélecteur d'établissement
 * @param {HTMLElement} container - Conteneur où afficher le sélecteur
 */
export function renderSchoolSwitcher(container) {
  const userRole = getUserRole();
  
  // Les étudiants n'ont pas accès au sélecteur
  if (userRole === 'student') {
    container.innerHTML = '';
    return;
  }
  
  const schools = getAllSchools();
  const activeSchoolId = getActiveSchoolId();
  const activeSchool = schools.find(s => s.id === activeSchoolId);
  
  if (schools.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <label for="school-selector" style="font-size: 0.875rem; color: var(--muted); font-weight: 500;">
        🏫 Établissement:
      </label>
      <select 
        id="school-selector" 
        style="
          padding: 6px 12px;
          border: 2px solid var(--card-border);
          border-radius: var(--radius-md);
          background: var(--card);
          color: var(--fg);
          font-size: 0.9rem;
          cursor: pointer;
          transition: border-color var(--transition-base);
        "
        onfocus="this.style.borderColor='var(--accent)'"
        onblur="this.style.borderColor='var(--card-border)'"
      >
        ${schools.map(school => `
          <option value="${school.id}" ${school.id === activeSchoolId ? 'selected' : ''}>
            ${school.name} (${school.city})
          </option>
        `).join('')}
      </select>
    </div>
  `;
  
  // Event listener pour le changement d'établissement
  const selector = container.querySelector('#school-selector');
  if (selector) {
    selector.addEventListener('change', (e) => {
      const newSchoolId = e.target.value;
      handleSchoolChange(newSchoolId);
    });
  }
}

/**
 * Gère le changement d'établissement
 * @param {string} schoolId - ID du nouvel établissement
 */
function handleSchoolChange(schoolId) {
  console.log('[SchoolSwitcher] Changement d\'établissement:', schoolId);
  
  // Mettre à jour l'établissement actif
  setActiveSchoolId(schoolId);
  
  // Recharger la vue actuelle pour afficher les nouvelles données
  const currentHash = window.location.hash.replace('#', '');
  if (currentHash) {
    // Recharger la vue actuelle
    navigateTo(currentHash);
  } else {
    // Recharger le dashboard selon le rôle
    const userRole = getUserRole();
    const dashboardRoutes = {
      'teacher': 'dashboard-teacher',
      'director': 'dashboard-director',
      'pedago': 'dashboard-pedago'
    };
    const dashboardRoute = dashboardRoutes[userRole];
    if (dashboardRoute) {
      navigateTo(dashboardRoute);
    }
  }
}

/**
 * Initialise le sélecteur d'établissement dans la navigation
 */
export function initSchoolSwitcher() {
  const nav = document.getElementById('top-nav');
  if (!nav) {
    console.warn('[SchoolSwitcher] Élément #top-nav introuvable');
    return;
  }
  
  // Créer un conteneur pour le sélecteur si il n'existe pas
  let switcherContainer = document.getElementById('school-switcher-container');
  if (!switcherContainer) {
    switcherContainer = document.createElement('div');
    switcherContainer.id = 'school-switcher-container';
    switcherContainer.style.cssText = 'display: flex; align-items: center; margin-right: auto;';
    nav.insertBefore(switcherContainer, nav.firstChild);
  }
  
  renderSchoolSwitcher(switcherContainer);
  
  // Écouter les changements d'établissement pour mettre à jour le sélecteur
  window.addEventListener('schoolChanged', () => {
    renderSchoolSwitcher(switcherContainer);
  });
}

export default { renderSchoolSwitcher, initSchoolSwitcher };

