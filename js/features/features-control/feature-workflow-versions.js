/**
 * Feature Workflow Versions - Logique des versions (STUB)
 */

export async function createVersion(contentId, versionData) {
  console.log('[Feature Versions] Création de version (STUB)', contentId, versionData);
  return { success: true, version: '1.0.0' };
}

export default { createVersion };
