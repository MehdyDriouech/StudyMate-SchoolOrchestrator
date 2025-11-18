/**
 * Feature Admin - Gestion des entités établissement / classes / utilisateurs
 */

import {
  getApprovedThemes as getApprovedThemesFromStore,
  publishTheme as publishThemeInStore
} from './store-themes.js';

import {
  getSchoolInfo as getSchoolInfoFromStore,
  updateSchoolInfo as updateSchoolInfoInStore,
  getClasses as getClassesFromStore,
  createClass as createClassInStore,
  updateClass as updateClassInStore,
  getUsers as getUsersFromStore,
  createUser as createUserInStore,
  toggleUserStatus as toggleUserStatusInStore,
  createSchool as createSchoolInStore
} from './store-multischool.js';

// Réexporter les fonctions du store multi-établissements
export function getSchoolInfo() {
  return getSchoolInfoFromStore();
}

export function updateSchoolInfo(partial) {
  return updateSchoolInfoInStore(partial);
}

export function getClasses() {
  return getClassesFromStore();
}

export function createClass(data) {
  return createClassInStore(data);
}

export function updateClass(classId, updates) {
  return updateClassInStore(classId, updates);
}

export function getUsers() {
  return getUsersFromStore();
}

export function createUser(data) {
  return createUserInStore(data);
}

export function toggleUserStatus(userId) {
  return toggleUserStatusInStore(userId);
}

/**
 * Crée un nouvel établissement
 * @param {object} schoolData - Données de l'établissement
 * @returns {object}
 */
export function createSchool(schoolData) {
  return createSchoolInStore(schoolData);
}

/**
 * Retourne les thèmes approuvés (prêts à être publiés)
 * @returns {Array}
 */
export function getApprovedThemes() {
  return getApprovedThemesFromStore();
}

/**
 * Publie un thème pour une ou plusieurs classes
 * @param {string} themeId - ID du thème
 * @param {Array<string>} classIds - IDs des classes
 * @returns {object}
 */
export function publishTheme(themeId, classIds) {
  return publishThemeInStore(themeId, classIds);
}

export default {
  getSchoolInfo,
  updateSchoolInfo,
  getClasses,
  createClass,
  updateClass,
  getUsers,
  createUser,
  toggleUserStatus,
  getApprovedThemes,
  publishTheme
};

