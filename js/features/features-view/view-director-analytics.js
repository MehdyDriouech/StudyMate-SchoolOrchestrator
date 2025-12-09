/**
 * View Director Analytics - Conteneur pour les analytics du directeur
 * Gère les sous-routes : school, inter, usage-heatmap
 */

console.log('[View Director Analytics] Module en cours de chargement...');

import { getSubRoute } from '../../components/NavigationManager.js';
import { loadDirectorDashboardData } from '../features-control/feature-dashboard-director.js';
import { getAllSchools } from '../features-control/store-multischool.js';
import { renderDirectorUsageHeatmapView } from './view-director-usage-heatmap.js';
import {
  fetchSchoolStats,
  getSchoolStats,
  isLoadingSchools,
  getSchoolsError
} from '../features-control/store-stats.js';
import { makeBarChart, destroyChartInstance } from '../../components/ChartFactory.js';

console.log('[View Director Analytics] Imports terminés');

/**
 * Rend la vue analytics du directeur
 * @param {HTMLElement} container - Conteneur de la vue
 * @param {string} route - Route actuelle
 */
export async function renderDirectorAnalyticsView(container, route = 'director-analytics') {
  console.log('[View Director Analytics] Rendu de l\'analytics, route:', route);
  
  if (!container) {
    console.error('[View Director Analytics] Container est null!');
    return;
  }
  
  const subRoute = getSubRoute(route);
  const routeToRender = subRoute || 'school';
  
  try {
    switch (routeToRender) {
      case 'school':
        await renderSchoolStatsView(container);
        break;
      case 'inter':
        await renderInterSchoolComparisonView(container);
        break;
      case 'usage-heatmap':
        await renderDirectorUsageHeatmapView(container);
        break;
      default:
        container.innerHTML = `
          <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center; padding: 24px;">
            <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
            <h2>Sous-route inconnue</h2>
            <p style="color: var(--muted); margin: 16px 0;">
              La route "${routeToRender}" n'existe pas.
          </p>
        </div>
      `;
    }
  } catch (error) {
    console.error('[View Director Analytics] Erreur lors du rendu:', error);
    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center; padding: 24px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
        <h2>Erreur de rendu</h2>
        <p style="color: var(--danger); margin: 16px 0;">
          ${error.message || 'Une erreur est survenue lors du rendu de la vue.'}
        </p>
      </div>
    `;
  }
}

// Export global pour app.js (doit être fait immédiatement au niveau du module)
try {
  window.renderDirectorAnalyticsView = renderDirectorAnalyticsView;
  console.log('[View Director Analytics] ✅ Fonction exportée globalement: renderDirectorAnalyticsView');
  console.log('[View Director Analytics] Vérification:', typeof window.renderDirectorAnalyticsView === 'function' ? 'OK' : 'ERREUR');
} catch (error) {
  console.error('[View Director Analytics] ❌ Erreur lors de l\'export global:', error);
}

// Export par défaut aussi
export default { renderDirectorAnalyticsView };

let analyticsContainer = null;

/**
 * Rend la vue des stats de l'établissement
 */
async function renderSchoolStatsView(container) {
  console.log('[View Director Analytics] renderSchoolStatsView appelée');
  
  if (!container) {
    console.error('[View Director Analytics] renderSchoolStatsView: container est null!');
    return;
  }
  
  try {
    const dashboardData = await loadDirectorDashboardData();
    console.log('[View Director Analytics] Dashboard data chargée:', !!dashboardData);
    
    if (!dashboardData || !dashboardData.stats || !dashboardData.classesComparison || !dashboardData.teachersPerformance) {
      container.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center; padding: 24px;">
          <div style="font-size: 3rem; margin-bottom: 16px;">⚠️</div>
          <h2>Données non disponibles</h2>
          <p style="color: var(--muted); margin: 16px 0;">
            Les données du dashboard ne sont pas encore chargées. Veuillez réessayer.
          </p>
        </div>
      `;
      return;
    }
  
    const { stats, classesComparison, teachersPerformance } = dashboardData;
    const totalStudents = classesComparison.reduce((sum, cls) => sum + (cls.studentsCount || 0), 0);
    const avgGrade = classesComparison.length > 0
      ? classesComparison.reduce((sum, cls) => sum + (cls.avgGrade || 0), 0) / classesComparison.length
      : 0;
  
    const kpis = {
      totalStudents,
      totalClasses: stats.totalClasses || 0,
      completionRate: parseFloat(stats.avgCompletionRate) || 0,
      averageGrade: avgGrade
    };
  
    const topClasses = classesComparison
      .sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0))
      .slice(0, 5)
      .map(cls => ({
        name: cls.className,
        studentsCount: cls.studentsCount || 0,
        avgCompletion: cls.completionRate || 0
      }));
  
    const topTeachers = teachersPerformance
      .sort((a, b) => (b.avgCompletionRate || 0) - (a.avgCompletionRate || 0))
      .slice(0, 5)
      .map(teacher => ({
        name: teacher.name,
        classesCount: teacher.classesCount || 0,
        avgCompletion: teacher.avgCompletionRate || 0
      }));
  
    container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          📈 Stats établissement
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Vue d'ensemble des performances de votre établissement
        </p>
      </div>
      
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      ">
        <div class="card" style="text-align: center; padding: 20px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">👥</div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--fg); margin-bottom: 4px;">
            ${kpis.totalStudents}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">Élèves</div>
        </div>
        <div class="card" style="text-align: center; padding: 20px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🎓</div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--fg); margin-bottom: 4px;">
            ${kpis.totalClasses}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">Classes</div>
        </div>
        <div class="card" style="text-align: center; padding: 20px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">✅</div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--fg); margin-bottom: 4px;">
            ${kpis.completionRate}%
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">Complétion</div>
        </div>
        <div class="card" style="text-align: center; padding: 20px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">📊</div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--fg); margin-bottom: 4px;">
            ${kpis.averageGrade.toFixed(1)}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">Moyenne / 20</div>
        </div>
      </div>
      
      <div class="card" style="margin-bottom: 24px;">
        <h2 style="font-size: 1.25rem; margin-bottom: 16px;">Top Classes</h2>
        <div style="display: grid; gap: 12px;">
          ${topClasses.map(cls => `
            <div style="
              padding: 12px;
              background: var(--card-hover);
              border-radius: var(--radius-md);
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(cls.name)}</div>
                <div style="font-size: 0.85rem; color: var(--muted);">
                  ${cls.studentsCount} élève${cls.studentsCount > 1 ? 's' : ''}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 700; color: var(--accent);">
                  ${cls.avgCompletion.toFixed(1)}%
                </div>
                <div style="font-size: 0.8rem; color: var(--muted);">complétion</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="card">
        <h2 style="font-size: 1.25rem; margin-bottom: 16px;">Top Enseignants</h2>
        <div style="display: grid; gap: 12px;">
          ${topTeachers.map(teacher => `
            <div style="
              padding: 12px;
              background: var(--card-hover);
              border-radius: var(--radius-md);
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(teacher.name)}</div>
                <div style="font-size: 0.85rem; color: var(--muted);">
                  ${teacher.classesCount} classe${teacher.classesCount > 1 ? 's' : ''}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 700; color: var(--accent);">
                  ${teacher.avgCompletion.toFixed(1)}%
                </div>
                <div style="font-size: 0.8rem; color: var(--muted);">complétion</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  } catch (error) {
    console.error('[View Director Analytics] Erreur dans renderSchoolStatsView:', error);
    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center; padding: 24px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
        <h2>Erreur de chargement</h2>
        <p style="color: var(--danger); margin: 16px 0;">
          ${error.message || 'Une erreur est survenue lors du chargement des données.'}
        </p>
      </div>
    `;
  }
}

/**
 * Rend la vue de comparaison inter-établissements
 */
async function renderInterSchoolComparisonView(container) {
  console.log('[View Director Analytics] renderInterSchoolComparisonView appelée');
  
  if (!container) {
    console.error('[View Director Analytics] renderInterSchoolComparisonView: container est null!');
    return;
  }
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px; text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 16px; animation: pulse 1.5s ease-in-out infinite;">⏳</div>
      <p style="color: var(--muted);">Chargement des statistiques multi-écoles...</p>
    </div>
  `;
  
  try {
    const schoolStats = await fetchSchoolStats();
    console.log('[View Director Analytics] Stats écoles chargées:', schoolStats.length);
    
    const totalSchools = schoolStats.length;
    const totalStudents = schoolStats.reduce((sum, s) => sum + (s.active_students || 0), 0);
    const totalClasses = schoolStats.reduce((sum, s) => sum + (s.classes_count || 0), 0);
    const avgScoreGlobal = schoolStats.length > 0
      ? schoolStats.reduce((sum, s) => sum + (s.avg_score || 0), 0) / schoolStats.length
      : 0;
    const avgCompletionGlobal = schoolStats.length > 0
      ? schoolStats.reduce((sum, s) => sum + (s.completion_rate || 0), 0) / schoolStats.length
      : 0;
    
    const bestSchool = schoolStats.length > 0
      ? schoolStats.reduce((best, current) => 
          (current.avg_score || 0) > (best.avg_score || 0) ? current : best
        )
      : null;
    
    const schoolNames = schoolStats.map(s => s.school_name || `École ${s.school_id}`);
    const avgScores = schoolStats.map(s => s.avg_score || 0);
    const completionRates = schoolStats.map(s => (s.completion_rate || 0) * 100);
    
    container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          🔍 Dashboard Multi-Écoles
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Vue comparative des performances de tous les établissements
        </p>
      </div>
      
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      ">
        <div class="card" style="text-align: center; padding: 20px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">🏫</div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--fg); margin-bottom: 4px;">
            ${totalSchools}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">Établissements</div>
        </div>
        <div class="card" style="text-align: center; padding: 20px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">👥</div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--fg); margin-bottom: 4px;">
            ${totalStudents}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">Élèves actifs</div>
        </div>
        <div class="card" style="text-align: center; padding: 20px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">📊</div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--fg); margin-bottom: 4px;">
            ${avgScoreGlobal.toFixed(1)}
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">Moyenne globale / 20</div>
        </div>
        <div class="card" style="text-align: center; padding: 20px;">
          <div style="font-size: 2rem; margin-bottom: 8px;">✅</div>
          <div style="font-size: 2rem; font-weight: 700; color: var(--fg); margin-bottom: 4px;">
            ${(avgCompletionGlobal * 100).toFixed(1)}%
          </div>
          <div style="font-size: 0.9rem; color: var(--muted);">Complétion moyenne</div>
        </div>
      </div>
      
      ${bestSchool ? `
        <div class="card" style="margin-bottom: 32px; background: rgba(16,185,129,0.1); border-left: 4px solid var(--success, #16a34a);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 2rem;">🏆</div>
            <div>
              <div style="font-weight: 600; margin-bottom: 4px;">Meilleure école</div>
              <div style="color: var(--muted); font-size: 0.9rem;">
                ${escapeHtml(bestSchool.school_name)} - Score moyen: ${bestSchool.avg_score.toFixed(1)}/20
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 24px; margin-bottom: 32px;">
        <div class="card">
          <h2 style="font-size: 1.25rem; margin-bottom: 16px;">📊 Score moyen par école</h2>
          <canvas id="chart-avg-score" style="max-height: 300px;"></canvas>
        </div>
        <div class="card">
          <h2 style="font-size: 1.25rem; margin-bottom: 16px;">✅ Taux de complétion par école</h2>
          <canvas id="chart-completion-rate" style="max-height: 300px;"></canvas>
        </div>
      </div>
      
      <div class="card">
        <h2 style="font-size: 1.25rem; margin-bottom: 16px;">📋 Détails par établissement</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--card-border);">
                <th style="padding: 10px; text-align: left;">Établissement</th>
                <th style="padding: 10px; text-align: center;">Score moyen</th>
                <th style="padding: 10px; text-align: center;">Complétion</th>
                <th style="padding: 10px; text-align: center;">Élèves actifs</th>
                <th style="padding: 10px; text-align: center;">Classes</th>
              </tr>
            </thead>
            <tbody>
              ${schoolStats.map(school => `
                <tr style="border-bottom: 1px solid var(--card-border);">
                  <td style="padding: 10px; font-weight: 600;">${escapeHtml(school.school_name || `École ${school.school_id}`)}</td>
                  <td style="padding: 10px; text-align: center;">
                    <span class="badge" style="background: var(--accent); color: white;">
                      ${(school.avg_score || 0).toFixed(1)}/20
                    </span>
                  </td>
                  <td style="padding: 10px; text-align: center;">
                    <span class="badge" style="background: var(--success, #16a34a); color: white;">
                      ${((school.completion_rate || 0) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td style="padding: 10px; text-align: center;">${school.active_students || 0}</td>
                  <td style="padding: 10px; text-align: center;">${school.classes_count || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
    
    setTimeout(() => {
      const avgScoreCanvas = container.querySelector('#chart-avg-score');
      const completionCanvas = container.querySelector('#chart-completion-rate');
      
      if (avgScoreCanvas && schoolStats.length > 0) {
        makeBarChart(avgScoreCanvas, schoolNames, avgScores, {
          label: 'Score moyen / 20',
          color: 'rgba(14, 165, 233, 0.8)',
          chartOptions: {
            scales: {
              y: {
                beginAtZero: true,
                max: 20
              }
            }
          }
        });
      }
      
      if (completionCanvas && schoolStats.length > 0) {
        makeBarChart(completionCanvas, schoolNames, completionRates, {
          label: 'Taux de complétion (%)',
          color: 'rgba(16, 185, 129, 0.8)',
          chartOptions: {
            scales: {
              y: {
                beginAtZero: true,
                max: 100
              }
            }
          }
        });
      }
    }, 100);
  } catch (error) {
    console.error('[View Director Analytics] Erreur dans renderInterSchoolComparisonView:', error);
    const errorMsg = getSchoolsError() || error.message || 'Une erreur est survenue lors du chargement des données.';
    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center; padding: 24px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
        <h2>Erreur de chargement</h2>
        <p style="color: var(--danger); margin: 16px 0;">
          ${escapeHtml(errorMsg)}
        </p>
        <button class="btn primary" onclick="location.reload()" style="margin-top: 16px;">Réessayer</button>
      </div>
    `;
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
