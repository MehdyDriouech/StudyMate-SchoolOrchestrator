/**
 * View Director Usage Heatmap - Vue de la heatmap d'usage des contenus
 */

import { loadUsageHeatmapData, filterHeatmapData, getCellStats, getActivityColor } from '../features-control/feature-director-usage-heatmap.js';

let heatmapChart = null;
let currentData = null;

/**
 * Rend la vue de la heatmap d'usage des contenus
 * @param {HTMLElement} container - Conteneur de la vue
 */
export async function renderDirectorUsageHeatmapView(container) {
  console.log('[View Director Usage Heatmap] Rendu de la heatmap');
  
  // Charger les données
  currentData = loadUsageHeatmapData();
  
  // Rendre le HTML
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <!-- En-tête -->
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          📊 Usage des contenus — Heatmap d'activité
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Visualisation de l'activité pédagogique par classe et par semaine
        </p>
      </div>
      
      <!-- Filtres (optionnel) -->
      <div class="card" style="margin-bottom: 24px; padding: 16px;">
        <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
          <label style="font-weight: 500; color: var(--fg);">
            Classe :
            <select id="heatmap-class-filter" style="
              margin-left: 8px;
              padding: 6px 12px;
              border: 2px solid var(--card-border);
              border-radius: var(--radius-md);
              background: var(--card);
              color: var(--fg);
              font-size: 0.9rem;
              cursor: pointer;
            ">
              <option value="">Toutes les classes</option>
            </select>
          </label>
        </div>
      </div>
      
      <!-- Heatmap -->
      <div class="card" style="padding: 24px; margin-bottom: 24px;">
        <h2 style="font-size: 1.25rem; margin-bottom: 20px;">
          Activités hebdomadaires par classe
        </h2>
        <div style="overflow-x: auto;">
          <canvas id="usage-heatmap-canvas" style="max-width: 100%;"></canvas>
        </div>
      </div>
      
      <!-- Légende -->
      <div class="card" style="padding: 20px; margin-bottom: 24px;">
        <h3 style="font-size: 1.1rem; margin-bottom: 16px;">Légende</h3>
        <div style="display: flex; gap: 24px; flex-wrap: wrap; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; background: #e5e7eb; border-radius: 4px; border: 1px solid var(--card-border);"></div>
            <span style="font-size: 0.9rem; color: var(--fg);">Aucune activité</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; background: #bbf7d0; border-radius: 4px; border: 1px solid var(--card-border);"></div>
            <span style="font-size: 0.9rem; color: var(--fg);">Faible activité (1-5)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; background: #86efac; border-radius: 4px; border: 1px solid var(--card-border);"></div>
            <span style="font-size: 0.9rem; color: var(--fg);">Activité modérée (6-12)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; background: #4ade80; border-radius: 4px; border: 1px solid var(--card-border);"></div>
            <span style="font-size: 0.9rem; color: var(--fg);">Activité modérée-élevée (13-20)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 32px; height: 32px; background: #16a34a; border-radius: 4px; border: 1px solid var(--card-border);"></div>
            <span style="font-size: 0.9rem; color: var(--fg);">Forte activité (21+)</span>
          </div>
        </div>
      </div>
      
      <!-- Explication -->
      <div class="card" style="padding: 16px; background: var(--card-hover);">
        <p style="font-size: 0.9rem; color: var(--muted); line-height: 1.6; margin: 0;">
          Cette heatmap représente l'intensité d'activité pédagogique (activités, rendus, consultations) 
          pour chaque classe sur les dernières semaines. Les données sont calculées à partir des interactions 
          des élèves avec les contenus assignés.
        </p>
      </div>
    </div>
  `;
  
  // Remplir le sélecteur de classes
  const classFilter = container.querySelector('#heatmap-class-filter');
  if (classFilter && currentData.classes) {
    currentData.classes.forEach(cls => {
      const option = document.createElement('option');
      option.value = cls.id;
      option.textContent = cls.name;
      classFilter.appendChild(option);
    });
    
    // Écouter les changements de filtre
    classFilter.addEventListener('change', (e) => {
      const classId = e.target.value || null;
      const filteredData = filterHeatmapData({ classId });
      renderHeatmap(container, filteredData);
    });
  }
  
  // Initialiser la heatmap
  setTimeout(() => {
    renderHeatmap(container, currentData);
  }, 100);
  
  // Écouter les changements d'établissement
  window.addEventListener('schoolChanged', () => {
    currentData = loadUsageHeatmapData();
    renderHeatmap(container, currentData);
  });
}

/**
 * Rend la heatmap sur le canvas
 * @param {HTMLElement} container - Conteneur
 * @param {object} data - Données { weeks, classes, activity }
 */
function renderHeatmap(container, data) {
  const canvas = container.querySelector('#usage-heatmap-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Dimensions
  const padding = { top: 60, right: 20, bottom: 40, left: 120 };
  const cellWidth = 50;
  const cellHeight = 40;
  const cellSpacing = 4;
  
  const numWeeks = data.weeks.length;
  const numClasses = data.classes.length;
  
  const totalWidth = padding.left + (numWeeks * (cellWidth + cellSpacing)) + padding.right;
  const totalHeight = padding.top + (numClasses * (cellHeight + cellSpacing)) + padding.bottom;
  
  // Ajuster la taille du canvas
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  canvas.style.width = `${totalWidth}px`;
  canvas.style.height = `${totalHeight}px`;
  
  // Fond blanc
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalWidth, totalHeight);
  
  // Dessiner les cellules
  data.classes.forEach((cls, classIdx) => {
    const y = padding.top + classIdx * (cellHeight + cellSpacing);
    
    // Label de la classe (axe Y)
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#1f2937';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(cls.name, padding.left - 10, y + cellHeight / 2);
    
    data.weeks.forEach((week, weekIdx) => {
      const x = padding.left + weekIdx * (cellWidth + cellSpacing);
      const activity = data.activity[cls.id]?.[week] || 0;
      const color = getActivityColor(activity);
      
      // Dessiner la cellule
      ctx.fillStyle = color;
      ctx.fillRect(x, y, cellWidth, cellHeight);
      
      // Bordure
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--card-border').trim() || '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellWidth, cellHeight);
      
      // Texte (nombre d'activités)
      ctx.fillStyle = activity > 12 ? '#ffffff' : '#1f2937';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(activity.toString(), x + cellWidth / 2, y + cellHeight / 2);
    });
  });
  
  // Labels des semaines (axe X)
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#1f2937';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  data.weeks.forEach((week, weekIdx) => {
    const x = padding.left + weekIdx * (cellWidth + cellSpacing) + cellWidth / 2;
    const y = padding.top + numClasses * (cellHeight + cellSpacing) + 10;
    ctx.fillText(`S${week}`, x, y);
  });
  
  // Titre de l'axe X
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#6b7280';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Semaines', totalWidth / 2, totalHeight - 10);
  
  // Ajouter les tooltips au survol
  setupTooltips(canvas, data, padding, cellWidth, cellHeight, cellSpacing);
}

/**
 * Configure les tooltips au survol
 */
function setupTooltips(canvas, data, padding, cellWidth, cellHeight, cellSpacing) {
  let tooltip = null;
  
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Trouver la cellule survolée
    const weekIdx = Math.floor((x - padding.left) / (cellWidth + cellSpacing));
    const classIdx = Math.floor((y - padding.top) / (cellHeight + cellSpacing));
    
    if (weekIdx >= 0 && weekIdx < data.weeks.length && 
        classIdx >= 0 && classIdx < data.classes.length) {
      const week = data.weeks[weekIdx];
      const cls = data.classes[classIdx];
      const stats = getCellStats(cls.id, week);
      
      // Créer ou mettre à jour le tooltip
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.style.cssText = `
          position: fixed;
          background: var(--card);
          border: 2px solid var(--card-border);
          border-radius: var(--radius-md);
          padding: 12px;
          font-size: 0.875rem;
          z-index: 10000;
          pointer-events: none;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        document.body.appendChild(tooltip);
      }
      
      tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 6px;">${escapeHtml(stats.className)} — Semaine ${week}</div>
        <div style="color: var(--muted);">Activités : <strong style="color: var(--fg);">${stats.activity}</strong></div>
        <div style="color: var(--muted);">Complétion moyenne : <strong style="color: var(--fg);">${stats.completion}%</strong></div>
      `;
      
      tooltip.style.left = `${e.clientX + 10}px`;
      tooltip.style.top = `${e.clientY + 10}px`;
      tooltip.style.display = 'block';
    } else {
      if (tooltip) {
        tooltip.style.display = 'none';
      }
    }
  });
  
  canvas.addEventListener('mouseleave', () => {
    if (tooltip) {
      tooltip.style.display = 'none';
    }
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
window.renderDirectorUsageHeatmapView = renderDirectorUsageHeatmapView;
export default { renderDirectorUsageHeatmapView };

