/**
 * View Timeline Teacher - Timeline des activités pour les enseignants
 */

import { loadTimelineData } from '../features-control/feature-timeline-teacher.js';

let timelineContainer = null;

/**
 * Rend la vue timeline enseignant
 * @param {HTMLElement} container - Conteneur de la vue
 */
export function renderTimelineTeacherView(container) {
  console.log('[View Timeline Teacher] Rendu de la timeline');
  
  timelineContainer = container;
  
  container.innerHTML = `
    <div style="max-width: 1000px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          📅 Timeline
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Historique de vos activités : création, soumission, validation, publication et assignations
        </p>
      </div>
      
      <div id="timeline-teacher-content">
        <div style="text-align: center; padding: 40px; color: var(--muted);">
          Chargement de la timeline...
        </div>
      </div>
    </div>
  `;
  
  // Charger les données
  setTimeout(() => {
    renderTimelineContent();
  }, 100);
}

/**
 * Rend le contenu de la timeline
 */
function renderTimelineContent() {
  const events = loadTimelineData();
  
  if (!events || events.length === 0) {
    timelineContainer.querySelector('#timeline-teacher-content').innerHTML = `
      <div class="card" style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">📭</div>
        <h2 style="color: var(--muted); margin-bottom: 8px;">Aucun événement</h2>
        <p style="color: var(--muted);">
          Votre timeline sera remplie au fur et à mesure de vos activités.
        </p>
      </div>
    `;
    return;
  }
  
  const timelineHTML = `
    <div class="timeline-vertical">
      ${events.map((event, index) => renderEventCard(event, index, events.length)).join('')}
    </div>
  `;
  
  timelineContainer.querySelector('#timeline-teacher-content').innerHTML = timelineHTML;
}

/**
 * Rend une carte d'événement
 * @param {object} event - Événement
 * @param {number} index - Index de l'événement
 * @param {number} totalEvents - Nombre total d'événements
 * @returns {string}
 */
function renderEventCard(event, index, totalEvents) {
  const date = new Date(event.timestamp);
  const dateStr = formatDate(date);
  const timeStr = formatTime(date);
  const typeLabel = getEventTypeLabel(event.type);
  const icon = getEventIcon(event.type);
  
  return `
    <div class="timeline-event-card" style="position: relative; padding-left: 48px; margin-bottom: 24px;">
      <div class="timeline-dot" style="
        position: absolute;
        left: 0;
        top: 8px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--accent);
        border: 3px solid var(--bg);
        z-index: 2;
      "></div>
      ${index < totalEvents - 1 ? `
        <div class="timeline-line" style="
          position: absolute;
          left: 7px;
          top: 24px;
          width: 2px;
          height: calc(100% + 8px);
          background: var(--card-border);
        "></div>
      ` : ''}
      
      <div class="card" style="padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.5rem;">${icon}</span>
            <span style="font-weight: 600; font-size: 1.1rem;">${typeLabel}</span>
          </div>
          <div style="text-align: right; color: var(--muted); font-size: 0.9rem;">
            <div>${dateStr}</div>
            <div>${timeStr}</div>
          </div>
        </div>
        
        ${renderEventDetails(event)}
      </div>
    </div>
  `;
}

/**
 * Rend les détails d'un événement
 * @param {object} event - Événement
 * @returns {string}
 */
function renderEventDetails(event) {
  const { payload } = event;
  
  switch (event.type) {
    case 'theme_created':
      return `
        <div style="color: var(--muted); margin-top: 8px;">
          <strong>Thème :</strong> ${payload.themeTitle || 'Sans titre'}<br/>
          ${payload.subject ? `<strong>Matière :</strong> ${payload.subject}` : ''}
        </div>
      `;
    
    case 'theme_submitted_quality':
      return `
        <div style="color: var(--muted); margin-top: 8px;">
          <strong>Thème :</strong> ${payload.themeTitle || 'Sans titre'}<br/>
          Soumis à validation qualité
        </div>
      `;
    
    case 'theme_updated':
      return `
        <div style="color: var(--muted); margin-top: 8px;">
          <strong>Thème :</strong> ${payload.themeTitle || 'Sans titre'}
        </div>
      `;
    
    case 'theme_saved_draft':
      return `
        <div style="color: var(--muted); margin-top: 8px;">
          <strong>Thème :</strong> ${payload.themeTitle || 'Sans titre'}<br/>
          Brouillon sauvegardé
        </div>
      `;
    
    case 'theme_approved':
      return `
        <div style="color: var(--muted); margin-top: 8px;">
          <strong>Thème :</strong> ${payload.themeTitle || 'Sans titre'}<br/>
          Validé et prêt à publier
        </div>
      `;
    
    case 'theme_rejected':
      return `
        <div style="color: var(--muted); margin-top: 8px;">
          <strong>Thème :</strong> ${payload.themeTitle || 'Sans titre'}<br/>
          ${payload.reason ? `<strong>Raison :</strong> ${payload.reason}` : 'Rejeté'}
        </div>
      `;
    
    case 'theme_published':
      return `
        <div style="color: var(--muted); margin-top: 8px;">
          <strong>Thème :</strong> ${payload.themeTitle || 'Sans titre'}<br/>
          ${payload.classIds ? `<strong>Classes :</strong> ${payload.classIds.join(', ')}` : ''}
        </div>
      `;
    
    case 'theme_assigned_to_class':
      return `
        <div style="color: var(--muted); margin-top: 8px;">
          <strong>Thème :</strong> ${payload.themeTitle || payload.themeId || 'Sans titre'}<br/>
          <strong>Classe :</strong> ${payload.classId || 'N/A'}<br/>
          ${payload.startAt ? `<strong>Début :</strong> ${formatDate(new Date(payload.startAt))}` : ''}<br/>
          ${payload.dueAt ? `<strong>Rendu :</strong> ${formatDate(new Date(payload.dueAt))}` : ''}
        </div>
      `;
    
    default:
      return payload ? `<div style="color: var(--muted); margin-top: 8px;">${JSON.stringify(payload)}</div>` : '';
  }
}

/**
 * Retourne le label d'un type d'événement
 * @param {string} type - Type d'événement
 * @returns {string}
 */
function getEventTypeLabel(type) {
  const labels = {
    'theme_created': 'Thème créé',
    'theme_submitted_quality': 'Soumission qualité',
    'theme_updated': 'Thème mis à jour',
    'theme_saved_draft': 'Brouillon sauvegardé',
    'theme_approved': 'Thème validé',
    'theme_rejected': 'Thème rejeté',
    'theme_published': 'Thème publié',
    'theme_assigned_to_class': 'Thème assigné à une classe'
  };
  
  return labels[type] || type;
}

/**
 * Retourne l'icône d'un type d'événement
 * @param {string} type - Type d'événement
 * @returns {string}
 */
function getEventIcon(type) {
  const icons = {
    'theme_created': '🎨',
    'theme_submitted_quality': '📤',
    'theme_updated': '✏️',
    'theme_saved_draft': '💾',
    'theme_approved': '✅',
    'theme_rejected': '❌',
    'theme_published': '🚀',
    'theme_assigned_to_class': '📋'
  };
  
  return icons[type] || '📌';
}

/**
 * Formate une date
 * @param {Date} date - Date
 * @returns {string}
 */
function formatDate(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

/**
 * Formate une heure
 * @param {Date} date - Date
 * @returns {string}
 */
function formatTime(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

window.renderTimelineTeacherView = renderTimelineTeacherView;
export default { renderTimelineTeacherView };

