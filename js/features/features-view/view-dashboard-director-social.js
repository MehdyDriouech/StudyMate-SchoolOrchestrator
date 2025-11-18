/**
 * View Dashboard Director Social - Interface du dashboard social directeur
 */

import {
  loadDirectorSocialData,
  getCohesionColor
} from '../features-control/feature-dashboard-director-social.js';
import {
  makeBarChart,
  destroyChartInstance
} from '../../components/ChartFactory.js';
import { getThemeColors } from '../../components/Charts.js';

let directorSocialData = null;
let directorSocialCharts = {
  scoreByClass: null,
  timeByClass: null,
  interSchool: null
};
let directorSocialContainer = null;

/**
 * Rend la vue du dashboard social directeur
 * @param {HTMLElement} container - Conteneur de la vue
 */
export async function renderDashboardDirectorSocialView(container) {
  console.log('[View Dashboard Director Social] Rendu du dashboard social directeur');
  directorSocialContainer = container;
  
  // Afficher un loader
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px; animation: pulse 1.5s ease-in-out infinite;">
          ⏳
        </div>
        <p style="color: var(--muted);">Chargement du dashboard social...</p>
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
    directorSocialData = await loadDirectorSocialData();
    
    // Rendre le dashboard complet
    renderDashboardSocialContent(container);
    
    // Écouter les changements d'établissement pour recharger
    window.addEventListener('schoolChanged', async () => {
      console.log('[View Dashboard Director Social] Changement d\'établissement, rechargement...');
      directorSocialData = await loadDirectorSocialData();
      renderDashboardSocialContent(container);
    });
    
  } catch (error) {
    console.error('[View Dashboard Director Social] Erreur:', error);
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
 * Rend le contenu complet du dashboard social
 * @param {HTMLElement} container - Conteneur
 */
function renderDashboardSocialContent(container) {
  const { classesSocialStats, socialCohesion, allSchoolsStats, activeSchool } = directorSocialData;
  
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <!-- En-tête -->
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          🟪 Vue Sociale de l'Établissement
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Analyse sociale avancée de ${activeSchool}
        </p>
      </div>
      
      <!-- Indicateur de cohésion sociale -->
      <div class="card" style="margin-bottom: 32px;">
        <h2 style="font-size: 1.25rem; margin-bottom: 16px;">
          🤝 Cohésion sociale de l'établissement
        </h2>
        <div style="
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 24px;
          background: var(--card-hover);
          border-radius: var(--radius-md);
        ">
          <div style="text-align: center;">
            <div style="font-size: 3rem; font-weight: 700; color: ${getCohesionColor(socialCohesion.level)}; margin-bottom: 8px;">
              ${socialCohesion.percentage}%
            </div>
            <div style="font-size: 0.9rem; color: var(--muted);">
              Niveau: ${socialCohesion.level}
            </div>
          </div>
          <div style="flex: 1;">
            <div style="
              height: 12px;
              background: var(--card-border);
              border-radius: 999px;
              overflow: hidden;
              margin-bottom: 8px;
            ">
              <div style="
                height: 100%;
                width: ${socialCohesion.percentage}%;
                background: ${getCohesionColor(socialCohesion.level)};
                transition: width 0.5s ease;
              "></div>
            </div>
            <div style="font-size: 0.85rem; color: var(--muted);">
              ${socialCohesion.percentage >= 80 ? 'Cohésion forte : Les élèves progressent de manière homogène' : 
                socialCohesion.percentage >= 60 ? 'Cohésion moyenne : Quelques écarts à surveiller' : 
                'Cohésion faible : Écarts importants entre les élèves'}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Graphiques par classe -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
        <!-- Score moyen par classe -->
        <div class="card">
          <h2 style="font-size: 1.25rem; margin-bottom: 20px;">
            📊 Score moyen par classe
          </h2>
          <div style="position: relative; height: 300px;">
            <canvas id="director-social-score-chart"></canvas>
          </div>
        </div>
        
        <!-- Vitesse moyenne par classe -->
        <div class="card">
          <h2 style="font-size: 1.25rem; margin-bottom: 20px;">
            ⚡ Vitesse moyenne de réponse par classe
          </h2>
          <div style="position: relative; height: 300px;">
            <canvas id="director-social-time-chart"></canvas>
          </div>
        </div>
      </div>
      
      <!-- Tableau multi-classe -->
      <div class="card" style="margin-bottom: 32px;">
        <h2 style="font-size: 1.25rem; margin-bottom: 16px;">
          📋 Tableau récapitulatif par classe
        </h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--card-border);">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Classe</th>
                <th style="padding: 12px; text-align: center;">Score moyen</th>
                <th style="padding: 12px; text-align: center;">Temps moyen</th>
                <th style="padding: 12px; text-align: center;">% Top 20</th>
                <th style="padding: 12px; text-align: center;">% Bottom 20</th>
              </tr>
            </thead>
            <tbody>
              ${classesSocialStats.map(cls => renderClassSocialRow(cls)).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Comparaison inter-établissements -->
      <div class="card">
        <h2 style="font-size: 1.25rem; margin-bottom: 20px;">
          🏫 Comment se situe votre établissement ? (démo)
        </h2>
        <div style="position: relative; height: 300px;">
          <canvas id="director-social-inter-school-chart"></canvas>
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
          📊 Données mockées - Comparaison avec d'autres établissements
        </div>
      </div>
    </div>
    
    <style>
      @media (max-width: 968px) {
        [style*="grid-template-columns: 1fr 1fr"] {
          grid-template-columns: 1fr !important;
        }
      }
    </style>
  `;
  
  // Initialiser les graphiques après que le DOM soit rendu
  requestAnimationFrame(() => {
    initDirectorSocialCharts();
  });
}

/**
 * Rend une ligne du tableau de classe sociale
 */
function renderClassSocialRow(classData) {
  const top20Percent = ((classData.top20Percent / classData.totalStudents) * 100).toFixed(1);
  const bottom20Percent = ((classData.bottom20Percent / classData.totalStudents) * 100).toFixed(1);
  
  return `
    <tr style="border-bottom: 1px solid var(--card-border);">
      <td style="padding: 12px; font-weight: 600;">${classData.className}</td>
      <td style="padding: 12px; text-align: center; font-weight: 600;">
        ${classData.avgScore.toFixed(1)}/20
      </td>
      <td style="padding: 12px; text-align: center; color: var(--muted);">
        ${classData.avgResponseTime}s
      </td>
      <td style="padding: 12px; text-align: center;">
        <span style="color: var(--accent); font-weight: 600;">${top20Percent}%</span>
      </td>
      <td style="padding: 12px; text-align: center;">
        <span style="color: var(--warning); font-weight: 600;">${bottom20Percent}%</span>
      </td>
    </tr>
  `;
}

/**
 * Initialise les graphiques du dashboard social directeur
 */
function initDirectorSocialCharts() {
  const { classesSocialStats, allSchoolsStats, activeSchool } = directorSocialData;
  
  // Graphique score moyen par classe
  const scoreCanvas = document.getElementById('director-social-score-chart');
  if (scoreCanvas) {
    if (directorSocialCharts.scoreByClass) {
      destroyChartInstance(directorSocialCharts.scoreByClass);
    }
    
    const labels = classesSocialStats.map(c => c.className);
    const scores = classesSocialStats.map(c => c.avgScore);
    
    directorSocialCharts.scoreByClass = makeBarChart(
      scoreCanvas,
      labels,
      scores,
      {
        label: 'Score moyen',
        color: 'var(--accent)',
        chartOptions: {
          scales: {
            y: {
              beginAtZero: true,
              max: 20,
              ticks: {
                callback: function(value) {
                  return value.toFixed(1) + '/20';
                }
              }
            }
          }
        }
      }
    );
  }
  
  // Graphique temps moyen par classe
  const timeCanvas = document.getElementById('director-social-time-chart');
  if (timeCanvas) {
    if (directorSocialCharts.timeByClass) {
      destroyChartInstance(directorSocialCharts.timeByClass);
    }
    
    const labels = classesSocialStats.map(c => c.className);
    const times = classesSocialStats.map(c => c.avgResponseTime);
    
    directorSocialCharts.timeByClass = makeBarChart(
      timeCanvas,
      labels,
      times,
      {
        label: 'Temps moyen (s)',
        color: 'var(--info)',
        chartOptions: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return value.toFixed(0) + 's';
                }
              }
            }
          }
        }
      }
    );
  }
  
  // Graphique comparaison inter-établissements
  const interSchoolCanvas = document.getElementById('director-social-inter-school-chart');
  if (interSchoolCanvas && allSchoolsStats.length > 0) {
    if (directorSocialCharts.interSchool) {
      destroyChartInstance(directorSocialCharts.interSchool);
    }
    
    // Mapper les schoolId aux noms d'établissements
    const schoolNames = {
      'school_01': 'Lycée Saint-Charles',
      'school_02': 'Lycée Condorcet'
    };
    
    const labels = allSchoolsStats.map(s => {
      const name = schoolNames[s.schoolId] || s.schoolId;
      return name === activeSchool ? `${name} (vous)` : name;
    });
    const scores = allSchoolsStats.map(s => s.avgScore);
    
    const colors = getThemeColors();
    const backgroundColors = allSchoolsStats.map(s => {
      const name = schoolNames[s.schoolId] || s.schoolId;
      return name === activeSchool ? colors.accent : colors.muted;
    });
    
    directorSocialCharts.interSchool = makeBarChart(
      interSchoolCanvas,
      labels,
      scores,
      {
        label: 'Score moyen',
        color: colors.accent,
        chartOptions: {
          scales: {
            y: {
              beginAtZero: true,
              max: 20,
              ticks: {
                callback: function(value) {
                  return value.toFixed(1) + '/20';
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      }
    );
    
    // Mettre à jour les couleurs après création
    if (directorSocialCharts.interSchool && directorSocialCharts.interSchool.data) {
      directorSocialCharts.interSchool.data.datasets[0].backgroundColor = backgroundColors;
      directorSocialCharts.interSchool.data.datasets[0].borderColor = backgroundColors;
      directorSocialCharts.interSchool.update();
    }
  }
}

// Export global pour que app.js puisse l'appeler
window.renderDashboardDirectorSocialView = renderDashboardDirectorSocialView;

export default { renderDashboardDirectorSocialView };

