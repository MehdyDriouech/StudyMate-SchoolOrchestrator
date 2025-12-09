/**
 * Configuration globale de l'application StudyMate School Orchestrator
 */

export const CONFIG = {
  // Mode démo : si true, utilise FakeRouter au lieu des vrais appels API
  DEMO_MODE: true,
  // Force l'utilisation de l'API mock même si DEMO_MODE est mal configuré
  FORCE_FAKE_API: true,
  // Force l'utilisation de l'API réelle (prioritaire sur FORCE_FAKE_API si true)
  FORCE_REAL_API: false,
  
  // URL de base pour les appels API (non utilisée en mode démo)
  // Pour AMPPS en localhost : /SMSO/backend/public/api
  // Si DocumentRoot pointe vers backend/public : /api
  // Pour production : ajuster selon votre configuration serveur
  API_BASE_URL: '/SMSO/backend/public/api',
  
  // Version de l'application
  APP_VERSION: '0.1.0-mvp',
  
  // Nom de l'application
  APP_NAME: 'StudyMate School Orchestrator',
  
  // Clés localStorage
  STORAGE_KEYS: {
    DEMO_SESSION: 'STUDYMATE_DEMO_SESSION',
    USER_SESSION: 'STUDYMATE_USER_SESSION',
    AUTH_SESSION: 'smso_auth_session',
    THEME: 'STUDYMATE_THEME'
  },
  
  // Configuration de l'authentification
  AUTH_TOKEN_TRANSPORT: 'query', // 'query' ou 'header' - 'query' recommandé pour compatibilité cPanel
};

// Export par défaut
export default CONFIG;
