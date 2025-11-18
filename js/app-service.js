/**
 * Service d'abstraction pour les appels API
 * Redirige vers FakeRouter en mode démo, sinon utilise fetch
 */

import CONFIG from './config.js';
import { fakeRequest } from './demo/FakeRouter.js';

// Forcer totalement l'utilisation des mocks tant que l'API réelle n'existe pas
const ALWAYS_USE_FAKE = true;

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
    const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[API Service] Erreur GET ${path}:`, error);
    if (CONFIG?.FORCE_FAKE_API !== false) {
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
 * @returns {Promise<any>}
 */
async function post(path, body = {}) {
  console.log(`[API Service] POST ${path}`, body);
  const useFake = shouldUseFakeApi();
  
  // Si mode démo, utiliser FakeRouter
  if (useFake) {
    return fakeRequest('POST', path, body);
  }
  
  // Sinon, utiliser fetch
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[API Service] Erreur POST ${path}:`, error);
    if (CONFIG?.FORCE_FAKE_API !== false) {
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
    const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[API Service] Erreur PUT ${path}:`, error);
    if (CONFIG?.FORCE_FAKE_API !== false) {
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
    const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[API Service] Erreur DELETE ${path}:`, error);
    if (CONFIG?.FORCE_FAKE_API !== false) {
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
  if (ALWAYS_USE_FAKE) {
    return true;
  }
  // Configuration explicite pour forcer les mocks
  if (CONFIG?.FORCE_FAKE_API !== false) {
    return true;
  }
  
  // Mode démo actif
  if (CONFIG?.DEMO_MODE) {
    return true;
  }
  
  // Override manuel via fenêtre globale
  if (typeof window !== 'undefined' && window.__USE_FAKE_API__ === true) {
    return true;
  }
  
  // Session démo stockée en localStorage
  try {
    return typeof localStorage !== 'undefined'
      && localStorage.getItem(CONFIG?.STORAGE_KEYS?.DEMO_SESSION) === 'true';
  } catch {
    return false;
  }
}
