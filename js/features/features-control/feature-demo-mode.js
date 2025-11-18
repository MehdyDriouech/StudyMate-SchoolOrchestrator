/**
 * Feature Demo Mode - Gestion du mode démonstration
 */

import CONFIG from '../../config.js';

/**
 * Vérifie si une session démo est active
 * @returns {boolean}
 */
export function isDemoSession() {
  const demoFlag = localStorage.getItem(CONFIG.STORAGE_KEYS.DEMO_SESSION);
  return demoFlag === 'true';
}

/**
 * Active le mode démo
 */
export function startDemoSession() {
  console.log('[Demo Mode] Activation du mode démo');
  localStorage.setItem(CONFIG.STORAGE_KEYS.DEMO_SESSION, 'true');
  
  // Dispatcher un événement pour notifier les composants
  window.dispatchEvent(new CustomEvent('demo-session-started'));
}

/**
 * Désactive le mode démo et redirige vers l'authentification
 */
export function endDemoSession() {
  console.log('[Demo Mode] Désactivation du mode démo');
  localStorage.removeItem(CONFIG.STORAGE_KEYS.DEMO_SESSION);
  
  // Dispatcher un événement pour notifier les composants
  window.dispatchEvent(new CustomEvent('demo-session-ended'));
  
  // Recharger la page pour revenir à l'écran d'authentification
  window.location.reload();
}

/**
 * Retourne les informations de la session démo
 * @returns {object}
 */
export function getDemoSessionInfo() {
  return {
    isActive: isDemoSession(),
    startedAt: localStorage.getItem('STUDYMATE_DEMO_STARTED_AT') || null,
    user: {
      name: 'Démo Utilisateur',
      role: 'teacher',
      email: 'demo@studymate.app'
    }
  };
}

export default {
  isDemoSession,
  startDemoSession,
  endDemoSession,
  getDemoSessionInfo
};
