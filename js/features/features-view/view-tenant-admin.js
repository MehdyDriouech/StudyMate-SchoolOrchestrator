/**
 * View Tenant Admin - Administration multi-tenant (STUB)
 */

export function renderAdminView(container) {
  console.log('[View Admin] Rendu de l\'administration (STUB)');
  
  container.innerHTML = `
    <div style="max-width: 900px; margin: 60px auto; padding: 0 16px;">
      <div class="card" style="text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 24px;">⚙️</div>
        <h1 style="font-size: 2rem; margin-bottom: 16px;">
          Administration
        </h1>
        <p style="color: var(--muted); font-size: 1.1rem; line-height: 1.6; margin-bottom: 24px;">
          Gérez les paramètres de votre établissement et les utilisateurs.
        </p>
        <span class="badge" style="background: var(--warning); color: white; border: none;">
          🚧 En construction
        </span>
      </div>
    </div>
  `;
}

window.renderAdminView = renderAdminView;
export default { renderAdminView };
