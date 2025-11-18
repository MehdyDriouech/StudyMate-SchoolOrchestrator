/**
 * View Director Analytics - Conteneur pour les analytics du directeur
 * Gère les sous-routes : school, inter
 */

import { getSubRoute } from '../../components/NavigationManager.js';
import { loadDirectorDashboardData } from '../features-control/feature-dashboard-director.js';
import { getAllSchools } from '../features-control/store-multischool.js';
import { navigateTo } from '../../app.js';

let analyticsContainer = null;

/**
 * Rend la vue analytics du directeur
 * @param {HTMLElement} container - Conteneur de la vue
 * @param {string} route - Route actuelle
 */
export async function renderDirectorAnalyticsView(container, route = 'director-analytics') {
  console.log('[View Director Analytics] Rendu des analytics, route:', route);
  
  analyticsContainer = container;
  const subRoute = getSubRoute(route);
  
  // Si pas de sous-route, rendre directement la première (school) au lieu de rediriger
  const routeToRender = subRoute || 'school';
  
  // Router vers la bonne vue selon la sous-route
  switch (routeToRender) {
    case 'school':
      await renderSchoolStatsView(container);
      break;
    case 'inter':
      renderInterSchoolComparisonView(container);
      break;
    default:
      container.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
          <h2>Sous-route inconnue</h2>
          <p style="color: var(--muted); margin: 16px 0;">
            La route "${subRoute}" n'existe pas.
          </p>
        </div>
      `;
  }
}

/**
 * Rend la vue des stats de l'établissement
 */
async function renderSchoolStatsView(container) {
  const dashboardData = await loadDirectorDashboardData();
  
  // Vérifier que les données sont valides
  if (!dashboardData || !dashboardData.stats || !dashboardData.classesComparison || !dashboardData.teachersPerformance) {
    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center;">
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
  
  // Calculer le total des élèves
  const totalStudents = classesComparison.reduce((sum, cls) => sum + (cls.studentsCount || 0), 0);
  
  // Calculer la moyenne des notes
  const avgGrade = classesComparison.length > 0
    ? classesComparison.reduce((sum, cls) => sum + (cls.avgGrade || 0), 0) / classesComparison.length
    : 0;
  
  // Créer les KPIs
  const kpis = {
    totalStudents,
    totalClasses: stats.totalClasses || 0,
    completionRate: parseFloat(stats.avgCompletionRate) || 0,
    averageGrade: avgGrade
  };
  
  // Trier les classes par taux de complétion (top 5)
  const topClasses = classesComparison
    .sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0))
    .slice(0, 5)
    .map(cls => ({
      name: cls.className,
      studentsCount: cls.studentsCount || 0,
      avgCompletion: cls.completionRate || 0
    }));
  
  // Trier les enseignants par taux de complétion moyen (top 5)
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
      
      <!-- KPIs -->
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
      
      <!-- Top Classes -->
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
      
      <!-- Top Teachers -->
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
}

/**
 * Rend la vue de comparaison inter-établissements
 */
function renderInterSchoolComparisonView(container) {
  const schools = getAllSchools();
  
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          🔍 Comparaison inter-établissements
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Comparez les performances de vos établissements
        </p>
      </div>
      
      <div class="card">
        <h2 style="font-size: 1.25rem; margin-bottom: 16px;">Comparaison</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--card-border);">
                <th style="padding: 10px; text-align: left;">Établissement</th>
                <th style="padding: 10px; text-align: center;">Élèves</th>
                <th style="padding: 10px; text-align: center;">Classes</th>
                <th style="padding: 10px; text-align: center;">Complétion</th>
                <th style="padding: 10px; text-align: center;">Moyenne</th>
              </tr>
            </thead>
            <tbody>
              ${schools.map(school => `
                <tr style="border-bottom: 1px solid var(--card-border);">
                  <td style="padding: 10px; font-weight: 600;">${escapeHtml(school.name)}</td>
                  <td style="padding: 10px; text-align: center;">${school.studentsCount || 0}</td>
                  <td style="padding: 10px; text-align: center;">${school.classesCount || 0}</td>
                  <td style="padding: 10px; text-align: center;">
                    <span class="badge" style="background: var(--accent); color: white;">
                      ${(school.completionRate || 0).toFixed(1)}%
                    </span>
                  </td>
                  <td style="padding: 10px; text-align: center;">
                    <span class="badge" style="background: var(--card-hover);">
                      ${(school.averageGrade || 0).toFixed(1)}/20
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
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
window.renderDirectorAnalyticsView = renderDirectorAnalyticsView;
export default { renderDirectorAnalyticsView };

