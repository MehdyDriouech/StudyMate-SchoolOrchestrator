/**
 * View Class Summary - Vue du résumé de classe pour l'enseignant
 * Affiche les KPIs, les élèves en difficulté/avancés, les graphiques et les thèmes récents
 */

import {
  loadClassSummaryData,
  formatDate,
  formatRelativeDate
} from '../features-control/feature-class-summary.js';
import { makeBarChart, destroyChartInstance } from '../../components/ChartFactory.js';
import { navigateTo } from '../../app.js';
import { getClasses } from '../features-control/store-multischool.js';

let summaryData = null;
let scoreChart = null;
let submissionsChart = null;
let currentClassId = null;

/**
 * Rend la vue du résumé de classe
 * @param {HTMLElement} container - Conteneur de la vue
 */
export async function renderClassSummaryView(container) {
  console.log('[View Class Summary] Rendu du résumé de classe');
  
  // Récupérer la classe sélectionnée depuis le localStorage ou utiliser la première
  const savedClassId = localStorage.getItem('SM_SO_SELECTED_CLASS_ID');
  const classes = getClasses();
  
  if (!currentClassId) {
    if (savedClassId && classes.find(c => c.id === savedClassId)) {
      currentClassId = savedClassId;
    } else if (classes.length > 0) {
      currentClassId = classes[0].id;
      localStorage.setItem('SM_SO_SELECTED_CLASS_ID', currentClassId);
    }
  }
  
  // Afficher un loader
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px; animation: pulse 1.5s ease-in-out infinite;">
          ⏳
        </div>
        <p style="color: var(--muted);">Chargement du résumé de classe...</p>
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
    // Charger les données pour la classe sélectionnée
    summaryData = await loadClassSummaryData(currentClassId);
    
    // Rendre le contenu
    renderSummaryContent(container);
    
    // Écouter les changements d'établissement pour recharger
    window.addEventListener('schoolChanged', async () => {
      console.log('[View Class Summary] Changement d\'établissement, rechargement...');
      // Réinitialiser la classe sélectionnée
      currentClassId = null;
      const newClasses = getClasses();
      if (newClasses.length > 0) {
        currentClassId = newClasses[0].id;
        localStorage.setItem('SM_SO_SELECTED_CLASS_ID', currentClassId);
      }
      summaryData = await loadClassSummaryData(currentClassId);
      renderSummaryContent(container);
    });
    
  } catch (error) {
    console.error('[View Class Summary] Erreur:', error);
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
 * Rend le contenu complet du résumé
 * @param {HTMLElement} container - Conteneur
 */
function renderSummaryContent(container) {
  // Détruire les graphiques existants
  if (scoreChart) {
    destroyChartInstance(scoreChart);
    scoreChart = null;
  }
  if (submissionsChart) {
    destroyChartInstance(submissionsChart);
    submissionsChart = null;
  }
  
  const { classInfo, kpis, studentsData, recentThemes, chartData } = summaryData;
  const classes = getClasses();
  
  container.innerHTML = `
    <div style="width: 100%; max-width: 100%; margin: 0; padding: 24px 32px; box-sizing: border-box;">
      <!-- En-tête avec sélecteur de classe -->
      <div style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
        <div style="flex: 1; min-width: 200px;">
          <h1 style="font-size: 2rem; margin: 0 0 8px 0; color: var(--fg);">
            ${classInfo.name || 'Classe'}
          </h1>
          <p style="color: var(--muted); margin: 0;">
            Résumé de classe • ${kpis.totalStudents} élèves
          </p>
        </div>
        ${classes.length > 1 ? `
          <div style="display: flex; align-items: center; gap: 12px;">
            <label for="class-selector" style="font-weight: 600; color: var(--fg); white-space: nowrap;">
              Classe :
            </label>
            <select 
              id="class-selector" 
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
                <option value="${c.id}" ${c.id === currentClassId ? 'selected' : ''}>
                  ${c.name || c.id}
                </option>
              `).join('')}
            </select>
          </div>
        ` : ''}
      </div>
      
      <!-- Section KPIs -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 32px;">
        ${renderKPICard('Taux de rendus', `${kpis.submissionRate}%`, '📋', kpis.submissionRate >= 75 ? 'success' : kpis.submissionRate >= 50 ? 'warning' : 'danger')}
        ${renderKPICard('Score moyen', `${kpis.avgScore}/100`, '⭐', kpis.avgScore >= 70 ? 'success' : kpis.avgScore >= 50 ? 'warning' : 'danger')}
        ${renderKPICard('Thèmes actifs', `${kpis.activeThemesCount}`, '📚', 'info')}
        ${renderKPICard('Élèves en difficulté', `${kpis.strugglingPercentage}%`, '⚠️', kpis.strugglingPercentage <= 10 ? 'success' : kpis.strugglingPercentage <= 20 ? 'warning' : 'danger')}
      </div>
      
      <!-- Sections élèves et graphiques -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
        <!-- Élèves à suivre -->
        <div class="card">
          <h2 style="font-size: 1.25rem; margin: 0 0 16px 0; color: var(--fg);">
            ⚠️ Élèves à suivre en priorité
          </h2>
          ${renderStudentsList(studentsData.struggling, 'struggling')}
        </div>
        
        <!-- Élèves moteurs -->
        <div class="card">
          <h2 style="font-size: 1.25rem; margin: 0 0 16px 0; color: var(--fg);">
            🚀 Élèves moteurs
          </h2>
          ${renderStudentsList(studentsData.topPerformers, 'top')}
        </div>
      </div>
      
      <!-- Section graphiques -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
        <!-- Distribution des scores -->
        <div class="card">
          <h2 style="font-size: 1.25rem; margin: 0 0 16px 0; color: var(--fg);">
            📊 Distribution des scores
          </h2>
          <canvas id="score-distribution-chart" style="max-height: 300px;"></canvas>
        </div>
        
        <!-- Rendus par thème -->
        <div class="card">
          <h2 style="font-size: 1.25rem; margin: 0 0 16px 0; color: var(--fg);">
            📈 Rendus par thème
          </h2>
          <canvas id="submissions-by-theme-chart" style="max-height: 300px;"></canvas>
        </div>
      </div>
      
      <!-- Section thèmes récents -->
      <div class="card">
        <h2 style="font-size: 1.25rem; margin: 0 0 16px 0; color: var(--fg);">
          📚 Thèmes récents
        </h2>
        ${renderRecentThemes(recentThemes)}
      </div>
    </div>
  `;
  
  // Ajouter le gestionnaire d'événement pour le sélecteur de classe
  if (classes.length > 1) {
    const classSelector = container.querySelector('#class-selector');
    if (classSelector) {
      classSelector.addEventListener('change', async (e) => {
        const selectedClassId = e.target.value;
        currentClassId = selectedClassId;
        localStorage.setItem('SM_SO_SELECTED_CLASS_ID', selectedClassId);
        
        // Afficher un loader
        const loader = document.createElement('div');
        loader.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: var(--card); opacity: 0.95; backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100;';
        loader.innerHTML = `
          <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 16px; animation: pulse 1.5s ease-in-out infinite;">⏳</div>
            <p style="color: var(--muted);">Chargement des données...</p>
          </div>
        `;
        container.style.position = 'relative';
        container.appendChild(loader);
        
        try {
          summaryData = await loadClassSummaryData(selectedClassId);
          loader.remove();
          renderSummaryContent(container);
        } catch (error) {
          console.error('[View Class Summary] Erreur lors du changement de classe:', error);
          loader.remove();
          alert('Erreur lors du chargement des données de la classe. Veuillez réessayer.');
        }
      });
    }
  }
  
  // Initialiser les graphiques après le rendu
  setTimeout(() => {
    initCharts(chartData);
  }, 100);
}

/**
 * Rend une carte KPI
 * @param {string} label - Label du KPI
 * @param {string} value - Valeur
 * @param {string} icon - Icône
 * @param {string} variant - Variante (success, warning, danger, info)
 * @returns {string}
 */
function renderKPICard(label, value, icon, variant) {
  const colors = {
    success: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', text: 'rgb(34, 197, 94)' },
    warning: { bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.3)', text: 'rgb(251, 191, 36)' },
    danger: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: 'rgb(239, 68, 68)' },
    info: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: 'rgb(59, 130, 246)' }
  };
  
  const color = colors[variant] || colors.info;
  
  return `
    <div class="card" style="background: ${color.bg}; border: 1px solid ${color.border};">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <span style="font-size: 1.5rem;">${icon}</span>
        <span style="color: var(--muted); font-size: 0.9rem;">${label}</span>
      </div>
      <div style="font-size: 2rem; font-weight: 700; color: ${color.text};">
        ${value}
      </div>
    </div>
  `;
}

/**
 * Rend une liste d'élèves
 * @param {Array} students - Liste des élèves
 * @param {string} type - Type (struggling ou top)
 * @returns {string}
 */
function renderStudentsList(students, type) {
  if (!students || students.length === 0) {
    return `
      <p style="color: var(--muted); text-align: center; padding: 20px;">
        Aucun élève à afficher
      </p>
    `;
  }
  
  return `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${students.map((student, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--card-hover); border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-weight: 600; color: var(--muted);">#${index + 1}</span>
            <span style="font-weight: 500; color: var(--fg);">${student.name}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            ${type === 'struggling' ? `
              <span style="color: var(--danger); font-weight: 600;">
                ${student.avgScore}/20
              </span>
              <span style="color: var(--muted); font-size: 0.9rem;">
                ${student.missingSubmissions} devoir${student.missingSubmissions > 1 ? 's' : ''} non rendu${student.missingSubmissions > 1 ? 's' : ''}
              </span>
            ` : `
              <span style="color: var(--success); font-weight: 600;">
                ${student.avgScore}/20
              </span>
              <span style="color: var(--muted); font-size: 0.9rem;">
                ${student.avgTime}s moy.
              </span>
            `}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Rend la liste des thèmes récents
 * @param {Array} themes - Liste des thèmes
 * @returns {string}
 */
function renderRecentThemes(themes) {
  if (!themes || themes.length === 0) {
    return `
      <p style="color: var(--muted); text-align: center; padding: 20px;">
        Aucun thème récent
      </p>
    `;
  }
  
  return `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${themes.map(theme => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--card-hover); border-radius: 8px; border-left: 4px solid var(--accent);">
          <div style="flex: 1;">
            <h3 style="font-size: 1.1rem; margin: 0 0 8px 0; color: var(--fg);">
              ${theme.title}
            </h3>
            <div style="display: flex; gap: 16px; color: var(--muted); font-size: 0.9rem;">
              <span>📅 Rendu: ${formatDate(theme.dueDate)}</span>
              <span>📊 ${theme.completionRate}% complété (${theme.totalSubmissions}/${theme.totalStudents})</span>
            </div>
          </div>
          <button 
            class="btn primary" 
            onclick="window.navigateToTheme('${theme.themeId}')"
            style="margin-left: 16px;"
          >
            Voir les détails
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Initialise les graphiques
 * @param {object} chartData - Données des graphiques
 */
function initCharts(chartData) {
  // Graphique de distribution des scores
  const scoreCanvas = document.getElementById('score-distribution-chart');
  if (scoreCanvas && chartData.scoreDistribution) {
    scoreChart = makeBarChart(
      scoreCanvas,
      chartData.scoreDistribution.labels,
      chartData.scoreDistribution.data,
      {
        label: 'Nombre d\'élèves',
        color: 'rgba(59, 130, 246, 0.8)',
        chartOptions: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.parsed.y} élèves`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      }
    );
  }
  
  // Graphique de rendus par thème
  const submissionsCanvas = document.getElementById('submissions-by-theme-chart');
  if (submissionsCanvas && chartData.submissionsByTheme) {
    submissionsChart = makeBarChart(
      submissionsCanvas,
      chartData.submissionsByTheme.labels,
      chartData.submissionsByTheme.data,
      {
        label: 'Taux de rendus (%)',
        color: 'rgba(34, 197, 94, 0.8)',
        chartOptions: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const index = context.dataIndex;
                  const count = chartData.submissionsByTheme.counts[index];
                  return `${context.parsed.y}% (${count} rendus)`;
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
                  return value + '%';
                }
              }
            }
          }
        }
      }
    );
  }
}

// Fonction globale pour la navigation vers un thème
window.navigateToTheme = function(themeId) {
  navigateTo('teacher-analytics/submissions', false, { themeId });
};

// Export global pour app.js
window.renderClassSummaryView = renderClassSummaryView;

