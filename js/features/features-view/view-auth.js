/**
 * View Auth - Écran d'authentification multi-personas
 */

import CONFIG from '../../config.js';
import { handleDemoLogin, handleLogin, getDashboardRoute } from '../features-control/feature-auth.js';
import { initTopNav } from '../../components/TopNav.js';
import { navigateTo } from '../../app.js';

/**
 * Rend la vue d'authentification
 * @param {HTMLElement} container - Conteneur de la vue
 */
export function renderAuthView(container) {
  console.log('[View Auth] Rendu de la vue d\'authentification');
  
  container.innerHTML = `
    <div style="max-width: 500px; margin: 60px auto; padding: 0 16px;">
      <!-- Logo et titre -->
      <div style="text-align: center; margin-bottom: 48px;">
        <div style="font-size: 4rem; margin-bottom: 16px;">🎓</div>
        <h1 style="
          font-size: 2rem;
          font-weight: 700;
          background: var(--btn-bg);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        ">
          ${CONFIG.APP_NAME}
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Plateforme de gestion pédagogique
        </p>
      </div>
      
      <!-- Identifiants de test (bandeau démo) -->
      ${CONFIG.DEMO_MODE ? `
        <div class="card" style="
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
          border: 2px solid var(--warning);
          margin-bottom: 24px;
          padding: 16px;
        ">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span style="font-size: 1.5rem;">🧪</span>
            <strong style="color: var(--fg);">Identifiants de test</strong>
          </div>
          <div style="font-size: 0.85rem; color: var(--muted); line-height: 1.6;">
            <div style="margin-bottom: 8px;">
              👨‍🏫 <strong>Enseignant :</strong> enseignant@ecole.fr / smso01**
            </div>
            <div style="margin-bottom: 8px;">
              👔 <strong>Directeur :</strong> directeur@ecole.fr / smso01**
            </div>
            <div style="margin-bottom: 8px;">
              🧭 <strong>Directeur pédagogique :</strong> pedago@ecole.fr / smso01**
            </div>
            <div>
              🎓 <strong>Étudiant :</strong> etudiant@ecole.fr / smso01**
            </div>
          </div>
        </div>
      ` : ''}
      
      <!-- Formulaire de connexion -->
      <div class="card" style="margin-bottom: 24px;">
        <h2 style="margin: 0 0 24px; font-size: 1.5rem; text-align: center;">
          Connexion
        </h2>
        
        <form id="login-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label for="email" style="display: block; margin-bottom: 8px; font-weight: 500;">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="votre.email@etablissement.fr"
              required
              style="
                width: 100%;
                padding: 12px 16px;
                border: 2px solid var(--card-border);
                border-radius: var(--radius-md);
                font-size: 1rem;
                background: var(--card);
                color: var(--fg);
                transition: border-color var(--transition-base);
              "
              onfocus="this.style.borderColor='var(--accent)'"
              onblur="this.style.borderColor='var(--card-border)'"
            />
          </div>
          
          <div>
            <label for="password" style="display: block; margin-bottom: 8px; font-weight: 500;">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              required
              style="
                width: 100%;
                padding: 12px 16px;
                border: 2px solid var(--card-border);
                border-radius: var(--radius-md);
                font-size: 1rem;
                background: var(--card);
                color: var(--fg);
                transition: border-color var(--transition-base);
              "
              onfocus="this.style.borderColor='var(--accent)'"
              onblur="this.style.borderColor='var(--card-border)'"
            />
          </div>
          
          <!-- Message d'erreur -->
          <div id="login-error" style="display: none; padding: 12px; background: var(--danger); color: white; border-radius: var(--radius-md); font-size: 0.9rem;">
          </div>
          
          <button
            type="submit"
            id="btn-login"
            class="btn primary"
            style="width: 100%; margin-top: 8px;"
          >
            🔐 Se connecter
          </button>
        </form>
      </div>
      
      <!-- Mode démo -->
      ${CONFIG.DEMO_MODE ? `
        <div class="card" style="
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
          border: 2px solid var(--accent);
          text-align: center;
        ">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🎭</div>
          <h3 style="margin: 0 0 12px; font-size: 1.25rem; color: var(--fg);">
            Mode Démonstration
          </h3>
          <p style="color: var(--muted); margin-bottom: 24px; line-height: 1.6;">
            Découvrez StudyMate en saisissant les identifiants de test.<br/>
          </p>
        </div>
      ` : ''}
      
      <!-- Version -->
      <div style="text-align: center; margin-top: 32px; color: var(--muted); font-size: 0.875rem;">
        <p>Version ${CONFIG.APP_VERSION}</p>
        <p style="margin-top: 8px;">
          <a href="#" style="color: var(--muted); text-decoration: underline;">
            Besoin d'aide ?
          </a>
        </p>
      </div>
    </div>
  `;
  
  // Event listeners
  setupAuthEventListeners();
}

/**
 * Configure les event listeners de la vue auth
 */
function setupAuthEventListeners() {
  // Bouton démo
  const btnStartDemo = document.getElementById('btn-start-demo');
  if (btnStartDemo) {
    btnStartDemo.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('[View Auth] Clic sur "Découvrir la démo"');
      // ✅ CORRECTION : handleDemoLogin retourne maintenant un objet
      const result = handleDemoLogin();
      // La navigation se fait via le hash changé dans handleDemoLogin
    });
  }
  
  // Formulaire de connexion
  const loginForm = document.getElementById('login-form');
  const btnLogin = document.getElementById('btn-login');
  const loginError = document.getElementById('login-error');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Récupérer les valeurs
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      // Cacher l'erreur précédente
      loginError.style.display = 'none';
      
      // Désactiver le bouton pendant la tentative
      btnLogin.disabled = true;
      btnLogin.textContent = '⏳ Connexion...';
      
      try {
        // Tenter la connexion
        const result = await handleLogin(email, password);
        
        if (result.success) {
          // Succès : mettre à jour la navigation puis rediriger vers le dashboard approprié
          initTopNav(); // Mettre à jour TopNav immédiatement après connexion
          
          const dashboardRoute = getDashboardRoute(result.user.role);
          console.log('[View Auth] ✅ Connexion réussie, redirection vers', dashboardRoute);
          
          // Le localStorage est mis à jour de manière synchrone dans handleLogin
          // Vérifier immédiatement que l'authentification est bien enregistrée
          const authCheck = localStorage.getItem('SM_SO_USER_ROLE');
          console.log('[View Auth] Auth check immédiat:', authCheck);
          
          if (!authCheck) {
            console.error('[View Auth] ❌ Problème : localStorage non mis à jour');
            // Réessayer après un court délai
            setTimeout(() => {
              navigateTo(dashboardRoute, true); // Skip auth check car on vient de se connecter
            }, 100);
          } else {
            // Navigation immédiate avec skipAuthCheck car on vient de se connecter
            console.log('[View Auth] Navigation immédiate vers', dashboardRoute);
            navigateTo(dashboardRoute, true); // Skip auth check car on vient de se connecter
          }
        }
      } catch (error) {
        // Erreur : afficher le message
        console.error('[View Auth] ❌ Erreur de connexion:', error);
        loginError.textContent = `❌ ${error.message}`;
        loginError.style.display = 'block';
        
        // Réactiver le bouton
        btnLogin.disabled = false;
        btnLogin.textContent = '🔐 Se connecter';
      }
    });
  }
}

// Export global pour que app.js puisse l'appeler
window.renderAuthView = renderAuthView;

export default { renderAuthView };