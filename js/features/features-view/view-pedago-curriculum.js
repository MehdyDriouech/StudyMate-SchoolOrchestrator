/**
 * View Pedago Curriculum - Vue consolidée du curriculum pour le référent pédagogique
 */

import { renderCurriculumView } from './view-curriculum-builder.js';

/**
 * Rend la vue curriculum du référent pédagogique
 * @param {HTMLElement} container - Conteneur de la vue
 */
export function renderPedagoCurriculumView(container) {
  console.log('[View Pedago Curriculum] Rendu du curriculum');
  
  // Utiliser la vue curriculum existante
  renderCurriculumView(container);
}

// Export global pour app.js
window.renderPedagoCurriculumView = renderPedagoCurriculumView;
export default { renderPedagoCurriculumView };

