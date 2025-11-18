/**
 * DemoBadge - Composant badge pour indiquer le mode démo
 */

import { isDemoSession } from '../features/features-control/feature-demo-mode.js';

/**
 * Met à jour l'affichage du badge démo
 */
export function updateDemoBadge() {
  const container = document.getElementById('demo-badge-container');
  if (!container) {
    console.warn('[DemoBadge] Conteneur #demo-badge-container introuvable');
    return;
  }
  
  const isDemo = isDemoSession();
  
  if (isDemo) {
    container.innerHTML = `
      <div class="badge" style="
        background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
        color: white;
        border-color: #f59e0b;
        font-size: 0.75rem;
        padding: 4px 12px;
        margin: 0 12px;
      ">
        <span>🎭</span>
        <span>Mode Démo</span>
      </div>
    `;
  } else {
    container.innerHTML = '';
  }
}

/**
 * Affiche le badge démo
 */
export function showDemoBadge() {
  updateDemoBadge();
}

/**
 * Cache le badge démo
 */
export function hideDemoBadge() {
  const container = document.getElementById('demo-badge-container');
  if (container) {
    container.innerHTML = '';
  }
}

export default {
  updateDemoBadge,
  showDemoBadge,
  hideDemoBadge
};
