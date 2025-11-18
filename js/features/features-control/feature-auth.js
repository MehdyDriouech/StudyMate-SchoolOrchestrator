/**
 * Feature Auth - Gestion de l'authentification multi-personas
 */

import CONFIG from '../../config.js';
import { startDemoSession } from './feature-demo-mode.js';

// Clés localStorage pour l'utilisateur
const STORAGE_USER_ROLE = 'SM_SO_USER_ROLE';
const STORAGE_USER_EMAIL = 'SM_SO_USER_EMAIL';

/**
 * Base de données fake des utilisateurs (login/password fixes)
 */
const FAKE_USERS = {
  'enseignant@ecole.fr': {
    password: 'smso01**',
    role: 'teacher',
    name: 'Professeur Martin',
    email: 'enseignant@ecole.fr',
    schoolId: 'school_01'
  },
  'directeur@ecole.fr': {
    password: 'smso01**',
    role: 'director',
    name: 'Directeur Dupont',
    email: 'directeur@ecole.fr',
    schoolId: 'school_01'
  },
  'etudiant@ecole.fr': {
    password: 'smso01**',
    role: 'student',
    name: 'Élève Sophie',
    email: 'etudiant@ecole.fr',
    schoolId: 'school_01'
  },
  'etudiant@condorcet.fr': {
    password: 'smso01**',
    role: 'student',
    name: 'Élève Emma',
    email: 'etudiant@condorcet.fr',
    schoolId: 'school_02'
  },
  'pedago@ecole.fr': {
    password: 'smso01**',
    role: 'pedago',
    name: 'Référent pédagogique',
    email: 'pedago@ecole.fr',
    schoolId: 'school_01'
  }
};

/**
 * Démarre la session démo (enseignant générique)
 */
export function handleDemoLogin() {
  console.log('[Auth] Démarrage de la session démo');
  
  // Activer le mode démo
  startDemoSession();
  
  // Créer un utilisateur démo (enseignant)
  const demoUser = {
    role: 'teacher',
    email: 'demo@ecole.fr',
    name: 'Démo Enseignant',
    schoolId: 'school_01'
  };
  
  // Stocker dans localStorage
  localStorage.setItem(STORAGE_USER_ROLE, demoUser.role);
  localStorage.setItem(STORAGE_USER_EMAIL, demoUser.email);
  localStorage.setItem('SM_SO_USER_SCHOOL_ID', demoUser.schoolId);
  localStorage.setItem('STUDYMATE_DEMO_STARTED_AT', new Date().toISOString());
  
  // Définir l'établissement actif
  import('../features-control/store-multischool.js').then(({ setActiveSchoolId }) => {
    setActiveSchoolId(demoUser.schoolId);
  });
  
  // Recharger pour initialiser correctement l'app en mode démo
  window.location.reload();
}

/**
 * Gère la connexion avec email/password
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<object>}
 */
export async function handleLogin(email, password) {
  console.log('[Auth] Tentative de connexion:', email);
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Vérifier les identifiants
  const user = FAKE_USERS[email];
  
  if (!user) {
    throw new Error('Email inconnu');
  }
  
  if (user.password !== password) {
    throw new Error('Mot de passe incorrect');
  }
  
  // Connexion réussie : stocker les infos
  localStorage.setItem(STORAGE_USER_ROLE, user.role);
  localStorage.setItem(STORAGE_USER_EMAIL, user.email);
  
  // Stocker le schoolId de l'utilisateur et définir l'établissement actif
  if (user.schoolId) {
    localStorage.setItem('SM_SO_USER_SCHOOL_ID', user.schoolId);
    // Importer dynamiquement pour éviter les dépendances circulaires
    import('../features-control/store-multischool.js').then(({ setActiveSchoolId }) => {
      setActiveSchoolId(user.schoolId);
    });
  }

  // Activer automatiquement la session démo quand l'app tourne en mode mock
  if (CONFIG.DEMO_MODE) {
    startDemoSession();
  }
  
  console.log('[Auth] ✅ Connexion réussie -', user.role, 'schoolId:', user.schoolId);
  
  return {
    success: true,
    user: {
      role: user.role,
      email: user.email,
      name: user.name,
      schoolId: user.schoolId
    }
  };
}

/**
 * Déconnecte l'utilisateur
 */
export function handleLogout() {
  console.log('[Auth] Déconnexion');
  
  // Nettoyer le localStorage
  localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_SESSION);
  localStorage.removeItem(CONFIG.STORAGE_KEYS.DEMO_SESSION);
  localStorage.removeItem(STORAGE_USER_ROLE);
  localStorage.removeItem(STORAGE_USER_EMAIL);
  localStorage.removeItem('SM_SO_USER_SCHOOL_ID');
  localStorage.removeItem('STUDYMATE_DEMO_STARTED_AT');
  localStorage.removeItem('SM_SO_SOCIAL_UUID');
  localStorage.removeItem('SM_SO_ACTIVE_SCHOOL_ID');
  
  // Recharger la page pour revenir à l'écran d'auth
  window.location.reload();
}

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns {boolean}
 */
export function isAuthenticated() {
  const userRole = localStorage.getItem(STORAGE_USER_ROLE);
  return !!userRole;
}

/**
 * Retourne les informations de l'utilisateur connecté
 * @returns {object|null}
 */
export function getCurrentUser() {
  const role = localStorage.getItem(STORAGE_USER_ROLE);
  const email = localStorage.getItem(STORAGE_USER_EMAIL);
  
  if (!role || !email) {
    return null;
  }
  
  return {
    role,
    email,
    name: FAKE_USERS[email]?.name || 'Utilisateur',
    schoolId: FAKE_USERS[email]?.schoolId || null
  };
}

/**
 * Retourne le rôle de l'utilisateur courant
 * @returns {string|null} 'teacher' | 'director' | 'student' | null
 */
export function getUserRole() {
  return localStorage.getItem(STORAGE_USER_ROLE);
}

/**
 * Détermine la route dashboard selon le rôle
 * @param {string} role - Rôle de l'utilisateur
 * @returns {string}
 */
export function getDashboardRoute(role) {
  const routes = {
    'teacher': 'dashboard-teacher',
    'director': 'dashboard-director',
    'student': 'dashboard-student',
    'pedago': 'dashboard-pedago'
  };
  
  return routes[role] || 'dashboard-teacher';
}

export default {
  handleDemoLogin,
  handleLogin,
  handleLogout,
  isAuthenticated,
  getCurrentUser,
  getUserRole,
  getDashboardRoute
};
