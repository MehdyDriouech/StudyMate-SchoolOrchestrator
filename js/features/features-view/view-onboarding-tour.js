/**
 * View Onboarding Tour - Visite guidée de l'application (STUB)
 */

export function renderOnboardingView(container) {
  console.log('[View Onboarding] Rendu de l\'onboarding (STUB)');
  
  container.innerHTML = `
    <div style="max-width: 900px; margin: 60px auto; padding: 0 16px;">
      <div class="card" style="text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 24px;">🎯</div>
        <h1 style="font-size: 2rem; margin-bottom: 16px;">
          Visite Guidée
        </h1>
        <p style="color: var(--muted); font-size: 1.1rem; line-height: 1.6; margin-bottom: 24px;">
          Découvrez toutes les fonctionnalités de StudyMate en quelques étapes.
        </p>
        <span class="badge" style="background: var(--warning); color: white; border: none;">
          🚧 En construction
        </span>
      </div>
    </div>
  `;
}

window.renderOnboardingView = renderOnboardingView;
export default { renderOnboardingView };
