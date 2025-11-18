/**
 * Configuration globale de l'application StudyMate School Orchestrator
 */

export const CONFIG = {
  // Mode démo : si true, utilise FakeRouter au lieu des vrais appels API
  DEMO_MODE: true,
  // Force l'utilisation de l'API mock même si DEMO_MODE est mal configuré
  FORCE_FAKE_API: true,
  
  // URL de base pour les appels API (non utilisée en mode démo)
  API_BASE_URL: '/api',
  
  // Version de l'application
  APP_VERSION: '0.1.0-mvp',
  
  // Nom de l'application
  APP_NAME: 'StudyMate School Orchestrator',
  
  // Clés localStorage
  STORAGE_KEYS: {
    DEMO_SESSION: 'STUDYMATE_DEMO_SESSION',
    USER_SESSION: 'STUDYMATE_USER_SESSION',
    THEME: 'STUDYMATE_THEME'
  }
};

// Export par défaut
export default CONFIG;
