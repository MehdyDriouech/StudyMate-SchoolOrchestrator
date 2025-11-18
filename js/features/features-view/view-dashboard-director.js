/**
 * View Dashboard Director - Interface du dashboard directeur
 */

import {
  loadDirectorDashboardData,
  addEstablishment,
  addUser,
  getCompletionColor,
  formatRelativeDate
} from '../features-control/feature-dashboard-director.js';

import {
  createBarChart,
  destroyChart,
  getThemeColors
} from '../../components/Charts.js';
import { renderDashboardDirectorSocialView } from './view-dashboard-director-social.js';

let dashboardData = null;
let classesChart = null; // Référence au graphique
let directorContainer = null;
let notificationTimer = null;

/**
 * Rend la vue du dashboard directeur
 * @param {HTMLElement} container - Conteneur de la vue
 */
export async function renderDashboardDirectorView(container) {
  console.log('[View Dashboard Director] Rendu du dashboard directeur');
  directorContainer = container;
  
  // Afficher un loader
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px; animation: pulse 1.5s ease-in-out infinite;">
          ⏳
        </div>
        <p style="color: var(--muted);">Chargement du dashboard directeur...</p>
      </div>
    </div>
    
    <style>
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.1); }
      }
    </style>
  `;
  
  try {
    // Charger les données
    dashboardData = await loadDirectorDashboardData();
    
    // Rendre le dashboard complet
    renderDashboardContent(container);
    
    // Écouter les changements d'établissement pour recharger
    window.addEventListener('schoolChanged', async () => {
      console.log('[View Dashboard Director] Changement d\'établissement, rechargement...');
      dashboardData = await loadDirectorDashboardData();
      renderDashboardContent(container);
    });
    
  } catch (error) {
    console.error('[View Dashboard Director] Erreur:', error);
    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 60px auto; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 16px;">❌</div>
        <h2>Erreur de chargement</h2>
        <p style="color: var(--danger); margin: 16px 0;">
          ${error.message}
        </p>
        <button class="btn primary" onclick="location.reload()">
          Réessayer
        </button>
      </div>
    `;
  }
}

/**
 * Rend le contenu complet du dashboard
 * @param {HTMLElement} container - Conteneur
 */
function renderDashboardContent(container) {
  const { stats, classesComparison, teachersPerformance, timeline, establishments, users } = dashboardData;
  
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <!-- En-tête -->
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          👔 Dashboard Directeur
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Vue d'ensemble de l'établissement et pilotage pédagogique
        </p>
      </div>
      
      <div id="director-notification" class="director-notification" aria-live="polite"></div>
      
      <!-- KPIs -->
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      ">
        ${renderKPICard('🎓', 'Classes', stats.totalClasses, 'Actives')}
        ${renderKPICard('👨‍🏫', 'Enseignants', stats.totalTeachers, 'En activité')}
        ${renderKPICard('✅', 'Complétion', `${stats.avgCompletionRate}%`, 'Moyenne')}
        ${renderKPICard('⏳', 'Validations', stats.pendingValidations, 'En attente')}
      </div>
      
      <!-- Actions administratives -->
      <div class="card" style="margin-bottom: 32px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 style="font-size: 1.25rem; margin-bottom: 4px;">🛠️ Actions administratives</h2>
            <p style="color: var(--muted); margin:0;">Ajoutez établissements et utilisateurs en un clic</p>
          </div>
          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <button id="btn-add-establishment" class="btn primary">🏫 Ajouter un établissement</button>
            <button id="btn-add-user" class="btn ghost">👤 Ajouter un utilisateur</button>
          </div>
        </div>
        <div style="display:grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap:16px; margin-top:16px;">
          <div style="background: var(--card-hover); padding:16px; border-radius: var(--radius-md);">
            <strong>Etablissements actifs</strong>
            <div style="font-size:2rem;">${establishments.length}</div>
            <small style="color:var(--muted);">${establishments[0]?.city || 'N/A'} en tête</small>
          </div>
          <div style="background: var(--card-hover); padding:16px; border-radius: var(--radius-md);">
            <strong>Utilisateurs total</strong>
            <div style="font-size:2rem;">${users.length}</div>
            <small style="color:var(--muted);">Incluant professeurs & étudiants</small>
          </div>
        </div>
      </div>
      
      <!-- Contenu principal -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-bottom: 32px;">
        <!-- Comparatif classes -->
        <div class="card">
          <h2 style="font-size: 1.25rem; margin-bottom: 16px;">
            📊 Comparatif des classes
          </h2>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
              <thead>
                <tr style="border-bottom: 2px solid var(--card-border);">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Classe</th>
                  <th style="padding: 12px; text-align: center;">Complétion</th>
                  <th style="padding: 12px; text-align: center;">Retard</th>
                  <th style="padding: 12px; text-align: center;">Moyenne</th>
                  <th style="padding: 12px; text-align: left;">Enseignant</th>
                </tr>
              </thead>
              <tbody>
                ${classesComparison.map(c => renderClassRow(c)).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Timeline -->
        <div class="card">
          <h2 style="font-size: 1.25rem; margin-bottom: 16px;">
            📅 Activité récente
          </h2>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${timeline.map(t => renderTimelineItem(t)).join('')}
          </div>
        </div>
      </div>
      
      <!-- Performance enseignants -->
      <div class="card">
        <h2 style="font-size: 1.25rem; margin-bottom: 16px;">
          👨‍🏫 Performance des enseignants
        </h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
              <tr style="border-bottom: 2px solid var(--card-border);">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Enseignant</th>
                <th style="padding: 12px; text-align: center;">Classes</th>
                <th style="padding: 12px; text-align: center;">Complétion moy.</th>
                <th style="padding: 12px; text-align: center;">Validations</th>
                <th style="padding: 12px; text-align: center;">Temps réponse</th>
              </tr>
            </thead>
            <tbody>
              ${teachersPerformance.map(t => renderTeacherRow(t)).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Graphique comparatif des classes -->
      <div class="card" style="margin-top: 24px;">
        <h2 style="font-size: 1.25rem; margin-bottom: 20px;">
          📊 Comparatif visuel des classes
        </h2>
        <div style="position: relative; height: 320px;">
          <canvas id="director-classes-chart"></canvas>
        </div>
      </div>

      <!-- Vue Sociale de l'Établissement -->
      <div class="card" style="margin-top: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="font-size: 1.25rem; margin: 0;">
            🟪 Vue Sociale de l'Établissement
          </h2>
          <button id="btn-open-social-view" class="btn primary" style="font-size: 0.9rem;">
            Voir l'analyse sociale avancée →
          </button>
        </div>
        <div style="
          padding: 24px;
          background: var(--card-hover);
          border-radius: var(--radius-md);
          border-left: 4px solid var(--accent);
        ">
          <p style="color: var(--muted); margin-bottom: 16px;">
            Accédez à une analyse sociale approfondie de votre établissement : cohésion sociale, 
            comparaison inter-établissements, statistiques par classe et bien plus.
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
            <div style="text-align: center;">
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent);">📊</div>
              <div style="font-size: 0.85rem; color: var(--muted); margin-top: 4px;">Analytics avancés</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent);">🤝</div>
              <div style="font-size: 0.85rem; color: var(--muted); margin-top: 4px;">Cohésion sociale</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent);">🏫</div>
              <div style="font-size: 0.85rem; color: var(--muted); margin-top: 4px;">Comparaison inter-établissements</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <style>
      @media (max-width: 968px) {
        [style*="grid-template-columns: 2fr 1fr"] {
          grid-template-columns: 1fr !important;
        }
        [style*="grid-template-columns: 1fr 1fr"] {
          grid-template-columns: 1fr !important;
        }
      }
      .director-notification {
        min-height: 32px;
        background: rgba(34,197,94,0.15);
        color: var(--success, #16a34a);
        border-radius: var(--radius-md);
        padding: 8px 16px;
        margin-bottom: 20px;
        display: none;
      }
      .director-notification.visible {
        display: block;
      }
    </style>
  `;
  
  // Configurer les événements
  setupEventListeners();
  
  // Initialiser le graphique après que le DOM soit rendu
  requestAnimationFrame(() => {
    initClassesChart();
  });
}

/**
 * Affiche la vue sociale dans le conteneur principal
 */
function showSocialView() {
  const appRoot = document.getElementById('app-root');
  if (!appRoot) return;
  
  // Sauvegarder le conteneur directeur actuel
  const currentDirectorContainer = directorContainer || appRoot.querySelector('#view-dashboard-director');
  
  // Nettoyer le conteneur
  appRoot.innerHTML = '';
  
  // Créer le conteneur de la vue sociale
  const viewContainer = document.createElement('div');
  viewContainer.id = 'view-dashboard-director-social';
  viewContainer.className = 'view-container';
  
  // Ajouter un bouton retour
  const headerDiv = document.createElement('div');
  headerDiv.style.cssText = 'max-width: 1400px; margin: 24px auto; padding: 0 16px;';
  headerDiv.innerHTML = `
    <button id="btn-back-to-director" class="btn ghost" style="margin-bottom: 16px;">
      ← Retour au dashboard
    </button>
  `;
  viewContainer.appendChild(headerDiv);
  
  const contentContainer = document.createElement('div');
  viewContainer.appendChild(contentContainer);
  
  appRoot.appendChild(viewContainer);
  
  // Rendre la vue sociale
  renderDashboardDirectorSocialView(contentContainer);
  
  // Setup du bouton retour
  const backBtn = document.getElementById('btn-back-to-director');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // Recharger le dashboard directeur
      if (currentDirectorContainer) {
        appRoot.innerHTML = '';
        appRoot.appendChild(currentDirectorContainer);
        // Re-rendre le contenu si nécessaire
        if (dashboardData) {
          renderDashboardContent(currentDirectorContainer);
        }
      } else {
        // Fallback : recharger via navigateTo ou location
        if (window.navigateTo) {
          window.navigateTo('dashboard-director');
        } else {
          window.location.hash = 'dashboard-director';
          location.reload();
        }
      }
    });
  }
}

/**
 * Rend une carte KPI
 */
function renderKPICard(icon, label, value, subtitle) {
  return `
    <div class="card" style="text-align: center; padding: 20px;">
      <div style="font-size: 2rem; margin-bottom: 8px;">${icon}</div>
      <div style="font-size: 2rem; font-weight: 700; color: var(--fg); margin-bottom: 4px;">
        ${value}
      </div>
      <div style="font-size: 0.9rem; font-weight: 600; color: var(--fg); margin-bottom: 2px;">
        ${label}
      </div>
      <div style="font-size: 0.8rem; color: var(--muted);">
        ${subtitle}
      </div>
    </div>
  `;
}

/**
 * Rend une ligne de classe
 */
function renderClassRow(classData) {
  return `
    <tr style="border-bottom: 1px solid var(--card-border);">
      <td style="padding: 12px; font-weight: 600;">${classData.className}</td>
      <td style="padding: 12px; text-align: center;">
        <span style="color: ${getCompletionColor(classData.completionRate)}; font-weight: 600;">
          ${classData.completionRate.toFixed(1)}%
        </span>
      </td>
      <td style="padding: 12px; text-align: center;">
        ${classData.sequencesLate > 0 ? `
          <span class="badge danger" style="font-size: 0.75rem; padding: 4px 8px;">
            ${classData.sequencesLate}
          </span>
        ` : `
          <span style="color: var(--accent);">✓</span>
        `}
      </td>
      <td style="padding: 12px; text-align: center; font-weight: 600;">
        ${classData.avgGrade.toFixed(1)}/20
      </td>
      <td style="padding: 12px; color: var(--muted); font-size: 0.85rem;">
        ${classData.teacher}
      </td>
    </tr>
  `;
}

/**
 * Rend une ligne d'enseignant
 */
function renderTeacherRow(teacher) {
  return `
    <tr style="border-bottom: 1px solid var(--card-border);">
      <td style="padding: 12px; font-weight: 600;">${teacher.name}</td>
      <td style="padding: 12px; text-align: center;">${teacher.classesCount}</td>
      <td style="padding: 12px; text-align: center;">
        <span style="color: ${getCompletionColor(teacher.avgCompletionRate)}; font-weight: 600;">
          ${teacher.avgCompletionRate.toFixed(1)}%
        </span>
      </td>
      <td style="padding: 12px; text-align: center;">
        ${teacher.pendingValidations > 0 ? `
          <span class="badge warning" style="font-size: 0.75rem; padding: 4px 8px;">
            ${teacher.pendingValidations}
          </span>
        ` : `
          <span style="color: var(--accent);">✓</span>
        `}
      </td>
      <td style="padding: 12px; text-align: center; color: var(--muted); font-size: 0.85rem;">
        ${teacher.avgResponseTime}
      </td>
    </tr>
  `;
}

/**
 * Rend un élément de timeline
 */
function renderTimelineItem(item) {
  const icons = {
    'school_added': '🏫',
    'validation_pending': '⏳',
    'teacher_joined': '👨‍🏫',
    'content_validated': '✅'
  };
  
  return `
    <div style="
      padding: 12px;
      background: var(--card-hover);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--accent);
    ">
      <div style="display: flex; align-items: start; gap: 8px;">
        <span style="font-size: 1.2rem;">${icons[item.type] || '📌'}</span>
        <div style="flex: 1;">
          <div style="font-size: 0.85rem; color: var(--fg); margin-bottom: 4px;">
            ${item.message}
          </div>
          <div style="font-size: 0.75rem; color: var(--muted);">
            ${formatRelativeDate(item.date)}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Configure les event listeners
 */
function setupEventListeners() {
  // Bouton ajouter établissement
  const btnAddEstablishment = document.getElementById('btn-add-establishment');
  if (btnAddEstablishment) {
    btnAddEstablishment.addEventListener('click', showAddEstablishmentModal);
  }
  
  // Bouton ajouter utilisateur
  const btnAddUser = document.getElementById('btn-add-user');
  if (btnAddUser) {
    btnAddUser.addEventListener('click', showAddUserModal);
  }
  
  // Bouton ouvrir vue sociale
  const btnOpenSocialView = document.getElementById('btn-open-social-view');
  if (btnOpenSocialView) {
    btnOpenSocialView.addEventListener('click', showSocialView);
  }
}

/**
 * Affiche la modale d'ajout d'établissement
 */
function showAddEstablishmentModal() {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    " id="establishment-modal">
      <div class="card" style="max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <h2 style="margin: 0 0 24px; font-size: 1.5rem;">
          🏫 Ajouter un établissement
        </h2>
        
        <form id="establishment-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Nom *</label>
            <input type="text" name="name" required class="form-input" placeholder="Ex: Lycée Victor Hugo" />
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Ville *</label>
            <input type="text" name="city" required class="form-input" placeholder="Ex: Paris" />
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Type *</label>
            <select name="type" required class="form-input">
              <option value="">-- Sélectionner --</option>
              <option value="Lycée général">Lycée général</option>
              <option value="Lycée professionnel">Lycée professionnel</option>
              <option value="Collège">Collège</option>
              <option value="École primaire">École primaire</option>
            </select>
          </div>
          
          <div style="display: flex; gap: 12px; margin-top: 8px;">
            <button type="submit" class="btn primary" style="flex: 1;">
              ✓ Ajouter
            </button>
            <button type="button" id="btn-cancel" class="btn ghost" style="flex: 1;">
              ✕ Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <style>
      .form-input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid var(--card-border);
        border-radius: var(--radius-md);
        font-size: 1rem;
        background: var(--card);
        color: var(--fg);
        transition: border-color var(--transition-base);
      }
      .form-input:focus {
        outline: none;
        border-color: var(--accent);
      }
    </style>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  const form = document.getElementById('establishment-form');
  const btnCancel = document.getElementById('btn-cancel');
  const modalElement = document.getElementById('establishment-modal');
  
  btnCancel.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Ajouter l'établissement
    const result = addEstablishment(data);
    dashboardData.establishments = [...dashboardData.establishments, result.establishment];
    document.body.removeChild(modal);
    renderDashboardContent(directorContainer);
    showDirectorNotification(`🏫 ${data.name} ajouté (démo)`);
  });
}

/**
 * Affiche la modale d'ajout d'utilisateur
 */
function showAddUserModal() {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    " id="user-modal">
      <div class="card" style="max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
        <h2 style="margin: 0 0 24px; font-size: 1.5rem;">
          👤 Ajouter un utilisateur
        </h2>
        
        <form id="user-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Nom complet *</label>
            <input type="text" name="name" required class="form-input" placeholder="Ex: Jean Dupont" />
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Email *</label>
            <input type="email" name="email" required class="form-input" placeholder="Ex: jean.dupont@ecole.fr" />
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Rôle *</label>
            <select name="role" required class="form-input">
              <option value="">-- Sélectionner --</option>
              <option value="teacher">Enseignant</option>
              <option value="director">Directeur</option>
              <option value="student">Étudiant</option>
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Classes (optionnel)</label>
            <input type="text" name="classes" class="form-input" placeholder="Ex: Term S1, Prem L" />
            <small style="color: var(--muted); font-size: 0.8rem;">Séparer par des virgules</small>
          </div>
          
          <div style="display: flex; gap: 12px; margin-top: 8px;">
            <button type="submit" class="btn primary" style="flex: 1;">
              ✓ Créer
            </button>
            <button type="button" id="btn-cancel-user" class="btn ghost" style="flex: 1;">
              ✕ Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <style>
      .form-input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid var(--card-border);
        border-radius: var(--radius-md);
        font-size: 1rem;
        background: var(--card);
        color: var(--fg);
        transition: border-color var(--transition-base);
      }
      .form-input:focus {
        outline: none;
        border-color: var(--accent);
      }
    </style>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  const form = document.getElementById('user-form');
  const btnCancel = document.getElementById('btn-cancel-user');
  
  btnCancel.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Transformer classes en array
    if (data.classes) {
      data.classes = data.classes.split(',').map(c => c.trim()).filter(c => c);
    } else {
      data.classes = [];
    }
    
    const result = addUser(data);
    dashboardData.users = [...dashboardData.users, result.user];
    document.body.removeChild(modal);
    renderDashboardContent(directorContainer);
    showDirectorNotification(`👤 ${data.name} créé (démo)`);
  });
}

/**
 * Initialise le graphique comparatif des classes
 */
function initClassesChart() {
  // Détruire le graphique existant si présent
  if (classesChart) {
    destroyChart(classesChart);
    classesChart = null;
  }
  
  // Récupérer le canvas
  const canvas = document.getElementById('director-classes-chart');
  if (!canvas) {
    console.warn('[View Dashboard Director] Canvas director-classes-chart non trouvé');
    return;
  }
  
  // Vérifier qu'on a les données
  if (!dashboardData || !dashboardData.classesComparison) {
    console.warn('[View Dashboard Director] Pas de données classesComparison disponibles');
    return;
  }
  
  const colors = getThemeColors();
  const classes = dashboardData.classesComparison;
  
  // Préparer les données
  const labels = classes.map(c => c.className);
  const completionData = classes.map(c => c.completionRate);
  const lateData = classes.map(c => c.sequencesLate);
  
  // Créer le graphique avec deux datasets
  try {
    classesChart = createBarChart(
      canvas,
      labels,
      [
        {
          label: 'Taux de complétion (%)',
          data: completionData,
          backgroundColor: colors.accent,
          borderColor: colors.accent,
          yAxisID: 'y'
        },
        {
          label: 'Séquences en retard',
          data: lateData,
          backgroundColor: colors.danger,
          borderColor: colors.danger,
          yAxisID: 'y1'
        }
      ],
      {
        horizontal: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (context.datasetIndex === 0) {
                  return `${label}: ${value.toFixed(1)}%`;
                }
                return `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            },
            title: {
              display: true,
              text: 'Taux de complétion (%)',
              font: {
                size: 12,
                weight: 600
              },
              color: colors.fg
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: true,
              text: 'Séquences en retard',
              font: {
                size: 12,
                weight: 600
              },
              color: colors.fg
            }
          }
        }
      }
    );
    console.log('[View Dashboard Director] ✅ Graphique des classes initialisé');
  } catch (error) {
    console.error('[View Dashboard Director] Erreur lors de la création du graphique:', error);
  }
}

function showDirectorNotification(message) {
  const banner = document.getElementById('director-notification');
  if (!banner) return;
  banner.textContent = message;
  banner.classList.add('visible');
  clearTimeout(notificationTimer);
  notificationTimer = setTimeout(() => {
    banner.classList.remove('visible');
  }, 3200);
}

// Export global pour que app.js puisse l'appeler
window.renderDashboardDirectorView = renderDashboardDirectorView;

export default { renderDashboardDirectorView };
