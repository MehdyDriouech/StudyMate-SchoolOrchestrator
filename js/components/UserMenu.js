/**
 * UserMenu - Menu utilisateur avec options de profil, thème et déconnexion
 */

import { handleLogout, getCurrentUser } from '../features/features-control/feature-auth.js';

let userMenuContainer = null;
let isMenuOpen = false;

/**
 * Initialise le menu utilisateur
 */
export function initUserMenu() {
  const nav = document.getElementById('top-nav');
  if (!nav) {
    console.error('[UserMenu] Élément #top-nav introuvable');
    return;
  }

  // Récupérer l'utilisateur actuel
  const user = getCurrentUser();
  if (!user) {
    return;
  }

  // Créer le conteneur du menu utilisateur
  const menuContainer = document.createElement('div');
  menuContainer.className = 'user-menu-container';
  menuContainer.style.cssText = 'position: relative; margin-left: 8px;';

  // Bouton pour ouvrir le menu
  const menuButton = document.createElement('button');
  menuButton.className = 'btn ghost user-menu-button';
  menuButton.setAttribute('aria-label', 'Menu utilisateur');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.innerHTML = `
    <span style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 1.2rem;">👤</span>
      <span style="font-weight: 500;">${user.name || user.email}</span>
      <span style="font-size: 0.8rem; opacity: 0.7;">▼</span>
    </span>
  `;

  // Menu déroulant
  const dropdown = document.createElement('div');
  dropdown.className = 'user-menu-dropdown';
  dropdown.setAttribute('role', 'menu');
  dropdown.style.cssText = `
    display: none;
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 240px;
    background: var(--card);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    padding: 8px;
    margin-top: 4px;
  `;

  // Obtenir le thème actuel
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const themeIcon = currentTheme === 'dark' ? '🌙' : '☀️';
  const themeLabel = currentTheme === 'dark' ? 'Mode clair' : 'Mode sombre';

  dropdown.innerHTML = `
    <!-- Informations utilisateur -->
    <div class="user-menu-section" style="padding: 12px; border-bottom: 1px solid var(--card-border);">
      <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(user.name || 'Utilisateur')}</div>
      <div style="font-size: 0.85rem; color: var(--muted);">${escapeHtml(user.email)}</div>
      <div style="font-size: 0.8rem; color: var(--muted); margin-top: 4px;">
        Rôle: ${getRoleLabel(user.role)}
      </div>
    </div>

    <!-- Options du menu -->
    <div class="user-menu-options" style="padding: 4px 0;">
      <button class="user-menu-item" data-action="profile" style="
        width: 100%;
        padding: 10px 12px;
        text-align: left;
        background: transparent;
        border: none;
        color: var(--fg);
        cursor: pointer;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
        transition: background var(--transition-base);
      ">
        <span style="font-size: 1.1rem;">ℹ️</span>
        <span>Informations du profil</span>
      </button>

      <button class="user-menu-item" data-action="theme" style="
        width: 100%;
        padding: 10px 12px;
        text-align: left;
        background: transparent;
        border: none;
        color: var(--fg);
        cursor: pointer;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
        transition: background var(--transition-base);
      ">
        <span style="font-size: 1.1rem;">${themeIcon}</span>
        <span>${themeLabel}</span>
      </button>

      <button class="user-menu-item" data-action="password" style="
        width: 100%;
        padding: 10px 12px;
        text-align: left;
        background: transparent;
        border: none;
        color: var(--fg);
        cursor: pointer;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
        transition: background var(--transition-base);
      ">
        <span style="font-size: 1.1rem;">🔒</span>
        <span>Changer le mot de passe</span>
      </button>

      <div style="height: 1px; background: var(--card-border); margin: 4px 0;"></div>

      <button class="user-menu-item" data-action="logout" style="
        width: 100%;
        padding: 10px 12px;
        text-align: left;
        background: transparent;
        border: none;
        color: var(--danger);
        cursor: pointer;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
        transition: background var(--transition-base);
      ">
        <span style="font-size: 1.1rem;">🚪</span>
        <span>Déconnexion</span>
      </button>
    </div>
  `;

  menuContainer.appendChild(menuButton);
  menuContainer.appendChild(dropdown);
  nav.appendChild(menuContainer);

  userMenuContainer = menuContainer;

  // Event listeners
  menuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  dropdown.querySelectorAll('[data-action]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = item.dataset.action;
      handleMenuAction(action);
      closeMenu();
    });
  });

  // Fermer le menu en cliquant à l'extérieur
  document.addEventListener('click', (e) => {
    if (!menuContainer.contains(e.target)) {
      closeMenu();
    }
  });

  // Styles hover pour les items
  dropdown.querySelectorAll('.user-menu-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.background = 'var(--card-hover)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });
  });
}

/**
 * Ouvre/ferme le menu
 */
function toggleMenu() {
  isMenuOpen = !isMenuOpen;
  const dropdown = userMenuContainer?.querySelector('.user-menu-dropdown');
  const button = userMenuContainer?.querySelector('.user-menu-button');
  
  if (dropdown && button) {
    dropdown.style.display = isMenuOpen ? 'block' : 'none';
    button.setAttribute('aria-expanded', isMenuOpen.toString());
  }
}

/**
 * Ferme le menu
 */
function closeMenu() {
  isMenuOpen = false;
  const dropdown = userMenuContainer?.querySelector('.user-menu-dropdown');
  const button = userMenuContainer?.querySelector('.user-menu-button');
  
  if (dropdown && button) {
    dropdown.style.display = 'none';
    button.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Gère les actions du menu
 * @param {string} action - Action à effectuer
 */
function handleMenuAction(action) {
  switch (action) {
    case 'profile':
      showProfileInfo();
      break;
    case 'theme':
      toggleTheme();
      break;
    case 'password':
      showPasswordChange();
      break;
    case 'logout':
      handleLogoutAction();
      break;
  }
}

/**
 * Affiche les informations du profil
 */
function showProfileInfo() {
  const user = getCurrentUser();
  if (!user) return;

  const modal = createModal(`
    <div style="max-width: 500px; margin: 0 auto;">
      <h2 style="font-size: 1.5rem; margin-bottom: 24px; display: flex; align-items: center; gap: 8px;">
        <span>👤</span>
        <span>Informations du profil</span>
      </h2>
      
      <div style="display: grid; gap: 16px;">
        <div>
          <label style="display: block; font-size: 0.85rem; color: var(--muted); margin-bottom: 4px;">
            Nom complet
          </label>
          <div style="padding: 10px; background: var(--card-hover); border-radius: var(--radius-sm);">
            ${escapeHtml(user.name || 'Non renseigné')}
          </div>
        </div>
        
        <div>
          <label style="display: block; font-size: 0.85rem; color: var(--muted); margin-bottom: 4px;">
            Email
          </label>
          <div style="padding: 10px; background: var(--card-hover); border-radius: var(--radius-sm);">
            ${escapeHtml(user.email || 'Non renseigné')}
          </div>
        </div>
        
        <div>
          <label style="display: block; font-size: 0.85rem; color: var(--muted); margin-bottom: 4px;">
            Rôle
          </label>
          <div style="padding: 10px; background: var(--card-hover); border-radius: var(--radius-sm);">
            ${getRoleLabel(user.role)}
          </div>
        </div>
        
        ${user.schoolId ? `
          <div>
            <label style="display: block; font-size: 0.85rem; color: var(--muted); margin-bottom: 4px;">
              Établissement
            </label>
            <div style="padding: 10px; background: var(--card-hover); border-radius: var(--radius-sm);">
              ${escapeHtml(user.schoolId)}
            </div>
          </div>
        ` : ''}
      </div>
      
      <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
        <button class="btn primary" onclick="this.closest('.modal-overlay').remove()">
          Fermer
        </button>
      </div>
    </div>
  `);
  
  document.body.appendChild(modal);
}

/**
 * Change le thème (clair/sombre)
 */
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('SM_SO_THEME', newTheme);
  
  // Mettre à jour l'icône dans le menu
  const themeItem = userMenuContainer?.querySelector('[data-action="theme"]');
  if (themeItem) {
    const icon = newTheme === 'dark' ? '🌙' : '☀️';
    const label = newTheme === 'dark' ? 'Mode clair' : 'Mode sombre';
    themeItem.innerHTML = `
      <span style="font-size: 1.1rem;">${icon}</span>
      <span>${label}</span>
    `;
  }
  
  console.log('[UserMenu] Thème changé:', newTheme);
}

/**
 * Affiche le formulaire de changement de mot de passe
 */
function showPasswordChange() {
  const modal = createModal(`
    <div style="max-width: 400px; margin: 0 auto;">
      <h2 style="font-size: 1.5rem; margin-bottom: 24px; display: flex; align-items: center; gap: 8px;">
        <span>🔒</span>
        <span>Changer le mot de passe</span>
      </h2>
      
      <form id="password-change-form" style="display: grid; gap: 16px;">
        <div>
          <label for="current-password" style="display: block; font-size: 0.85rem; color: var(--muted); margin-bottom: 4px;">
            Mot de passe actuel
          </label>
          <input 
            type="password" 
            id="current-password" 
            required
            style="width: 100%; padding: 10px; border: 1px solid var(--card-border); border-radius: var(--radius-sm); background: var(--card); color: var(--fg);"
            placeholder="Entrez votre mot de passe actuel"
          />
        </div>
        
        <div>
          <label for="new-password" style="display: block; font-size: 0.85rem; color: var(--muted); margin-bottom: 4px;">
            Nouveau mot de passe
          </label>
          <input 
            type="password" 
            id="new-password" 
            required
            minlength="6"
            style="width: 100%; padding: 10px; border: 1px solid var(--card-border); border-radius: var(--radius-sm); background: var(--card); color: var(--fg);"
            placeholder="Entrez le nouveau mot de passe"
          />
        </div>
        
        <div>
          <label for="confirm-password" style="display: block; font-size: 0.85rem; color: var(--muted); margin-bottom: 4px;">
            Confirmer le nouveau mot de passe
          </label>
          <input 
            type="password" 
            id="confirm-password" 
            required
            minlength="6"
            style="width: 100%; padding: 10px; border: 1px solid var(--card-border); border-radius: var(--radius-sm); background: var(--card); color: var(--fg);"
            placeholder="Confirmez le nouveau mot de passe"
          />
        </div>
        
        <div id="password-error" style="display: none; padding: 10px; background: var(--danger-light); color: var(--danger); border-radius: var(--radius-sm); font-size: 0.9rem;"></div>
        
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
          <button type="button" class="btn ghost" onclick="this.closest('.modal-overlay').remove()">
            Annuler
          </button>
          <button type="submit" class="btn primary">
            Changer le mot de passe
          </button>
        </div>
      </form>
    </div>
  `);
  
  document.body.appendChild(modal);
  
  // Gérer la soumission du formulaire
  const form = modal.querySelector('#password-change-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorDiv = document.getElementById('password-error');
    
    // Validation
    if (newPassword !== confirmPassword) {
      errorDiv.textContent = 'Les mots de passe ne correspondent pas.';
      errorDiv.style.display = 'block';
      return;
    }
    
    if (newPassword.length < 6) {
      errorDiv.textContent = 'Le mot de passe doit contenir au moins 6 caractères.';
      errorDiv.style.display = 'block';
      return;
    }
    
    // Simuler le changement de mot de passe
    // Dans une vraie app, on ferait un appel API ici
    console.log('[UserMenu] Changement de mot de passe demandé');
    
    // Afficher un message de succès
    errorDiv.style.display = 'none';
    alert('Mot de passe changé avec succès !');
    modal.remove();
  });
}

/**
 * Gère la déconnexion
 */
function handleLogoutAction() {
  if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
    handleLogout();
  }
}

/**
 * Crée une modale
 * @param {string} content - Contenu HTML de la modale
 * @returns {HTMLElement}
 */
function createModal(content) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  `;
  
  const modal = document.createElement('div');
  modal.className = 'modal-content';
  modal.style.cssText = `
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  `;
  
  modal.innerHTML = content;
  overlay.appendChild(modal);
  
  // Fermer en cliquant sur l'overlay
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
  
  return overlay;
}

/**
 * Retourne le libellé du rôle
 * @param {string} role - Rôle de l'utilisateur
 * @returns {string}
 */
function getRoleLabel(role) {
  const labels = {
    teacher: 'Enseignant',
    director: 'Directeur',
    student: 'Élève',
    pedago: 'Référent pédagogique'
  };
  return labels[role] || role;
}

/**
 * Échappe le HTML pour éviter les injections XSS
 * @param {string} str - Chaîne à échapper
 * @returns {string}
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Charge le thème sauvegardé au démarrage
 */
export function loadSavedTheme() {
  const savedTheme = localStorage.getItem('SM_SO_THEME');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
}

export default { initUserMenu, loadSavedTheme };

