/**
 * View Qualité - Workflow de contenus
 */

import {
  getQualityThemes,
  getQualityStats,
  getThemeById,
  updateThemeStatus
} from '../features-control/feature-quality.js';

import { getUserRole } from '../features-control/feature-auth.js';

let qualityContainer = null;
let qualityModal = null;
let qualityNotificationTimer = null;

export function renderQualityView(container) {
  qualityContainer = container;
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 32px auto; padding: 0 16px; text-align:center;">
      <div style="font-size:3rem; margin-bottom:12px; animation:pulse 1.5s infinite;">✅</div>
      <p style="color:var(--muted);">Chargement du workflow qualité...</p>
    </div>
    <style>
      @keyframes pulse {
        0%,100% { opacity:1; transform:scale(1); }
        50% { opacity:.5; transform:scale(1.05); }
      }
    </style>
  `;

  setTimeout(() => {
    renderQualityContent();
  }, 150);
}

function renderQualityContent() {
  const themes = getQualityThemes();
  const stats = getQualityStats();
  const role = getUserRole();
  const isReadOnly = role === 'teacher';

  qualityContainer.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
        <div>
          <h1 style="font-size:2rem; margin:0;">🛡️ Qualité des contenus</h1>
          <p style="color:var(--muted); margin:4px 0 0;">Pilotez le pipeline de validation</p>
        </div>
        ${isReadOnly ? '<span class="badge ghost">Lecture seule (enseignant)</span>' : '<span class="badge success">Contrôle actif</span>'}
      </div>

      <div id="quality-notification" class="quality-notification" aria-live="polite"></div>

      <div class="quality-stats-grid">
        ${renderStatusCard('✍️ Brouillons', stats.draft, 'draft')}
        ${renderStatusCard('🕒 À valider', stats.pending_review, 'pending_review')}
        ${renderStatusCard('✅ Validés', stats.approved, 'approved')}
        ${renderStatusCard('🚀 Publiés', stats.published, 'published')}
      </div>

      <div class="card" style="margin-top:24px;">
        <h2 style="margin-top:0;">Thèmes en cours</h2>
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
            <thead>
              <tr style="border-bottom:2px solid var(--card-border);">
                <th style="padding:10px; text-align:left;">Titre</th>
                <th style="padding:10px;">Matière</th>
                <th style="padding:10px;">Auteur</th>
                <th style="padding:10px;">Statut</th>
                <th style="padding:10px;">Dernière MAJ</th>
                <th style="padding:10px;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${themes.map(theme => `
                <tr style="border-bottom:1px solid var(--card-border);">
                  <td style="padding:10px; font-weight:600;">${theme.title}</td>
                  <td style="padding:10px; text-align:center;">${theme.subject}</td>
                  <td style="padding:10px; text-align:center;">${theme.author}</td>
                  <td style="padding:10px; text-align:center;">${renderStatusBadge(theme.status)}</td>
                  <td style="padding:10px; text-align:center; color:var(--muted);">${formatDate(theme.updatedAt)}</td>
                  <td style="padding:10px; text-align:center;">
                    <button class="btn ${isReadOnly ? 'ghost' : 'primary'}" data-review-theme="${theme.id}">
                      Revoir
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <style>
      .quality-stats-grid {
        display:grid;
        grid-template-columns: repeat(auto-fit,minmax(200px,1fr));
        gap:16px;
        margin-top:20px;
      }
      .quality-notification {
        min-height: 32px;
        margin-top: 16px;
        border-radius: var(--radius-md);
        padding: 8px 16px;
        background: rgba(16,185,129,0.15);
        color: var(--success, #16a34a);
        font-weight:600;
        display:none;
      }
      .quality-notification.visible {
        display:block;
      }
    </style>
  `;

  document.querySelectorAll('[data-review-theme]').forEach(btn => {
    btn.addEventListener('click', () => openQualityModal(btn.dataset.reviewTheme));
  });
}

function renderStatusCard(label, value, status) {
  const colors = {
    draft: 'rgba(148,163,184,0.2)',
    pending_review: 'rgba(245,158,11,0.2)',
    approved: 'rgba(16,185,129,0.2)',
    published: 'rgba(14,165,233,0.2)'
  };
  return `
    <div class="card" style="background:${colors[status]};">
      <div style="font-size:2rem; font-weight:700;">${value}</div>
      <div style="font-size:0.9rem; color:var(--muted);">${label}</div>
    </div>
  `;
}

function renderStatusBadge(status) {
  const meta = {
    draft: { label: 'Brouillon', color: 'var(--muted)' },
    pending_review: { label: 'À valider', color: 'var(--warning)' },
    approved: { label: 'Validé', color: 'var(--success, #16a34a)' },
    published: { label: 'Publié', color: 'var(--accent)' }
  };
  const info = meta[status] || meta.draft;
  return `<span class="badge" style="background:${info.color}; color:white; border:none;">${info.label}</span>`;
}

function openQualityModal(themeId) {
  const theme = getThemeById(themeId);
  if (!theme) return;
  const role = getUserRole();
  const isReadOnly = role === 'teacher';

  qualityModal?.remove();
  qualityModal = document.createElement('div');
  qualityModal.className = 'quality-modal';
  qualityModal.innerHTML = `
    <div class="quality-modal__backdrop" data-close></div>
    <div class="card quality-modal__dialog">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div>
          <h3 style="margin:0;">${theme.title}</h3>
          <small style="color:var(--muted);">${theme.subject} • ${theme.author}</small>
        </div>
        <button class="btn ghost" data-close>✕</button>
      </div>
      <div style="margin-bottom:12px;">
        <strong>Statut actuel :</strong> ${renderStatusBadge(theme.status)}
        ${theme.origin === 'ai_theme_studio' ? '<span class="badge" style="background:var(--accent); color:white; margin-left:8px; font-size:0.75rem;">Généré via IA</span>' : ''}
      </div>
      ${theme.classes && theme.classes.length > 0 ? `
        <div style="margin-bottom:12px;">
          <strong>Classes cibles :</strong>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">
            ${theme.classes.map(c => `<span class="badge ghost" style="font-size:0.8rem;">${c.label || c}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      <div style="margin-bottom:16px; background:var(--card-hover); padding:12px; border-radius:var(--radius-md);">
        <strong>Aperçu :</strong>
        <p style="margin:8px 0 0;">${theme.preview || theme.description || 'Aucun aperçu disponible'}</p>
        ${theme.origin === 'ai_theme_studio' && theme.quiz ? `
          <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(148,163,184,0.3);">
            <strong style="font-size:0.9rem;">Contenus générés :</strong>
            <ul style="margin:4px 0 0; padding-left:20px; font-size:0.85rem; color:var(--muted);">
              ${theme.quiz && theme.quiz.length > 0 ? `<li>${theme.quiz.length} question(s) de quiz</li>` : ''}
              ${theme.flashcards && theme.flashcards.length > 0 ? `<li>${theme.flashcards.length} flashcard(s)</li>` : ''}
              ${theme.revision_sheet ? `<li>Fiche de révision</li>` : ''}
            </ul>
          </div>
        ` : ''}
      </div>
      <div>
        <strong>Timeline</strong>
        <div class="quality-timeline">
          ${theme.timeline.map(item => `
            <div class="quality-timeline__item">
              <div style="font-weight:600;">${formatDate(item.at)}</div>
              <div style="color:var(--muted);">${item.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ${isReadOnly ? `
        <p style="color:var(--muted); font-size:0.9rem; margin-top:12px;">
          Vous êtes en lecture seule. Contactez la direction pour valider.
        </p>
      ` : `
        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:16px;">
          <button class="btn success" data-action="approved" data-theme="${theme.id}">✅ Valider</button>
          <button class="btn warning" data-action="needs_revision" data-theme="${theme.id}">✏️ Demander correction</button>
          <button class="btn danger" data-action="rejected" data-theme="${theme.id}">❌ Rejeter</button>
        </div>
      `}
    </div>
    <style>
      .quality-modal {
        position: fixed;
        inset: 0;
        display:flex;
        align-items:center;
        justify-content:center;
        z-index: 1100;
      }
      .quality-modal__backdrop {
        position:absolute;
        inset:0;
        background:rgba(15,23,42,0.6);
        backdrop-filter:blur(4px);
      }
      .quality-modal__dialog {
        position:relative;
        width:calc(100% - 32px);
        max-width:520px;
        max-height:90vh;
        overflow-y:auto;
        z-index:1;
      }
      .quality-timeline {
        border-left:2px solid rgba(148,163,184,0.4);
        margin-top:8px;
        padding-left:12px;
      }
      .quality-timeline__item {
        margin-bottom:10px;
      }
    </style>
  `;

  document.body.appendChild(qualityModal);

  qualityModal.addEventListener('click', event => {
    if (event.target.dataset.close !== undefined) {
      closeQualityModal();
    }
    if (event.target.dataset.action) {
      const status = event.target.dataset.action;
      const id = event.target.dataset.theme;
      updateThemeStatus(id, status);
      showQualityNotification('✅ Statut mis à jour');
      closeQualityModal();
      renderQualityContent();
    }
  });
}

function closeQualityModal() {
  qualityModal?.remove();
  qualityModal = null;
}

function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function showQualityNotification(message) {
  const banner = document.getElementById('quality-notification');
  if (!banner) return;
  banner.textContent = message;
  banner.classList.add('visible');
  clearTimeout(qualityNotificationTimer);
  qualityNotificationTimer = setTimeout(() => {
    banner.classList.remove('visible');
  }, 3200);
}

window.renderQualityView = renderQualityView;
export default { renderQualityView };

