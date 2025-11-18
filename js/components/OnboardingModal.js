/**
 * OnboardingModal - Modale d'introduction et de sélection de persona pour la démo
 */

import { fakeLogin } from '../features/features-control/feature-auth.js';
import { navigateTo } from '../app.js';

const STORAGE_ONBOARDING_SEEN = 'SM_SO_ONBOARDING_SEEN';

/**
 * Personas et leurs features
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
 * Vérifie si la modale doit être affichée
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
 * Marque la modale comme vue
 */
function markOnboardingAsSeen() {
  localStorage.setItem(STORAGE_ONBOARDING_SEEN, 'true');
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

export default {
  showOnboardingModal,
  closeOnboardingModal,
  shouldShowOnboarding,
  testAsPersona
};

