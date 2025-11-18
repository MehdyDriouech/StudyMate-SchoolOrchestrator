/**
 * Charts.js - Utilitaires pour créer des graphiques avec Chart.js
 * 
 * Ce module fournit des fonctions helper pour créer des graphiques
 * cohérents avec le design d'ErgoMate.
 */

/**
 * Configuration par défaut pour tous les graphiques
 */
const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        font: {
          family: "'Inter', sans-serif",
          size: 12,
          weight: 500
        },
        padding: 15,
        usePointStyle: true,
        color: getComputedStyle(document.documentElement).getPropertyValue('--fg').trim()
      }
    },
    tooltip: {
      enabled: true,
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card').trim(),
      titleColor: getComputedStyle(document.documentElement).getPropertyValue('--fg').trim(),
      bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--fg').trim(),
      borderColor: getComputedStyle(document.documentElement).getPropertyValue('--card-border').trim(),
      borderWidth: 2,
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        family: "'Inter', sans-serif",
        size: 13,
        weight: 600
      },
      bodyFont: {
        family: "'Inter', sans-serif",
        size: 12,
        weight: 400
      },
      displayColors: true,
      boxPadding: 6
    }
  }
};

/**
 * Récupère les couleurs du thème ErgoMate
 */
export function getThemeColors() {
  const root = getComputedStyle(document.documentElement);
  return {
    accent: root.getPropertyValue('--accent').trim() || '#22c55e',
    accentLight: root.getPropertyValue('--accent-light').trim() || '#86efac',
    danger: root.getPropertyValue('--danger').trim() || '#ef4444',
    dangerLight: root.getPropertyValue('--danger-light').trim() || '#fca5a5',
    warning: root.getPropertyValue('--warning').trim() || '#f59e0b',
    info: root.getPropertyValue('--info').trim() || '#3b82f6',
    muted: root.getPropertyValue('--muted').trim() || '#64748b',
    fg: root.getPropertyValue('--fg').trim() || '#0f172a',
    cardBorder: root.getPropertyValue('--card-border').trim() || '#e2e8f0'
  };
}

/**
 * Crée un graphique en barres (bar chart)
 * @param {HTMLCanvasElement} canvas - Élément canvas
 * @param {string[]} labels - Labels des barres
 * @param {Object} datasets - Datasets avec { label, data, backgroundColor?, borderColor? }[]
 * @param {Object} options - Options Chart.js supplémentaires
 * @returns {Chart} Instance Chart.js
 */
export function createBarChart(canvas, labels, datasets, options = {}) {
  if (!canvas) {
    console.error('[Charts] Canvas element not found');
    return null;
  }

  const colors = getThemeColors();
  const ctx = canvas.getContext('2d');

  // Appliquer les couleurs par défaut si non spécifiées
  const processedDatasets = datasets.map((dataset, index) => {
    const colorPalette = [colors.accent, colors.info, colors.warning, colors.danger];
    const defaultColor = colorPalette[index % colorPalette.length];
    
    return {
      ...dataset,
      backgroundColor: dataset.backgroundColor || defaultColor,
      borderColor: dataset.borderColor || defaultColor,
      borderWidth: 2,
      borderRadius: 6,
      barThickness: options.horizontal ? 24 : undefined
    };
  });

  const chartConfig = {
    type: 'bar',
    data: {
      labels,
      datasets: processedDatasets
    },
    options: {
      ...defaultChartOptions,
      indexAxis: options.horizontal ? 'y' : 'x',
      scales: {
        x: {
          grid: {
            color: colors.cardBorder,
            drawBorder: false,
            tickLength: 0
          },
          ticks: {
            font: {
              family: "'Inter', sans-serif",
              size: 11
            },
            color: colors.muted,
            padding: 8
          }
        },
        y: {
          grid: {
            color: colors.cardBorder,
            drawBorder: false,
            tickLength: 0
          },
          ticks: {
            font: {
              family: "'Inter', sans-serif",
              size: 11
            },
            color: colors.muted,
            padding: 8
          }
        }
      },
      ...options
    }
  };

  return new Chart(ctx, chartConfig);
}

/**
 * Crée un graphique en ligne (line chart)
 * @param {HTMLCanvasElement} canvas - Élément canvas
 * @param {string[]} labels - Labels des points
 * @param {Object} datasets - Datasets avec { label, data, borderColor?, backgroundColor? }[]
 * @param {Object} options - Options Chart.js supplémentaires
 * @returns {Chart} Instance Chart.js
 */
export function createLineChart(canvas, labels, datasets, options = {}) {
  if (!canvas) {
    console.error('[Charts] Canvas element not found');
    return null;
  }

  const colors = getThemeColors();
  const ctx = canvas.getContext('2d');

  // Appliquer les couleurs par défaut si non spécifiées
  const processedDatasets = datasets.map((dataset, index) => {
    const colorPalette = [colors.accent, colors.info, colors.warning, colors.danger];
    const defaultColor = colorPalette[index % colorPalette.length];
    
    return {
      ...dataset,
      borderColor: dataset.borderColor || defaultColor,
      backgroundColor: dataset.backgroundColor || `${defaultColor}33`, // 20% opacity
      fill: dataset.fill !== undefined ? dataset.fill : true,
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: defaultColor,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2
    };
  });

  const chartConfig = {
    type: 'line',
    data: {
      labels,
      datasets: processedDatasets
    },
    options: {
      ...defaultChartOptions,
      scales: {
        x: {
          grid: {
            color: colors.cardBorder,
            drawBorder: false,
            tickLength: 0
          },
          ticks: {
            font: {
              family: "'Inter', sans-serif",
              size: 11
            },
            color: colors.muted,
            padding: 8
          }
        },
        y: {
          grid: {
            color: colors.cardBorder,
            drawBorder: false,
            tickLength: 0
          },
          ticks: {
            font: {
              family: "'Inter', sans-serif",
              size: 11
            },
            color: colors.muted,
            padding: 8
          }
        }
      },
      ...options
    }
  };

  return new Chart(ctx, chartConfig);
}

/**
 * Crée un graphique en donut (donut chart)
 * @param {HTMLCanvasElement} canvas - Élément canvas
 * @param {string[]} labels - Labels des segments
 * @param {number[]} data - Données des segments
 * @param {Object} options - Options Chart.js supplémentaires
 * @returns {Chart} Instance Chart.js
 */
export function createDonutChart(canvas, labels, data, options = {}) {
  if (!canvas) {
    console.error('[Charts] Canvas element not found');
    return null;
  }

  const colors = getThemeColors();
  const ctx = canvas.getContext('2d');

  // Palette de couleurs pour le donut
  const colorPalette = options.colors || [
    colors.accent,
    colors.info,
    colors.warning,
    colors.danger,
    colors.muted
  ];

  const chartConfig = {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colorPalette.slice(0, data.length),
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--card').trim(),
        borderWidth: 3,
        hoverOffset: 8
      }]
    },
    options: {
      ...defaultChartOptions,
      cutout: '65%',
      plugins: {
        ...defaultChartOptions.plugins,
        legend: {
          ...defaultChartOptions.plugins.legend,
          position: 'bottom'
        },
        tooltip: {
          ...defaultChartOptions.plugins.tooltip,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      ...options
    }
  };

  return new Chart(ctx, chartConfig);
}

/**
 * Détruit un graphique existant de manière sûre
 * @param {Chart} chartInstance - Instance Chart.js à détruire
 */
export function destroyChart(chartInstance) {
  if (chartInstance && typeof chartInstance.destroy === 'function') {
    chartInstance.destroy();
  }
}

/**
 * Crée un graphique en barres horizontal pour le taux de complétion
 * Helper spécifique pour les dashboards
 */
export function createCompletionBarChart(canvas, subjects) {
  const labels = subjects.map(s => s.name);
  const data = subjects.map(s => s.avgCompletion || s.completionRate);
  
  const colors = getThemeColors();
  
  // Couleur conditionnelle selon le taux
  const backgroundColors = data.map(value => {
    if (value >= 80) return colors.accent;
    if (value >= 60) return colors.info;
    if (value >= 40) return colors.warning;
    return colors.danger;
  });

  return createBarChart(
    canvas,
    labels,
    [{
      label: 'Taux de complétion (%)',
      data,
      backgroundColor: backgroundColors,
      borderColor: backgroundColors
    }],
    {
      horizontal: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Complétion: ${context.parsed.x.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        x: {
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
  );
}

export default {
  createBarChart,
  createLineChart,
  createDonutChart,
  destroyChart,
  createCompletionBarChart,
  getThemeColors
};
