/**
 * Service d'abstraction pour les appels API
 * Redirige vers FakeRouter en mode démo, sinon utilise fetch
 * Gère automatiquement l'authentification (token) et les erreurs 401
 */

import CONFIG from './config.js';
import { fakeRequest } from './demo/FakeRouter.js';

// Forcer totalement l'utilisation des mocks tant que l'API réelle n'existe pas
const ALWAYS_USE_FAKE = true;

/**
 * Récupère la session d'authentification depuis localStorage
 * @returns {object|null} Session avec token, user, expires_in
 */
function getAuthSession() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error('[API Service] Erreur lors de la lecture de la session:', error);
    return null;
  }
}

/**
 * Récupère le token d'authentification actuel
 * @returns {string|null} Token JWT ou null
 */
function getCurrentToken() {
  const session = getAuthSession();
  return session?.token || null;
}

/**
 * Sauvegarde la session d'authentification dans localStorage
 * @param {object} session - Session avec token, user, expires_in
 */
export function saveAuthSession(session) {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    console.log('[API Service] Session sauvegardée');
  } catch (error) {
    console.error('[API Service] Erreur lors de la sauvegarde de la session:', error);
  }
}

/**
 * Efface la session d'authentification
 */
export function clearAuthSession() {
  try {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_SESSION);
    console.log('[API Service] Session effacée');
  } catch (error) {
    console.error('[API Service] Erreur lors de l\'effacement de la session:', error);
  }
}

/**
 * Gère les erreurs HTTP, notamment les 401 (Unauthorized)
 * @param {Response} response - Réponse HTTP
 * @returns {Promise<void>}
 */
async function handleHttpError(response) {
  if (response.status === 401) {
    console.warn('[API Service] Erreur 401 - Session expirée');
    
    // Lire le body JSON si possible
    try {
      const errorData = await response.json();
      console.error('[API Service] Détails erreur 401:', errorData);
    } catch {
      // Ignorer si le body n'est pas du JSON
    }
    
    // Effacer la session
    clearAuthSession();
    
    // Afficher un message à l'utilisateur
    const message = 'Session expirée, veuillez vous reconnecter';
    
    // Utiliser alert si aucun système de notification n'existe
    if (typeof window !== 'undefined') {
      alert(message);
      
      // Rediriger vers la page de login après 5 secondes
      setTimeout(() => {
        // Essayer de trouver la route de login (peut varier selon l'implémentation)
        const loginRoute = window.location.pathname.includes('index.html') 
          ? '#auth' 
          : 'index.html#auth';
        
        window.location.href = loginRoute;
      }, 5000);
    }
    
    throw new Error(message);
  }
}

/**
 * Construit l'URL avec le token en query string si nécessaire
 * @param {string} path - Chemin de l'endpoint
 * @returns {string} URL complète avec token si mode query
 */
function buildUrlWithToken(path) {
  const baseUrl = `${CONFIG.API_BASE_URL}${path}`;
  
  if (CONFIG.AUTH_TOKEN_TRANSPORT === 'query') {
    const token = getCurrentToken();
    if (token) {
      const separator = path.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
    }
  }
  
  return baseUrl;
}

/**
 * Construit les headers avec le token si nécessaire
 * @param {object} additionalHeaders - Headers supplémentaires
 * @returns {object} Headers complets
 */
function buildHeaders(additionalHeaders = {}) {
  const headers = {
    ...additionalHeaders
  };
  
  if (CONFIG.AUTH_TOKEN_TRANSPORT === 'header') {
    const token = getCurrentToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

/**
 * Effectue une requête GET
 * @param {string} path - Chemin de l'endpoint (ex: '/stats/overview')
 * @returns {Promise<any>}
 */
async function get(path) {
  console.log(`[API Service] GET ${path}`);
  const useFake = shouldUseFakeApi();
  
  // Si mode démo, utiliser FakeRouter
  if (useFake) {
    return fakeRequest('GET', path);
  }
  
  // Sinon, utiliser fetch
  try {
    const url = buildUrlWithToken(path);
    const headers = buildHeaders({
      'Content-Type': 'application/json'
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    // Gérer les erreurs HTTP (notamment 401)
    if (!response.ok) {
      await handleHttpError(response);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    // Ne pas faire de fallback si c'est une erreur 401 (déjà gérée)
    if (error.message && error.message.includes('Session expirée')) {
      throw error;
    }
    
    console.error(`[API Service] Erreur GET ${path}:`, error);
    if (CONFIG?.FORCE_FAKE_API !== false && !CONFIG?.FORCE_REAL_API) {
      console.warn('[API Service] Fallback mock suite à une erreur GET');
      return fakeRequest('GET', path);
    }
    throw error;
  }
}

/**
 * Effectue une requête POST
 * @param {string} path - Chemin de l'endpoint
 * @param {any} body - Corps de la requête
 * @param {object} options - Options supplémentaires (encoding: 'form' pour URL-encoded)
 * @returns {Promise<any>}
 */
async function post(path, body = {}, options = {}) {
  console.log(`[API Service] POST ${path}`, body);
  const useFake = shouldUseFakeApi();
  
  // Si mode démo, utiliser FakeRouter
  if (useFake) {
    return fakeRequest('POST', path, body);
  }
  
  // Sinon, utiliser fetch
  try {
    const url = buildUrlWithToken(path);
    
    // Déterminer le Content-Type et le body selon l'encoding
    let contentType = 'application/json';
    let requestBody;
    
    if (options.encoding === 'form') {
      // Format URL-encoded
      contentType = 'application/x-www-form-urlencoded';
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(body)) {
        params.append(key, value);
      }
      requestBody = params.toString();
    } else {
      // Format JSON par défaut
      requestBody = JSON.stringify(body);
    }
    
    const headers = buildHeaders({
      'Content-Type': contentType
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: requestBody
    });
    
    // Gérer les erreurs HTTP (notamment 401)
    if (!response.ok) {
      await handleHttpError(response);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    // Ne pas faire de fallback si c'est une erreur 401 (déjà gérée)
    if (error.message && error.message.includes('Session expirée')) {
      throw error;
    }
    
    console.error(`[API Service] Erreur POST ${path}:`, error);
    if (CONFIG?.FORCE_FAKE_API !== false && !CONFIG?.FORCE_REAL_API) {
      console.warn('[API Service] Fallback mock suite à une erreur POST');
      return fakeRequest('POST', path, body);
    }
    throw error;
  }
}

/**
 * Effectue une requête PUT
 * @param {string} path - Chemin de l'endpoint
 * @param {any} body - Corps de la requête
 * @returns {Promise<any>}
 */
async function put(path, body = {}) {
  console.log(`[API Service] PUT ${path}`, body);
  const useFake = shouldUseFakeApi();
  
  // Si mode démo, utiliser FakeRouter
  if (useFake) {
    return fakeRequest('PUT', path, body);
  }
  
  // Sinon, utiliser fetch
  try {
    const url = buildUrlWithToken(path);
    const headers = buildHeaders({
      'Content-Type': 'application/json'
    });
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });
    
    // Gérer les erreurs HTTP (notamment 401)
    if (!response.ok) {
      await handleHttpError(response);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    // Ne pas faire de fallback si c'est une erreur 401 (déjà gérée)
    if (error.message && error.message.includes('Session expirée')) {
      throw error;
    }
    
    console.error(`[API Service] Erreur PUT ${path}:`, error);
    if (CONFIG?.FORCE_FAKE_API !== false && !CONFIG?.FORCE_REAL_API) {
      console.warn('[API Service] Fallback mock suite à une erreur PUT');
      return fakeRequest('PUT', path, body);
    }
    throw error;
  }
}

/**
 * Effectue une requête DELETE
 * @param {string} path - Chemin de l'endpoint
 * @returns {Promise<any>}
 */
async function del(path) {
  console.log(`[API Service] DELETE ${path}`);
  const useFake = shouldUseFakeApi();
  
  // Si mode démo, utiliser FakeRouter
  if (useFake) {
    return fakeRequest('DELETE', path);
  }
  
  // Sinon, utiliser fetch
  try {
    const url = buildUrlWithToken(path);
    const headers = buildHeaders({
      'Content-Type': 'application/json'
    });
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });
    
    // Gérer les erreurs HTTP (notamment 401)
    if (!response.ok) {
      await handleHttpError(response);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    // Ne pas faire de fallback si c'est une erreur 401 (déjà gérée)
    if (error.message && error.message.includes('Session expirée')) {
      throw error;
    }
    
    console.error(`[API Service] Erreur DELETE ${path}:`, error);
    if (CONFIG?.FORCE_FAKE_API !== false && !CONFIG?.FORCE_REAL_API) {
      console.warn('[API Service] Fallback mock suite à une erreur DELETE');
      return fakeRequest('DELETE', path);
    }
    throw error;
  }
}

// Export de l'objet API
export const api = {
  get,
  post,
  put,
  delete: del
};

export default api;

/**
 * Détermine si les appels doivent être routés vers l'API mockée
 * @returns {boolean}
 */
function shouldUseFakeApi() {
  // FORCE_REAL_API a la priorité absolue
  if (CONFIG?.FORCE_REAL_API === true) {
    return false;
  }
  
  // ALWAYS_USE_FAKE (pour compatibilité avec l'ancien code)
  if (ALWAYS_USE_FAKE) {
    return true;
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
