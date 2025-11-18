/**
 * View AI Theme Import - Interface d'import de PDF pour génération de thème
 */

import {
  importPDF,
  generateThemeFromPDFImport,
  openThemeInEditor
} from '../features-control/feature-ai-theme-import.js';
import {
  getLastImportedFileName,
  getLastExtractionText,
  getLastGeneratedThemeId,
  getActiveTab
} from '../features-control/store-ai-theme-studio.js';
import { navigateTo } from '../../app.js';

let viewContainer = null;
let uiState = {
  isImporting: false,
  isGenerating: false,
  importedFile: null,
  extractionText: null,
  generatedTheme: null
};

export function renderAiThemeImportView(container) {
  viewContainer = container;
  
  // Charger l'état depuis le store si disponible
  const lastFileName = getLastImportedFileName();
  const lastExtraction = getLastExtractionText();
  const lastThemeId = getLastGeneratedThemeId();
  
  if (lastFileName && lastExtraction) {
    uiState.importedFile = { name: lastFileName };
    uiState.extractionText = lastExtraction;
  }
  
  if (lastThemeId) {
    uiState.generatedTheme = { id: lastThemeId };
  }
  
  container.innerHTML = getBaseTemplate();
  
  bindTabSwitchers();
  bindFileInput();
  bindAnalyzeButton();
  bindGenerateButton();
  bindOpenEditorButton();
  
  // Afficher les données existantes si disponibles
  if (uiState.importedFile) {
    renderFileInfo();
  }
  if (uiState.extractionText) {
    renderExtractionPreview();
  }
  if (uiState.generatedTheme) {
    renderGeneratedTheme();
  }
}

function getBaseTemplate() {
  const activeTab = getActiveTab();
  
  return `
    <div class="ai-theme-import" style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
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

      <div class="card" style="margin-bottom: 20px; padding: 0;">
        <div class="ai-theme-tabs-main" style="display: flex; gap: 8px; border-bottom: 1px solid rgba(148,163,184,0.3); padding: 0 16px;">
          <button class="ai-theme-tab-main ${activeTab === 'manual' ? 'active' : ''}" data-tab="manual" style="padding: 12px 16px; border: none; background: transparent; cursor: pointer; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; margin-bottom: -1px;">
            ✏️ Création manuelle
          </button>
          <button class="ai-theme-tab-main ${activeTab === 'pdf' ? 'active' : ''}" data-tab="pdf" style="padding: 12px 16px; border: none; background: transparent; cursor: pointer; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; margin-bottom: -1px;">
            📄 Importer un PDF
          </button>
        </div>
        <div id="ai-theme-tab-content" style="padding: 16px;">
      
      <div class="card" style="margin-bottom: 20px; background: linear-gradient(120deg, rgba(14,165,233,0.12), rgba(59,130,246,0.12)); border: 1px solid rgba(14,165,233,0.4);">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div style="font-size: 1.3rem; font-weight: 700;">
            📄 Importer un PDF
          </div>
          <p style="color: var(--muted); line-height: 1.5;">
            Importez un fichier PDF pour générer automatiquement un thème pédagogique. Le contenu sera analysé par l'IA pour créer des quiz, flashcards et fiches de révision.
          </p>
        </div>
      </div>

      <div class="card" id="pdf-upload-card" style="margin-bottom: 20px;">
        <div class="ai-theme-step-title">Étape 1 · Import du PDF</div>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label class="ai-theme-label">Fichier PDF</label>
            <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
              <input type="file" id="pdf-file-input" accept=".pdf" style="display: none;" />
              <button class="btn primary" id="pdf-file-select-btn">
                📁 Sélectionner un fichier PDF
              </button>
              <span id="pdf-file-name" style="color: var(--muted); font-size: 0.9rem;">
                Aucun fichier sélectionné
              </span>
            </div>
          </div>
          <div id="pdf-file-info" style="display: none;">
            <div style="padding: 12px; background: rgba(59,130,246,0.1); border-radius: var(--radius-md); font-size: 0.9rem;">
              <strong>Fichier sélectionné :</strong> <span id="pdf-file-name-display"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="card" id="pdf-extraction-card" style="margin-bottom: 20px; display: none;">
        <div class="ai-theme-step-title">Étape 2 · Analyse du PDF</div>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div id="pdf-extraction-status" style="min-height: 20px;"></div>
          <button class="btn primary" id="pdf-analyze-btn" style="align-self: flex-start;">
            🔍 Analyser le PDF
          </button>
          <div id="pdf-extraction-preview" style="display: none;">
            <div style="padding: 16px; background: rgba(15,23,42,0.02); border: 1px solid rgba(148,163,184,0.3); border-radius: var(--radius-md);">
              <div style="font-weight: 500; margin-bottom: 8px;">Aperçu de l'extraction :</div>
              <div id="pdf-extraction-text" style="color: var(--muted); line-height: 1.6; font-size: 0.9rem; white-space: pre-wrap;"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card" id="pdf-generate-card" style="margin-bottom: 20px; display: none;">
        <div class="ai-theme-step-title">Étape 3 · Génération du thème</div>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <p style="color: var(--muted); font-size: 0.9rem;">
            L'IA va générer un thème complet avec quiz, flashcards et fiche de révision à partir du contenu extrait.
          </p>
          <button class="btn primary" id="pdf-generate-btn" style="align-self: flex-start;">
            ✨ Générer un thème
          </button>
          <div id="pdf-generation-status" style="min-height: 20px;"></div>
          <div id="pdf-generated-theme" style="display: none;">
            <div style="padding: 16px; background: linear-gradient(120deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1)); border: 1px solid rgba(16,185,129,0.3); border-radius: var(--radius-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div>
                  <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 4px;" id="generated-theme-title"></div>
                  <div style="font-size: 0.85rem; color: var(--muted);" id="generated-theme-description"></div>
                </div>
                <span class="badge" style="background: var(--success); color: white;">Généré</span>
              </div>
              <div style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
                <div style="font-size: 0.85rem; color: var(--muted);">
                  📊 <span id="generated-quiz-count">0</span> quiz
                </div>
                <div style="font-size: 0.85rem; color: var(--muted);">
                  🃏 <span id="generated-flashcards-count">0</span> flashcards
                </div>
                <div style="font-size: 0.85rem; color: var(--muted);">
                  📝 Fiche de révision
                </div>
              </div>
            </div>
            <div style="margin-top: 16px;">
              <button class="btn success" id="pdf-open-editor-btn" style="align-self: flex-start;">
                ✏️ Ouvrir dans l'éditeur
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="pdf-error-message" class="ai-theme-feedback" aria-live="polite" style="display: none;"></div>
        </div>
      </div>
    </div>

    <style>
      .ai-theme-step-title { font-weight: 600; font-size: 1rem; margin-bottom: 12px; }
      .ai-theme-label { font-weight: 500; font-size: 0.9rem; display: block; margin-bottom: 8px; }
      .ai-theme-feedback { min-height: 20px; font-size: 0.9rem; padding: 12px; border-radius: var(--radius-md); }
      .ai-theme-feedback.error { background: rgba(220,38,38,0.1); border: 1px solid rgba(220,38,38,0.3); color: var(--danger, #dc2626); }
      .ai-theme-feedback.success { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); color: var(--success, #16a34a); }
      .ai-theme-feedback.info { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); color: var(--accent); }
      .ai-theme-tabs-main { display: flex; gap: 8px; }
      .ai-theme-tab-main { padding: 12px 16px; border: none; background: transparent; cursor: pointer; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.2s; }
      .ai-theme-tab-main:hover { color: var(--accent); }
      .ai-theme-tab-main.active { color: var(--accent); border-bottom-color: var(--accent); }
    </style>
  `;
}

function bindTabSwitchers() {
  const tabButtons = viewContainer.querySelectorAll('.ai-theme-tab-main');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === 'manual') {
        // Naviguer vers l'onglet manuel
        navigateTo('teacher-content/studio?tab=manual');
      } else {
        // Naviguer vers l'onglet PDF
        navigateTo('teacher-content/studio?tab=pdf');
      }
    });
  });
}

function bindFileInput() {
  const fileInput = viewContainer.querySelector('#pdf-file-input');
  const selectBtn = viewContainer.querySelector('#pdf-file-select-btn');
  const fileNameSpan = viewContainer.querySelector('#pdf-file-name');
  
  if (!fileInput || !selectBtn) return;
  
  selectBtn.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showError('Veuillez sélectionner un fichier PDF.');
      return;
    }
    
    uiState.importedFile = file;
    fileNameSpan.textContent = file.name;
    
    // Afficher les informations du fichier
    renderFileInfo();
    
    // Afficher la carte d'analyse
    const extractionCard = viewContainer.querySelector('#pdf-extraction-card');
    if (extractionCard) {
      extractionCard.style.display = 'block';
    }
    
    // Réinitialiser l'état d'extraction
    uiState.extractionText = null;
    uiState.generatedTheme = null;
    
    const extractionPreview = viewContainer.querySelector('#pdf-extraction-preview');
    if (extractionPreview) {
      extractionPreview.style.display = 'none';
    }
    
    const generateCard = viewContainer.querySelector('#pdf-generate-card');
    if (generateCard) {
      generateCard.style.display = 'none';
    }
  });
}

function bindAnalyzeButton() {
  const analyzeBtn = viewContainer.querySelector('#pdf-analyze-btn');
  if (!analyzeBtn) return;
  
  analyzeBtn.addEventListener('click', async () => {
    if (!uiState.importedFile) {
      showError('Veuillez d\'abord sélectionner un fichier PDF.');
      return;
    }
    
    if (uiState.isImporting) return;
    
    uiState.isImporting = true;
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = '⏳ Analyse en cours...';
    
    const statusEl = viewContainer.querySelector('#pdf-extraction-status');
    if (statusEl) {
      statusEl.style.color = 'var(--accent)';
      statusEl.textContent = '📄 Extraction du contenu en cours...';
    }
    
    try {
      const result = await importPDF(uiState.importedFile);
      
      uiState.extractionText = result.extractionText;
      
      // Afficher l'aperçu
      renderExtractionPreview();
      
      // Afficher la carte de génération
      const generateCard = viewContainer.querySelector('#pdf-generate-card');
      if (generateCard) {
        generateCard.style.display = 'block';
      }
      
      if (statusEl) {
        statusEl.style.color = 'var(--success, #16a34a)';
        statusEl.textContent = '✅ Extraction terminée avec succès';
      }
      
    } catch (error) {
      console.error('[AI Theme Import] Erreur import PDF', error);
      showError('Erreur lors de l\'import du PDF : ' + error.message);
      if (statusEl) {
        statusEl.textContent = '';
      }
    } finally {
      uiState.isImporting = false;
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = '🔍 Analyser le PDF';
    }
  });
}

function bindGenerateButton() {
  const generateBtn = viewContainer.querySelector('#pdf-generate-btn');
  if (!generateBtn) return;
  
  generateBtn.addEventListener('click', async () => {
    if (!uiState.importedFile || !uiState.extractionText) {
      showError('Veuillez d\'abord analyser le PDF.');
      return;
    }
    
    if (uiState.isGenerating) return;
    
    uiState.isGenerating = true;
    generateBtn.disabled = true;
    generateBtn.textContent = '⏳ Génération en cours...';
    
    const statusEl = viewContainer.querySelector('#pdf-generation-status');
    if (statusEl) {
      statusEl.style.color = 'var(--accent)';
      statusEl.textContent = '✨ Génération du thème par l\'IA...';
    }
    
    try {
      // Simuler un délai de génération
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const theme = generateThemeFromPDFImport(
        uiState.importedFile.name,
        uiState.extractionText
      );
      
      uiState.generatedTheme = theme;
      
      // Afficher le thème généré
      renderGeneratedTheme();
      
      if (statusEl) {
        statusEl.style.color = 'var(--success, #16a34a)';
        statusEl.textContent = '✅ Thème généré avec succès';
      }
      
    } catch (error) {
      console.error('[AI Theme Import] Erreur génération thème', error);
      showError('Erreur lors de la génération du thème : ' + error.message);
      if (statusEl) {
        statusEl.textContent = '';
      }
    } finally {
      uiState.isGenerating = false;
      generateBtn.disabled = false;
      generateBtn.textContent = '✨ Générer un thème';
    }
  });
}

function bindOpenEditorButton() {
  const openEditorBtn = viewContainer.querySelector('#pdf-open-editor-btn');
  if (!openEditorBtn) return;
  
  openEditorBtn.addEventListener('click', () => {
    if (!uiState.generatedTheme || !uiState.generatedTheme.id) {
      showError('Aucun thème généré à ouvrir.');
      return;
    }
    
    openThemeInEditor(uiState.generatedTheme.id);
  });
}

function renderFileInfo() {
  if (!uiState.importedFile) return;
  
  const fileInfo = viewContainer.querySelector('#pdf-file-info');
  const fileNameDisplay = viewContainer.querySelector('#pdf-file-name-display');
  
  if (fileInfo) {
    fileInfo.style.display = 'block';
  }
  
  if (fileNameDisplay) {
    fileNameDisplay.textContent = uiState.importedFile.name;
  }
}

function renderExtractionPreview() {
  if (!uiState.extractionText) return;
  
  const preview = viewContainer.querySelector('#pdf-extraction-preview');
  const textEl = viewContainer.querySelector('#pdf-extraction-text');
  
  if (preview) {
    preview.style.display = 'block';
  }
  
  if (textEl) {
    textEl.textContent = uiState.extractionText;
  }
}

function renderGeneratedTheme() {
  if (!uiState.generatedTheme) return;
  
  const themeCard = viewContainer.querySelector('#pdf-generated-theme');
  const titleEl = viewContainer.querySelector('#generated-theme-title');
  const descEl = viewContainer.querySelector('#generated-theme-description');
  const quizCountEl = viewContainer.querySelector('#generated-quiz-count');
  const flashcardsCountEl = viewContainer.querySelector('#generated-flashcards-count');
  
  if (themeCard) {
    themeCard.style.display = 'block';
  }
  
  if (titleEl) {
    titleEl.textContent = uiState.generatedTheme.title || 'Thème généré';
  }
  
  if (descEl) {
    descEl.textContent = uiState.generatedTheme.description || 'Description du thème';
  }
  
  if (quizCountEl) {
    const quizCount = uiState.generatedTheme.quiz?.length || 0;
    quizCountEl.textContent = quizCount;
  }
  
  if (flashcardsCountEl) {
    const flashcardsCount = uiState.generatedTheme.flashcards?.length || 0;
    flashcardsCountEl.textContent = flashcardsCount;
  }
}

function showError(message) {
  const errorEl = viewContainer.querySelector('#pdf-error-message');
  if (!errorEl) return;
  
  errorEl.className = 'ai-theme-feedback error';
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  
  // Cacher après 5 secondes
  setTimeout(() => {
    errorEl.style.display = 'none';
  }, 5000);
}

function showSuccess(message) {
  const errorEl = viewContainer.querySelector('#pdf-error-message');
  if (!errorEl) return;
  
  errorEl.className = 'ai-theme-feedback success';
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  
  // Cacher après 5 secondes
  setTimeout(() => {
    errorEl.style.display = 'none';
  }, 5000);
}

window.renderAiThemeImportView = renderAiThemeImportView;
export default { renderAiThemeImportView };

