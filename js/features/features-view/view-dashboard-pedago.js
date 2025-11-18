/**
 * View Dashboard Pedago - Vue synthétique pour le directeur pédagogique
 */

import {
  getCurriculumCoverage,
  getQualityWorkflowSummary,
  getThemeDetails,
  changeThemeStatus,
  getAiThemesSummary
} from '../features-control/feature-dashboard-pedago.js';

let pedagoContainer = null;

export async function renderDashboardPedagoView(container) {
  pedagoContainer = container;
  container.innerHTML = renderLoadingState();

  try {
    const [coverage, workflow, aiThemes] = await Promise.all([
      getCurriculumCoverage(),
      Promise.resolve(getQualityWorkflowSummary()),
      Promise.resolve(getAiThemesSummary())
    ]);

    container.innerHTML = getBaseLayout();
    renderCurriculumSection(coverage);
    renderWorkflowSection(workflow);
    renderAiThemeSection(aiThemes);
    setupModalEvents();
  } catch (error) {
    console.error('[Dashboard Pedago] Erreur de chargement', error);
    container.innerHTML = renderErrorState(error);
  }
}

function renderLoadingState() {
  return `
    <div class="card" style="max-width: 600px; margin: 80px auto; text-align: center;">
      <div style="font-size: 2.5rem; animation: pulse 1.5s infinite;">⏳</div>
      <p style="color: var(--muted); margin-top: 12px;">Chargement du dashboard pédagogique...</p>
    </div>
  `;
}

function renderErrorState(error) {
  return `
    <div class="card" style="max-width: 600px; margin: 80px auto; text-align: center;">
      <div style="font-size: 2.5rem;">❌</div>
      <h2>Impossible de charger le dashboard</h2>
      <p style="color: var(--danger); margin-top: 12px;">${error.message}</p>
      <button class="btn primary" onclick="location.reload()">Réessayer</button>
    </div>
  `;
}

function getBaseLayout() {
  return `
    <div style="max-width: 1400px; margin: 0 auto; padding: 24px 16px;">
      <div style="margin-bottom: 24px;">
        <h1 style="font-size: 2rem; font-weight: 700; display: flex; align-items: center; gap: 12px;">
          🧭 Dashboard Directeur pédagogique
        </h1>
        <p style="color: var(--muted);">Surveillez la complétion du curriculum, la qualité des contenus et l’usage de l’AI Theme Studio.</p>
      </div>

      <section id="pedago-curriculum"></section>
      <section id="pedago-workflow" style="margin-top: 24px;"></section>
      <section id="pedago-ai-themes" style="margin-top: 24px;"></section>
    </div>

    <div id="pedago-theme-modal" class="pedago-modal hidden">
      <div class="pedago-modal__backdrop"></div>
      <div class="pedago-modal__dialog">
        <div class="pedago-modal__header">
          <h3 id="pedago-modal-title">Détails du thème</h3>
          <button class="btn ghost" id="pedago-modal-close" aria-label="Fermer la modale">✖️</button>
        </div>
        <div id="pedago-modal-body"></div>
      </div>
    </div>

    <style>
      .pedago-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      .pedago-stat-card {
        border: 1px solid rgba(148,163,184,0.3);
        border-radius: var(--radius-md);
        padding: 16px;
        background: var(--card);
      }
      .pedago-heatmap table {
        width: 100%;
        border-collapse: collapse;
      }
      .pedago-heatmap th, .pedago-heatmap td {
        border: 1px solid rgba(148,163,184,0.3);
        padding: 8px;
        text-align: center;
        font-size: 0.9rem;
      }
      .pedago-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
      }
      .pedago-modal {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .pedago-modal.hidden {
        pointer-events: none;
        opacity: 0;
      }
      .pedago-modal__backdrop {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
      }
      .pedago-modal__dialog {
        position: relative;
        background: var(--card);
        border-radius: var(--radius-lg);
        padding: 24px;
        max-width: 520px;
        width: calc(100% - 32px);
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: var(--shadow-lg);
      }
      .pedago-modal__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .pedago-timeline {
        border-left: 2px solid rgba(148,163,184,0.4);
        padding-left: 16px;
        margin: 12px 0;
      }
      .pedago-timeline__item {
        margin-bottom: 12px;
      }
    </style>
  `;
}

function renderCurriculumSection(coverage) {
  const container = pedagoContainer.querySelector('#pedago-curriculum');
  if (!container) return;

  const { totals, periods, subjects, heatmap } = coverage;
  container.innerHTML = `
    <div class="card">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap: wrap;">
        <div>
          <h2>Couverture du curriculum</h2>
          <p style="color: var(--muted); margin: 6px 0;">Progression par période et par matière</p>
        </div>
        <span style="font-size: 0.85rem; color: var(--muted);">Mise à jour ${formatDate(coverage.lastUpdated)}</span>
      </div>

      <div class="pedago-stats-grid" style="margin: 16px 0;">
        ${renderStatCard('Progression globale', `${totals.completionRate}%`, '📈')}
        ${renderStatCard('Séquences complétées', `${totals.completedSequences}/${totals.totalSequences}`, '✅')}
        ${renderStatCard('Périodes en retard', totals.delayedPeriods, totals.delayedPeriods > 0 ? '⚠️' : '🟢')}
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
        <div>
          <h3 style="margin-bottom: 8px;">Périodes</h3>
          ${periods.map(period => `
            <div style="border: 1px solid rgba(148,163,184,0.3); padding: 10px 12px; border-radius: var(--radius-md); margin-bottom: 8px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${period.name}</strong>
                <span style="font-size: 0.9rem; color: ${period.delayed ? 'var(--warning)' : 'var(--muted)'};">
                  ${period.progress}% ${period.delayed ? '• retard' : ''}
                </span>
              </div>
              <div style="height: 6px; border-radius: 999px; background: rgba(148,163,184,0.2); margin: 8px 0;">
                <div style="
                  width: ${period.progress}%;
                  height: 100%;
                  border-radius: 999px;
                  background: linear-gradient(90deg, #0ea5e9, #22d3ee);
                "></div>
              </div>
              <small style="color: var(--muted);">
                ${period.completed} complétées • ${period.inProgress} en cours
              </small>
            </div>
          `).join('')}
        </div>
        <div class="pedago-heatmap">
          <h3 style="margin-bottom: 8px;">Période × Matière</h3>
          <table>
            <thead>
              <tr>
                <th>Période</th>
                ${subjects.map(subject => `<th>${subject.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${heatmap.map(row => `
                <tr>
                  <td style="text-align:left;">${row.periodLabel}</td>
                  ${row.cells.map(cell => `
                    <td style="${heatmapCellStyle(cell.value, subjects.find(s => s.id === cell.subjectId)?.color)}">
                      ${cell.value}
                    </td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderWorkflowSection(workflow) {
  const container = pedagoContainer.querySelector('#pedago-workflow');
  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap: wrap;">
        <div>
          <h2>Workflow qualité</h2>
          <p style="color: var(--muted); margin: 6px 0;">Suivi des thèmes en validation</p>
        </div>
        <span style="font-size: 0.85rem; color: var(--muted);">Mise à jour ${formatDate(workflow.lastUpdated)}</span>
      </div>

      <div class="pedago-stats-grid" style="margin: 16px 0;">
        ${renderStatCard('À valider', workflow.stats.pending_review || 0, '🕒', 'var(--warning)')}
        ${renderStatCard('Brouillons', workflow.stats.draft || 0, '✍️')}
        ${renderStatCard('Validés', workflow.stats.approved || 0, '✅', 'var(--success, #16a34a)')}
        ${renderStatCard('Publiés', workflow.stats.published || 0, '🚀', 'var(--accent)')}
      </div>

      <div style="overflow-x: auto;">
        <table class="table" style="width:100%; min-width: 640px;">
          <thead>
            <tr>
              <th>Thème</th>
              <th>Matière</th>
              <th>Auteur</th>
              <th>Statut</th>
              <th>Dernière action</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${workflow.themes.map(theme => `
              <tr>
                <td><strong>${theme.title}</strong></td>
                <td>${theme.subject}</td>
                <td>${theme.author}</td>
                <td>${renderStatusBadge(theme.status)}</td>
                <td>${formatRelative(theme.lastAction)}</td>
                <td style="text-align:right;">
                  <button class="btn ghost" data-theme-details="${theme.id}">Détails</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  bindWorkflowButtons();
}

function renderAiThemeSection(aiThemes) {
  const container = pedagoContainer.querySelector('#pedago-ai-themes');
  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap: wrap;">
        <div>
          <h2>Suivi AI Theme Studio</h2>
          <p style="color: var(--muted); margin: 6px 0;">Thèmes en préparation et validés via AI Theme Studio</p>
        </div>
      </div>

      <div id="pedago-ai-theme-notice" style="min-height: 20px; color: var(--muted); font-size: 0.9rem;"></div>

      <div style="overflow-x:auto; margin-top: 12px;">
        <table class="table" style="width:100%; min-width: 640px;">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Créateur</th>
              <th>Statut</th>
              <th>Classes</th>
              <th>MAJ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${aiThemes.map(theme => `
              <tr>
                <td><strong>${theme.title}</strong></td>
                <td>${theme.creator}</td>
                <td>${renderStatusBadge(theme.status)}</td>
                <td>${(theme.classes || []).join(', ') || '—'}</td>
                <td>${formatRelative(theme.updatedAt)}</td>
                <td style="text-align:right;">
                  <button class="btn primary" data-open-ai-theme="${theme.id}">
                    Ouvrir dans AI Theme Studio
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  bindAiThemeButtons();
}

function renderStatCard(label, value, emoji, accentColor) {
  return `
    <div class="pedago-stat-card">
      <div style="font-size: 1.5rem;">${emoji}</div>
      <div style="font-size: 1.75rem; font-weight: 700; color: ${accentColor || 'var(--fg)'};">${value}</div>
      <div style="color: var(--muted); font-size: 0.9rem;">${label}</div>
    </div>
  `;
}

function renderStatusBadge(status) {
  const map = {
    draft: { label: 'Brouillon', color: 'rgba(148,163,184,0.2)', text: '#475569' },
    pending_review: { label: 'À valider', color: 'rgba(245,158,11,0.2)', text: '#b45309' },
    approved: { label: 'Validé', color: 'rgba(16,185,129,0.15)', text: '#0f766e' },
    published: { label: 'Publié', color: 'rgba(14,165,233,0.2)', text: '#0369a1' }
  };
  const info = map[status] || { label: status, color: 'rgba(148,163,184,0.2)', text: '#475569' };
  return `<span class="pedago-status-badge" style="background:${info.color}; color:${info.text};">${info.label}</span>`;
}

function heatmapCellStyle(value, color = '#0ea5e9') {
  const intensity = Math.min(1, value / 3);
  return `
    background: ${hexToRgba(color, 0.1 + intensity * 0.3)};
  `;
}

function hexToRgba(hex, alpha) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function bindWorkflowButtons() {
  pedagoContainer.querySelectorAll('[data-theme-details]').forEach(btn => {
    btn.addEventListener('click', () => {
      openThemeModal(btn.dataset.themeDetails);
    });
  });
}

function bindAiThemeButtons() {
  pedagoContainer.querySelectorAll('[data-open-ai-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      const notice = document.getElementById('pedago-ai-theme-notice');
      if (notice) {
        notice.style.color = 'var(--accent)';
        notice.textContent = 'Ouverture du AI Theme Studio… (chargement du thème à venir)';
      }
      setTimeout(() => {
        window.location.hash = 'ai-theme-studio';
      }, 500);
    });
  });
}

function setupModalEvents() {
  const modal = document.getElementById('pedago-theme-modal');
  const closeBtn = document.getElementById('pedago-modal-close');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeThemeModal());
  }

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target.classList.contains('pedago-modal__backdrop')) {
        closeThemeModal();
      }
    });
  }
}

function openThemeModal(themeId) {
  const modal = document.getElementById('pedago-theme-modal');
  const body = document.getElementById('pedago-modal-body');
  const titleEl = document.getElementById('pedago-modal-title');
  if (!modal || !body) return;

  const theme = getThemeDetails(themeId);
  if (!theme) return;

  titleEl.textContent = theme.title;
  body.innerHTML = `
    <p style="color: var(--muted); margin-bottom: 8px;">${theme.subject} • ${theme.author}</p>
    <div style="margin-bottom: 12px;">
      ${renderStatusBadge(theme.status)}
    </div>
    <div style="display:flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
      ${renderStatusActionButton(themeId, 'pending_review', '🕒 Mettre en attente')}
      ${renderStatusActionButton(themeId, 'approved', '✅ Valider')}
      ${renderStatusActionButton(themeId, 'published', '🚀 Publier')}
      ${renderStatusActionButton(themeId, 'draft', '↩️ Rebasculer brouillon')}
    </div>
    <div>
      <h4>Historique</h4>
      <div class="pedago-timeline">
        ${(theme.timeline || []).map(item => `
          <div class="pedago-timeline__item">
            <strong>${formatDate(item.at)}</strong>
            <div style="color: var(--muted); font-size: 0.9rem;">${item.label}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  modal.classList.remove('hidden');

  body.querySelectorAll('[data-theme-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      const status = btn.dataset.themeStatus;
      changeThemeStatus(themeId, status);
      renderWorkflowSection(getQualityWorkflowSummary());
      openThemeModal(themeId);
    });
  });
}

function renderStatusActionButton(themeId, status, label) {
  return `
    <button class="btn ghost" data-theme-status="${status}" data-theme-id="${themeId}">
      ${label}
    </button>
  `;
}

function closeThemeModal() {
  const modal = document.getElementById('pedago-theme-modal');
  if (!modal) return;
  modal.classList.add('hidden');
}

function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatRelative(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short'
  });
}

window.renderDashboardPedagoView = renderDashboardPedagoView;
export default { renderDashboardPedagoView };


