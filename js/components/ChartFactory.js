/**
 * ChartFactory - Factory pour créer des graphiques Chart.js de manière simplifiée
 * Utilise Charts.js en interne mais avec une API plus simple
 */

import {
  createBarChart,
  createLineChart,
  getThemeColors,
  destroyChart
} from './Charts.js';

/**
 * Crée un graphique en barres
 * @param {HTMLCanvasElement} canvas - Élément canvas
 * @param {string[]} labels - Labels des barres
 * @param {number[]} data - Données des barres
 * @param {object} options - Options supplémentaires (label, color, etc.)
 * @returns {Chart} Instance Chart.js
 */
export function makeBarChart(canvas, labels, data, options = {}) {
  if (!canvas) {
    console.error('[ChartFactory] Canvas element not found');
    return null;
  }

  const colors = getThemeColors();
  const dataset = {
    label: options.label || 'Données',
    data,
    backgroundColor: options.color || colors.accent,
    borderColor: options.borderColor || colors.accent
  };

  return createBarChart(canvas, labels, [dataset], {
    horizontal: options.horizontal || false,
    ...options.chartOptions
  });
}

/**
 * Crée un graphique en ligne
 * @param {HTMLCanvasElement} canvas - Élément canvas
 * @param {string[]} labels - Labels des points
 * @param {number[]} data - Données des points
 * @param {object} options - Options supplémentaires
 * @returns {Chart} Instance Chart.js
 */
export function makeLineChart(canvas, labels, data, options = {}) {
  if (!canvas) {
    console.error('[ChartFactory] Canvas element not found');
    return null;
  }

  const colors = getThemeColors();
  const dataset = {
    label: options.label || 'Données',
    data,
    borderColor: options.color || colors.accent,
    backgroundColor: options.fillColor || `${colors.accent}33`,
    fill: options.fill !== false
  };

  return createLineChart(canvas, labels, [dataset], options.chartOptions);
}

/**
 * Crée un heatmap (simulé via bar chart groupé)
 * @param {HTMLCanvasElement} canvas - Élément canvas
 * @param {string[]} xLabels - Labels de l'axe X (temps de réponse)
 * @param {string[]} yLabels - Labels de l'axe Y (scores)
 * @param {Array} data - Données [{x, y, v}, ...]
 * @param {object} options - Options supplémentaires
 * @returns {Chart} Instance Chart.js
 */
export function makeHeatmapChart(canvas, xLabels, yLabels, data, options = {}) {
  if (!canvas) {
    console.error('[ChartFactory] Canvas element not found');
    return null;
  }

  const colors = getThemeColors();
  
  // Transformer les données en format bar chart groupé
  // Chaque score range devient une série de barres
  const datasets = yLabels.map((yLabel, yIdx) => {
    const values = xLabels.map(xLabel => {
      const item = data.find(d => d.x === xLabel && d.y === yLabel);
      return item ? item.v : 0;
    });

    // Couleur dégradée selon le score
    const colorIntensity = (yIdx / yLabels.length) * 0.8 + 0.2;
    const baseColor = colors.accent;
    
    return {
      label: yLabel,
      data: values,
      backgroundColor: `rgba(14, 165, 233, ${colorIntensity})`,
      borderColor: `rgba(14, 165, 233, ${Math.min(1, colorIntensity + 0.2)})`,
      borderWidth: 1
    };
  });

  return createBarChart(canvas, xLabels, datasets, {
    plugins: {
      legend: {
        display: true,
        position: 'right'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} élèves`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: false
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    },
    ...options.chartOptions
  });
}

/**
 * Détruit un graphique
 * @param {Chart} chart - Instance Chart.js à détruire
 */
export function destroyChartInstance(chart) {
  destroyChart(chart);
}

export default {
  makeBarChart,
  makeLineChart,
  makeHeatmapChart,
  destroyChartInstance
};

