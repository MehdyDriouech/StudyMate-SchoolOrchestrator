/**
 * View Library - Bibliothèque de contenus pédagogiques
 */

import {
  loadLibraryResources,
  searchLibraryResources,
  getLibraryResource,
  rateLibraryResource,
  importToCurriculum,
  importToAIStudio,
  getClassesForImport,
  getSubjects,
  getLevels,
  canRateResources,
  canImportResources
} from '../features-control/feature-library.js';
import { setCurrentTheme } from '../features-control/feature-ai-theme-studio.js';
import { navigateTo } from '../../app.js';
import { loadCurriculumData } from '../features-control/feature-curriculum-builder.js';

let allResources = [];
let filteredResources = [];
let currentFilters = {
  text: '',
  subject: '',
  level: '',
  format: '',
  sortBy: 'popular' // popular, rating, recent
};
let detailResourceId = null;

/**
 * Rend la vue de la bibliothèque
 * @param {HTMLElement} container - Conteneur de la vue
 */
export async function renderLibraryView(container) {
  console.log('[View Library] Rendu de la bibliothèque');
  
  // Afficher un loader
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px; animation: pulse 1.5s ease-in-out infinite;">
          ⏳
        </div>
        <p style="color: var(--muted);">Chargement de la bibliothèque...</p>
      </div>
    </div>
  `;
  
  try {
    // Charger les ressources
    allResources = await loadLibraryResources();
    filteredResources = [...allResources];
    
    // Rendre le contenu
    renderLibraryContent(container);
    
  } catch (error) {
    console.error('[View Library] Erreur:', error);
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
 * Rend le contenu principal de la bibliothèque
 * @param {HTMLElement} container - Conteneur
 */
function renderLibraryContent(container) {
  const subjects = getSubjects();
  const levels = getLevels();
  const canImport = canImportResources();
  const canRate = canRateResources();
  
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 24px auto; padding: 0 16px;">
      <!-- En-tête -->
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          📚 Bibliothèque de contenus
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Parcourez et importez des contenus pédagogiques validés et publiés
        </p>
      </div>
      
      <!-- Bandeau de filtres -->
      <div class="card" style="margin-bottom: 24px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 12px;">
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">Matière</label>
            <select id="filter-subject" class="input" style="width: 100%;">
              <option value="">Toutes les matières</option>
              ${subjects.map(s => `<option value="${s}" ${currentFilters.subject === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">Niveau</label>
            <select id="filter-level" class="input" style="width: 100%;">
              <option value="">Tous les niveaux</option>
              ${levels.map(l => `<option value="${l}" ${currentFilters.level === l ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">Type de contenu</label>
            <select id="filter-format" class="input" style="width: 100%;">
              <option value="">Tous les types</option>
              <option value="quiz" ${currentFilters.format === 'quiz' ? 'selected' : ''}>Quiz</option>
              <option value="flashcards" ${currentFilters.format === 'flashcards' ? 'selected' : ''}>Flashcards</option>
              <option value="revision_sheet" ${currentFilters.format === 'revision_sheet' ? 'selected' : ''}>Fiche de révision</option>
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.9rem;">Rechercher</label>
            <input 
              type="text" 
              id="filter-text" 
              class="input" 
              placeholder="Mots-clés..."
              value="${escapeHtml(currentFilters.text)}"
              style="width: 100%;"
            />
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-weight: 500; font-size: 0.9rem;">Trier par :</label>
            <select id="sort-by" class="input" style="width: auto;">
              <option value="popular" ${currentFilters.sortBy === 'popular' ? 'selected' : ''}>Plus populaires</option>
              <option value="rating" ${currentFilters.sortBy === 'rating' ? 'selected' : ''}>Mieux notés</option>
              <option value="recent" ${currentFilters.sortBy === 'recent' ? 'selected' : ''}>Plus récents</option>
            </select>
          </div>
          <div style="color: var(--muted); font-size: 0.9rem;">
            ${filteredResources.length} ressource${filteredResources.length > 1 ? 's' : ''} trouvée${filteredResources.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>
      
      <!-- Liste des ressources -->
      <div id="library-resources-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; margin-bottom: 32px;">
        ${renderResourcesList()}
      </div>
      
      <!-- Message si aucune ressource -->
      ${filteredResources.length === 0 ? `
        <div class="card" style="text-align: center; padding: 60px 20px;">
          <div style="font-size: 3rem; margin-bottom: 16px;">🔍</div>
          <h3>Aucune ressource trouvée</h3>
          <p style="color: var(--muted); margin-top: 12px;">
            Essayez de modifier vos critères de recherche.
          </p>
        </div>
      ` : ''}
    </div>
    
    <!-- Modale de détail -->
    <div id="library-detail-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 3000; overflow-y: auto; padding: 20px;">
      <div style="max-width: 900px; margin: 40px auto; background: var(--card); border-radius: var(--radius-lg); padding: 24px; position: relative;">
        <button id="close-detail-modal" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--muted);">×</button>
        <div id="library-detail-content"></div>
      </div>
    </div>
    
    <!-- Modale d'import curriculum -->
    <div id="import-curriculum-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 3000; overflow-y: auto; padding: 20px;">
      <div style="max-width: 500px; margin: 40px auto; background: var(--card); border-radius: var(--radius-lg); padding: 24px; position: relative;">
        <button id="close-import-curriculum-modal" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--muted);">×</button>
        <h2 style="margin-bottom: 20px;">Importer dans un cours</h2>
        <div id="import-curriculum-form"></div>
      </div>
    </div>
    
    <!-- Modale de notation -->
    <div id="rate-resource-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 3000; overflow-y: auto; padding: 20px;">
      <div style="max-width: 500px; margin: 40px auto; background: var(--card); border-radius: var(--radius-lg); padding: 24px; position: relative;">
        <button id="close-rate-modal" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--muted);">×</button>
        <h2 style="margin-bottom: 20px;">Noter et commenter</h2>
        <div id="rate-resource-form"></div>
      </div>
    </div>
  `;
  
  // Configurer les event listeners
  setupLibraryEventListeners(container);
}

/**
 * Rend la liste des ressources
 * @returns {string}
 */
function renderResourcesList() {
  if (filteredResources.length === 0) return '';
  
  return filteredResources.map(resource => `
    <div class="card" style="display: flex; flex-direction: column; height: 100%;">
      <div style="flex: 1;">
        <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 8px;">
          ${escapeHtml(resource.title)}
        </h3>
        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
          <span class="badge" style="background: var(--accent); color: white; font-size: 0.75rem;">
            ${escapeHtml(resource.subject)}
          </span>
          <span class="badge ghost" style="font-size: 0.75rem;">
            ${escapeHtml(resource.level)}
          </span>
        </div>
        <p style="color: var(--muted); font-size: 0.9rem; line-height: 1.5; margin-bottom: 12px;">
          ${escapeHtml(resource.description.substring(0, 120))}${resource.description.length > 120 ? '...' : ''}
        </p>
        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
          ${resource.formats.map(format => {
            const icons = { quiz: '❓', flashcards: '🎴', revision_sheet: '📄' };
            return `<span class="badge ghost" style="font-size: 0.7rem;">${icons[format] || format}</span>`;
          }).join('')}
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <span style="color: var(--muted); font-size: 0.85rem;">⭐</span>
          <span style="font-weight: 600; font-size: 0.9rem;">${resource.avgRating.toFixed(1)}</span>
          <span style="color: var(--muted); font-size: 0.85rem;">(${resource.ratingsCount} avis)</span>
          <span style="margin-left: auto; color: var(--muted); font-size: 0.85rem;">👥 ${resource.usageCount}</span>
        </div>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
        <button class="btn ghost" data-view-detail="${resource.id}" style="flex: 1; font-size: 0.85rem;">
          Voir détails
        </button>
        ${canImportResources() ? `
          <button class="btn primary" data-import="${resource.id}" style="flex: 1; font-size: 0.85rem;">
            Importer
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

/**
 * Configure les event listeners
 */
function setupLibraryEventListeners(container) {
  // Filtres
  const filterSubject = document.getElementById('filter-subject');
  const filterLevel = document.getElementById('filter-level');
  const filterFormat = document.getElementById('filter-format');
  const filterText = document.getElementById('filter-text');
  const sortBy = document.getElementById('sort-by');
  
  const applyFilters = () => {
    currentFilters.subject = filterSubject?.value || '';
    currentFilters.level = filterLevel?.value || '';
    currentFilters.format = filterFormat?.value || '';
    currentFilters.text = filterText?.value || '';
    currentFilters.sortBy = sortBy?.value || 'popular';
    
    performSearch();
  };
  
  filterSubject?.addEventListener('change', applyFilters);
  filterLevel?.addEventListener('change', applyFilters);
  filterFormat?.addEventListener('change', applyFilters);
  sortBy?.addEventListener('change', applyFilters);
  
  // Recherche avec debounce
  let searchTimeout;
  filterText?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300);
  });
  
  // Boutons "Voir détails"
  container.querySelectorAll('[data-view-detail]').forEach(btn => {
    btn.addEventListener('click', () => {
      const resourceId = btn.dataset.viewDetail;
      showResourceDetail(resourceId);
    });
  });
  
  // Boutons "Importer"
  container.querySelectorAll('[data-import]').forEach(btn => {
    btn.addEventListener('click', () => {
      const resourceId = btn.dataset.import;
      showImportCurriculumModal(resourceId);
    });
  });
  
  // Fermeture des modales
  document.getElementById('close-detail-modal')?.addEventListener('click', () => {
    document.getElementById('library-detail-modal').style.display = 'none';
  });
  
  document.getElementById('close-import-curriculum-modal')?.addEventListener('click', () => {
    document.getElementById('import-curriculum-modal').style.display = 'none';
  });
  
  document.getElementById('close-rate-modal')?.addEventListener('click', () => {
    document.getElementById('rate-resource-modal').style.display = 'none';
  });
  
  // Fermer en cliquant à l'extérieur
  document.getElementById('library-detail-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'library-detail-modal') {
      e.target.style.display = 'none';
    }
  });
  
  document.getElementById('import-curriculum-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'import-curriculum-modal') {
      e.target.style.display = 'none';
    }
  });
  
  document.getElementById('rate-resource-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'rate-resource-modal') {
      e.target.style.display = 'none';
    }
  });
}

/**
 * Effectue la recherche et le tri
 */
async function performSearch() {
  try {
    filteredResources = await searchLibraryResources({
      text: currentFilters.text,
      subject: currentFilters.subject,
      level: currentFilters.level,
      format: currentFilters.format
    });
    
    // Trier
    if (currentFilters.sortBy === 'popular') {
      filteredResources.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    } else if (currentFilters.sortBy === 'rating') {
      filteredResources.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (currentFilters.sortBy === 'recent') {
      filteredResources.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    
    // Mettre à jour l'affichage
    const listContainer = document.getElementById('library-resources-list');
    if (listContainer) {
      listContainer.innerHTML = renderResourcesList();
      // Re-binder les event listeners
      setupResourceButtons();
    }
    
  } catch (error) {
    console.error('[View Library] Erreur recherche:', error);
  }
}

/**
 * Re-bind les boutons des ressources
 */
function setupResourceButtons() {
  const container = document.getElementById('library-resources-list');
  if (!container) return;
  
  container.querySelectorAll('[data-view-detail]').forEach(btn => {
    btn.addEventListener('click', () => {
      const resourceId = btn.dataset.viewDetail;
      showResourceDetail(resourceId);
    });
  });
  
  container.querySelectorAll('[data-import]').forEach(btn => {
    btn.addEventListener('click', () => {
      const resourceId = btn.dataset.import;
      showImportCurriculumModal(resourceId);
    });
  });
}

/**
 * Affiche les détails d'une ressource
 * @param {string} resourceId - ID de la ressource
 */
async function showResourceDetail(resourceId) {
  detailResourceId = resourceId;
  const resource = await getLibraryResource(resourceId);
  if (!resource) {
    alert('Ressource introuvable');
    return;
  }
  
  const modal = document.getElementById('library-detail-modal');
  const content = document.getElementById('library-detail-content');
  const canImport = canImportResources();
  const canRate = canRateResources();
  
  content.innerHTML = `
    <h2 style="margin-bottom: 16px;">${escapeHtml(resource.title)}</h2>
    
    <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
      <span class="badge" style="background: var(--accent); color: white;">${escapeHtml(resource.subject)}</span>
      <span class="badge ghost">${escapeHtml(resource.level)}</span>
      ${resource.tags.map(tag => `<span class="badge ghost" style="font-size: 0.75rem;">#${escapeHtml(tag)}</span>`).join('')}
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 1.1rem; margin-bottom: 8px;">Description</h3>
      <p style="color: var(--muted); line-height: 1.6;">${escapeHtml(resource.description)}</p>
    </div>
    
    <div style="margin-bottom: 20px; padding: 12px; background: var(--card-hover); border-radius: var(--radius-md);">
      <p style="color: var(--muted); font-size: 0.9rem; margin: 0;">
        <strong>Provenance :</strong> Issu d'un thème validé via AI Theme Studio / Qualité (démo).
      </p>
    </div>
    
    <!-- Aperçu rapide -->
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 1.1rem; margin-bottom: 12px;">Aperçu du contenu</h3>
      
      ${resource.formats.includes('quiz') && resource.quiz && resource.quiz.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.95rem; margin-bottom: 8px; color: var(--muted);">❓ Quiz (${resource.quiz.length} question${resource.quiz.length > 1 ? 's' : ''})</h4>
          ${resource.quiz.slice(0, 2).map((q, idx) => `
            <div style="padding: 12px; background: var(--card-hover); border-radius: var(--radius-md); margin-bottom: 8px;">
              <div style="font-weight: 500; margin-bottom: 6px;">${idx + 1}. ${escapeHtml(q.prompt)}</div>
              <div style="font-size: 0.85rem; color: var(--muted);">
                ${q.choices.slice(0, 2).map((c, i) => `${i + 1}. ${escapeHtml(c)}`).join(', ')}...
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${resource.formats.includes('flashcards') && resource.flashcards && resource.flashcards.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.95rem; margin-bottom: 8px; color: var(--muted);">🎴 Flashcards (${resource.flashcards.length} carte${resource.flashcards.length > 1 ? 's' : ''})</h4>
          ${resource.flashcards.slice(0, 2).map(card => `
            <div style="padding: 12px; background: var(--card-hover); border-radius: var(--radius-md); margin-bottom: 8px;">
              <div style="font-weight: 500; margin-bottom: 4px;">${escapeHtml(card.front)}</div>
              <div style="font-size: 0.85rem; color: var(--muted);">→ ${escapeHtml(card.back.substring(0, 60))}...</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${resource.formats.includes('revision_sheet') && resource.revision_sheet && resource.revision_sheet.blocks && resource.revision_sheet.blocks.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.95rem; margin-bottom: 8px; color: var(--muted);">📄 Fiche de révision</h4>
          <div style="padding: 12px; background: var(--card-hover); border-radius: var(--radius-md);">
            ${resource.revision_sheet.blocks.slice(0, 2).map(block => `
              <div style="margin-bottom: 8px;">
                ${block.type === 'title' ? `<strong>${escapeHtml(block.text)}</strong>` : `<div style="color: var(--muted);">${escapeHtml(block.text.substring(0, 150))}...</div>`}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
    
    <!-- Notes et commentaires -->
    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 1.1rem; margin-bottom: 12px;">
        Notes et commentaires
      </h3>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <span style="font-size: 1.5rem;">⭐</span>
        <span style="font-size: 1.2rem; font-weight: 600;">${resource.avgRating.toFixed(1)}</span>
        <span style="color: var(--muted);">(${resource.ratingsCount} avis)</span>
      </div>
      
      <div style="max-height: 300px; overflow-y: auto;">
        ${resource.comments && resource.comments.length > 0 ? `
          ${resource.comments.map(comment => `
            <div style="padding: 12px; background: var(--card-hover); border-radius: var(--radius-md); margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
                <div>
                  <strong>${escapeHtml(comment.authorName)}</strong>
                  <span class="badge ghost" style="font-size: 0.7rem; margin-left: 6px;">${escapeHtml(comment.authorRole)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  ${'⭐'.repeat(comment.rating)}
                </div>
              </div>
              <p style="color: var(--muted); font-size: 0.9rem; margin: 0 0 4px 0;">${escapeHtml(comment.comment)}</p>
              <div style="font-size: 0.75rem; color: var(--muted);">
                ${formatDate(comment.createdAt)}
              </div>
            </div>
          `).join('')}
        ` : `
          <p style="color: var(--muted); font-style: italic;">Aucun commentaire pour le moment.</p>
        `}
      </div>
    </div>
    
    <!-- Boutons d'action -->
    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px;">
      ${canImport ? `
        <button class="btn primary" id="btn-import-curriculum-detail" data-resource-id="${resource.id}">
          📚 Importer dans un cours
        </button>
        <button class="btn success" id="btn-import-ai-studio-detail" data-resource-id="${resource.id}">
          🎨 Importer dans AI Theme Studio
        </button>
      ` : ''}
      ${canRate ? `
        <button class="btn ghost" id="btn-rate-resource-detail" data-resource-id="${resource.id}">
          ⭐ Noter et commenter
        </button>
      ` : ''}
    </div>
  `;
  
  modal.style.display = 'block';
  
  // Event listeners pour les boutons dans la modale
  document.getElementById('btn-import-curriculum-detail')?.addEventListener('click', () => {
    showImportCurriculumModal(resource.id);
  });
  
  document.getElementById('btn-import-ai-studio-detail')?.addEventListener('click', async () => {
    await handleImportToAIStudio(resource.id);
  });
  
  document.getElementById('btn-rate-resource-detail')?.addEventListener('click', () => {
    showRateModal(resource.id);
  });
}

/**
 * Affiche la modale d'import dans le curriculum
 * @param {string} resourceId - ID de la ressource
 */
async function showImportCurriculumModal(resourceId) {
  const resource = await getLibraryResource(resourceId);
  if (!resource) {
    alert('Ressource introuvable');
    return;
  }
  
  const classes = getClassesForImport();
  const curriculumData = await loadCurriculumData();
  const periods = curriculumData.periods || [];
  
  const modal = document.getElementById('import-curriculum-modal');
  const form = document.getElementById('import-curriculum-form');
  
  form.innerHTML = `
    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 6px; font-weight: 500;">Contenu à importer</label>
      <div class="card" style="padding: 12px; background: var(--card-hover);">
        <strong>${escapeHtml(resource.title)}</strong>
        <div style="font-size: 0.85rem; color: var(--muted); margin-top: 4px;">
          ${escapeHtml(resource.subject)} • ${escapeHtml(resource.level)}
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 6px; font-weight: 500;">Classe</label>
      <select id="import-class" class="input" style="width: 100%;">
        <option value="">Sélectionner une classe</option>
        ${classes.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
      </select>
    </div>
    
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 6px; font-weight: 500;">Période</label>
      <select id="import-period" class="input" style="width: 100%;">
        <option value="">Sélectionner une période</option>
        ${periods.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
      </select>
    </div>
    
    <div style="display: flex; gap: 12px;">
      <button class="btn ghost" id="cancel-import-curriculum">Annuler</button>
      <button class="btn primary" id="confirm-import-curriculum" data-resource-id="${resourceId}">
        Confirmer l'import
      </button>
    </div>
  `;
  
  modal.style.display = 'block';
  
  document.getElementById('cancel-import-curriculum')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  document.getElementById('confirm-import-curriculum')?.addEventListener('click', async () => {
    const classId = document.getElementById('import-class')?.value;
    const period = document.getElementById('import-period')?.value;
    
    if (!classId || !period) {
      alert('Veuillez sélectionner une classe et une période');
      return;
    }
    
    await handleImportToCurriculum(resourceId, classId, period);
  });
}

/**
 * Gère l'import dans le curriculum
 */
async function handleImportToCurriculum(resourceId, classId, period) {
  try {
    const result = await importToCurriculum(resourceId, classId, period);
    
    // Fermer la modale
    document.getElementById('import-curriculum-modal').style.display = 'none';
    
    // Afficher une notification
    showNotification(result.message || 'Contenu importé avec succès (démo)', 'success');
    
    // Recharger les ressources pour mettre à jour usageCount
    allResources = await loadLibraryResources();
    performSearch();
    
  } catch (error) {
    console.error('[View Library] Erreur import curriculum:', error);
    alert('Erreur lors de l\'import: ' + error.message);
  }
}

/**
 * Gère l'import dans AI Theme Studio
 */
async function handleImportToAIStudio(resourceId) {
  try {
    const result = await importToAIStudio(resourceId);
    
    // Charger le thème dans AI Studio
    setCurrentTheme(result.theme);
    
    // Fermer la modale de détail si ouverte
    document.getElementById('library-detail-modal').style.display = 'none';
    
    // Afficher une notification
    showNotification(result.message || 'Contenu importé dans AI Theme Studio (démo)', 'success');
    
    // Rediriger vers AI Theme Studio
    setTimeout(() => {
      navigateTo('ai-theme-studio');
    }, 1000);
    
  } catch (error) {
    console.error('[View Library] Erreur import AI Studio:', error);
    alert('Erreur lors de l\'import: ' + error.message);
  }
}

/**
 * Affiche la modale de notation
 * @param {string} resourceId - ID de la ressource
 */
function showRateModal(resourceId) {
  const modal = document.getElementById('rate-resource-modal');
  const form = document.getElementById('rate-resource-form');
  
  form.innerHTML = `
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 500;">Note (1-5 étoiles)</label>
      <div id="rating-stars" style="display: flex; gap: 8px; margin-bottom: 12px;">
        ${[1, 2, 3, 4, 5].map(i => `
          <button class="rating-star" data-rating="${i}" style="
            background: none;
            border: none;
            font-size: 2rem;
            cursor: pointer;
            color: var(--muted);
            transition: color 0.2s;
          ">⭐</button>
        `).join('')}
      </div>
      <input type="hidden" id="selected-rating" value="0" />
    </div>
    
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 500;">Commentaire (max 250 caractères)</label>
      <textarea 
        id="rating-comment" 
        class="input" 
        rows="4" 
        maxlength="250"
        placeholder="Votre avis sur ce contenu..."
        style="width: 100%;"
      ></textarea>
      <div style="font-size: 0.85rem; color: var(--muted); margin-top: 4px; text-align: right;">
        <span id="comment-length">0</span>/250
      </div>
    </div>
    
    <div style="display: flex; gap: 12px;">
      <button class="btn ghost" id="cancel-rate">Annuler</button>
      <button class="btn primary" id="submit-rate" data-resource-id="${resourceId}">
        Envoyer
      </button>
    </div>
  `;
  
  modal.style.display = 'block';
  
  let selectedRating = 0;
  
  // Gestion des étoiles
  form.querySelectorAll('.rating-star').forEach((star, index) => {
    star.addEventListener('click', () => {
      selectedRating = index + 1;
      document.getElementById('selected-rating').value = selectedRating;
      
      // Mettre à jour l'affichage
      form.querySelectorAll('.rating-star').forEach((s, i) => {
        s.style.color = i < selectedRating ? 'var(--warning)' : 'var(--muted)';
      });
    });
    
    star.addEventListener('mouseenter', () => {
      const hoverRating = index + 1;
      form.querySelectorAll('.rating-star').forEach((s, i) => {
        s.style.color = i < hoverRating ? 'var(--warning)' : 'var(--muted)';
      });
    });
  });
  
  form.querySelector('#rating-stars')?.addEventListener('mouseleave', () => {
    form.querySelectorAll('.rating-star').forEach((s, i) => {
      s.style.color = i < selectedRating ? 'var(--warning)' : 'var(--muted)';
    });
  });
  
  // Compteur de caractères
  const commentTextarea = form.querySelector('#rating-comment');
  const commentLength = form.querySelector('#comment-length');
  commentTextarea?.addEventListener('input', () => {
    if (commentLength) {
      commentLength.textContent = commentTextarea.value.length;
    }
  });
  
  document.getElementById('cancel-rate')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  document.getElementById('submit-rate')?.addEventListener('click', async () => {
    const rating = parseInt(document.getElementById('selected-rating')?.value || '0');
    const comment = document.getElementById('rating-comment')?.value || '';
    
    if (rating === 0) {
      alert('Veuillez sélectionner une note');
      return;
    }
    
    await handleRateResource(resourceId, rating, comment);
  });
}

/**
 * Gère la notation d'une ressource
 */
async function handleRateResource(resourceId, rating, comment) {
  try {
    const result = await rateLibraryResource(resourceId, rating, comment);
    
    // Fermer la modale
    document.getElementById('rate-resource-modal').style.display = 'none';
    
    // Afficher une notification
    showNotification('Votre avis a été enregistré (démo)', 'success');
    
    // Recharger les ressources
    allResources = await loadLibraryResources();
    
    // Si la modale de détail est ouverte, la mettre à jour
    if (detailResourceId === resourceId) {
      showResourceDetail(resourceId);
    } else {
      performSearch();
    }
    
  } catch (error) {
    console.error('[View Library] Erreur notation:', error);
    alert('Erreur lors de l\'enregistrement: ' + error.message);
  }
}

/**
 * Affiche une notification
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${type === 'success' ? 'var(--success, #16a34a)' : 'var(--accent)'};
    color: white;
    padding: 12px 20px;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 4000;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Utilitaires
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Export global pour app.js
window.renderLibraryView = renderLibraryView;
export default { renderLibraryView };

