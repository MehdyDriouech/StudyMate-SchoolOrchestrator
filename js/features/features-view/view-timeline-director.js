/**
 * View Timeline Director - Timeline globale pour la direction
 */

import { loadTimelineData } from '../features-control/feature-timeline-director.js';

let timelineContainer = null;

/**
 * Rend la vue timeline direction
 * @param {HTMLElement} container - Conteneur de la vue
 */
export function renderTimelineDirectorView(container) {
  console.log('[View Timeline Director] Rendu de la timeline');
  
  timelineContainer = container;
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          📅 Historique Global
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Vue consolidée de toutes les activités : qualité, publications et usage des classes
        </p>
      </div>
      
      <div id="timeline-director-content">
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
    timelineContainer.querySelector('#timeline-director-content').innerHTML = `
      <div class="card" style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">📭</div>
        <h2 style="color: var(--muted); margin-bottom: 8px;">Aucun événement</h2>
        <p style="color: var(--muted);">
          La timeline sera remplie au fur et à mesure des activités.
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
  
  timelineContainer.querySelector('#timeline-director-content').innerHTML = timelineHTML;
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
  const roleLabel = getRoleLabel(event.role);
  
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
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 1.5rem;">${icon}</span>
            <span style="font-weight: 600; font-size: 1.1rem;">${typeLabel}</span>
            <span class="badge ghost" style="font-size: 0.85rem;">${roleLabel}</span>
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
    
    case 'assignment_due_passed':
      return `
        <div style="color: var(--muted); margin-top: 8px;">
          <strong>Thème :</strong> ${payload.themeTitle || payload.themeId || 'Sans titre'}<br/>
          Passage en mode Annales
        </div>
      `;
    
    case 'student_submitted_assignment':
      return `
        <div style="color: var(--muted); margin-top: 8px;">
          <strong>Thème :</strong> ${payload.themeTitle || payload.themeId || 'Sans titre'}<br/>
          Devoir soumis par un étudiant
        </div>
      `;
    
    case 'student_training_session':
      return `
        <div style="color: var(--muted); margin-top: 8px;">
          <strong>Thème :</strong> ${payload.themeTitle || payload.themeId || 'Sans titre'}<br/>
          Session d'entraînement (${payload.questionsCount || 0} question${(payload.questionsCount || 0) > 1 ? 's' : ''})
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
    'theme_assigned_to_class': 'Thème assigné à une classe',
    'assignment_due_passed': 'Passage en Annales',
    'assignment_viewed': 'Thème consulté',
    'assignment_completed': 'Rendu effectué',
    'student_submitted_assignment': 'Devoir soumis',
    'student_auto_graded': 'Correction automatique',
    'student_training_session': 'Session d\'entraînement'
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
    'theme_assigned_to_class': '📋',
    'assignment_due_passed': '📖',
    'assignment_viewed': '👁️',
    'assignment_completed': '✅',
    'student_submitted_assignment': '📤',
    'student_auto_graded': '🤖',
    'student_training_session': '🎯'
  };
  
  return icons[type] || '📌';
}

/**
 * Retourne le label d'un rôle
 * @param {string} role - Rôle
 * @returns {string}
 */
function getRoleLabel(role) {
  const labels = {
    'teacher': 'Enseignant',
    'student': 'Étudiant',
    'director': 'Direction',
    'pedago': 'Pédagogie'
  };
  
  return labels[role] || role;
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

window.renderTimelineDirectorView = renderTimelineDirectorView;
export default { renderTimelineDirectorView };

