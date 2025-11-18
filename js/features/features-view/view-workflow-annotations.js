/**
 * View Workflow Annotations - Système d'annotations collaboratives (STUB)
 */

export function renderAnnotationsView(container) {
  console.log('[View Annotations] Rendu des annotations (STUB)');
  
  container.innerHTML = `
    <div style="max-width: 900px; margin: 60px auto; padding: 0 16px;">
      <div class="card" style="text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 24px;">💬</div>
        <h1 style="font-size: 2rem; margin-bottom: 16px;">
          Annotations Collaboratives
        </h1>
        <p style="color: var(--muted); font-size: 1.1rem; line-height: 1.6; margin-bottom: 24px;">
          Annotez et commentez les contenus de manière collaborative.
        </p>
        <span class="badge" style="background: var(--warning); color: white; border: none;">
          🚧 En construction
        </span>
      </div>
    </div>
  `;
}

window.renderAnnotationsView = renderAnnotationsView;
export default { renderAnnotationsView };
