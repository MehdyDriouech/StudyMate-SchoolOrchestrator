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
  console.log('[View Auth] DEMO_MODE:', CONFIG.DEMO_MODE);
  
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
            <div style="margin-bottom: 8px;">
              🎓 <strong>Étudiant :</strong> etudiant@ecole.fr / smso01**
            </div>
            <div>
              🏛️ <strong>Administrateur Campus :</strong> campusadmin@ecole.fr / smso01**
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label for="password" style="display: block; font-weight: 500;">
                Mot de passe
              </label>
              <button
                type="button"
                id="btn-forgot-password"
                style="
                  background: none;
                  border: none;
                  color: var(--accent);
                  font-size: 0.875rem;
                  cursor: pointer;
                  text-decoration: underline;
                  padding: 0;
                  font-weight: 500;
                "
                onmouseover="this.style.opacity='0.8'"
                onmouseout="this.style.opacity='1'"
              >
                Mot de passe oublié ?
              </button>
            </div>
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
  
  // Bouton mot de passe oublié
  const btnForgotPassword = document.getElementById('btn-forgot-password');
  if (btnForgotPassword) {
    btnForgotPassword.addEventListener('click', (e) => {
      e.preventDefault();
      showForgotPasswordModal();
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

/**
 * Affiche la modale de réinitialisation de mot de passe
 */
function showForgotPasswordModal() {
  const modal = createModal(`
    <div style="max-width: 450px; margin: 0 auto;">
      <h2 style="font-size: 1.5rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
        <span>🔑</span>
        <span>Mot de passe oublié</span>
      </h2>
      <p style="color: var(--muted); margin-bottom: 24px; font-size: 0.95rem; line-height: 1.6;">
        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </p>
      
      <form id="forgot-password-form" style="display: grid; gap: 16px;">
        <div>
          <label for="forgot-email" style="display: block; font-size: 0.85rem; color: var(--muted); margin-bottom: 4px; font-weight: 500;">
            Adresse email
          </label>
          <input 
            type="email" 
            id="forgot-email" 
            required
            placeholder="votre.email@etablissement.fr"
            style="width: 100%; padding: 12px 16px; border: 2px solid var(--card-border); border-radius: var(--radius-md); background: var(--card); color: var(--fg); font-size: 1rem; transition: border-color var(--transition-base);"
            onfocus="this.style.borderColor='var(--accent)'"
            onblur="this.style.borderColor='var(--card-border)'"
          />
        </div>
        
        <div id="forgot-password-error" style="display: none; padding: 12px; background: var(--danger-light); color: var(--danger); border-radius: var(--radius-sm); font-size: 0.9rem;"></div>
        
        <div id="forgot-password-success" style="display: none; padding: 12px; background: var(--accent-light); color: var(--accent); border-radius: var(--radius-sm); font-size: 0.9rem;"></div>
        
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px;">
          <button type="button" class="btn ghost" onclick="this.closest('.modal-overlay').remove()">
            Annuler
          </button>
          <button type="submit" class="btn primary" id="btn-send-reset-link">
            Envoyer le lien
          </button>
        </div>
      </form>
    </div>
  `);
  
  document.body.appendChild(modal);
  
  // Gérer la soumission du formulaire
  const form = modal.querySelector('#forgot-password-form');
  const btnSend = modal.querySelector('#btn-send-reset-link');
  const errorDiv = modal.querySelector('#forgot-password-error');
  const successDiv = modal.querySelector('#forgot-password-success');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('forgot-email').value.trim();
    
    // Validation basique
    if (!email || !email.includes('@')) {
      errorDiv.textContent = 'Veuillez entrer une adresse email valide.';
      errorDiv.style.display = 'block';
      successDiv.style.display = 'none';
      return;
    }
    
    // Cacher les messages précédents
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Désactiver le bouton pendant l'envoi
    btnSend.disabled = true;
    btnSend.textContent = '⏳ Envoi en cours...';
    
    try {
      // Simuler l'envoi du lien de réinitialisation
      await sendPasswordResetLink(email);
      
      // Afficher le message de succès
      successDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.2rem;">✅</span>
          <div>
            <strong>Email envoyé !</strong><br/>
            <span style="font-size: 0.85rem;">Un lien de réinitialisation a été envoyé à <strong>${escapeHtml(email)}</strong>.</span>
          </div>
        </div>
      `;
      successDiv.style.display = 'block';
      
      // Réinitialiser le formulaire
      form.reset();
      
      // Fermer la modale après 3 secondes
      setTimeout(() => {
        modal.remove();
      }, 3000);
      
    } catch (error) {
      // Afficher l'erreur
      errorDiv.textContent = error.message || 'Une erreur est survenue. Veuillez réessayer.';
      errorDiv.style.display = 'block';
      
      // Réactiver le bouton
      btnSend.disabled = false;
      btnSend.textContent = 'Envoyer le lien';
    }
  });
}

/**
 * Envoie le lien de réinitialisation de mot de passe
 * @param {string} email - Email de l'utilisateur
 * @returns {Promise<void>}
 */
async function sendPasswordResetLink(email) {
  console.log('[View Auth] Envoi du lien de réinitialisation pour:', email);
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Vérifier si l'email existe dans la base de données fake
  const FAKE_USERS = {
    'enseignant@ecole.fr': { name: 'Professeur Martin' },
    'directeur@ecole.fr': { name: 'Directeur Dupont' },
    'etudiant@ecole.fr': { name: 'Élève Sophie' },
    'etudiant@condorcet.fr': { name: 'Élève Emma' },
    'pedago@ecole.fr': { name: 'Référent pédagogique' }
  };
  
  // Pour la démo, on accepte tous les emails valides
  // Dans une vraie app, on vérifierait si l'email existe
  if (!email || !email.includes('@')) {
    throw new Error('Adresse email invalide');
  }
  
  // Simuler l'envoi du lien (dans une vraie app, on ferait un appel API)
  console.log('[View Auth] ✅ Lien de réinitialisation envoyé à', email);
  
  // Dans une vraie application, on générerait un token unique et on l'enverrait par email
  // Pour la démo, on simule juste le succès
}

/**
 * Crée une modale
 * @param {string} content - Contenu HTML de la modale
 * @returns {HTMLElement}
 */
function createModal(content) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
    backdrop-filter: blur(4px);
  `;
  
  const modal = document.createElement('div');
  modal.className = 'modal-content';
  modal.style.cssText = `
    background: var(--card);
    border-radius: var(--radius-lg);
    padding: 24px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    animation: modalFadeIn 0.2s ease-out;
  `;
  
  modal.innerHTML = content;
  overlay.appendChild(modal);
  
  // Fermer en cliquant sur l'overlay
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
  
  // Ajouter l'animation CSS si elle n'existe pas déjà
  if (!document.getElementById('modal-animations')) {
    const style = document.createElement('style');
    style.id = 'modal-animations';
    style.textContent = `
      @keyframes modalFadeIn {
        from {
          opacity: 0;
          transform: scale(0.95) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  return overlay;
}

/**
 * Échappe le HTML pour éviter les injections XSS
 * @param {string} str - Chaîne à échapper
 * @returns {string}
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Export global pour que app.js puisse l'appeler
window.renderAuthView = renderAuthView;

export default { renderAuthView };