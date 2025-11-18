/**
 * View Curriculum Builder - Interface simplifiée de création de curriculum
 */

import { loadCurriculumData, getAssignedThemesForClass } from '../features-control/feature-curriculum-builder.js';
import { getPublishedThemesByClass } from '../features-control/store-themes.js';
import { getActiveSchoolId, getClasses } from '../features-control/store-multischool.js';

let curriculumData = null;

/**
 * Rend la vue du curriculum builder
 * @param {HTMLElement} container - Conteneur de la vue
 */
export async function renderCurriculumView(container) {
  console.log('[View Curriculum] Rendu du curriculum builder');
  
  // Afficher un loader
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px; animation: pulse 1.5s ease-in-out infinite;">
          ⏳
        </div>
        <p style="color: var(--muted);">Chargement du curriculum...</p>
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
    curriculumData = await loadCurriculumData();
    
    // Rendre le curriculum complet
    renderCurriculumContent(container);
    
  } catch (error) {
    console.error('[View Curriculum] Erreur:', error);
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
 * Rend le contenu du curriculum
 * @param {HTMLElement} container - Conteneur
 */
function renderCurriculumContent(container) {
  const { periods, subjects } = curriculumData;
  
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <!-- En-tête -->
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          📚 Curriculum Builder
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Organisez vos séquences pédagogiques par périodes
        </p>
      </div>
      
      <!-- Sélecteur de matière -->
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <strong>Matière :</strong>
          ${subjects.map(s => `
            <button class="btn ghost subject-btn ${s.active ? 'active' : ''}" data-subject="${s.id}" style="font-size: 0.9rem;">
              ${s.name}
            </button>
          `).join('')}
        </div>
      </div>
      
      <!-- Thèmes assignés aux classes -->
      <div class="card" style="margin-bottom: 24px;" id="curriculum-assigned-themes">
        <h2 style="font-size: 1.25rem; margin-bottom: 12px;">📋 Thèmes assignés aux classes</h2>
        <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 12px;">
          Thèmes publiés et assignés à vos classes avec période d'accessibilité
        </p>
        <div id="curriculum-assigned-list" style="display: flex; flex-direction: column; gap: 8px;">
          ${renderAssignedThemes()}
        </div>
      </div>
      
      <!-- Thèmes publiés disponibles -->
      <div class="card" style="margin-bottom: 24px;" id="curriculum-published-themes">
        <h2 style="font-size: 1.25rem; margin-bottom: 12px;">✨ Thèmes publiés disponibles</h2>
        <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 12px;">
          Thèmes validés et publiés, prêts à être intégrés dans votre curriculum
        </p>
        <div id="curriculum-themes-list" style="display: flex; flex-direction: column; gap: 8px;">
          ${renderPublishedThemes()}
        </div>
      </div>
      
      <!-- Vue Kanban par périodes -->
      <div style="
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 32px;
      ">
        ${periods.map(period => renderPeriodColumn(period)).join('')}
      </div>
      
      <!-- Note informative -->
      <div class="card" style="
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
        border: 2px solid var(--warning);
        text-align: center;
      ">
        <div style="font-size: 2rem; margin-bottom: 12px;">ℹ️</div>
        <p style="color: var(--muted); line-height: 1.6;">
          <strong>Version simplifiée</strong> : Cette vue montre une organisation statique des séquences.
          Les fonctionnalités de drag & drop et d'édition seront ajoutées dans une version future.
        </p>
      </div>
    </div>
    
    <style>
      .subject-btn.active {
        background: var(--btn-bg);
        color: var(--btn-fg);
        border-color: transparent;
      }
      
      @media (max-width: 968px) {
        [style*="grid-template-columns: repeat(3, 1fr)"] {
          grid-template-columns: 1fr !important;
        }
      }
    </style>
  `;
  
  // Événements
  setupCurriculumEventListeners();
}

/**
 * Rend une colonne de période
 * @param {object} period - Période
 * @returns {string}
 */
function renderPeriodColumn(period) {
  return `
    <div class="card" style="
      background: var(--card-hover);
      min-height: 400px;
    ">
      <div style="
        padding: 12px 16px;
        background: var(--btn-bg);
        color: white;
        border-radius: var(--radius-md) var(--radius-md) 0 0;
        margin: -24px -24px 16px -24px;
        font-weight: 600;
      ">
        ${period.name}
        <div style="font-size: 0.8rem; font-weight: 400; opacity: 0.9; margin-top: 4px;">
          ${period.dates}
        </div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${period.sequences.map(seq => renderSequenceCard(seq)).join('')}
      </div>
      
      ${period.sequences.length === 0 ? `
        <div style="text-align: center; padding: 40px 20px; color: var(--muted); font-size: 0.9rem;">
          Aucune séquence planifiée
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Rend une carte de séquence
 * @param {object} sequence - Séquence
 * @returns {string}
 */
function renderSequenceCard(sequence) {
  const statusColors = {
    'planned': 'var(--muted)',
    'in_progress': 'var(--warning)',
    'completed': 'var(--accent)'
  };
  
  const statusLabels = {
    'planned': 'Planifiée',
    'in_progress': 'En cours',
    'completed': 'Terminée'
  };
  
  return `
    <div style="
      padding: 12px;
      background: var(--card);
      border-radius: var(--radius-md);
      border-left: 4px solid ${statusColors[sequence.status]};
      cursor: grab;
      transition: all var(--transition-fast);
    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-md)'" 
       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
      <div style="font-weight: 600; margin-bottom: 6px; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
        ${sequence.title}
        ${sequence.origin === 'ai_theme_studio' ? '<span class="badge" style="background:var(--accent); color:white; border:none; font-size:0.65rem; padding:2px 6px;">Nouveau (IA)</span>' : ''}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.8rem; color: var(--muted);">
          ${sequence.duration}
        </span>
        <span class="badge" style="
          background: ${statusColors[sequence.status]};
          color: white;
          border: none;
          font-size: 0.7rem;
          padding: 3px 8px;
        ">
          ${statusLabels[sequence.status]}
        </span>
      </div>
      ${sequence.skills.length > 0 ? `
        <div style="font-size: 0.75rem; color: var(--muted); line-height: 1.4;">
          🎯 ${sequence.skills.join(', ')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Rend la liste des thèmes assignés aux classes
 * @returns {string}
 */
function renderAssignedThemes() {
  const activeSchoolId = getActiveSchoolId();
  if (!activeSchoolId) {
    return '<p style="color: var(--muted); padding: 12px;">Aucun établissement sélectionné.</p>';
  }
  
  const classes = getClasses(activeSchoolId);
  const allAssigned = [];
  
  classes.forEach(classItem => {
    const assigned = getAssignedThemesForClass(classItem.id);
    assigned.forEach(theme => {
      allAssigned.push({
        ...theme,
        className: classItem.name
      });
    });
  });
  
  if (allAssigned.length === 0) {
    return `
      <div style="text-align: center; padding: 24px; color: var(--muted);">
        <div style="font-size: 2rem; margin-bottom: 8px;">📭</div>
        <p>Aucun thème assigné pour le moment.</p>
        <p style="font-size: 0.85rem; margin-top: 4px;">Les thèmes publiés depuis AI Theme Studio apparaîtront ici.</p>
      </div>
    `;
  }
  
  return allAssigned.map(item => {
    const startDate = new Date(item.startAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const endDate = new Date(item.endAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    
    return `
      <div style="
        padding: 12px;
        background: var(--card-hover);
        border-radius: var(--radius-md);
        border-left: 3px solid var(--success);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      ">
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px;">
            ${item.title || 'Thème sans titre'}
            <span class="badge" style="background:var(--success); color:white; margin-left:8px; font-size:0.7rem;">Assigné</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--muted);">
            ${item.className || 'Classe inconnue'} • ${startDate} → ${endDate}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Rend la liste des thèmes publiés disponibles
 * @returns {string}
 */
function renderPublishedThemes() {
  // Récupérer tous les thèmes publiés (pour toutes les classes)
  // Pour la démo, on prend les premières classes disponibles
  const classIds = ['terminale_2_spe_math', 'terminale_s1', 'terminale_l', 'terminale_es2'];
  const allPublished = [];
  
  classIds.forEach(classId => {
    const themes = getPublishedThemesByClass(classId);
    themes.forEach(theme => {
      // Éviter les doublons
      if (!allPublished.find(t => t.id === theme.id)) {
        allPublished.push({ ...theme, classId });
      }
    });
  });
  
  if (allPublished.length === 0) {
    return `
      <div style="text-align: center; padding: 24px; color: var(--muted);">
        <div style="font-size: 2rem; margin-bottom: 8px;">📭</div>
        <p>Aucun thème publié disponible pour le moment.</p>
        <p style="font-size: 0.85rem; margin-top: 4px;">Les thèmes publiés par le directeur apparaîtront ici.</p>
      </div>
    `;
  }
  
  return allPublished.map(theme => `
    <div style="
      padding: 12px;
      background: var(--card-hover);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--accent);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    ">
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 4px;">
          ${theme.title}
          ${theme.origin === 'ai_theme_studio' ? '<span class="badge" style="background:var(--accent); color:white; margin-left:8px; font-size:0.7rem;">IA</span>' : ''}
        </div>
        <div style="font-size: 0.85rem; color: var(--muted);">
          ${theme.subject || 'Matière non spécifiée'} • ${theme.author || 'Auteur inconnu'}
        </div>
        ${theme.classes && theme.classes.length > 0 ? `
          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
            ${theme.classes.map(c => `<span class="badge ghost" style="font-size:0.7rem;">${c.label || c}</span>`).join('')}
          </div>
        ` : ''}
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${curriculumData.periods.map((period, idx) => `
          <button class="btn ghost" style="font-size: 0.8rem;" data-add-theme="${theme.id}" data-period="${period.id}" data-period-index="${idx}">
            + ${period.name}
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');
}

/**
 * Configure les event listeners
 */
function setupCurriculumEventListeners() {
  // Sélecteurs de matière (pour démo visuelle)
  const subjectBtns = document.querySelectorAll('.subject-btn');
  subjectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Retirer l'état actif de tous
      subjectBtns.forEach(b => b.classList.remove('active'));
      // Activer le bouton cliqué
      btn.classList.add('active');
      
      // Message informatif
      const subjectId = btn.dataset.subject;
      console.log('[Curriculum] Changement de matière:', subjectId);
      
      // Dans une vraie implémentation, on rechargerait les séquences de cette matière
    });
  });
  
  // Boutons d'ajout de thème à une période
  document.querySelectorAll('[data-add-theme]').forEach(btn => {
    btn.addEventListener('click', () => {
      const themeId = btn.dataset.addTheme;
      const periodId = btn.dataset.period;
      const periodIndex = Number(btn.dataset.periodIndex);
      
      // Récupérer le thème depuis le store
      const classIds = ['terminale_2_spe_math', 'terminale_s1', 'terminale_l', 'terminale_es2'];
      let theme = null;
      for (const classId of classIds) {
        const themes = getPublishedThemesByClass(classId);
        theme = themes.find(t => t.id === themeId);
        if (theme) break;
      }
      
      if (!theme) {
        alert('Thème introuvable');
        return;
      }
      
      // Ajouter le thème à la période (simulation)
      if (curriculumData && curriculumData.periods && curriculumData.periods[periodIndex]) {
        const period = curriculumData.periods[periodIndex];
        const newSequence = {
          id: `seq-${Date.now()}`,
          title: theme.title,
          duration: '2-3 semaines',
          status: 'planned',
          skills: ['Raisonner', 'Appliquer'],
          origin: 'ai_theme_studio',
          themeId: theme.id
        };
        
        period.sequences.push(newSequence);
        
        // Re-rendre le curriculum
        renderCurriculumContent(document.getElementById('view-curriculum-builder'));
        
        // Notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 80px;
          right: 20px;
          background: var(--success, #16a34a);
          color: white;
          padding: 12px 20px;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 2000;
          animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = `✅ Thème "${theme.title}" ajouté à ${period.name} (démo)`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.animation = 'slideOut 0.3s ease-out';
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }
    });
  });
}

window.renderCurriculumView = renderCurriculumView;
export default { renderCurriculumView };
