/**
 * View Workflow Versions - Gestion des versions de contenus (STUB)
 */

export function renderVersionsView(container) {
  console.log('[View Versions] Rendu de la gestion des versions (STUB)');
  
  container.innerHTML = `
    <div style="max-width: 900px; margin: 60px auto; padding: 0 16px;">
      <div class="card" style="text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 24px;">🔄</div>
        <h1 style="font-size: 2rem; margin-bottom: 16px;">
          Gestion des Versions
        </h1>
        <p style="color: var(--muted); font-size: 1.1rem; line-height: 1.6; margin-bottom: 24px;">
          Suivez et gérez les différentes versions de vos contenus.
        </p>
        <span class="badge" style="background: var(--warning); color: white; border: none;">
          🚧 En construction
        </span>
      </div>
    </div>
  `;
}

window.renderVersionsView = renderVersionsView;
export default { renderVersionsView };
