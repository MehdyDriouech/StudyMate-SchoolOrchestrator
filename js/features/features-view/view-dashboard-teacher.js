/**
 * View Dashboard Teacher - Interface du dashboard enseignant
 */

import {
  loadDashboardData,
  formatDate,
  formatRelativeDate,
  calculateCompletionRate,
  getCompletionColor,
  getAssignmentsSnapshot,
  getTeacherClassOptions,
  getAssignmentMetrics,
  createDemoAssignment
} from '../features-control/feature-dashboard-teacher.js';

import {
  createCompletionBarChart,
  destroyChart,
  createBarChart
} from '../../components/Charts.js';
import { getAllPublishedThemes } from '../features-control/store-themes.js';
import { getAssignmentsByClass } from '../features-control/store-class-theme-assignments.js';
import { getCurrentTheme } from '../features-control/feature-ai-theme-studio.js';
import { getThemeById } from '../features-control/store-themes.js';
import {
  getClassSocialDynamics,
  getClassSocialLeaderboard,
  getSocialComparisonData,
  getClassSocialStats,
  getClassProgressionData,
  getHeatmapData,
  getFilteredLeaderboard
} from '../features-control/feature-social.js';
import { getClasses } from '../features-control/store-multischool.js';
import {
  makeBarChart,
  makeLineChart,
  makeHeatmapChart,
  destroyChartInstance
} from '../../components/ChartFactory.js';
import { getThemeColors } from '../../components/Charts.js';

let dashboardData = null;
let completionChart = null; // Référence au graphique
let teacherContainer = null;
let notificationTimeout = null;
let socialAdvancedCharts = {
  heatmap: null,
  progression: null,
  scoreTime: null
};
let currentLeaderboardFilter = 'all';

/**
 * Rend la vue du dashboard enseignant
 * @param {HTMLElement} container - Conteneur de la vue
 */
export async function renderDashboardTeacherView(container) {
  console.log('[View Dashboard] Rendu du dashboard enseignant');
  teacherContainer = container;
  
  // Afficher un loader
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px; animation: pulse 1.5s ease-in-out infinite;">
          ⏳
        </div>
        <p style="color: var(--muted);">Chargement du dashboard...</p>
      </div>
    </div>
    
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.1); }
      }
    </style>
  `;
  
  try {
    // Charger les données
    dashboardData = await loadDashboardData();
    
    // Rendre le dashboard complet
    renderDashboardContent(container);
    
    // Écouter les changements d'établissement pour recharger
    window.addEventListener('schoolChanged', async () => {
      console.log('[View Dashboard Teacher] Changement d\'établissement, rechargement...');
      dashboardData = await loadDashboardData();
      renderDashboardContent(container);
    });
    
  } catch (error) {
    console.error('[View Dashboard] Erreur:', error);
    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
        <h2>Erreur de chargement</h2>
        <p style="color: var(--danger); margin: 16px 0;">
          ${error.message}
        </p>
        <button class="btn primary" onclick="location.reload()">
          Réessayer
        </button>
      </div>
    `;
  }
}

/**
 * Rend le contenu complet du dashboard
 * @param {HTMLElement} container - Conteneur
 */
function renderDashboardContent(container) {
  const { kpis, topSubjects, assignments, urgentAssignments } = dashboardData;
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <!-- En-tête -->
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          📊 Dashboard Enseignant
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Vue d'ensemble de votre activité pédagogique
        </p>
      </div>
      
      <div id="teacher-notification" class="teacher-notification" aria-live="polite"></div>
      
      <!-- KPIs -->
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      ">
        ${renderKPICard('👥', 'Élèves', kpis.totalStudents, 'Total')}
        ${renderKPICard('🎓', 'Classes', kpis.totalClasses, 'Actives')}
        ${renderKPICard('📝', 'Devoirs', kpis.activeAssignments, 'En cours')}
        ${renderKPICard('✅', 'Complétion', `${kpis.completionRate}%`, 'Moyenne')}
        ${renderKPICard('📊', 'Moyenne', kpis.averageGrade.toFixed(1), '/ 20')}
      </div>
      
      <!-- Section principale à 2 colonnes -->
      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 32px;
      ">
        <!-- Devoirs urgents -->
        <div class="card">
          <h2 style="font-size: 1.25rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <span>⚠️</span>
            <span>Devoirs urgents</span>
            ${urgentAssignments.length > 0 ? `
              <span class="badge danger" style="margin-left: auto; font-size: 0.75rem;">
                ${urgentAssignments.length}
              </span>
            ` : ''}
          </h2>
          ${urgentAssignments.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${urgentAssignments.map(a => renderUrgentAssignment(a)).join('')}
            </div>
          ` : `
            <p style="color: var(--muted); text-align: center; padding: 24px 0;">
              🎉 Aucun devoir urgent à venir
            </p>
          `}
        </div>
        
        <!-- Matières principales -->
        <div class="card">
          <h2 style="font-size: 1.25rem; margin-bottom: 16px;">
            📚 Matières principales
          </h2>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${topSubjects.map(s => renderSubjectCard(s)).join('')}
          </div>
        </div>
      </div>
      
      <!-- Liste des devoirs -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="font-size: 1.25rem; margin: 0;">
            📝 Tous les devoirs
          </h2>
          <button class="btn ghost" style="font-size: 0.9rem;" id="btn-open-assignment-modal">
            + Nouveau devoir
          </button>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${assignments.slice(0, 8).map(a => renderAssignmentRow(a)).join('')}
        </div>
        
        ${assignments.length > 8 ? `
          <div style="text-align: center; margin-top: 20px;">
            <button class="btn ghost">
              Voir tous les devoirs (${assignments.length})
            </button>
          </div>
        ` : ''}
      </div>
      
      <!-- Thèmes récemment publiés -->
      ${renderPublishedThemesSection()}
      
      <!-- Dynamique sociale de la classe -->
      ${renderClassSocialDynamicsSection()}
      
      <!-- Analyse sociale avancée (démo) -->
      ${renderAdvancedSocialAnalysisSection()}
      
      <!-- Graphique de complétion par matière -->
      <div class="card" style="margin-top: 24px;">
        <h2 style="font-size: 1.25rem; margin-bottom: 20px;">
          📊 Taux de complétion par matière
        </h2>
        <div style="position: relative; height: 280px;">
          <canvas id="teacher-completion-chart"></canvas>
        </div>
      </div>
    </div>
    
    <style>
      .teacher-notification {
        min-height: 32px;
        margin-bottom: 16px;
        border-radius: var(--radius-md);
        padding: 8px 16px;
        background: rgba(14,165,233,0.12);
        color: var(--accent);
        font-weight: 600;
        display: none;
      }
      .teacher-notification.visible {
        display: block;
        animation: fadeIn 0.2s ease-in;
      }
      .assignment-badge-new {
        background: var(--accent);
        color: white;
        border: none;
        font-size: 0.7rem;
        padding: 2px 8px;
        border-radius: 999px;
        margin-left: 8px;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (max-width: 768px) {
        [style*="grid-template-columns: 1fr 1fr"] {
          grid-template-columns: 1fr !important;
        }
      }
    </style>
  `;
  
  // Initialiser le graphique après que le DOM soit rendu
  requestAnimationFrame(() => {
    initCompletionChart();
    initSocialComparisonChart();
    initAdvancedSocialCharts();
    setupTeacherActions();
  });
}

/**
 * Rend une carte KPI
 */
function renderKPICard(icon, label, value, subtitle) {
  return `
    <div class="card" style="text-align: center; padding: 20px;">
      <div style="font-size: 2rem; margin-bottom: 8px;">${icon}</div>
      <div style="font-size: 2rem; font-weight: 700; color: var(--fg); margin-bottom: 4px;">
        ${value}
      </div>
      <div style="font-size: 0.9rem; font-weight: 600; color: var(--fg); margin-bottom: 2px;">
        ${label}
      </div>
      <div style="font-size: 0.8rem; color: var(--muted);">
        ${subtitle}
      </div>
    </div>
  `;
}

/**
 * Rend un devoir urgent
 */
function renderUrgentAssignment(assignment) {
  const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const completionRate = calculateCompletionRate(assignment.submittedCount, assignment.totalStudents);
  
  return `
    <div style="
      padding: 12px;
      background: var(--card-hover);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--danger);
    ">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${assignment.title}
          </div>
          <div style="font-size: 0.85rem; color: var(--muted);">
            ${assignment.class} • ${assignment.subject}
          </div>
        </div>
        <span class="badge danger" style="font-size: 0.75rem;">
          J-${daysLeft}
        </span>
      </div>
      <div style="font-size: 0.85rem; color: var(--muted);">
        ${assignment.submittedCount}/${assignment.totalStudents} rendus (${completionRate}%)
      </div>
    </div>
  `;
}

/**
 * Rend une carte matière
 */
function renderSubjectCard(subject) {
  return `
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: var(--card-hover);
      border-radius: var(--radius-md);
    ">
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">
          ${subject.name}
        </div>
        <div style="font-size: 0.85rem; color: var(--muted);">
          ${subject.assignmentsCount} devoir${subject.assignmentsCount > 1 ? 's' : ''}
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 700; color: ${getCompletionColor(subject.avgCompletion)};">
          ${subject.avgCompletion.toFixed(1)}%
        </div>
        <div style="font-size: 0.8rem; color: var(--muted);">
          complétion
        </div>
      </div>
    </div>
  `;
}

/**
 * Rend une ligne de devoir
 */
function renderAssignmentRow(assignment) {
  const completionRate = calculateCompletionRate(assignment.submittedCount, assignment.totalStudents);
  const statusColors = {
    active: 'var(--accent)',
    completed: 'var(--muted)',
    draft: 'var(--warning)'
  };
  const statusLabels = {
    active: 'En cours',
    completed: 'Terminé',
    draft: 'Brouillon'
  };
  
  return `
    <div style="
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 100px;
      gap: 16px;
      align-items: center;
      padding: 16px;
      background: var(--card-hover);
      border-radius: var(--radius-md);
      transition: transform var(--transition-fast);
      cursor: pointer;
    " onmouseover="this.style.transform='translateX(4px)'" onmouseout="this.style.transform='translateX(0)'">
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">
          ${assignment.title}
        </div>
        <div style="font-size: 0.85rem; color: var(--muted);">
          ${assignment.class}
          ${assignment.isNew ? `<span class="assignment-badge-new">NOUVEAU</span>` : ''}
        </div>
      </div>
      
      <div style="font-size: 0.9rem;">
        ${assignment.subject}
      </div>
      
      <div style="font-size: 0.9rem; color: var(--muted);">
        ${formatDate(assignment.dueDate)}
      </div>
      
      <div>
        ${assignment.status === 'active' ? `
          <div style="font-size: 0.85rem; font-weight: 600; color: ${getCompletionColor(completionRate)};">
            ${completionRate}%
          </div>
          <div style="font-size: 0.75rem; color: var(--muted);">
            ${assignment.submittedCount}/${assignment.totalStudents}
          </div>
        ` : `
          <div style="font-size: 0.85rem; color: var(--muted);">
            ${assignment.status === 'completed' ? assignment.submittedCount : '-'}
          </div>
        `}
      </div>
      
      <div>
        <span class="badge" style="
          background: ${statusColors[assignment.status]};
          color: white;
          border: none;
          font-size: 0.75rem;
          padding: 4px 10px;
        ">
          ${statusLabels[assignment.status]}
        </span>
      </div>
    </div>
  `;
}

/**
 * Initialise le graphique de complétion par matière
 */
function initCompletionChart() {
  // Détruire le graphique existant si présent
  if (completionChart) {
    destroyChart(completionChart);
    completionChart = null;
  }
  
  // Récupérer le canvas
  const canvas = document.getElementById('teacher-completion-chart');
  if (!canvas) {
    console.warn('[View Dashboard] Canvas teacher-completion-chart non trouvé');
    return;
  }
  
  // Vérifier qu'on a les données
  if (!dashboardData || !dashboardData.topSubjects) {
    console.warn('[View Dashboard] Pas de données topSubjects disponibles');
    return;
  }
  
  // Créer le graphique
  try {
    completionChart = createCompletionBarChart(canvas, dashboardData.topSubjects);
    console.log('[View Dashboard] ✅ Graphique de complétion initialisé');
  } catch (error) {
    console.error('[View Dashboard] Erreur lors de la création du graphique:', error);
  }
}

/**
 * Initialise le graphique de comparaison sociale
 */
function initSocialComparisonChart() {
  const canvas = document.getElementById('teacher-social-comparison-chart');
  if (!canvas) return;
  
  const comparisonData = getSocialComparisonData();
  
  // Remplacer "Moi" par "Meilleur Élève" pour le contexte enseignant
  const labels = comparisonData.labels.map(label => 
    label === 'Moi' ? 'Meilleur Élève' : label
  );
  
  try {
    createBarChart(
      canvas,
      labels,
      [{
        label: 'Score moyen',
        data: comparisonData.scores,
        backgroundColor: [
          'rgba(14, 165, 233, 0.8)', // Moi
          'rgba(148, 163, 184, 0.6)', // Amis
          'rgba(100, 116, 139, 0.6)'  // Classe
        ],
        borderColor: [
          'rgba(14, 165, 233, 1)',
          'rgba(148, 163, 184, 1)',
          'rgba(100, 116, 139, 1)'
        ],
        borderWidth: 2
      }],
      {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Score moyen: ${context.parsed.y}/100`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '/100';
              }
            }
          }
        }
      }
    );
    console.log('[View Dashboard Teacher] ✅ Graphique de comparaison sociale initialisé');
  } catch (error) {
    console.error('[View Dashboard Teacher] Erreur lors de la création du graphique social:', error);
  }
}

function setupTeacherActions() {
  const btn = document.getElementById('btn-open-assignment-modal');
  if (btn) {
    btn.addEventListener('click', openNewAssignmentModal);
  }
}

function openNewAssignmentModal() {
  const classes = getTeacherClassOptions();
  const modal = document.createElement('div');
  modal.id = 'teacher-assignment-modal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="card modal-content">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h2 style="margin:0; font-size:1.3rem;">📝 Nouveau devoir</h2>
          <button class="btn ghost" id="teacher-modal-close">✕</button>
        </div>
        <form id="teacher-assignment-form" style="display:flex; flex-direction:column; gap:12px;">
          <label>
            <span style="display:block; font-weight:600; margin-bottom:4px;">Classe cible</span>
            <select name="className" required class="modal-input">
              ${classes.length ? classes.map(cls => `<option value="${cls}">${cls}</option>`).join('') : '<option value="Terminale S1">Terminale S1</option>'}
            </select>
          </label>
          <label>
            <span style="display:block; font-weight:600; margin-bottom:4px;">Titre du devoir</span>
            <input type="text" name="title" required placeholder="Ex: DM Suites numériques" class="modal-input" />
          </label>
          <label>
            <span style="display:block; font-weight:600; margin-bottom:4px;">Description</span>
            <textarea name="description" rows="3" class="modal-input" placeholder="Objectifs, consignes..."></textarea>
          </label>
          <label>
            <span style="display:block; font-weight:600; margin-bottom:4px;">Deadline</span>
            <input type="date" name="dueDate" required class="modal-input" value="${getDefaultDeadline()}" />
          </label>
          <label>
            <span style="display:block; font-weight:600; margin-bottom:4px;">Pièce jointe (optionnel)</span>
            <input type="file" name="attachment" class="modal-input" />
          </label>
          <div style="display:flex; gap:12px; margin-top:8px; flex-wrap:wrap;">
            <button type="submit" class="btn primary" style="flex:1;">Publier (démo)</button>
            <button type="button" class="btn ghost" id="teacher-modal-cancel" style="flex:1;">Annuler</button>
          </div>
        </form>
      </div>
    </div>
    <style>
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15,23,42,0.55);
        display:flex;
        justify-content:center;
        align-items:center;
        padding:16px;
        z-index:9999;
      }
      .modal-content {
        width:100%;
        max-width:520px;
      }
      .modal-input {
        width:100%;
        border:2px solid var(--card-border);
        border-radius: var(--radius-md);
        padding:10px 12px;
        font-size:1rem;
        background: var(--card);
        color: var(--fg);
      }
      .modal-input:focus {
        outline:none;
        border-color: var(--accent);
      }
    </style>
  `;

  document.body.appendChild(modal);

  const closeButtons = modal.querySelectorAll('#teacher-modal-close, #teacher-modal-cancel');
  closeButtons.forEach(btn => btn.addEventListener('click', () => closeAssignmentModal(modal)));

  const form = modal.querySelector('#teacher-assignment-form');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(form);
    const attachment = formData.get('attachment');
    const payload = {
      className: formData.get('className'),
      title: formData.get('title'),
      description: formData.get('description'),
      dueDate: formData.get('dueDate'),
      attachmentName: attachment && attachment.name ? attachment.name : null
    };
    createDemoAssignment(payload);
    dashboardData.assignments = getAssignmentsSnapshot();
    const metrics = getAssignmentMetrics();
    dashboardData.urgentAssignments = metrics.urgentAssignments;
    dashboardData.assignmentsByStatus = metrics.assignmentsByStatus;
    closeAssignmentModal(modal);
    renderDashboardContent(teacherContainer);
    showTeacherNotification('📘 Devoir publié (démo)');
  });
}

function closeAssignmentModal(modal) {
  if (modal && modal.parentNode) {
    modal.parentNode.removeChild(modal);
  }
}

function getDefaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

/**
 * Rend la section de dynamique sociale de la classe
 */
function renderClassSocialDynamicsSection() {
  const dynamics = getClassSocialDynamics();
  // Filtrer "Moi" du leaderboard car le professeur n'est pas en compétition avec ses élèves
  const leaderboard = getClassSocialLeaderboard().filter(student => student.name !== 'Moi');
  const comparisonData = getSocialComparisonData();
  
  return `
    <div class="card" style="margin-top: 24px;">
      <h2 style="font-size: 1.25rem; margin-bottom: 16px;">
        👥 Dynamique sociale de la classe
      </h2>
      
      <!-- Statistiques principales -->
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      ">
        <div style="
          padding: 16px;
          background: var(--card-hover);
          border-radius: var(--radius-md);
          text-align: center;
        ">
          <div style="font-size: 2rem; font-weight: 700; color: var(--success, #16a34a); margin-bottom: 4px;">
            ${dynamics.progressingRegularly}%
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">
            des élèves progressent régulièrement
          </div>
        </div>
        
        <div style="
          padding: 16px;
          background: var(--card-hover);
          border-radius: var(--radius-md);
          text-align: center;
        ">
          <div style="font-size: 2rem; font-weight: 700; color: var(--accent); margin-bottom: 4px;">
            ${dynamics.fastLearners}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">
            élèves se distinguent par leur rapidité
          </div>
        </div>
        
        <div style="
          padding: 16px;
          background: var(--card-hover);
          border-radius: var(--radius-md);
          text-align: center;
        ">
          <div style="font-size: 2rem; font-weight: 700; color: var(--warning, #f59e0b); margin-bottom: 4px;">
            ${dynamics.belowGroup}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">
            élèves sont en dessous du groupe
          </div>
        </div>
      </div>
      
      <!-- Mini leaderboard social -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--muted);">
          Classement social (Top ${leaderboard.length})
        </h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--card-border);">
                <th style="padding: 10px; text-align: left;">Élève</th>
                <th style="padding: 10px; text-align: center;">Score</th>
                <th style="padding: 10px; text-align: center;">Temps</th>
                <th style="padding: 10px; text-align: center;">Rang social</th>
              </tr>
            </thead>
            <tbody>
              ${leaderboard.map((student, idx) => `
                <tr style="border-bottom: 1px solid var(--card-border);">
                  <td style="padding: 10px; font-weight: 400;">
                    ${student.name}
                  </td>
                  <td style="padding: 10px; text-align: center;">${student.score}/100</td>
                  <td style="padding: 10px; text-align: center;">${student.avgTime}s</td>
                  <td style="padding: 10px; text-align: center;">
                    <span class="badge" style="
                      background: ${getRankColor(student.socialRank)};
                      color: white;
                      font-size: 0.75rem;
                      padding: 4px 8px;
                    ">
                      ${student.socialRank}${getOrdinalSuffix(student.socialRank)}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Graphique de comparaison sociale (optionnel) -->
      <div>
        <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--muted);">
          Comparaison sociale (moyennes)
        </h3>
        <div style="position: relative; height: 200px;">
          <canvas id="teacher-social-comparison-chart"></canvas>
        </div>
      </div>
      
      <div style="
        margin-top: 16px;
        padding: 12px;
        background: var(--card-hover);
        border-radius: var(--radius-md);
        font-size: 0.85rem;
        color: var(--muted);
        text-align: center;
      ">
        📊 Source: ErgoMate (mock)
      </div>
    </div>
  `;
}

/**
 * Retourne la couleur selon le rang
 */
function getRankColor(rank) {
  if (rank === 1) return 'var(--warning, #f59e0b)'; // Or
  if (rank === 2) return 'var(--muted, #64748b)'; // Argent
  if (rank === 3) return 'var(--info, #3b82f6)'; // Bronze
  return 'var(--accent, #0ea5e9)';
}

/**
 * Retourne le suffixe ordinal (1er, 2e, 3e, etc.)
 */
function getOrdinalSuffix(num) {
  if (num === 1) return 'er';
  if (num === 2) return 'e';
  if (num >= 3) return 'e';
  return '';
}

function renderPublishedThemesSection() {
  const classes = getClasses();
  const now = new Date();
  const allAssignments = [];
  
  // Récupérer toutes les assignations publiées pour toutes les classes de l'enseignant
  classes.forEach(classItem => {
    const assignments = getAssignmentsByClass(classItem.id, {
      now: now,
      includeDraft: false
    });
    
    assignments.forEach(assignment => {
      // Enrichir avec les données du thème
      let theme = getThemeById(assignment.themeId);
      
      // Si pas trouvé, chercher dans le thème courant de AI Studio
      if (!theme) {
        const currentTheme = getCurrentTheme();
        if (currentTheme && currentTheme.id === assignment.themeId) {
          theme = currentTheme;
        }
      }
      
      if (theme && theme.id) {
        allAssignments.push({
          ...theme,
          assignment,
          className: classItem.name
        });
      }
    });
  });
  
  // Trier par date de publication (plus récent en premier)
  allAssignments.sort((a, b) => {
    const dateA = new Date(a.assignment.publishedAt || a.assignment.createdAt);
    const dateB = new Date(b.assignment.publishedAt || b.assignment.createdAt);
    return dateB - dateA;
  });
  
  const recentAssignments = allAssignments.slice(0, 5); // Limiter à 5
  
  if (recentAssignments.length === 0) {
    return '';
  }
  
  return `
    <div class="card" style="margin-top: 24px;">
      <h2 style="font-size: 1.25rem; margin-bottom: 16px;">
        ✨ Thèmes publiés pour vos classes
      </h2>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${recentAssignments.map(item => {
          const theme = item;
          const assignment = item.assignment;
          const startDate = new Date(assignment.startAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
          const endDate = new Date(assignment.endAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
          
          return `
            <div style="
              padding: 12px;
              background: var(--card-hover);
              border-radius: var(--radius-md);
              border-left: 3px solid var(--success);
            ">
              <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                ${theme.title || 'Thème sans titre'}
                <span class="badge" style="background:var(--success); color:white; font-size:0.7rem; padding:2px 6px;">Publié</span>
                ${theme.origin === 'ai_theme_studio' || theme.origin === 'library_import' ? '<span class="badge" style="background:var(--accent); color:white; font-size:0.7rem; padding:2px 6px;">IA</span>' : ''}
              </div>
              <div style="font-size: 0.85rem; color: var(--muted); margin-bottom: 6px;">
                ${item.className} • ${startDate} → ${endDate}
              </div>
              ${theme.description ? `
                <div style="font-size: 0.8rem; color: var(--muted); margin-top: 4px;">
                  ${theme.description.substring(0, 100)}${theme.description.length > 100 ? '...' : ''}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function showTeacherNotification(message) {
  const banner = document.getElementById('teacher-notification');
  if (!banner) return;
  banner.textContent = message;
  banner.classList.add('visible');
  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    banner.classList.remove('visible');
  }, 3500);
}

/**
 * Rend la section d'analyse sociale avancée
 */
function renderAdvancedSocialAnalysisSection() {
  const classes = getClasses();
  const firstClass = classes[0];
  if (!firstClass) {
    return '<div class="card" style="margin-top: 24px; padding: 24px; text-align: center; color: var(--muted);">Aucune classe disponible</div>';
  }

  const classId = firstClass.id;
  const stats = getClassSocialStats(classId);
  
  if (!stats) {
    return '<div class="card" style="margin-top: 24px; padding: 24px; text-align: center; color: var(--muted);">Données sociales non disponibles</div>';
  }

  return `
    <div class="card" style="margin-top: 24px;">
      <h2 style="font-size: 1.25rem; margin-bottom: 20px;">
        🟪 Analyse sociale avancée (démo)
      </h2>
      
      <!-- Onglets -->
      <div style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid var(--card-border);">
        <button class="social-tab-btn active" data-tab="heatmap" style="
          padding: 12px 20px;
          background: transparent;
          border: none;
          border-bottom: 3px solid var(--accent);
          color: var(--fg);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-base);
        ">Heatmap</button>
        <button class="social-tab-btn" data-tab="progression" style="
          padding: 12px 20px;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          color: var(--muted);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-base);
        ">Progression</button>
        <button class="social-tab-btn" data-tab="score-time" style="
          padding: 12px 20px;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          color: var(--muted);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-base);
        ">Score vs Temps</button>
        <button class="social-tab-btn" data-tab="leaderboard" style="
          padding: 12px 20px;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          color: var(--muted);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-base);
        ">Leaderboard</button>
      </div>
      
      <!-- Contenu des onglets -->
      <div id="social-tab-content">
        <!-- Heatmap -->
        <div class="social-tab-panel active" data-panel="heatmap">
          <h3 style="font-size: 1rem; margin-bottom: 16px; color: var(--muted);">
            Scores × Temps de réponse
          </h3>
          <div style="position: relative; height: 300px;">
            <canvas id="teacher-heatmap-chart"></canvas>
          </div>
        </div>
        
        <!-- Progression -->
        <div class="social-tab-panel" data-panel="progression" style="display: none;">
          <h3 style="font-size: 1rem; margin-bottom: 16px; color: var(--muted);">
            Progression moyenne de la classe
          </h3>
          <div style="position: relative; height: 300px;">
            <canvas id="teacher-progression-chart"></canvas>
          </div>
        </div>
        
        <!-- Score vs Temps -->
        <div class="social-tab-panel" data-panel="score-time" style="display: none;">
          <h3 style="font-size: 1rem; margin-bottom: 16px; color: var(--muted);">
            Score moyen vs Temps moyen
          </h3>
          <div style="position: relative; height: 300px;">
            <canvas id="teacher-score-time-chart"></canvas>
          </div>
        </div>
        
        <!-- Leaderboard -->
        <div class="social-tab-panel" data-panel="leaderboard" style="display: none;">
          <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
            <button class="leaderboard-filter-btn ${currentLeaderboardFilter === 'all' ? 'active' : ''}" data-filter="all" style="
              padding: 8px 16px;
              border: 2px solid var(--card-border);
              border-radius: var(--radius-md);
              background: ${currentLeaderboardFilter === 'all' ? 'var(--accent)' : 'transparent'};
              color: ${currentLeaderboardFilter === 'all' ? 'white' : 'var(--fg)'};
              cursor: pointer;
              font-weight: 500;
              transition: all var(--transition-base);
            ">Tous</button>
            <button class="leaderboard-filter-btn ${currentLeaderboardFilter === 'top' ? 'active' : ''}" data-filter="top" style="
              padding: 8px 16px;
              border: 2px solid var(--card-border);
              border-radius: var(--radius-md);
              background: ${currentLeaderboardFilter === 'top' ? 'var(--accent)' : 'transparent'};
              color: ${currentLeaderboardFilter === 'top' ? 'white' : 'var(--fg)'};
              cursor: pointer;
              font-weight: 500;
              transition: all var(--transition-base);
            ">Meilleurs</button>
            <button class="leaderboard-filter-btn ${currentLeaderboardFilter === 'struggling' ? 'active' : ''}" data-filter="struggling" style="
              padding: 8px 16px;
              border: 2px solid var(--card-border);
              border-radius: var(--radius-md);
              background: ${currentLeaderboardFilter === 'struggling' ? 'var(--accent)' : 'transparent'};
              color: ${currentLeaderboardFilter === 'struggling' ? 'white' : 'var(--fg)'};
              cursor: pointer;
              font-weight: 500;
              transition: all var(--transition-base);
            ">En difficulté</button>
            <button class="leaderboard-filter-btn ${currentLeaderboardFilter === 'fast' ? 'active' : ''}" data-filter="fast" style="
              padding: 8px 16px;
              border: 2px solid var(--card-border);
              border-radius: var(--radius-md);
              background: ${currentLeaderboardFilter === 'fast' ? 'var(--accent)' : 'transparent'};
              color: ${currentLeaderboardFilter === 'fast' ? 'white' : 'var(--fg)'};
              cursor: pointer;
              font-weight: 500;
              transition: all var(--transition-base);
            ">Progression rapide</button>
          </div>
          <div id="teacher-leaderboard-content">
            ${renderLeaderboardContent(classId, currentLeaderboardFilter)}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Rend le contenu du leaderboard
 */
function renderLeaderboardContent(classId, filter) {
  const students = getFilteredLeaderboard(classId, filter);
  
  if (students.length === 0) {
    return '<p style="text-align: center; color: var(--muted); padding: 24px;">Aucun élève trouvé</p>';
  }
  
  return `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
        <thead>
          <tr style="border-bottom: 2px solid var(--card-border);">
            <th style="padding: 10px; text-align: left;">Élève</th>
            <th style="padding: 10px; text-align: center;">Score</th>
            <th style="padding: 10px; text-align: center;">Temps</th>
            ${filter === 'fast' ? '<th style="padding: 10px; text-align: center;">Ratio</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${students.map((student, idx) => `
            <tr style="border-bottom: 1px solid var(--card-border);">
              <td style="padding: 10px; font-weight: 400;">
                ${idx + 1}. ${student.name}
              </td>
              <td style="padding: 10px; text-align: center; font-weight: 600;">
                ${student.score}/20
              </td>
              <td style="padding: 10px; text-align: center; color: var(--muted);">
                ${student.time}s
              </td>
              ${filter === 'fast' ? `<td style="padding: 10px; text-align: center; color: var(--accent);">${(student.ratio || (student.score / student.time)).toFixed(2)}</td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Initialise les graphiques d'analyse sociale avancée
 */
function initAdvancedSocialCharts() {
  const classes = getClasses();
  const firstClass = classes[0];
  if (!firstClass) return;
  
  const classId = firstClass.id;
  
  // Heatmap
  const heatmapCanvas = document.getElementById('teacher-heatmap-chart');
  if (heatmapCanvas) {
    const heatmapData = getHeatmapData(classId);
    if (heatmapData) {
      if (socialAdvancedCharts.heatmap) {
        destroyChartInstance(socialAdvancedCharts.heatmap);
      }
      socialAdvancedCharts.heatmap = makeHeatmapChart(
        heatmapCanvas,
        heatmapData.timeRanges,
        heatmapData.scoreRanges,
        heatmapData.data
      );
    }
  }
  
  // Progression
  const progressionCanvas = document.getElementById('teacher-progression-chart');
  if (progressionCanvas) {
    const progressionData = getClassProgressionData(classId);
    if (progressionData) {
      if (socialAdvancedCharts.progression) {
        destroyChartInstance(socialAdvancedCharts.progression);
      }
      socialAdvancedCharts.progression = makeLineChart(
        progressionCanvas,
        progressionData.labels,
        progressionData.scores,
        {
          label: 'Score moyen',
          color: 'var(--accent)',
          fill: true
        }
      );
    }
  }
  
  // Score vs Temps
  const scoreTimeCanvas = document.getElementById('teacher-score-time-chart');
  if (scoreTimeCanvas) {
    const stats = getClassSocialStats(classId);
    if (stats) {
      if (socialAdvancedCharts.scoreTime) {
        destroyChartInstance(socialAdvancedCharts.scoreTime);
      }
      // Créer un graphique barre avec score moyen et temps moyen
      const labels = ['Score moyen', 'Temps moyen (s)'];
      const scoreData = [stats.avgScore, 0];
      const timeData = [0, stats.avgResponseTime];
      
      // Utiliser un bar chart avec deux datasets
      const colors = getThemeColors();
      socialAdvancedCharts.scoreTime = makeBarChart(
        scoreTimeCanvas,
        labels,
        [stats.avgScore, stats.avgResponseTime / 5], // Normaliser le temps pour l'affichage
        {
          label: 'Valeurs',
          color: colors.accent,
          chartOptions: {
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value, index) {
                    if (index === 0) return value.toFixed(1) + '/20';
                    return (value * 5).toFixed(0) + 's';
                  }
                }
              }
            }
          }
        }
      );
    }
  }
  
  // Setup des onglets
  setupSocialTabs();
  
  // Setup des filtres du leaderboard
  setupLeaderboardFilters(classId);
}

/**
 * Configure les onglets de l'analyse sociale
 */
function setupSocialTabs() {
  const tabButtons = document.querySelectorAll('.social-tab-btn');
  const tabPanels = document.querySelectorAll('.social-tab-panel');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      // Désactiver tous les onglets
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.style.borderBottomColor = 'transparent';
        b.style.color = 'var(--muted)';
        b.style.fontWeight = '500';
      });
      
      tabPanels.forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
      });
      
      // Activer l'onglet sélectionné
      btn.classList.add('active');
      btn.style.borderBottomColor = 'var(--accent)';
      btn.style.color = 'var(--fg)';
      btn.style.fontWeight = '600';
      
      const panel = document.querySelector(`[data-panel="${tabName}"]`);
      if (panel) {
        panel.classList.add('active');
        panel.style.display = 'block';
      }
    });
  });
}

/**
 * Configure les filtres du leaderboard
 */
function setupLeaderboardFilters(classId) {
  const filterButtons = document.querySelectorAll('.leaderboard-filter-btn');
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      currentLeaderboardFilter = filter;
      
      // Mettre à jour les boutons
      filterButtons.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'transparent';
        b.style.color = 'var(--fg)';
      });
      
      btn.classList.add('active');
      btn.style.background = 'var(--accent)';
      btn.style.color = 'white';
      
      // Mettre à jour le contenu
      const content = document.getElementById('teacher-leaderboard-content');
      if (content) {
        content.innerHTML = renderLeaderboardContent(classId, filter);
      }
    });
  });
}

// Export global pour que app.js puisse l'appeler
window.renderDashboardTeacherView = renderDashboardTeacherView;

export default { renderDashboardTeacherView };
