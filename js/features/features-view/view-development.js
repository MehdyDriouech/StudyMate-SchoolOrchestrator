/**
 * View Développement - Roadmap produit
 */

import { getRoadmapColumns, suggestIdea } from '../features-control/feature-development.js';

let devContainer = null;
let devNotificationTimer = null;

export function renderDevelopmentView(container) {
  devContainer = container;
  renderDevelopmentContent();
}

function renderDevelopmentContent() {
  const columns = getRoadmapColumns();

  devContainer.innerHTML = `
    <div style="max-width:1200px; margin:24px auto; padding:0 16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div>
          <h1 style="margin:0;">🧭 Développement / Roadmap</h1>
          <p style="color:var(--muted); margin:4px 0 0;">Initiatives en cours, à venir et idées</p>
        </div>
        <span class="badge warning">🧪 En construction</span>
      </div>

      <div id="dev-notification" class="dev-notification" aria-live="polite"></div>

      <div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
        <button class="btn primary" id="btn-suggest-idea">Suggérer une idée</button>
      </div>

      <div class="dev-board">
        ${renderColumn('En cours', columns.in_progress)}
        ${renderColumn('À venir', columns.upcoming)}
        ${renderColumn('Idées', columns.ideas)}
      </div>
    </div>
    <style>
      .dev-board {
        display:grid;
        grid-template-columns: repeat(auto-fit,minmax(260px,1fr));
        gap:16px;
      }
      .dev-column {
        background: var(--card);
        border-radius: var(--radius-lg);
        border:1px solid var(--card-border);
        padding:16px;
      }
      .dev-card {
        background: var(--card-hover);
        border-radius: var(--radius-md);
        padding:12px;
        margin-bottom:12px;
      }
      .dev-notification {
        min-height:32px;
        border-radius: var(--radius-md);
        padding:8px 16px;
        background: rgba(14,165,233,0.15);
        color: var(--accent);
        font-weight:600;
        margin-bottom:12px;
        display:none;
      }
      .dev-notification.visible { display:block; }
    </style>
  `;

  const btn = document.getElementById('btn-suggest-idea');
  if (btn) btn.addEventListener('click', openIdeaModal);
}

function renderColumn(title, cards) {
  return `
    <div class="dev-column">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <strong>${title}</strong>
        <span class="badge ghost">${cards.length}</span>
      </div>
      <div>
        ${cards.map(card => `
          <div class="dev-card">
            <div style="font-weight:600;">${card.title}</div>
            <p style="color:var(--muted); font-size:0.9rem;">${card.description}</p>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
              <span>${card.owner}</span>
              <span>${card.eta}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function openIdeaModal() {
  const modal = document.createElement('div');
  modal.className = 'dev-modal';
  modal.innerHTML = `
    <div class="dev-modal__backdrop" data-close></div>
    <div class="card dev-modal__dialog">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="margin:0;">Suggérer une idée</h3>
        <button class="btn ghost" data-close>✕</button>
      </div>
      <form id="dev-idea-form" style="display:flex; flex-direction:column; gap:12px;">
        <label>
          <span style="font-weight:600;">Titre</span>
          <input type="text" name="title" required class="dev-input" placeholder="Ex: Module parents" />
        </label>
        <label>
          <span style="font-weight:600;">Description</span>
          <textarea name="description" rows="3" class="dev-input" placeholder="Expliquez votre idée..."></textarea>
        </label>
        <label>
          <span style="font-weight:600;">Équipe / contact</span>
          <input type="text" name="owner" class="dev-input" placeholder="Votre nom / équipe" />
        </label>
        <div style="display:flex; gap:12px; margin-top:8px;">
          <button type="submit" class="btn primary" style="flex:1;">Envoyer</button>
          <button type="button" class="btn ghost" data-close style="flex:1;">Annuler</button>
        </div>
      </form>
    </div>
    <style>
      .dev-modal {
        position: fixed;
        inset: 0;
        display:flex;
        align-items:center;
        justify-content:center;
        z-index: 1050;
      }
      .dev-modal__backdrop {
        position:absolute;
        inset:0;
        background:rgba(15,23,42,0.6);
        backdrop-filter:blur(4px);
      }
      .dev-modal__dialog {
        position:relative;
        width:calc(100% - 32px);
        max-width:480px;
        z-index:1;
      }
      .dev-input {
        width:100%;
        border:2px solid var(--card-border);
        border-radius:var(--radius-md);
        padding:10px 12px;
        background:var(--card);
        color:var(--fg);
      }
      .dev-input:focus {
        border-color:var(--accent);
        outline:none;
      }
    </style>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', event => {
    if (event.target.dataset.close !== undefined) {
      modal.remove();
    }
  });

  const form = modal.querySelector('#dev-idea-form');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    suggestIdea(data);
    modal.remove();
    renderDevelopmentContent();
    showDevNotification('💡 Idée ajoutée à la colonne "Idées"');
  });
}

function showDevNotification(message) {
  const banner = document.getElementById('dev-notification');
  if (!banner) return;
  banner.textContent = message;
  banner.classList.add('visible');
  clearTimeout(devNotificationTimer);
  devNotificationTimer = setTimeout(() => {
    banner.classList.remove('visible');
  }, 3000);
}

window.renderDevelopmentView = renderDevelopmentView;
export default { renderDevelopmentView };

