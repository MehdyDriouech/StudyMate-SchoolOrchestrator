/**
 * Feature Library - Logique métier pour la bibliothèque de contenus
 */

import {
  getAllResources,
  searchResources,
  getResourceById,
  rateResource,
  importResourceToCurriculum,
  importResourceToAIStudio,
  getAvailableSubjects,
  getAvailableLevels
} from './store-library.js';
import { getActiveSchoolId, getClasses } from './store-multischool.js';
import { getUserRole, getCurrentUser } from './feature-auth.js';

/**
 * Charge les ressources de la bibliothèque
 * @returns {Promise<Array>}
 */
export async function loadLibraryResources() {
  console.log('[Feature Library] Chargement des ressources');
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return getAllResources();
}

/**
 * Recherche des ressources avec filtres
 * @param {object} filters - Filtres de recherche
 * @returns {Promise<Array>}
 */
export async function searchLibraryResources(filters) {
  console.log('[Feature Library] Recherche avec filtres:', filters);
  
  await new Promise(resolve => setTimeout(resolve, 150));
  
  return searchResources(filters);
}

/**
 * Récupère une ressource par ID
 * @param {string} resourceId - ID de la ressource
 * @returns {Promise<object|null>}
 */
export async function getLibraryResource(resourceId) {
  return getResourceById(resourceId);
}

/**
 * Note une ressource
 * @param {string} resourceId - ID de la ressource
 * @param {number} rating - Note (1-5)
 * @param {string} comment - Commentaire
 * @returns {Promise<object>}
 */
export async function rateLibraryResource(resourceId, rating, comment) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('Utilisateur non authentifié');
  }
  
  const contextUser = {
    userId: currentUser.email || 'unknown',
    displayName: currentUser.name || 'Utilisateur',
    role: currentUser.role || 'teacher'
  };
  
  return rateResource(resourceId, rating, comment, contextUser);
}

/**
 * Importe une ressource dans le curriculum
 * @param {string} resourceId - ID de la ressource
 * @param {string} classId - ID de la classe
 * @param {string} period - ID de la période
 * @returns {Promise<object>}
 */
export async function importToCurriculum(resourceId, classId, period) {
  return importResourceToCurriculum({ resourceId, classId, period });
}

/**
 * Importe une ressource dans AI Theme Studio
 * @param {string} resourceId - ID de la ressource
 * @returns {Promise<object>}
 */
export async function importToAIStudio(resourceId) {
  return importResourceToAIStudio(resourceId);
}

/**
 * Récupère les classes disponibles pour l'import
 * @returns {Array}
 */
export function getClassesForImport() {
  const activeSchoolId = getActiveSchoolId();
  if (!activeSchoolId) return [];
  
  return getClasses(activeSchoolId);
}

/**
 * Récupère les matières disponibles
 * @returns {Array<string>}
 */
export function getSubjects() {
  return getAvailableSubjects();
}

/**
 * Récupère les niveaux disponibles
 * @returns {Array<string>}
 */
export function getLevels() {
  return getAvailableLevels();
}

/**
 * Vérifie si l'utilisateur peut noter/commenter
 * @returns {boolean}
 */
export function canRateResources() {
  const role = getUserRole();
  return role === 'teacher' || role === 'pedago';
}

/**
 * Vérifie si l'utilisateur peut importer des ressources
 * @returns {boolean}
 */
export function canImportResources() {
  const role = getUserRole();
  return role === 'teacher' || role === 'pedago';
}

export default {
  loadLibraryResources,
  searchLibraryResources,
  getLibraryResource,
  rateLibraryResource,
  importToCurriculum,
  importToAIStudio,
  getClassesForImport,
  getSubjects,
  getLevels,
  canRateResources,
  canImportResources
};

