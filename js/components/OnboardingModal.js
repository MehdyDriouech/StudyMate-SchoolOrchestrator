/**
 * OnboardingModal - Modale d'introduction et de sélection de persona pour la démo
 */

import { fakeLogin } from '../features/features-control/feature-auth.js';
import { navigateTo } from '../app.js';

const STORAGE_ONBOARDING_SEEN = 'SM_SO_ONBOARDING_SEEN';
const STORAGE_ONBOARDING_ROLE_SEEN = 'SM_SO_ONBOARDING_ROLE_SEEN';

/**
 * Personas et leurs features (pour la modale de sélection initiale)
 */
const PERSONAS = [
  {
    role: 'student',
    title: '👨‍🎓 Élève',
    description: 'Accédez à vos thèmes, entraînez-vous et suivez votre progression',
    features: [
      '📚 Mes thèmes (catalogue)',
      '🎯 Entraînement',
      '📝 Rendu + Annales',
      '👥 Social / Classement / Comparaisons',
      '📅 Timeline'
    ],
    color: '#3b82f6'
  },
  {
    role: 'teacher',
    title: '👨‍🏫 Enseignant',
    description: 'Créez des contenus, assignez des thèmes et suivez vos élèves',
    features: [
      '🎨 AI Theme Studio',
      '📚 Bibliothèque',
      '📖 Curriculum Builder',
      '📋 Assignations',
      '👥 Suivi élèves (rendus)',
      '📊 Résumé de classe',
      '📈 Analytics Classe',
      '📅 Timeline'
    ],
    color: '#10b981'
  },
  {
    role: 'director',
    title: '👔 Direction',
    description: 'Gérez votre établissement, administrez les classes et analysez les performances',
    features: [
      '🏫 Multi-Établissements',
      '⚙️ Administration : établissements / classes / utilisateurs',
      '📊 Dashboard exécutif',
      '📈 Analytics établissement / matières',
      '📅 Timeline'
    ],
    color: '#8b5cf6'
  },
  {
    role: 'pedago',
    title: '📚 Direction pédagogique',
    description: 'Validez les contenus pédagogiques et gérez le curriculum',
    features: [
      '✅ Workflow Qualité complet',
      '📖 Lecture et validation thèmes',
      '📚 Curriculum global',
      '📅 Timeline'
    ],
    color: '#f59e0b'
  }
];

/**
 * Contenu des modales d'onboarding spécifiques par rôle
 */
const ROLE_ONBOARDING = {
  teacher: {
    title: '👨‍🏫 Bienvenue sur votre Dashboard Enseignant',
    description: 'Découvrez les fonctionnalités principales de votre espace',
    features: [
      { icon: '🎨', text: 'AI Theme Studio : Créez des thèmes avec l\'IA' },
      { icon: '📚', text: 'Bibliothèque : Gérez vos contenus pédagogiques' },
      { icon: '📖', text: 'Curriculum Builder : Construisez vos parcours' },
      { icon: '📋', text: 'Assignations : Assignez des thèmes à vos classes' },
      { icon: '👥', text: 'Suivi élèves : Consultez les rendus et progrès' },
      { icon: '📊', text: 'Analytics : Analysez les performances de vos classes' }
    ],
    color: '#10b981'
  },
  student: {
    title: '👨‍🎓 Bienvenue sur votre Dashboard Élève',
    description: 'Découvrez les fonctionnalités principales de votre espace',
    features: [
      { icon: '📚', text: 'Mes thèmes : Accédez à votre catalogue de thèmes' },
      { icon: '🎯', text: 'Entraînement : Pratiquez et progressez' },
      { icon: '📝', text: 'Rendu + Annales : Consultez vos résultats' },
      { icon: '👥', text: 'Social : Comparez-vous avec vos camarades' },
      { icon: '📅', text: 'Timeline : Suivez votre progression dans le temps' }
    ],
    color: '#3b82f6'
  },
  director: {
    title: '👔 Bienvenue sur votre Dashboard Direction',
    description: 'Découvrez les fonctionnalités principales de votre espace',
    features: [
      { icon: '🏫', text: 'Multi-Établissements : Gérez plusieurs établissements' },
      { icon: '⚙️', text: 'Administration : Gérez établissements, classes et utilisateurs' },
      { icon: '📊', text: 'Dashboard exécutif : Vue d\'ensemble des performances' },
      { icon: '📈', text: 'Analytics : Analysez les données de votre établissement' },
      { icon: '📅', text: 'Timeline : Suivez l\'activité de votre établissement' }
    ],
    color: '#8b5cf6'
  },
  pedago: {
    title: '📚 Bienvenue sur votre Dashboard Direction Pédagogique',
    description: 'Découvrez les fonctionnalités principales de votre espace',
    features: [
      { icon: '✅', text: 'Workflow Qualité : Validez les contenus pédagogiques' },
      { icon: '📖', text: 'Lecture et validation : Examinez les thèmes proposés' },
      { icon: '📚', text: 'Curriculum global : Gérez le curriculum de l\'établissement' },
      { icon: '📅', text: 'Timeline : Suivez les validations et modifications' }
    ],
    color: '#f59e0b'
  }
};

/**
 * Vérifie si la modale de sélection de persona doit être affichée (avant login)
 * @returns {boolean}
 */
export function shouldShowOnboarding() {
  // Ne pas afficher si l'utilisateur est déjà connecté
  const isAuth = localStorage.getItem('SM_SO_USER_ROLE');
  if (isAuth) {
    return false;
  }
  
  // Vérifier si l'utilisateur a déjà vu la modale
  const seen = localStorage.getItem(STORAGE_ONBOARDING_SEEN);
  return !seen;
}

/**
 * Vérifie si l'onboarding spécifique au rôle doit être affiché (après login)
 * @param {string} role - Rôle de l'utilisateur
 * @returns {boolean}
 */
export function shouldShowRoleOnboarding(role) {
  if (!role) {
    return false;
  }
  
  // Vérifier si l'utilisateur a déjà vu l'onboarding pour ce rôle
  const seenRoles = JSON.parse(localStorage.getItem(STORAGE_ONBOARDING_ROLE_SEEN) || '[]');
  return !seenRoles.includes(role);
}

/**
 * Marque la modale comme vue
 */
function markOnboardingAsSeen() {
  localStorage.setItem(STORAGE_ONBOARDING_SEEN, 'true');
}

/**
 * Marque l'onboarding d'un rôle comme vu
 * @param {string} role - Rôle de l'utilisateur
 */
function markRoleOnboardingAsSeen(role) {
  const seenRoles = JSON.parse(localStorage.getItem(STORAGE_ONBOARDING_ROLE_SEEN) || '[]');
  if (!seenRoles.includes(role)) {
    seenRoles.push(role);
    localStorage.setItem(STORAGE_ONBOARDING_ROLE_SEEN, JSON.stringify(seenRoles));
  }
}

/**
 * Affiche la modale d'onboarding
 */
export function showOnboardingModal() {
  if (!shouldShowOnboarding()) {
    return;
  }
  
  const modal = document.createElement('div');
  modal.id = 'onboarding-modal';
  modal.className = 'onboarding-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'onboarding-title');
  modal.setAttribute('aria-modal', 'true');
  
  modal.innerHTML = `
    <div class="onboarding-modal-overlay"></div>
    <div class="onboarding-modal-content">
      <div class="onboarding-modal-header">
        <h2 id="onboarding-title" class="onboarding-modal-title">
          🎓 Bienvenue sur StudyMate School Orchestrator
        </h2>
        <p class="onboarding-modal-subtitle">
          Plateforme de gestion pédagogique pour établissements scolaires
        </p>
        <button 
          class="onboarding-modal-close" 
          aria-label="Fermer la modale"
          onclick="window.closeOnboardingModal()"
        >
          ✕
        </button>
      </div>
      
      <div class="onboarding-modal-body">
        <p class="onboarding-intro">
          Découvrez les fonctionnalités de StudyMate en testant l'application avec l'un des rôles ci-dessous.
          Chaque persona vous donne accès à un ensemble de fonctionnalités spécifiques.
        </p>
        
        <div class="onboarding-personas-grid">
          ${PERSONAS.map(persona => `
            <div class="onboarding-persona-card" style="border-top-color: ${persona.color}">
              <div class="onboarding-persona-header">
                <h3 class="onboarding-persona-title">${persona.title}</h3>
                <p class="onboarding-persona-description">${persona.description}</p>
              </div>
              
              <ul class="onboarding-persona-features">
                ${persona.features.map(feature => `
                  <li>${feature}</li>
                `).join('')}
              </ul>
              
              <button 
                class="onboarding-persona-button" 
                style="background-color: ${persona.color};"
                onclick="window.testAsPersona('${persona.role}')"
              >
                Tester en tant que ${persona.role === 'student' ? 'Étudiant' : persona.role === 'teacher' ? 'Enseignant' : persona.role === 'director' ? 'Directeur' : 'Directeur pédagogique'}
              </button>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="onboarding-modal-footer">
        <button 
          class="onboarding-modal-close-btn"
          onclick="window.closeOnboardingModal()"
        >
          Fermer la démo
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Empêcher le scroll du body
  document.body.style.overflow = 'hidden';
  
  // Fermer au clic sur l'overlay
  modal.querySelector('.onboarding-modal-overlay').addEventListener('click', closeOnboardingModal);
  
  // Fermer avec Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeOnboardingModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

/**
 * Ferme la modale d'onboarding
 */
export function closeOnboardingModal() {
  const modal = document.getElementById('onboarding-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
    markOnboardingAsSeen();
  }
}

/**
 * Ferme la modale d'onboarding spécifique au rôle
 * @param {string} role - Rôle de l'utilisateur
 */
export function closeRoleOnboardingModal(role) {
  const modal = document.getElementById('role-onboarding-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
    if (role) {
      markRoleOnboardingAsSeen(role);
    }
  }
}

/**
 * Affiche la modale d'onboarding spécifique au rôle (après login)
 * @param {string} role - Rôle de l'utilisateur
 */
export function showRoleOnboardingModal(role) {
  if (!role || !shouldShowRoleOnboarding(role)) {
    return;
  }
  
  // Vérifier si la modale est déjà affichée
  const existingModal = document.getElementById('role-onboarding-modal');
  if (existingModal) {
    console.log('[Onboarding] La modale est déjà affichée, ignore le double appel');
    return;
  }
  
  const onboarding = ROLE_ONBOARDING[role];
  if (!onboarding) {
    console.warn('[Onboarding] Pas de contenu d\'onboarding pour le rôle:', role);
    return;
  }
  
  const modal = document.createElement('div');
  modal.id = 'role-onboarding-modal';
  modal.className = 'onboarding-modal role-onboarding-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'role-onboarding-title');
  modal.setAttribute('aria-modal', 'true');
  
  modal.innerHTML = `
    <div class="onboarding-modal-overlay"></div>
    <div class="onboarding-modal-content">
      <div class="onboarding-modal-header">
        <h2 id="role-onboarding-title" class="onboarding-modal-title" style="color: ${onboarding.color};">
          ${onboarding.title}
        </h2>
        <p class="onboarding-modal-subtitle">
          ${onboarding.description}
        </p>
        <button 
          class="onboarding-modal-close" 
          aria-label="Fermer la modale"
          type="button"
        >
          ✕
        </button>
      </div>
      
      <div class="onboarding-modal-body">
        <div class="onboarding-features-list" style="
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 16px;
        ">
          ${onboarding.features.map(feature => `
            <div style="
              display: flex;
              align-items: flex-start;
              gap: 10px;
              padding: 12px;
              background: var(--card);
              border-radius: var(--radius-md);
              border-left: 4px solid ${onboarding.color};
            ">
              <span style="font-size: 1.3rem; flex-shrink: 0;">${feature.icon}</span>
              <p style="margin: 0; color: var(--fg); font-size: 0.95rem; line-height: 1.4;">
                ${feature.text}
              </p>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="onboarding-modal-footer">
        <button 
          class="onboarding-modal-close-btn"
          type="button"
          style="background-color: ${onboarding.color};"
        >
          Commencer
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Empêcher le scroll du body
  document.body.style.overflow = 'hidden';
  
  // Récupérer les éléments après l'insertion dans le DOM
  const closeButton = modal.querySelector('.onboarding-modal-close');
  const footerButton = modal.querySelector('.onboarding-modal-close-btn');
  const overlay = modal.querySelector('.onboarding-modal-overlay');
  
  // Fonction de fermeture avec stopPropagation pour éviter les doubles clics
  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeRoleOnboardingModal(role);
  };
  
  // Fermer au clic sur le bouton de fermeture
  closeButton.addEventListener('click', handleClose);
  
  // Fermer au clic sur le bouton "Commencer"
  footerButton.addEventListener('click', handleClose);
  
  // Fermer au clic sur l'overlay (mais pas sur le contenu)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      handleClose(e);
    }
  });
  
  // Fermer avec Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      handleClose(e);
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

/**
 * Teste l'application en tant qu'un persona spécifique
 * @param {string} role - Rôle à tester
 */
export async function testAsPersona(role) {
  console.log('[Onboarding] Test en tant que:', role);
  
  // Fermer la modale
  closeOnboardingModal();
  
  // Effectuer l'auto-login
  await fakeLogin(role);
  
  // Rediriger vers le dashboard approprié
  const dashboardRoutes = {
    'student': 'dashboard-student',
    'teacher': 'dashboard-teacher',
    'director': 'dashboard-director',
    'pedago': 'dashboard-pedago'
  };
  
  const route = dashboardRoutes[role] || 'dashboard-teacher';
  navigateTo(route, true);
}

// Exposer les fonctions globalement pour les onclick
window.closeOnboardingModal = closeOnboardingModal;
window.testAsPersona = testAsPersona;
window.closeRoleOnboardingModal = closeRoleOnboardingModal;

export default {
  showOnboardingModal,
  closeOnboardingModal,
  shouldShowOnboarding,
  shouldShowRoleOnboarding,
  showRoleOnboardingModal,
  closeRoleOnboardingModal,
  testAsPersona
};

