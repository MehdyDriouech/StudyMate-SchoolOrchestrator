/**
 * TopNav - Composant de navigation principale adaptée au rôle
 * Affiche les liens de navigation selon le persona connecté
 */

import { navigateTo } from '../app.js';
import { isDemoSession, endDemoSession } from '../features/features-control/feature-demo-mode.js';
import { getUserRole, handleLogout } from '../features/features-control/feature-auth.js';
import { initSchoolSwitcher } from './SchoolSwitcher.js';
import { getTopNavItems, getParentRoute } from './NavigationManager.js';

/**
 * Initialise la navigation principale
 */
export function initTopNav() {
  const nav = document.getElementById('top-nav');
  if (!nav) {
    console.error('[TopNav] Élément #top-nav introuvable');
    return;
  }
  
  // Déterminer le rôle de l'utilisateur
  const userRole = getUserRole();
  const isDemo = isDemoSession();
  
  if (!userRole) {
    // Pas d'utilisateur connecté : navigation vide
    nav.innerHTML = '';
    return;
  }
  
  // Liens selon le rôle (via NavigationManager)
  const links = getTopNavItems(userRole);
  
  // Construire le HTML de la navigation
  let navHTML = '';
  
  links.forEach(link => {
    navHTML += `
      <button 
        class="btn ghost" 
        data-view="${link.view}"
        aria-label="${link.label}"
        title="${link.label}">
        ${link.label}
      </button>
    `;
  });
  
  // Ajouter un bouton de déconnexion
  navHTML += `
    <button 
      id="btn-logout" 
      class="btn ghost"
      aria-label="Se déconnecter"
      title="Se déconnecter"
      style="color: var(--danger);">
      🚪 Déconnexion
    </button>
  `;
  
  nav.innerHTML = navHTML;
  
  // Ajouter les event listeners
  nav.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      navigateTo(view);
    });
  });
  
  // Event listener pour la déconnexion
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        handleLogout();
      }
    });
  }
  
  // Initialiser le sélecteur d'établissement (sauf pour les étudiants)
  if (userRole !== 'student') {
    initSchoolSwitcher();
  }
  
  console.log('[TopNav] ✅ Navigation initialisée pour le rôle:', userRole);
}

/**
 * Met à jour l'état actif de la navigation
 * @param {string} activeView - Vue actuellement active
 */
export function updateActiveNav(activeView) {
  const nav = document.getElementById('top-nav');
  if (!nav) return;
  
  // Extraire la route parente pour la comparaison (ex: 'teacher-content/studio' -> 'teacher-content')
  const parentRoute = getParentRoute(activeView);
  
  nav.querySelectorAll('[data-view]').forEach(btn => {
    const btnView = btn.dataset.view;
    // Comparer la route parente ou la route exacte
    if (btnView === activeView || btnView === parentRoute) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

export default { initTopNav, updateActiveNav };
