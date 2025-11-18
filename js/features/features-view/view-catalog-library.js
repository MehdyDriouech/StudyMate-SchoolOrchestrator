/**
 * View Catalog Library - Bibliothèque de contenus pédagogiques (STUB)
 */

export function renderCatalogView(container) {
  console.log('[View Catalog] Rendu de la bibliothèque (STUB)');
  
  container.innerHTML = `
    <div style="max-width: 900px; margin: 60px auto; padding: 0 16px;">
      <div class="card" style="text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 24px;">🗂️</div>
        <h1 style="font-size: 2rem; margin-bottom: 16px;">
          Bibliothèque de Contenus
        </h1>
        <p style="color: var(--muted); font-size: 1.1rem; line-height: 1.6; margin-bottom: 24px;">
          Accédez à une bibliothèque complète de ressources pédagogiques partagées.
        </p>
        <div style="
          padding: 20px;
          background: var(--card-hover);
          border-radius: var(--radius-md);
          margin: 24px 0;
        ">
          <h3 style="margin-bottom: 12px;">Fonctionnalités prévues :</h3>
          <ul style="text-align: left; color: var(--muted); line-height: 1.8;">
            <li>Parcourir les contenus par matière et niveau</li>
            <li>Recherche avancée avec filtres</li>
            <li>Import de contenus dans vos cours</li>
            <li>Système de notation et commentaires</li>
          </ul>
        </div>
        <span class="badge" style="background: var(--warning); color: white; border: none;">
          🚧 En construction
        </span>
      </div>
    </div>
  `;
}

window.renderCatalogView = renderCatalogView;
export default { renderCatalogView };
