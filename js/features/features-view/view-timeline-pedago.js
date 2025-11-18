/**
 * View Timeline Pedago - Timeline pour le référent pédagogique
 * Affiche tous les événements de qualité
 */

import { loadTimelineData } from '../features-control/feature-timeline-director.js';

let timelineContainer = null;

/**
 * Rend la vue timeline référent pédagogique
 * @param {HTMLElement} container - Conteneur de la vue
 */
export function renderTimelinePedagoView(container) {
  console.log('[View Timeline Pedago] Rendu de la timeline');
  
  timelineContainer = container;
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          📅 Historique Qualité
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Vue consolidée de tous les événements de qualité et de validation
        </p>
      </div>
      
      <div id="timeline-pedago-content">
        <div style="text-align: center; padding: 40px; color: var(--muted);">
          Chargement de l'historique...
        </div>
      </div>
    </div>
  `;
  
  // Charger les données
  setTimeout(() => {
    const timelineData = loadTimelineData();
    renderTimelineContent(timelineData);
  }, 150);
}

/**
 * Rend le contenu de la timeline
 */
function renderTimelineContent(timelineData) {
  if (!timelineData || timelineData.length === 0) {
    timelineContainer.querySelector('#timeline-pedago-content').innerHTML = `
      <div class="card" style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">📅</div>
        <h3>Aucun événement</h3>
        <p style="color: var(--muted); margin-top: 12px;">
          Aucun événement de qualité enregistré pour le moment.
        </p>
      </div>
    `;
    return;
  }
  
  // Filtrer les événements liés à la qualité
  const qualityEvents = timelineData.filter(event => 
    event.type?.includes('quality') || 
    event.type?.includes('validation') ||
    event.type?.includes('approval')
  );
  
  timelineContainer.querySelector('#timeline-pedago-content').innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      ${qualityEvents.map(event => `
        <div class="card" style="border-left: 4px solid var(--accent);">
          <div style="display: flex; gap: 16px;">
            <div style="font-size: 2rem; flex-shrink: 0;">
              ${getEventIcon(event.type)}
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 600; margin-bottom: 4px;">
                ${escapeHtml(event.title || event.type || 'Événement')}
              </div>
              <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 8px;">
                ${formatDate(event.timestamp)}
              </div>
              ${event.description ? `
                <div style="font-size: 0.9rem; color: var(--muted); line-height: 1.5;">
                  ${escapeHtml(event.description)}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getEventIcon(eventType) {
  if (eventType?.includes('quality')) return '✅';
  if (eventType?.includes('validation')) return '✔️';
  if (eventType?.includes('approval')) return '👍';
  return '📝';
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Export global pour app.js
window.renderTimelinePedagoView = renderTimelinePedagoView;
export default { renderTimelinePedagoView };

