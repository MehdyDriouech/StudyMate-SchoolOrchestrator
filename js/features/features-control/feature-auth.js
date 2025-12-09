/**
 * Feature Auth - Gestion de l'authentification multi-personas
 */

import CONFIG from '../../config.js';
import api, { saveAuthSession, clearAuthSession } from '../../app-service.js';
import { startDemoSession } from './feature-demo-mode.js';

// Clés localStorage pour l'utilisateur (anciennes clés, conservées pour compatibilité)
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
  },
  'campusadmin@ecole.fr': {
    password: 'smso01**',
    role: 'campus_admin',
    name: 'Administrateur Campus',
    email: 'campusadmin@ecole.fr',
    schoolId: null // Campus admin n'est pas lié à une école spécifique
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
  
  // Normaliser l'email (trim et lowercase)
  const normalizedEmail = email.trim().toLowerCase();
  console.log('[Auth] Email normalisé:', normalizedEmail);
  
  // Vérifier si on doit utiliser l'API réelle ou le mode démo
  const useFakeApi = shouldUseFakeApi();
  console.log('[Auth] useFakeApi:', useFakeApi);
  
  if (useFakeApi) {
    // Mode démo : utiliser la logique fake existante
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const user = FAKE_USERS[normalizedEmail];
    
    if (!user) {
      console.error('[Auth] Email non trouvé dans FAKE_USERS:', normalizedEmail);
      console.log('[Auth] Utilisateurs disponibles:', Object.keys(FAKE_USERS));
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
    
    console.log('[Auth] ✅ Connexion réussie (démo) -', user.role, 'schoolId:', user.schoolId);
    
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
  
  // Mode API réelle : appeler l'endpoint backend
  try {
    const response = await api.post('/auth/login', { email, password }, { encoding: 'form' });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur de connexion');
    }
    
    const { token, user, expires_in } = response.data;
    
    // Sauvegarder la session complète (token + user + expires_in)
    saveAuthSession({
      token,
      user,
      expires_in,
      expires_at: expires_in ? Date.now() + (expires_in * 1000) : null
    });
    
    // Stocker aussi dans les anciennes clés pour compatibilité
    localStorage.setItem(STORAGE_USER_ROLE, user.role);
    localStorage.setItem(STORAGE_USER_EMAIL, user.email);
    
    // Stocker le schoolId de l'utilisateur et définir l'établissement actif
    if (user.school_id) {
      localStorage.setItem('SM_SO_USER_SCHOOL_ID', String(user.school_id));
      // Importer dynamiquement pour éviter les dépendances circulaires
      import('../features-control/store-multischool.js').then(({ setActiveSchoolId }) => {
        setActiveSchoolId(String(user.school_id));
      });
    }
    
    console.log('[Auth] ✅ Connexion réussie (API réelle) -', user.role, 'schoolId:', user.school_id);
    
    return {
      success: true,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.full_name || user.name,
        schoolId: user.school_id ? String(user.school_id) : null
      }
    };
  } catch (error) {
    console.error('[Auth] ❌ Erreur de connexion:', error);
    
    // Propager l'erreur avec un message user-friendly
    if (error.message && error.message.includes('HTTP 401')) {
      throw new Error('Email ou mot de passe incorrect');
    }
    
    throw error;
  }
}

/**
 * Détermine si on doit utiliser l'API fake (démo) ou réelle
 * @returns {boolean}
 */
function shouldUseFakeApi() {
  // FORCE_REAL_API a la priorité absolue
  if (CONFIG?.FORCE_REAL_API === true) {
    return false;
  }
  
  // Configuration explicite pour forcer les mocks
  if (CONFIG?.FORCE_FAKE_API === true) {
    return true;
  }
  
  // Mode démo actif
  if (CONFIG?.DEMO_MODE === true) {
    return true;
  }
  
  // Override manuel via fenêtre globale
  if (typeof window !== 'undefined' && window.__USE_FAKE_API__ === true) {
    return true;
  }
  
  // Session démo stockée en localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const demoSession = localStorage.getItem(CONFIG?.STORAGE_KEYS?.DEMO_SESSION);
      if (demoSession === 'true') {
        return true;
      }
    }
  } catch {
    // Ignorer les erreurs localStorage
  }
  
  // Par défaut, utiliser l'API réelle si aucune condition n'est remplie
  return false;
}

/**
 * Déconnecte l'utilisateur
 */
export function handleLogout() {
  console.log('[Auth] Déconnexion');
  
  // Effacer la session d'authentification (token)
  clearAuthSession();
  
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
  // Essayer d'abord de récupérer depuis la session auth (API réelle)
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_SESSION);
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.user) {
        return {
          id: session.user.id,
          role: session.user.role,
          email: session.user.email,
          name: session.user.full_name || session.user.name || 'Utilisateur',
          schoolId: session.user.school_id ? String(session.user.school_id) : null
        };
      }
    }
  } catch {
    // Ignorer les erreurs de parsing
  }
  
  // Fallback sur les anciennes clés (mode démo)
  const role = localStorage.getItem(STORAGE_USER_ROLE);
  const email = localStorage.getItem(STORAGE_USER_EMAIL);
  
  if (!role || !email) {
    return null;
  }
  
  // Normaliser l'email pour la recherche dans FAKE_USERS
  const normalizedEmail = email.trim().toLowerCase();
  
  return {
    role,
    email,
    name: FAKE_USERS[normalizedEmail]?.name || 'Utilisateur',
    schoolId: FAKE_USERS[normalizedEmail]?.schoolId || null
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
    'pedago': 'dashboard-pedago',
    'campus_admin': 'dashboard-campus-admin'
  };
  
  return routes[role] || 'dashboard-teacher';
}

/**
 * Auto-login pour la démo (fake login)
 * @param {string} role - Rôle à tester ('student', 'teacher', 'director', 'pedago')
 * @returns {Promise<object>}
 */
export async function fakeLogin(role) {
  console.log('[Auth] Fake login pour le rôle:', role);
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Créer un utilisateur mock selon le rôle
  const demoUsers = {
    'student': {
      role: 'student',
      email: 'demo.student@ecole.fr',
      name: 'Nathan Leroy',
      schoolId: 'school_01'
    },
    'teacher': {
      role: 'teacher',
      email: 'demo.teacher@ecole.fr',
      name: 'Professeur Martin',
      schoolId: 'school_01'
    },
    'director': {
      role: 'director',
      email: 'demo.director@ecole.fr',
      name: 'Directeur Dupont',
      schoolId: 'school_01'
    },
    'pedago': {
      role: 'pedago',
      email: 'demo.pedago@ecole.fr',
      name: 'Référent pédagogique',
      schoolId: 'school_01'
    }
  };
  
  const user = demoUsers[role];
  if (!user) {
    throw new Error(`Rôle invalide: ${role}`);
  }
  
  // Activer le mode démo
  startDemoSession();
  
  // Stocker dans localStorage
  localStorage.setItem(STORAGE_USER_ROLE, user.role);
  localStorage.setItem(STORAGE_USER_EMAIL, user.email);
  localStorage.setItem('SM_SO_USER_SCHOOL_ID', user.schoolId);
  localStorage.setItem('STUDYMATE_DEMO_STARTED_AT', new Date().toISOString());
  
  // Définir l'établissement actif
  import('../features-control/store-multischool.js').then(({ setActiveSchoolId }) => {
    setActiveSchoolId(user.schoolId);
  });
  
  console.log('[Auth] ✅ Fake login réussi -', user.role, 'schoolId:', user.schoolId);
  
  return {
    success: true,
    user
  };
}

export default {
  handleDemoLogin,
  handleLogin,
  handleLogout,
  isAuthenticated,
  getCurrentUser,
  getUserRole,
  getDashboardRoute,
  fakeLogin
};
