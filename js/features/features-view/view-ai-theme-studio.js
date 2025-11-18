/**
 * View AI Theme Studio - Interface de génération/édition de thèmes IA (démo)
 */

import {
  getAvailableClasses,
  getCurrentTheme,
  updateThemeMeta,
  updateThemePart,
  generateThemeFromDescription,
  saveThemeLocally,
  getSavedThemes,
  submitThemeToQuality,
  saveThemeAssignment,
  publishThemeForClass,
  getCurrentThemeAssignments
} from '../features-control/feature-ai-theme-studio.js';
import { navigateTo } from '../../app.js';

let viewContainer = null;
let uiState = {
  activeTab: 'quiz',
  isGenerating: false,
  isSaving: false
};
let classesCache = getAvailableClasses();

export function renderAiThemeStudioView(container) {
  viewContainer = container;
  classesCache = getAvailableClasses();
  const theme = getCurrentTheme();

  container.innerHTML = getBaseTemplate(theme);

  bindStepOneInputs(theme);
  bindContentTypeInputs(theme);
  bindGenerateButton();
  bindSaveButton();
  bindSubmitQualityButton();
  bindAssignmentButtons();
  renderThemeSummary(theme);
  renderEditorArea(theme);
  renderSavedThemes();
  renderAssignmentsList();
}

function getBaseTemplate(theme) {
  return `
    <div class="ai-theme-studio" style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <div class="card" style="margin-bottom: 20px; background: linear-gradient(120deg, rgba(14,165,233,0.12), rgba(59,130,246,0.12)); border: 1px solid rgba(14,165,233,0.4);">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="font-size: 1.3rem; font-weight: 700;">
            ✨ AI Theme Studio (démo)
          </div>
          <p style="color: var(--muted); line-height: 1.5;">
            Décrivez un thème pédagogique, sélectionnez les contenus à générer et retouchez les propositions de l'IA avant de les partager avec vos classes.
          </p>
        </div>
      </div>

      <div class="ai-theme-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 20px;">
        <div class="card" id="ai-theme-step1">
          <div class="ai-theme-step-title">Étape 1 · Description du thème</div>
          <label class="ai-theme-label">Titre / Sujet</label>
          <input id="ai-theme-title" type="text" class="input" placeholder="Ex : Math appliqués – Suites et séries" value="${escapeHtml(theme.title)}" />

          <label class="ai-theme-label" style="margin-top: 16px;">Description / Contexte</label>
          <textarea id="ai-theme-description" class="input" rows="4" placeholder="Précisez les objectifs, notions clés, attentes...">${escapeHtml(theme.description)}</textarea>

          <label class="ai-theme-label" style="margin-top: 16px;">Classes cibles</label>
          <div class="ai-theme-classes">
            ${classesCache.map(cls => `
              <label class="ai-theme-chip">
                <input type="checkbox" name="ai-theme-class" value="${cls.id}" ${theme.classes.some(c => c.id === cls.id) ? 'checked' : ''} />
                <span>${cls.label}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="card" id="ai-theme-step2">
          <div class="ai-theme-step-title">Étape 2 · Types de contenus</div>
          <div class="ai-theme-checkboxes">
            ${renderContentTypeCheckbox('quiz', 'Quiz', theme)}
            ${renderContentTypeCheckbox('flashcards', 'Flashcards', theme)}
            ${renderContentTypeCheckbox('revision_sheet', 'Fiche de révision', theme)}
          </div>
          <div class="ai-theme-hint">
            Tous les contenus sont cochés par défaut pour maximiser la démo.
          </div>
        </div>
      </div>

      <div class="card" id="ai-theme-step3" style="margin-bottom: 20px;">
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;">
            <div>
              <div class="ai-theme-step-title">Étape 3 · Génération IA</div>
              <p style="color: var(--muted); margin-top: 4px;">Simulez un appel à l'IA pour obtenir une première version prête à éditer.</p>
            </div>
            <button class="btn primary" id="ai-theme-generate-btn">
              ⚡ Générer avec l’IA (démo)
            </button>
          </div>

          <div class="ai-theme-summary" id="ai-theme-summary"></div>
          <div id="ai-theme-feedback" class="ai-theme-feedback" aria-live="polite"></div>
        </div>
      </div>

      <div class="card" id="ai-theme-editor-card" style="margin-bottom: 20px;">
        <div class="ai-theme-step-title">Étape 4 · Édition fine</div>
        <div id="ai-theme-tabs" class="ai-theme-tabs"></div>
        <div id="ai-theme-editor-panel" class="ai-theme-panel"></div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 16px; flex-wrap: wrap; gap: 12px;">
          <div id="ai-theme-editor-status" style="font-size: 0.9rem; color: var(--muted);">
            ${theme.generatedAt ? `Dernière génération : ${formatDate(theme.generatedAt)}` : 'Pas encore généré'}
          </div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn ghost" id="ai-theme-refresh-editor">🔄 Recharger les données</button>
            <button class="btn success" id="ai-theme-save-btn">💾 Sauvegarder (démo)</button>
            <button class="btn primary" id="ai-theme-submit-quality-btn" ${!theme.id || theme.status === 'pending_review' ? 'disabled' : ''}>
              📤 Soumettre à validation qualité
            </button>
          </div>
        </div>
        <div id="ai-theme-save-feedback" class="ai-theme-feedback" aria-live="polite"></div>
      </div>

      <div class="card" id="ai-theme-targeting-card" style="margin-bottom: 20px;">
        <div class="ai-theme-step-title">Étape 5 · Ciblage & disponibilité</div>
        <p style="color: var(--muted); margin-bottom: 16px; font-size: 0.9rem;">
          Associez ce thème à une classe et définissez la période d'accessibilité pour les élèves.
        </p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px;">
          <div>
            <label class="ai-theme-label">Classe</label>
            <select id="ai-theme-assignment-class" class="input" style="width: 100%;">
              <option value="">Sélectionner une classe</option>
              ${classesCache.map(cls => `
                <option value="${cls.id}">${escapeHtml(cls.label)}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="ai-theme-label">Date de début</label>
            <input 
              type="date" 
              id="ai-theme-assignment-start" 
              class="input" 
              style="width: 100%;"
              value="${new Date().toISOString().split('T')[0]}"
            />
          </div>
          <div>
            <label class="ai-theme-label">Date de fin</label>
            <input 
              type="date" 
              id="ai-theme-assignment-end" 
              class="input" 
              style="width: 100%;"
              value="${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}"
            />
          </div>
          <div>
            <label class="ai-theme-label">Date de rendu (dueAt)</label>
            <input 
              type="date" 
              id="ai-theme-assignment-due" 
              class="input" 
              style="width: 100%;"
              value="${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}"
            />
            <div style="font-size: 0.75rem; color: var(--muted); margin-top: 4px;">
              Après cette date, le thème devient "Annales"
            </div>
          </div>
        </div>
        
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
          <button class="btn ghost" id="ai-theme-save-assignment-btn">
            💾 Enregistrer l'assignation (brouillon)
          </button>
          <button class="btn primary" id="ai-theme-publish-class-btn">
            🚀 Publier pour cette classe
          </button>
        </div>
        
        <div id="ai-theme-assignment-feedback" class="ai-theme-feedback" aria-live="polite"></div>
        
        <div id="ai-theme-assignments-list" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(148,163,184,0.3);">
          <div style="font-weight: 500; margin-bottom: 8px; font-size: 0.9rem;">Assignations existantes :</div>
          <div id="ai-theme-assignments-content" style="font-size: 0.85rem; color: var(--muted);">
            Aucune assignation pour le moment.
          </div>
        </div>
      </div>

      <div class="card" id="ai-theme-library-card">
        <div class="ai-theme-step-title">Bibliothèque locale</div>
        <p style="color: var(--muted); margin-bottom: 12px;">Les thèmes sauvegardés apparaissent ici (stockage en mémoire uniquement).</p>
        <div id="ai-theme-saved-list"></div>
      </div>
    </div>

    <style>
      .ai-theme-step-title { font-weight: 600; font-size: 1rem; margin-bottom: 8px; }
      .ai-theme-label { font-weight: 500; font-size: 0.9rem; }
      .ai-theme-classes { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
      .ai-theme-chip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(148, 163, 184, 0.4); border-radius: 999px; padding: 6px 12px; font-size: 0.85rem; cursor: pointer; }
      .ai-theme-chip input { accent-color: var(--accent); }
      .ai-theme-checkboxes { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
      .ai-theme-checkboxes label { display: flex; align-items: center; gap: 10px; font-weight: 500; }
      .ai-theme-checkboxes input { width: 18px; height: 18px; accent-color: var(--accent); }
      .ai-theme-hint { font-size: 0.85rem; color: var(--muted); margin-top: 16px; }
      .ai-theme-summary { background: rgba(59, 130, 246, 0.05); border: 1px dashed rgba(59, 130, 246, 0.4); border-radius: var(--radius-md); padding: 12px; font-size: 0.9rem; }
      .ai-theme-feedback { min-height: 20px; font-size: 0.9rem; }
      .ai-theme-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
      .ai-theme-tabs button.active { background: var(--btn-bg); color: var(--btn-fg); }
      .ai-theme-panel { border: 1px solid rgba(148,163,184,0.3); border-radius: var(--radius-md); padding: 16px; background: rgba(15,23,42,0.02); min-height: 200px; }
      .ai-theme-block { border: 1px solid rgba(148,163,184,0.4); border-radius: var(--radius-md); padding: 12px; margin-bottom: 12px; background: white; }
      .ai-theme-block h4 { margin: 0 0 8px 0; font-size: 0.95rem; }
      .ai-theme-choice { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
      .ai-theme-choice input[type="text"] { flex: 1; }
      .ai-theme-saved-item { padding: 8px 0; border-bottom: 1px solid rgba(148,163,184,0.3); }
      .ai-theme-saved-item:last-child { border-bottom: none; }
      @media (max-width: 640px) {
        #ai-theme-editor-card { padding: 16px; }
      }
    </style>
  `;
}

function bindStepOneInputs(theme) {
  const titleInput = viewContainer.querySelector('#ai-theme-title');
  const descriptionInput = viewContainer.querySelector('#ai-theme-description');

  if (titleInput) {
    titleInput.addEventListener('input', e => {
      updateThemeMeta({ title: e.target.value });
      renderThemeSummary(getCurrentTheme());
    });
  }

  if (descriptionInput) {
    descriptionInput.addEventListener('input', e => {
      updateThemeMeta({ description: e.target.value });
    });
  }

  viewContainer.querySelectorAll('input[name="ai-theme-class"]').forEach(input => {
    input.addEventListener('change', handleClassSelection);
  });
}

function bindContentTypeInputs(theme) {
  viewContainer.querySelectorAll('input[name="ai-theme-content"]').forEach(input => {
    input.addEventListener('change', () => {
      const contentTypes = { ...getCurrentTheme().contentTypes };
      contentTypes[input.value] = input.checked;
      updateThemeMeta({ contentTypes });
    });
  });
}

function bindGenerateButton() {
  const button = viewContainer.querySelector('#ai-theme-generate-btn');
  if (!button) return;

  button.addEventListener('click', async () => {
    if (uiState.isGenerating) return;

    const theme = getCurrentTheme();
    if (!theme.title.trim() || !theme.description.trim()) {
      renderFeedback('Veuillez renseigner un titre et une description avant de lancer la génération.', 'error');
      return;
    }

    uiState.isGenerating = true;
    button.disabled = true;
    button.textContent = '⏳ Génération...';
    renderFeedback('Communication avec le FakeRouter...', 'info');

    try {
      const payload = {
        title: theme.title,
        description: theme.description,
        classes: theme.classes,
        contentTypes: theme.contentTypes
      };
      const generatedTheme = await generateThemeFromDescription(payload);

      hydrateFormFields(generatedTheme);
      renderThemeSummary(generatedTheme);
      renderEditorArea(generatedTheme);
      renderFeedback('Thème généré ! Vous pouvez éditer chaque section.', 'success');
    } catch (error) {
      console.error('[AI Theme Studio] Erreur génération', error);
      renderFeedback('Impossible de générer le thème (voir console).', 'error');
    } finally {
      uiState.isGenerating = false;
      button.disabled = false;
      button.textContent = '⚡ Générer avec l’IA (démo)';
    }
  });

  const refreshBtn = viewContainer.querySelector('#ai-theme-refresh-editor');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      renderEditorArea(getCurrentTheme());
      renderFeedback('Sections rechargées depuis l’état actuel.', 'info');
    });
  }
}

function bindSaveButton() {
  const button = viewContainer.querySelector('#ai-theme-save-btn');
  if (!button) return;

  button.addEventListener('click', () => {
    if (uiState.isSaving) return;

    uiState.isSaving = true;
    button.disabled = true;
    button.textContent = '💾 Sauvegarde...';

    const { success, message } = saveThemeLocally();
    const feedbackEl = viewContainer.querySelector('#ai-theme-save-feedback');
    if (feedbackEl) {
      feedbackEl.style.color = success ? 'var(--success, #16a34a)' : 'var(--danger, #dc2626)';
      feedbackEl.textContent = message;
    }

    renderSavedThemes();

    setTimeout(() => {
      uiState.isSaving = false;
      button.disabled = false;
      button.textContent = '💾 Sauvegarder (démo)';
    }, 600);
  });
}

function bindSubmitQualityButton() {
  const button = viewContainer.querySelector('#ai-theme-submit-quality-btn');
  if (!button) return;

  button.addEventListener('click', () => {
    const theme = getCurrentTheme();
    
    if (!theme.id) {
      renderFeedback('Veuillez d\'abord générer un thème avant de le soumettre.', 'error');
      return;
    }
    
    if (!theme.title.trim()) {
      renderFeedback('Le thème doit avoir un titre pour être soumis.', 'error');
      return;
    }
    
    if (theme.classes.length === 0) {
      renderFeedback('Veuillez sélectionner au moins une classe cible.', 'error');
      return;
    }

    try {
      const submitted = submitThemeToQuality(theme);
      
      // Mettre à jour le thème courant
      updateThemeMeta({ status: 'pending_review', submittedAt: submitted.submittedAt });
      
      // Désactiver le bouton
      button.disabled = true;
      button.textContent = '✅ Soumis à validation';
      
      renderFeedback('📤 Thème soumis à validation qualité (démo). Le directeur pédagogique va le réviser.', 'success');
      
      // Optionnel : afficher un lien vers la page Qualité
      setTimeout(() => {
        const feedbackEl = viewContainer.querySelector('#ai-theme-feedback');
        if (feedbackEl) {
          feedbackEl.innerHTML += `
            <div style="margin-top: 8px;">
              <button class="btn ghost" style="font-size: 0.85rem;" onclick="window.location.hash='quality'">
                → Voir dans Qualité
              </button>
            </div>
          `;
        }
      }, 500);
      
    } catch (error) {
      console.error('[AI Theme Studio] Erreur soumission', error);
      renderFeedback('Impossible de soumettre le thème (voir console).', 'error');
    }
  });
}

function bindAssignmentButtons() {
  const saveBtn = viewContainer.querySelector('#ai-theme-save-assignment-btn');
  const publishBtn = viewContainer.querySelector('#ai-theme-publish-class-btn');
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const classId = document.getElementById('ai-theme-assignment-class')?.value;
      const startAt = document.getElementById('ai-theme-assignment-start')?.value;
      const endAt = document.getElementById('ai-theme-assignment-end')?.value;
      const dueAt = document.getElementById('ai-theme-assignment-due')?.value;
      
      if (!classId) {
        renderAssignmentFeedback('Veuillez sélectionner une classe.', 'error');
        return;
      }
      
      if (!startAt || !endAt) {
        renderAssignmentFeedback('Veuillez renseigner les dates de début et de fin.', 'error');
        return;
      }
      
      if (new Date(startAt) > new Date(endAt)) {
        renderAssignmentFeedback('La date de fin doit être postérieure à la date de début.', 'error');
        return;
      }
      
      if (dueAt && (new Date(dueAt) < new Date(startAt) || new Date(dueAt) > new Date(endAt))) {
        renderAssignmentFeedback('La date de rendu doit être entre la date de début et la date de fin.', 'error');
        return;
      }
      
      try {
        const assignment = saveThemeAssignment(
          classId,
          new Date(startAt).toISOString(),
          new Date(endAt).toISOString(),
          dueAt ? new Date(dueAt).toISOString() : undefined
        );
        
        renderAssignmentFeedback('✅ Assignation enregistrée (brouillon – non visible élèves)', 'success');
        renderAssignmentsList();
        
      } catch (error) {
        console.error('[AI Theme Studio] Erreur enregistrement assignation', error);
        renderAssignmentFeedback('Erreur: ' + error.message, 'error');
      }
    });
  }
  
  if (publishBtn) {
    publishBtn.addEventListener('click', () => {
      const classId = document.getElementById('ai-theme-assignment-class')?.value;
      const startAt = document.getElementById('ai-theme-assignment-start')?.value;
      const endAt = document.getElementById('ai-theme-assignment-end')?.value;
      const dueAt = document.getElementById('ai-theme-assignment-due')?.value;
      
      if (!classId) {
        renderAssignmentFeedback('Veuillez sélectionner une classe.', 'error');
        return;
      }
      
      if (!startAt || !endAt) {
        renderAssignmentFeedback('Veuillez renseigner les dates de début et de fin.', 'error');
        return;
      }
      
      if (new Date(startAt) > new Date(endAt)) {
        renderAssignmentFeedback('La date de fin doit être postérieure à la date de début.', 'error');
        return;
      }
      
      if (dueAt && (new Date(dueAt) < new Date(startAt) || new Date(dueAt) > new Date(endAt))) {
        renderAssignmentFeedback('La date de rendu doit être entre la date de début et la date de fin.', 'error');
        return;
      }
      
      try {
        const published = publishThemeForClass(
          classId,
          new Date(startAt).toISOString(),
          new Date(endAt).toISOString(),
          dueAt ? new Date(dueAt).toISOString() : undefined
        );
        
        const classLabel = classesCache.find(c => c.id === classId)?.label || classId;
        const startDate = formatDateShort(startAt);
        const endDate = formatDateShort(endAt);
        const dueDate = dueAt ? formatDateShort(dueAt) : null;
        
        renderAssignmentFeedback(
          `🚀 Thème publié pour la classe ${classLabel} (période ${startDate} → ${endDate}${dueDate ? `, rendu le ${dueDate}` : ''})`,
          'success'
        );
        renderAssignmentsList();
        
      } catch (error) {
        console.error('[AI Theme Studio] Erreur publication', error);
        renderAssignmentFeedback('Erreur: ' + error.message, 'error');
      }
    });
  }
}

function renderAssignmentsList() {
  const container = viewContainer.querySelector('#ai-theme-assignments-content');
  if (!container) return;
  
  const assignments = getCurrentThemeAssignments(true); // Inclure les brouillons
  
  if (assignments.length === 0) {
    container.innerHTML = '<em>Aucune assignation pour le moment.</em>';
    return;
  }
  
  container.innerHTML = assignments.map(assignment => {
    const classLabel = classesCache.find(c => c.id === assignment.classId)?.label || assignment.classId;
    const statusBadge = assignment.status === 'published' 
      ? '<span class="badge" style="background: var(--success); color: white; font-size: 0.7rem;">Publié</span>'
      : '<span class="badge ghost" style="font-size: 0.7rem;">Brouillon</span>';
    const startDate = formatDateShort(assignment.startAt);
    const endDate = formatDateShort(assignment.endAt);
    const dueDate = assignment.dueAt ? formatDateShort(assignment.dueAt) : null;
    
    return `
      <div style="padding: 8px; background: var(--card-hover); border-radius: var(--radius-md); margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <strong>${escapeHtml(classLabel)}</strong>
          ${statusBadge}
        </div>
        <div style="font-size: 0.8rem; color: var(--muted);">
          ${startDate} → ${endDate}
        </div>
        ${dueDate ? `
          <div style="font-size: 0.75rem; color: var(--muted); margin-top: 2px;">
            Rendu : ${dueDate}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function renderAssignmentFeedback(message, type = 'info') {
  const feedbackEl = viewContainer.querySelector('#ai-theme-assignment-feedback');
  if (!feedbackEl) return;
  
  const colorMap = {
    info: 'var(--accent)',
    success: 'var(--success, #16a34a)',
    error: 'var(--danger, #dc2626)'
  };
  
  feedbackEl.style.color = colorMap[type] || colorMap.info;
  feedbackEl.textContent = message;
}

function formatDateShort(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function handleClassSelection() {
  const selectedIds = Array.from(viewContainer.querySelectorAll('input[name="ai-theme-class"]:checked')).map(input => input.value);
  const selectedClasses = classesCache.filter(cls => selectedIds.includes(cls.id));
  updateThemeMeta({ classes: selectedClasses });
  renderThemeSummary(getCurrentTheme());
}

function renderThemeSummary(theme) {
  const summary = viewContainer.querySelector('#ai-theme-summary');
  if (!summary) return;

  const classes = theme.classes.length
    ? theme.classes.map(c => c.label).join(', ')
    : 'Aucune classe sélectionnée';

  const types = Object.entries(theme.contentTypes || {})
    .filter(([, isOn]) => isOn)
    .map(([key]) => formatContentTypeLabel(key))
    .join(', ') || 'Aucun contenu';

  summary.innerHTML = `
    <strong>Résumé :</strong>
    <div><span style="color: var(--muted);">Titre :</span> ${theme.title || '—'}</div>
    <div><span style="color: var(--muted);">Disponible pour :</span> ${classes}</div>
    <div><span style="color: var(--muted);">Contenus générés :</span> ${types}</div>
    <div><span style="color: var(--muted);">Statut :</span> ${theme.status === 'non_publie_demo' ? 'Non publié / Démo' : 'Brouillon démo'}</div>
  `;
}

function renderEditorArea(theme) {
  const tabsContainer = viewContainer.querySelector('#ai-theme-tabs');
  const panelContainer = viewContainer.querySelector('#ai-theme-editor-panel');
  if (!tabsContainer || !panelContainer) return;

  const tabs = [
    { id: 'quiz', label: 'Quiz', count: theme.quiz.length },
    { id: 'flashcards', label: 'Flashcards', count: theme.flashcards.length },
    { id: 'revision_sheet', label: 'Fiche de révision', count: theme.revision_sheet?.blocks?.length || 0 }
  ];

  // Ajuster l'onglet actif si nécessaire
  if (!tabs.some(tab => tab.id === uiState.activeTab)) {
    uiState.activeTab = tabs[0].id;
  }

  tabsContainer.innerHTML = tabs.map(tab => `
    <button class="btn ghost ${uiState.activeTab === tab.id ? 'active' : ''}" data-ai-theme-tab="${tab.id}">
      ${tab.label} ${tab.count ? `<span class="badge">${tab.count}</span>` : ''}
    </button>
  `).join('');

  panelContainer.innerHTML = renderEditorPanel(theme, uiState.activeTab);

  tabsContainer.querySelectorAll('[data-ai-theme-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      uiState.activeTab = btn.dataset.aiThemeTab;
      renderEditorArea(getCurrentTheme());
    });
  });

  bindEditorInputs(uiState.activeTab);
}

function renderEditorPanel(theme, tabId) {
  if (tabId === 'quiz') {
    if (!theme.quiz.length) {
      return renderEmptyState('Aucun quiz pour le moment. Lancez une génération pour voir des suggestions.');
    }

    return theme.quiz.map((question, index) => `
      <div class="ai-theme-block">
        <h4>Question ${index + 1}</h4>
        <textarea class="input" rows="2" data-quiz-prompt="${question.id}">${escapeHtml(question.prompt || '')}</textarea>
        <div style="margin-top: 8px;">
          ${question.choices.map((choice, idx) => `
            <div class="ai-theme-choice">
              <input type="radio" name="quiz-answer-${question.id}" data-quiz-answer="${question.id}" value="${idx}" ${question.answer === idx ? 'checked' : ''} />
              <input type="text" class="input" value="${escapeHtml(choice)}" data-quiz-choice="${question.id}" data-choice-index="${idx}" placeholder="Proposition ${idx + 1}" />
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  if (tabId === 'flashcards') {
    if (!theme.flashcards.length) {
      return renderEmptyState('Aucune flashcard générée pour l’instant.');
    }

    return theme.flashcards.map((card, index) => `
      <div class="ai-theme-block">
        <h4>Carte ${index + 1}</h4>
        <label class="ai-theme-label">Recto</label>
        <textarea class="input" rows="2" data-flashcard-front="${card.id}">${escapeHtml(card.front || '')}</textarea>
        <label class="ai-theme-label" style="margin-top: 8px;">Verso</label>
        <textarea class="input" rows="3" data-flashcard-back="${card.id}">${escapeHtml(card.back || '')}</textarea>
      </div>
    `).join('');
  }

  if (tabId === 'revision_sheet') {
    const blocks = theme.revision_sheet?.blocks || [];
    if (!blocks.length) {
      return renderEmptyState('Ajoutez une fiche de révision en générant un thème.');
    }

    return blocks.map((block, index) => `
      <div class="ai-theme-block">
        <div style="display:flex; justify-content: space-between; align-items:center;">
          <h4>Bloc ${index + 1}</h4>
          <span class="badge ghost">${block.type}</span>
        </div>
        <textarea class="input" rows="${block.type === 'title' ? 1 : 4}" data-revision-block="${block.id}">${escapeHtml(block.text || '')}</textarea>
      </div>
    `).join('');
  }

  return renderEmptyState('Sélectionnez un onglet pour commencer.');
}

function bindEditorInputs(tabId) {
  if (tabId === 'quiz') {
    viewContainer.querySelectorAll('[data-quiz-prompt]').forEach(textarea => {
      textarea.addEventListener('input', () => {
        updateQuizQuestion(textarea.dataset.quizPrompt, { prompt: textarea.value });
      });
    });

    viewContainer.querySelectorAll('[data-quiz-choice]').forEach(input => {
      input.addEventListener('input', () => {
        updateQuizChoice(input.dataset.quizChoice, Number(input.dataset.choiceIndex), input.value);
      });
    });

    viewContainer.querySelectorAll('[data-quiz-answer]').forEach(radio => {
      radio.addEventListener('change', () => {
        updateQuizQuestion(radio.dataset.quizAnswer, { answer: Number(radio.value) });
      });
    });
  }

  if (tabId === 'flashcards') {
    viewContainer.querySelectorAll('[data-flashcard-front]').forEach(textarea => {
      textarea.addEventListener('input', () => {
        updateFlashcard(textarea.dataset.flashcardFront, { front: textarea.value });
      });
    });

    viewContainer.querySelectorAll('[data-flashcard-back]').forEach(textarea => {
      textarea.addEventListener('input', () => {
        updateFlashcard(textarea.dataset.flashcardBack, { back: textarea.value });
      });
    });
  }

  if (tabId === 'revision_sheet') {
    viewContainer.querySelectorAll('[data-revision-block]').forEach(textarea => {
      textarea.addEventListener('input', () => {
        updateRevisionBlock(textarea.dataset.revisionBlock, textarea.value);
      });
    });
  }
}

function updateQuizQuestion(questionId, changes) {
  const theme = getCurrentTheme();
  const updatedQuiz = theme.quiz.map(question => {
    if (question.id !== questionId) return question;
    return { ...question, ...changes };
  });
  updateThemePart('quiz', updatedQuiz);
}

function updateQuizChoice(questionId, choiceIndex, value) {
  const theme = getCurrentTheme();
  const updatedQuiz = theme.quiz.map(question => {
    if (question.id !== questionId) return question;
    const newChoices = [...question.choices];
    newChoices[choiceIndex] = value;
    return { ...question, choices: newChoices };
  });
  updateThemePart('quiz', updatedQuiz);
}

function updateFlashcard(cardId, changes) {
  const theme = getCurrentTheme();
  const updatedFlashcards = theme.flashcards.map(card => {
    if (card.id !== cardId) return card;
    return { ...card, ...changes };
  });
  updateThemePart('flashcards', updatedFlashcards);
}

function updateRevisionBlock(blockId, text) {
  const theme = getCurrentTheme();
  const blocks = theme.revision_sheet?.blocks?.map(block => {
    if (block.id !== blockId) return block;
    return { ...block, text };
  }) || [];
  updateThemePart('revision_sheet', { ...theme.revision_sheet, blocks });
}

function hydrateFormFields(theme) {
  const titleInput = viewContainer.querySelector('#ai-theme-title');
  const descriptionInput = viewContainer.querySelector('#ai-theme-description');

  if (titleInput) titleInput.value = theme.title || '';
  if (descriptionInput) descriptionInput.value = theme.description || '';

  viewContainer.querySelectorAll('input[name="ai-theme-class"]').forEach(input => {
    input.checked = theme.classes.some(cls => cls.id === input.value);
  });

  viewContainer.querySelectorAll('input[name="ai-theme-content"]').forEach(input => {
    input.checked = Boolean(theme.contentTypes?.[input.value]);
  });

  const statusEl = viewContainer.querySelector('#ai-theme-editor-status');
  if (statusEl) {
    statusEl.textContent = theme.generatedAt
      ? `Dernière génération : ${formatDate(theme.generatedAt)}`
      : 'Pas encore généré';
  }
}

function renderFeedback(message, type = 'info') {
  const feedbackEl = viewContainer.querySelector('#ai-theme-feedback');
  if (!feedbackEl) return;

  const colorMap = {
    info: 'var(--accent)',
    success: 'var(--success, #16a34a)',
    error: 'var(--danger, #dc2626)'
  };

  feedbackEl.style.color = colorMap[type] || colorMap.info;
  feedbackEl.textContent = message;
}

function renderSavedThemes() {
  const container = viewContainer.querySelector('#ai-theme-saved-list');
  if (!container) return;

  const saved = getSavedThemes();
  if (!saved.length) {
    container.innerHTML = '<em>Aucun thème enregistré pour le moment.</em>';
    return;
  }

  container.innerHTML = saved.slice(0, 4).map(theme => `
    <div class="ai-theme-saved-item">
      <strong>${escapeHtml(theme.title || 'Sans titre')}</strong>
      <div style="font-size: 0.85rem; color: var(--muted);">
        ${theme.classes.map(cls => cls.label).join(', ') || 'Classes non définies'}
      </div>
      <div style="font-size: 0.75rem; color: var(--muted);">
        Enregistré le ${formatDate(theme.savedAt || new Date())}
      </div>
    </div>
  `).join('');
}

function renderEmptyState(message) {
  return `
    <div style="text-align: center; padding: 24px; color: var(--muted);">
      ${message}
    </div>
  `;
}

function renderContentTypeCheckbox(key, label, theme) {
  const checked = theme?.contentTypes?.[key] !== false;
  return `
    <label>
      <input type="checkbox" name="ai-theme-content" value="${key}" ${checked ? 'checked' : ''} />
      ${label}
    </label>
  `;
}

function formatContentTypeLabel(key) {
  const map = {
    quiz: 'Quiz',
    flashcards: 'Flashcards',
    revision_sheet: 'Fiche de révision'
  };
  return map[key] || key;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

window.renderAiThemeStudioView = renderAiThemeStudioView;
export default { renderAiThemeStudioView };


