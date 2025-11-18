/**
 * Store AI Theme Studio - Gestion de l'état de l'AI Theme Studio
 * Gère les onglets, l'import PDF, et l'état de la génération
 */

// État du store
const aiThemeStudioStore = {
  // Onglet actif : "manual" | "pdf"
  activeTab: 'manual',
  
  // Dernier fichier PDF importé
  lastImportedFileName: null,
  
  // Dernier texte extrait (fake)
  lastExtractionText: null,
  
  // ID du dernier thème généré depuis PDF
  lastGeneratedThemeId: null
};

/**
 * Définit l'onglet actif
 * @param {string} tab - "manual" | "pdf"
 */
export function setActiveTab(tab) {
  if (tab !== 'manual' && tab !== 'pdf') {
    console.warn('[AIThemeStudioStore] Onglet invalide:', tab, '- utilisation de "manual" par défaut');
    tab = 'manual';
  }
  aiThemeStudioStore.activeTab = tab;
  console.log('[AIThemeStudioStore] Onglet actif:', tab);
  return tab;
}

/**
 * Récupère l'onglet actif
 * @returns {string}
 */
export function getActiveTab() {
  return aiThemeStudioStore.activeTab;
}

/**
 * Définit le dernier fichier PDF importé
 * @param {string} fileName - Nom du fichier
 */
export function setLastImportedFileName(fileName) {
  aiThemeStudioStore.lastImportedFileName = fileName;
  return fileName;
}

/**
 * Récupère le dernier fichier PDF importé
 * @returns {string|null}
 */
export function getLastImportedFileName() {
  return aiThemeStudioStore.lastImportedFileName;
}

/**
 * Définit le dernier texte extrait (fake)
 * @param {string} text - Texte extrait
 */
export function setLastExtractionText(text) {
  aiThemeStudioStore.lastExtractionText = text;
  return text;
}

/**
 * Récupère le dernier texte extrait
 * @returns {string|null}
 */
export function getLastExtractionText() {
  return aiThemeStudioStore.lastExtractionText;
}

/**
 * Définit l'ID du dernier thème généré depuis PDF
 * @param {string} themeId - ID du thème
 */
export function setLastGeneratedThemeId(themeId) {
  aiThemeStudioStore.lastGeneratedThemeId = themeId;
  return themeId;
}

/**
 * Récupère l'ID du dernier thème généré depuis PDF
 * @returns {string|null}
 */
export function getLastGeneratedThemeId() {
  return aiThemeStudioStore.lastGeneratedThemeId;
}

/**
 * Réinitialise le store
 */
export function resetStore() {
  aiThemeStudioStore.activeTab = 'manual';
  aiThemeStudioStore.lastImportedFileName = null;
  aiThemeStudioStore.lastExtractionText = null;
  aiThemeStudioStore.lastGeneratedThemeId = null;
}

export default {
  setActiveTab,
  getActiveTab,
  setLastImportedFileName,
  getLastImportedFileName,
  setLastExtractionText,
  getLastExtractionText,
  setLastGeneratedThemeId,
  getLastGeneratedThemeId,
  resetStore
};

