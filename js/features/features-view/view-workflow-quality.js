/**
 * View Workflow Quality - Contrôle qualité des contenus (STUB)
 */

export function renderQualityView(container) {
  console.log('[View Quality] Rendu du contrôle qualité (STUB)');
  
  container.innerHTML = `
    <div style="max-width: 900px; margin: 60px auto; padding: 0 16px;">
      <div class="card" style="text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 24px;">✅</div>
        <h1 style="font-size: 2rem; margin-bottom: 16px;">
          Contrôle Qualité
        </h1>
        <p style="color: var(--muted); font-size: 1.1rem; line-height: 1.6; margin-bottom: 24px;">
          Système de validation et contrôle qualité des contenus pédagogiques.
        </p>
        <div style="
          padding: 20px;
          background: var(--card-hover);
          border-radius: var(--radius-md);
          margin: 24px 0;
        ">
          <h3 style="margin-bottom: 12px;">Fonctionnalités prévues :</h3>
          <ul style="text-align: left; color: var(--muted); line-height: 1.8;">
            <li>Workflow de validation multi-niveaux</li>
            <li>Checklist de contrôle qualité</li>
            <li>Historique des validations</li>
            <li>Tableau de bord des contenus en attente</li>
          </ul>
        </div>
        <span class="badge" style="background: var(--warning); color: white; border: none;">
          🚧 En construction
        </span>
      </div>
    </div>
  `;
}

window.renderQualityView = renderQualityView;
export default { renderQualityView };
