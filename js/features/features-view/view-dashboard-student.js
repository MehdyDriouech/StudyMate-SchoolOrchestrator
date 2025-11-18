/**
 * View Dashboard Student - Interface du dashboard étudiant
 */

import {
  loadStudentDashboardData,
  generateSocialUUID,
  saveSocialUUID,
  getSocialUUID,
  getPriorityColor,
  getStatusLabel,
  formatDueDate
} from '../features-control/feature-dashboard-student.js';

import {
  createDonutChart,
  destroyChart,
  getThemeColors,
  createBarChart
} from '../../components/Charts.js';
import { getPublishedThemesByClass, getThemeById } from '../features-control/store-themes.js';
import { getAssignmentsByClass } from '../features-control/store-class-theme-assignments.js';
import { getCurrentTheme } from '../features-control/feature-ai-theme-studio.js';
import {
  getSocialProfile,
  getFriends,
  addFriendByUuid,
  getLastQuizSocialStats,
  getFriendsRankingData
} from '../features-control/feature-social.js';

let dashboardData = null;
let progressChart = null; // Référence au graphique
let socialRankingChart = null; // Référence au graphique de classement social

/**
 * Rend la vue du dashboard étudiant
 * @param {HTMLElement} container - Conteneur de la vue
 */
export async function renderDashboardStudentView(container) {
  console.log('[View Dashboard Student] Rendu du dashboard étudiant');
  
  // Afficher un loader
  container.innerHTML = `
    <div style="max-width: 900px; margin: 24px auto; padding: 0 16px;">
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px; animation: pulse 1.5s ease-in-out infinite;">
          ⏳
        </div>
        <p style="color: var(--muted);">Chargement de ton espace...</p>
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
    dashboardData = await loadStudentDashboardData();
    
    // Écouter les changements d'établissement pour recharger (si l'étudiant change d'établissement)
    window.addEventListener('schoolChanged', async () => {
      console.log('[View Dashboard Student] Changement d\'établissement, rechargement...');
      dashboardData = await loadStudentDashboardData();
      renderDashboardContent(container);
    });
    
    // Rendre le dashboard complet
    renderDashboardContent(container);
    
  } catch (error) {
    console.error('[View Dashboard Student] Erreur:', error);
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
  const { assignments, stats, progressPercentage } = dashboardData;
  const existingUUID = getSocialUUID();
  
  // Filtrer les devoirs à faire et terminés
  const todoAssignments = assignments.filter(a => a.status !== 'completed');
  const completedAssignments = assignments.filter(a => a.status === 'completed');
  
  container.innerHTML = `
    <div style="max-width: 900px; margin: 24px auto; padding: 0 16px;">
      <!-- En-tête -->
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          🎓 Mon Espace
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Suis ta progression et organise ton travail
        </p>
      </div>
      
      <!-- Statistiques -->
      <div style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      ">
        ${renderStatCard('📝', 'Devoirs', `${stats.assignmentsCompleted}/${stats.assignmentsTotal}`, 'Complétés')}
        ${renderStatCard('📊', 'Moyenne', stats.avgGrade.toFixed(1), '/ 20')}
        ${renderStatCard('🏆', 'Classement', stats.classRanking, 'Dans ta classe')}
        ${renderStatCard('🔥', 'Série', `${stats.currentStreak} jours`, 'Consécutifs')}
      </div>
      
      <!-- Progression globale -->
      <div class="card" style="margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h2 style="font-size: 1.25rem; margin: 0;">
            📈 Ta progression
          </h2>
          <span style="font-size: 1.5rem; font-weight: 700; color: var(--accent);">
            ${progressPercentage}%
          </span>
        </div>
        <div style="
          width: 100%;
          height: 24px;
          background: var(--card-hover);
          border-radius: var(--radius-full);
          overflow: hidden;
          position: relative;
        ">
          <div style="
            width: ${progressPercentage}%;
            height: 100%;
            background: linear-gradient(90deg, var(--accent) 0%, var(--accent-light) 100%);
            border-radius: var(--radius-full);
            transition: width var(--transition-base);
          "></div>
        </div>
        <p style="color: var(--muted); font-size: 0.9rem; margin-top: 12px; text-align: center;">
          Continue comme ça ! Tu es dans le ${stats.classRanking} de ta classe. 🎯
        </p>
      </div>
      
      <!-- Graphique de répartition des devoirs -->
      <div class="card" style="margin-bottom: 32px;">
        <h2 style="font-size: 1.25rem; margin-bottom: 20px; text-align: center;">
          📊 Répartition de tes devoirs
        </h2>
        <div style="position: relative; height: 280px; max-width: 400px; margin: 0 auto;">
          <canvas id="student-progress-chart"></canvas>
        </div>
      </div>
      
      <!-- UUID Social -->
      <div class="card" style="
        margin-bottom: 32px;
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
        border: 2px solid var(--accent);
      ">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <span style="font-size: 2rem;">🌐</span>
          <h2 style="font-size: 1.25rem; margin: 0;">
            UUID Social
          </h2>
        </div>
        <p style="color: var(--muted); font-size: 0.9rem; line-height: 1.6; margin-bottom: 16px;">
          Cet identifiant unique te permet de partager tes scores avec tes amis dans de futures features sociales. 
          <strong style="color: var(--fg);">Mode démo uniquement</strong>, aucune donnée réelle n'est envoyée.
        </p>
        
        ${existingUUID ? `
          <!-- UUID existant -->
          <div style="
            padding: 12px 16px;
            background: var(--card);
            border-radius: var(--radius-md);
            border: 2px solid var(--accent);
            font-family: monospace;
            font-size: 0.9rem;
            color: var(--accent);
            text-align: center;
            margin-bottom: 12px;
            word-break: break-all;
          ">
            ${existingUUID}
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="btn-copy-uuid" class="btn ghost" style="flex: 1;">
              📋 Copier
            </button>
            <button id="btn-regenerate-uuid" class="btn ghost" style="flex: 1;">
              🔄 Générer nouveau
            </button>
          </div>
        ` : `
          <!-- Pas d'UUID -->
          <button id="btn-generate-uuid" class="btn primary" style="width: 100%;">
            ✨ Générer mon UUID social
          </button>
        `}
      </div>
      
      <!-- Nouveaux thèmes disponibles -->
      ${renderNewThemesSection()}
      
      <!-- Classement entre amis -->
      ${renderSocialRankingSection()}
      
      <!-- Devoirs à faire -->
      <div class="card" style="margin-bottom: 24px;">
        <h2 style="font-size: 1.25rem; margin-bottom: 16px;">
          📝 Devoirs à rendre
        </h2>
        ${todoAssignments.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${todoAssignments.map(a => renderAssignmentCard(a)).join('')}
          </div>
        ` : `
          <p style="color: var(--muted); text-align: center; padding: 24px 0;">
            🎉 Aucun devoir en attente !
          </p>
        `}
      </div>
      
      <!-- Devoirs terminés -->
      ${completedAssignments.length > 0 ? `
        <div class="card">
          <h2 style="font-size: 1.25rem; margin-bottom: 16px;">
            ✅ Devoirs terminés (${completedAssignments.length})
          </h2>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${completedAssignments.map(a => renderCompletedAssignmentCard(a)).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
  
  // Configurer les événements
  setupEventListeners();
  
  // Initialiser les graphiques après que le DOM soit rendu
  requestAnimationFrame(() => {
    initProgressChart();
    initSocialRankingChart();
  });
}

/**
 * Rend une carte statistique
 */
function renderStatCard(icon, label, value, subtitle) {
  return `
    <div class="card" style="text-align: center; padding: 20px;">
      <div style="font-size: 2rem; margin-bottom: 8px;">${icon}</div>
      <div style="font-size: 1.8rem; font-weight: 700; color: var(--fg); margin-bottom: 4px;">
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
 * Rend une carte de devoir
 */
function renderAssignmentCard(assignment) {
  return `
    <div style="
      padding: 16px;
      background: var(--card-hover);
      border-radius: var(--radius-md);
      border-left: 4px solid ${getPriorityColor(assignment.priority)};
      transition: transform var(--transition-fast);
      cursor: pointer;
    " onmouseover="this.style.transform='translateX(4px)'" onmouseout="this.style.transform='translateX(0)'">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${assignment.title}
          </div>
          <div style="font-size: 0.85rem; color: var(--muted);">
            ${assignment.subject}
          </div>
        </div>
        <span class="badge" style="
          background: ${assignment.status === 'in_progress' ? 'var(--warning)' : 'var(--muted)'};
          color: white;
          border: none;
          font-size: 0.75rem;
        ">
          ${getStatusLabel(assignment.status)}
        </span>
      </div>
      <div style="font-size: 0.85rem; color: ${getPriorityColor(assignment.priority)}; font-weight: 600;">
        ⏰ ${formatDueDate(assignment.dueDate)}
      </div>
    </div>
  `;
}

/**
 * Rend une carte de devoir terminé
 */
function renderCompletedAssignmentCard(assignment) {
  return `
    <div style="
      padding: 16px;
      background: var(--card-hover);
      border-radius: var(--radius-md);
      border-left: 4px solid var(--accent);
      opacity: 0.8;
    ">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${assignment.title}
          </div>
          <div style="font-size: 0.85rem; color: var(--muted);">
            ${assignment.subject}
          </div>
        </div>
        ${assignment.grade ? `
          <div style="text-align: right;">
            <div style="font-size: 1.2rem; font-weight: 700; color: var(--accent);">
              ${assignment.grade}/20
            </div>
            <div style="font-size: 0.75rem; color: var(--muted);">
              Note
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Initialise le graphique de répartition des devoirs
 */
function initProgressChart() {
  // Détruire le graphique existant si présent
  if (progressChart) {
    destroyChart(progressChart);
    progressChart = null;
  }
  
  // Récupérer le canvas
  const canvas = document.getElementById('student-progress-chart');
  if (!canvas) {
    console.warn('[View Dashboard Student] Canvas student-progress-chart non trouvé');
    return;
  }
  
  // Vérifier qu'on a les données
  if (!dashboardData || !dashboardData.assignments) {
    console.warn('[View Dashboard Student] Pas de données assignments disponibles');
    return;
  }
  
  const colors = getThemeColors();
  const assignments = dashboardData.assignments;
  
  // Calculer les statistiques
  const completed = assignments.filter(a => a.status === 'completed').length;
  const inProgress = assignments.filter(a => a.status === 'in_progress').length;
  const todo = assignments.filter(a => a.status === 'todo').length;
  
  // Labels et données
  const labels = [];
  const data = [];
  const chartColors = [];
  
  if (completed > 0) {
    labels.push('Terminés');
    data.push(completed);
    chartColors.push(colors.accent);
  }
  
  if (inProgress > 0) {
    labels.push('En cours');
    data.push(inProgress);
    chartColors.push(colors.warning);
  }
  
  if (todo > 0) {
    labels.push('À faire');
    data.push(todo);
    chartColors.push(colors.info);
  }
  
  // Créer le graphique
  try {
    progressChart = createDonutChart(
      canvas,
      labels,
      data,
      {
        colors: chartColors,
        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} devoir${value > 1 ? 's' : ''} (${percentage}%)`;
              }
            }
          }
        }
      }
    );
    console.log('[View Dashboard Student] ✅ Graphique de progression initialisé');
  } catch (error) {
    console.error('[View Dashboard Student] Erreur lors de la création du graphique:', error);
  }
}

/**
 * Initialise le graphique de classement social
 */
function initSocialRankingChart() {
  const canvas = document.getElementById('social-ranking-chart');
  if (!canvas) return;
  
  // Détruire le graphique existant s'il y en a un
  if (socialRankingChart) {
    destroyChart(socialRankingChart);
    socialRankingChart = null;
  }
  
  const rankingData = getFriendsRankingData();
  
  try {
    socialRankingChart = createBarChart(
      canvas,
      rankingData.labels,
      [{
        label: 'Score',
        data: rankingData.scores,
        backgroundColor: rankingData.labels.map((label, idx) => 
          label === 'Moi' ? 'rgba(14, 165, 233, 0.8)' : 'rgba(148, 163, 184, 0.6)'
        ),
        borderColor: rankingData.labels.map((label, idx) => 
          label === 'Moi' ? 'rgba(14, 165, 233, 1)' : 'rgba(148, 163, 184, 1)'
        ),
        borderWidth: 2
      }],
      {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Score: ${context.parsed.y}/100`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '/100';
              }
            }
          }
        }
      }
    );
    console.log('[View Dashboard Student] ✅ Graphique de classement social initialisé');
  } catch (error) {
    console.error('[View Dashboard Student] Erreur lors de la création du graphique social:', error);
  }
}

/**
 * Configure les event listeners
 */
function setupEventListeners() {
  // Bouton générer UUID
  const btnGenerateUUID = document.getElementById('btn-generate-uuid');
  if (btnGenerateUUID) {
    btnGenerateUUID.addEventListener('click', handleGenerateUUID);
  }
  
  // Bouton régénérer UUID
  const btnRegenerateUUID = document.getElementById('btn-regenerate-uuid');
  if (btnRegenerateUUID) {
    btnRegenerateUUID.addEventListener('click', handleGenerateUUID);
  }
  
  // Bouton copier UUID
  const btnCopyUUID = document.getElementById('btn-copy-uuid');
  if (btnCopyUUID) {
    btnCopyUUID.addEventListener('click', handleCopyUUID);
  }
  
  // Formulaire ajout ami
  const addFriendForm = document.getElementById('add-friend-form');
  if (addFriendForm) {
    addFriendForm.addEventListener('submit', handleAddFriend);
  }
}

/**
 * Gère l'ajout d'un ami via UUID
 */
function handleAddFriend(event) {
  event.preventDefault();
  
  const input = document.getElementById('friend-uuid-input');
  const feedback = document.getElementById('add-friend-feedback');
  
  if (!input || !feedback) return;
  
  const uuid = input.value.trim();
  
  if (!uuid) {
    feedback.textContent = '❌ Veuillez saisir un UUID';
    feedback.style.color = 'var(--danger, #ef4444)';
    return;
  }
  
  try {
    const newFriend = addFriendByUuid(uuid);
    feedback.textContent = `✅ ${newFriend.displayName} a été ajouté à ta liste d'amis !`;
    feedback.style.color = 'var(--success, #16a34a)';
    
    // Réinitialiser le formulaire
    input.value = '';
    
    // Re-rendre la section sociale après un court délai
    setTimeout(() => {
      const container = document.getElementById('view-dashboard-student');
      if (container) {
        renderDashboardStudentView(container);
      }
    }, 500);
    
  } catch (error) {
    feedback.textContent = `❌ ${error.message}`;
    feedback.style.color = 'var(--danger, #ef4444)';
  }
}

/**
 * Gère la génération d'UUID
 */
function handleGenerateUUID() {
  const uuid = generateSocialUUID();
  saveSocialUUID(uuid);
  
  // Rafraîchir l'affichage
  const container = document.getElementById('view-dashboard-student');
  if (container) {
    renderDashboardContent(container);
  }
}

/**
 * Copie l'UUID dans le presse-papier
 */
async function handleCopyUUID() {
  const uuid = getSocialUUID();
  if (!uuid) return;
  
  try {
    await navigator.clipboard.writeText(uuid);
    alert('✅ UUID copié dans le presse-papier !');
  } catch (error) {
    // Fallback si clipboard API non disponible
    const textArea = document.createElement('textarea');
    textArea.value = uuid;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('✅ UUID copié !');
  }
}

/**
 * Rend la section de classement entre amis
 */
function renderSocialRankingSection() {
  try {
    const socialStats = getLastQuizSocialStats();
    const friends = getFriends();
    const rankingData = getFriendsRankingData();
  
  return `
    <div class="card" style="
      margin-bottom: 32px;
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
      border: 2px solid var(--accent);
    ">
      <h2 style="font-size: 1.25rem; margin-bottom: 16px;">
        🏆 Classement entre amis
      </h2>
      
      <!-- Stats principales -->
      <div style="
        padding: 16px;
        background: var(--card);
        border-radius: var(--radius-md);
        margin-bottom: 16px;
      ">
        <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 8px; color: var(--accent);">
          Tu es ${socialStats.rank}${getOrdinalSuffix(socialStats.rank)} sur ${socialStats.total} pour le quiz "${socialStats.quizLabel}"
        </div>
        <div style="font-size: 0.9rem; color: var(--muted); margin-bottom: 12px;">
          Percentile : ${socialStats.percentile}% • Score : ${socialStats.myScore}/100
        </div>
        
        ${socialStats.fasterThan.length > 0 ? `
          <div style="font-size: 0.85rem; color: var(--success, #16a34a); margin-top: 8px;">
            ✅ Tu as répondu plus vite que ${socialStats.fasterThan.join(', ')} sur 80% des questions
          </div>
        ` : ''}
        
        ${socialStats.slowerThan.length > 0 ? `
          <div style="font-size: 0.85rem; color: var(--muted); margin-top: 4px;">
            ⏱️ ${socialStats.slowerThan.join(', ')} ont été plus rapides que toi
          </div>
        ` : ''}
      </div>
      
      <!-- Graphique de classement -->
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--muted);">
          Comparaison des scores
        </h3>
        <div style="position: relative; height: 200px;">
          <canvas id="social-ranking-chart"></canvas>
        </div>
      </div>
      
      <!-- Liste des amis -->
      <div style="margin-bottom: 16px;">
        <h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--muted);">
          Tes amis (${friends.length})
        </h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${friends.slice(0, 5).map((friend, idx) => {
            const isHigher = friend.score > socialStats.myScore;
            const isLower = friend.score < socialStats.myScore;
            return `
              <div style="
                padding: 10px;
                background: var(--card);
                border-radius: var(--radius-md);
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-left: 3px solid ${isHigher ? 'var(--success, #16a34a)' : isLower ? 'var(--warning, #f59e0b)' : 'var(--accent)'};
              ">
                <div style="flex: 1;">
                  <div style="font-weight: 600; font-size: 0.9rem;">
                    ${friend.displayName}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--muted);">
                    Score: ${friend.score}/100 • Temps moyen: ${friend.avgTime}s
                  </div>
                </div>
                <div style="font-size: 1.2rem;">
                  ${isHigher ? '⇧' : isLower ? '⇩' : '='}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <!-- Formulaire ajout ami -->
      <div style="
        padding: 12px;
        background: var(--card-hover);
        border-radius: var(--radius-md);
        border: 1px dashed var(--card-border);
      ">
        <h3 style="font-size: 0.95rem; margin-bottom: 8px; color: var(--muted);">
          Ajouter un ami via UUID
        </h3>
        <form id="add-friend-form" style="display: flex; gap: 8px;">
          <input 
            type="text" 
            id="friend-uuid-input" 
            placeholder="UUID de ton ami" 
            style="
              flex: 1;
              padding: 8px 12px;
              border: 2px solid var(--card-border);
              border-radius: var(--radius-md);
              background: var(--card);
              color: var(--fg);
              font-size: 0.9rem;
            "
            required
          />
          <button 
            type="submit" 
            class="btn primary" 
            style="font-size: 0.9rem; white-space: nowrap;"
          >
            ➕ Ajouter
          </button>
        </form>
        <div id="add-friend-feedback" style="
          margin-top: 8px;
          font-size: 0.85rem;
          min-height: 20px;
        "></div>
      </div>
    </div>
  `;
  } catch (error) {
    console.error('[View Dashboard Student] Erreur lors du rendu de la section sociale:', error);
    // Retourner une section vide en cas d'erreur pour ne pas bloquer le dashboard
    return '';
  }
}

/**
 * Retourne le suffixe ordinal (1er, 2e, 3e, etc.)
 */
function getOrdinalSuffix(num) {
  if (num === 1) return 'er';
  if (num === 2) return 'e';
  if (num >= 3) return 'e';
  return '';
}

/**
 * Rend la section des nouveaux thèmes disponibles pour la classe de l'étudiant
 */
function renderNewThemesSection() {
  // Pour la démo, on utilise une classe par défaut (Terminale S1)
  // Dans une vraie implémentation, on récupérerait la classe de l'étudiant connecté
  const studentClassId = 'terminale_s1';
  const now = new Date();
  
  // Récupérer les assignations publiées pour la classe de l'étudiant
  const assignments = getAssignmentsByClass(studentClassId, {
    now: now,
    includeDraft: false
  });
  
  // Enrichir avec les données du thème
  const themes = assignments.map(assignment => {
    let theme = getThemeById(assignment.themeId);
    
    // Si pas trouvé, chercher dans le thème courant de AI Studio
    if (!theme) {
      const currentTheme = getCurrentTheme();
      if (currentTheme && currentTheme.id === assignment.themeId) {
        theme = currentTheme;
      }
    }
    
    return {
      ...theme,
      assignment
    };
  }).filter(t => t.id); // Filtrer les thèmes valides
  
  // Trier par date de début (plus récent en premier)
  themes.sort((a, b) => {
    const dateA = new Date(a.assignment.startAt);
    const dateB = new Date(b.assignment.startAt);
    return dateB - dateA;
  });
  
  const recentThemes = themes.slice(0, 3); // Limiter à 3 thèmes
  
  if (recentThemes.length === 0) {
    return '';
  }
  
  return `
    <div class="card" style="
      margin-bottom: 32px;
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
      border: 2px solid var(--warning);
    ">
      <h2 style="font-size: 1.25rem; margin-bottom: 16px;">
        ✨ Thèmes disponibles actuellement pour ta classe
      </h2>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${recentThemes.map(item => {
          const theme = item;
          const assignment = item.assignment;
          const startDate = new Date(assignment.startAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
          const endDate = new Date(assignment.endAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
          
          return `
            <div style="
              padding: 12px;
              background: var(--card);
              border-radius: var(--radius-md);
              border-left: 3px solid var(--accent);
            ">
              <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                ${theme.title || 'Thème sans titre'}
                <span class="badge" style="background:var(--success); color:white; font-size:0.7rem; padding:2px 6px;">Disponible</span>
                ${theme.origin === 'ai_theme_studio' || theme.origin === 'library_import' ? '<span class="badge" style="background:var(--accent); color:white; font-size:0.7rem; padding:2px 6px;">IA</span>' : ''}
              </div>
              <div style="font-size: 0.85rem; color: var(--muted); margin-bottom: 6px;">
                ${startDate} → ${endDate}
              </div>
              ${theme.description ? `
                <p style="font-size: 0.8rem; color: var(--muted); margin-top: 6px; line-height: 1.4;">
                  ${theme.description.substring(0, 100)}${theme.description.length > 100 ? '...' : ''}
                </p>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Export global pour que app.js puisse l'appeler
window.renderDashboardStudentView = renderDashboardStudentView;

export default { renderDashboardStudentView };
