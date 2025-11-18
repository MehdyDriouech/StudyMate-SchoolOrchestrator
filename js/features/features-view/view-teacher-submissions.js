/**
 * View Teacher Submissions - Vue des rendus et corrections pour l'enseignant
 */

import { loadSubmissionsData } from '../features-control/feature-teacher-submissions.js';
import ActivityTimelineStore from '../features-control/store-timeline.js';
import { getCurrentUser } from '../features-control/feature-auth.js';
import { getClasses } from '../features-control/store-multischool.js';

let submissionsContainer = null;
let currentSubmissions = [];
let sortConfig = { column: null, direction: 'asc' };

/**
 * Rend la vue soumissions enseignant
 * @param {HTMLElement} container - Conteneur de la vue
 */
export function renderTeacherSubmissionsView(container) {
  console.log('[View Teacher Submissions] Rendu des soumissions');
  
  submissionsContainer = container;
  
  container.innerHTML = `
    <div style="width: 100%; max-width: 100%; margin: 0; padding: 24px; box-sizing: border-box;">
      <div style="text-align: center; padding: 40px; color: var(--muted);">
        Chargement des soumissions...
      </div>
    </div>
  `;
  
  // Logger l'événement de consultation
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.role === 'teacher') {
    ActivityTimelineStore.logEvent('teacher_viewed_submissions', currentUser.email, currentUser.role, {});
  }
  
  // Charger les données
  setTimeout(() => {
    renderSubmissionsContent();
  }, 100);
}

/**
 * Rend le contenu des soumissions
 */
function renderSubmissionsContent() {
  // Récupérer la classe sélectionnée depuis le localStorage
  const savedClassId = localStorage.getItem('SM_SO_SELECTED_CLASS_ID');
  const classes = getClasses();
  
  let selectedClassId = null;
  if (savedClassId && classes.find(c => c.id === savedClassId)) {
    selectedClassId = savedClassId;
  } else if (classes.length > 0) {
    selectedClassId = classes[0].id;
    localStorage.setItem('SM_SO_SELECTED_CLASS_ID', selectedClassId);
  }
  
  // Charger les soumissions filtrées par classe
  let submissions = loadSubmissionsData(selectedClassId);
  currentSubmissions = [...submissions];
  
  // Appliquer le tri si configuré
  if (sortConfig.column) {
    submissions = sortSubmissions(submissions, sortConfig.column, sortConfig.direction);
  }
  
  if (!submissions || submissions.length === 0) {
    submissionsContainer.innerHTML = `
      <div style="width: 100%; max-width: 100%; margin: 0; padding: 24px 32px; box-sizing: border-box;">
        <div style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div style="flex: 1; min-width: 200px;">
            <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
              📋 Rendus / Corrections
            </h1>
            <p style="color: var(--muted); font-size: 1.05rem;">
              Gestion des devoirs rendus par vos élèves
            </p>
          </div>
          ${classes.length > 1 ? `
            <div style="display: flex; align-items: center; gap: 12px;">
              <label for="class-selector-submissions-empty" style="font-weight: 600; color: var(--fg); white-space: nowrap;">
                Classe :
              </label>
              <select 
                id="class-selector-submissions-empty" 
                style="
                  padding: 10px 16px;
                  border-radius: var(--radius-md);
                  border: 1px solid var(--card-border);
                  background: var(--card);
                  color: var(--fg);
                  font-size: 1rem;
                  font-family: inherit;
                  cursor: pointer;
                  min-width: 250px;
                  transition: all var(--transition-base);
                "
                onmouseover="this.style.borderColor='var(--accent)'"
                onmouseout="this.style.borderColor='var(--card-border)'"
                onfocus="this.style.borderColor='var(--accent)'; this.style.outline='2px solid var(--accent)'; this.style.outlineOffset='2px'"
                onblur="this.style.borderColor='var(--card-border)'; this.style.outline='none'"
              >
                ${classes.map(c => `
                  <option value="${c.id}" ${c.id === selectedClassId ? 'selected' : ''}>
                    ${c.name || c.id}
                  </option>
                `).join('')}
              </select>
            </div>
          ` : ''}
        </div>
        
        <div class="card" style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 3rem; margin-bottom: 16px;">📭</div>
          <h2 style="color: var(--muted); margin-bottom: 8px;">Aucun rendu</h2>
          <p style="color: var(--muted);">
            Aucun devoir n'a encore été rendu par vos élèves${selectedClassId ? ` dans cette classe` : ''}.
          </p>
        </div>
      </div>
    `;
    
    // Event listener pour le sélecteur de classe même quand il n'y a pas de soumissions
    if (classes.length > 1) {
      const classSelector = submissionsContainer.querySelector('#class-selector-submissions-empty');
      if (classSelector) {
        classSelector.addEventListener('change', (e) => {
          const newSelectedClassId = e.target.value;
          localStorage.setItem('SM_SO_SELECTED_CLASS_ID', newSelectedClassId);
          sortConfig = { column: null, direction: 'asc' }; // Réinitialiser le tri
          renderSubmissionsContent();
        });
      }
    }
    
    return;
  }
  
  submissionsContainer.innerHTML = `
    <div style="width: 100%; max-width: 100%; margin: 0; padding: 24px 32px; box-sizing: border-box;">
      <div style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
        <div style="flex: 1; min-width: 200px;">
          <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
            📋 Rendus / Corrections
          </h1>
          <p style="color: var(--muted); font-size: 1.05rem;">
            Gestion des devoirs rendus par vos élèves
          </p>
        </div>
        ${classes.length > 1 ? `
          <div style="display: flex; align-items: center; gap: 12px;">
            <label for="class-selector-submissions" style="font-weight: 600; color: var(--fg); white-space: nowrap;">
              Classe :
            </label>
            <select 
              id="class-selector-submissions" 
              style="
                padding: 10px 16px;
                border-radius: var(--radius-md);
                border: 1px solid var(--card-border);
                background: var(--card);
                color: var(--fg);
                font-size: 1rem;
                font-family: inherit;
                cursor: pointer;
                min-width: 250px;
                transition: all var(--transition-base);
              "
              onmouseover="this.style.borderColor='var(--accent)'"
              onmouseout="this.style.borderColor='var(--card-border)'"
              onfocus="this.style.borderColor='var(--accent)'; this.style.outline='2px solid var(--accent)'; this.style.outlineOffset='2px'"
              onblur="this.style.borderColor='var(--card-border)'; this.style.outline='none'"
            >
              ${classes.map(c => `
                <option value="${c.id}" ${c.id === selectedClassId ? 'selected' : ''}>
                  ${c.name || c.id}
                </option>
              `).join('')}
            </select>
          </div>
        ` : ''}
      </div>
      
      <div class="card">
        <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; table-layout: fixed;">
            <colgroup>
              <col style="width: 25%;">
              <col style="width: 30%;">
              <col style="width: 20%;">
              <col style="width: 12%;">
              <col style="width: 13%;">
            </colgroup>
            <thead>
              <tr style="border-bottom: 2px solid var(--card-border);">
                <th style="padding: 12px; text-align: left;">
                  <button class="sortable-header" data-sort="student" style="
                    background: none;
                    border: none;
                    color: var(--fg);
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0;
                    font-size: inherit;
                  ">
                    Élève
                    ${getSortIcon('student')}
                  </button>
                </th>
                <th style="padding: 12px; text-align: left;">
                  <button class="sortable-header" data-sort="theme" style="
                    background: none;
                    border: none;
                    color: var(--fg);
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0;
                    font-size: inherit;
                  ">
                    Thème
                    ${getSortIcon('theme')}
                  </button>
                </th>
                <th style="padding: 12px; text-align: center;">
                  <button class="sortable-header" data-sort="date" style="
                    background: none;
                    border: none;
                    color: var(--fg);
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0;
                    font-size: inherit;
                    margin: 0 auto;
                  ">
                    Date rendu
                    ${getSortIcon('date')}
                  </button>
                </th>
                <th style="padding: 12px; text-align: center;">
                  <button class="sortable-header" data-sort="score" style="
                    background: none;
                    border: none;
                    color: var(--fg);
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0;
                    font-size: inherit;
                    margin: 0 auto;
                  ">
                    Score
                    ${getSortIcon('score')}
                  </button>
                </th>
                <th style="padding: 12px; text-align: center;">
                  <button class="sortable-header" data-sort="status" style="
                    background: none;
                    border: none;
                    color: var(--fg);
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0;
                    font-size: inherit;
                    margin: 0 auto;
                  ">
                    Statut
                    ${getSortIcon('status')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              ${submissions.map(submission => `
                <tr style="border-bottom: 1px solid var(--card-border);">
                  <td style="padding: 12px; overflow: hidden; text-overflow: ellipsis;">
                    <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(submission.studentName || submission.studentId)}">${escapeHtml(submission.studentName || submission.studentId)}</div>
                    <div style="font-size: 0.85rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(submission.className || submission.classId)}">${escapeHtml(submission.className || submission.classId)}</div>
                  </td>
                  <td style="padding: 12px; overflow: hidden; text-overflow: ellipsis;">
                    <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(submission.themeTitle || submission.themeId)}">${escapeHtml(submission.themeTitle || submission.themeId)}</div>
                    ${submission.themeSubject ? `
                      <div style="font-size: 0.85rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(submission.themeSubject)}">${escapeHtml(submission.themeSubject)}</div>
                    ` : ''}
                  </td>
                  <td style="padding: 12px; text-align: center; color: var(--muted);">
                    ${formatDate(new Date(submission.submittedAt))}
                  </td>
                  <td style="padding: 12px; text-align: center;">
                    ${submission.status === 'graded' && submission.score !== null ? `
                      <span style="font-weight: 700; font-size: 1.1rem; color: ${getScoreColor(submission.score)};">
                        ${submission.score}%
                      </span>
                    ` : '<span style="color: var(--muted);">—</span>'}
                  </td>
                  <td style="padding: 12px; text-align: center;">
                    ${renderStatusBadge(submission.status)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Statistiques -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 24px;">
        <div class="card" style="text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 8px;">📝</div>
          <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;">
            ${submissions.length}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">Total rendus</div>
        </div>
        <div class="card" style="text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 8px;">✅</div>
          <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;">
            ${submissions.filter(s => s.status === 'graded').length}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">Corrigés</div>
        </div>
        <div class="card" style="text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 8px;">⏳</div>
          <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;">
            ${submissions.filter(s => s.status === 'submitted').length}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">En attente</div>
        </div>
        ${(() => {
          const gradedSubmissions = submissions.filter(s => s.status === 'graded' && s.score !== null);
          const avgScore = gradedSubmissions.length > 0
            ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length)
            : 0;
          return `
            <div class="card" style="text-align: center;">
              <div style="font-size: 2rem; margin-bottom: 8px;">📊</div>
              <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;">
                ${avgScore}%
              </div>
              <div style="font-size: 0.9rem; color: var(--muted);">Moyenne</div>
            </div>
          `;
        })()}
      </div>
    </div>
  `;
  
  // Event listeners pour le sélecteur de classe
  if (classes.length > 1) {
    const classSelector = submissionsContainer.querySelector('#class-selector-submissions');
    if (classSelector) {
      classSelector.addEventListener('change', (e) => {
        const selectedClassId = e.target.value;
        localStorage.setItem('SM_SO_SELECTED_CLASS_ID', selectedClassId);
        sortConfig = { column: null, direction: 'asc' }; // Réinitialiser le tri
        renderSubmissionsContent();
      });
    }
  }
  
  // Event listeners pour le tri
  submissionsContainer.querySelectorAll('.sortable-header').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const column = e.currentTarget.dataset.sort;
      if (sortConfig.column === column) {
        // Inverser la direction si on clique sur la même colonne
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
        // Nouvelle colonne, tri ascendant par défaut
        sortConfig.column = column;
        sortConfig.direction = 'asc';
      }
      renderSubmissionsContent();
    });
  });
}

/**
 * Trie les soumissions selon la colonne et la direction
 * @param {Array} submissions - Liste des soumissions
 * @param {string} column - Colonne à trier
 * @param {string} direction - Direction du tri ('asc' ou 'desc')
 * @returns {Array}
 */
function sortSubmissions(submissions, column, direction) {
  const sorted = [...submissions];
  
  sorted.sort((a, b) => {
    let comparison = 0;
    
    switch (column) {
      case 'student':
        const nameA = (a.studentName || a.studentId || '').toLowerCase();
        const nameB = (b.studentName || b.studentId || '').toLowerCase();
        comparison = nameA.localeCompare(nameB);
        break;
      case 'theme':
        const themeA = (a.themeTitle || a.themeId || '').toLowerCase();
        const themeB = (b.themeTitle || b.themeId || '').toLowerCase();
        comparison = themeA.localeCompare(themeB);
        break;
      case 'date':
        const dateA = new Date(a.submittedAt || 0).getTime();
        const dateB = new Date(b.submittedAt || 0).getTime();
        comparison = dateA - dateB;
        break;
      case 'score':
        const scoreA = a.score !== null ? a.score : -1;
        const scoreB = b.score !== null ? b.score : -1;
        comparison = scoreA - scoreB;
        break;
      case 'status':
        const statusA = a.status || '';
        const statusB = b.status || '';
        comparison = statusA.localeCompare(statusB);
        break;
      default:
        return 0;
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

/**
 * Retourne l'icône de tri pour une colonne
 * @param {string} column - Colonne
 * @returns {string}
 */
function getSortIcon(column) {
  if (sortConfig.column !== column) {
    return '<span style="opacity: 0.3;">↕️</span>';
  }
  return sortConfig.direction === 'asc' ? '↑' : '↓';
}

/**
 * Rend un badge de statut
 * @param {string} status - Statut
 * @returns {string}
 */
function renderStatusBadge(status) {
  const badges = {
    'submitted': '<span class="badge" style="background: #f59e0b; color: white; font-weight: 600; padding: 6px 12px; border-radius: 6px; display: inline-block;">Rendu</span>',
    'graded': '<span class="badge" style="background: #22c55e; color: white; font-weight: 600; padding: 6px 12px; border-radius: 6px; display: inline-block;">Corrigé</span>'
  };
  
  return badges[status] || '<span class="badge" style="background: #64748b; color: white; font-weight: 600; padding: 6px 12px; border-radius: 6px; display: inline-block;">Inconnu</span>';
}

/**
 * Retourne la couleur selon le score
 * @param {number} score - Score
 * @returns {string}
 */
function getScoreColor(score) {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  return 'var(--danger)';
}

/**
 * Utilitaires
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

window.renderTeacherSubmissionsView = renderTeacherSubmissionsView;
export default { renderTeacherSubmissionsView };

