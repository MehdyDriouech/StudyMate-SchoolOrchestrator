/**
 * Sprint 11 - Content Creation Suite
 * UI Component: Theme Editor (E11-EDITOR)
 * Éditeur WYSIWYG pour création/édition manuelle de thèmes
 */

class ThemeEditor {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            apiBaseUrl: options.apiBaseUrl || '/api',
            tenantId: options.tenantId,
            onSave: options.onSave || (() => {}),
            onPreview: options.onPreview || (() => {}),
            autoSaveInterval: options.autoSaveInterval || 30000, // 30 secondes
            ...options
        };

        this.themeData = null;
        this.themeId = null;
        this.isDirty = false;
        this.autoSaveTimer = null;
        this.undoStack = [];
        this.redoStack = [];

        this.init();
    }

    /**
     * Initialiser l'éditeur
     */
    init() {
        this.render();
        this.attachEventListeners();
        this.startAutoSave();
        this.setupKeyboardShortcuts();
    }

    /**
     * Rendre l'interface de l'éditeur
     */
    render() {
        this.container.innerHTML = `
            <div class="theme-editor">
                <!-- Header avec actions -->
                <div class="editor-header">
                    <div class="editor-title">
                        <input type="text" id="theme-title" placeholder="Titre du thème" class="title-input" />
                    </div>
                    <div class="editor-actions">
                        <button id="btn-undo" class="btn btn-icon" title="Annuler (Ctrl+Z)">
                            <i class="icon-undo"></i>
                        </button>
                        <button id="btn-redo" class="btn btn-icon" title="Rétablir (Ctrl+Y)">
                            <i class="icon-redo"></i>
                        </button>
                        <button id="btn-preview" class="btn btn-secondary">
                            <i class="icon-eye"></i> Prévisualiser
                        </button>
                        <button id="btn-analyze" class="btn btn-secondary">
                            <i class="icon-check"></i> Analyser
                        </button>
                        <button id="btn-save" class="btn btn-primary">
                            <i class="icon-save"></i> Enregistrer
                        </button>
                        <button id="btn-publish" class="btn btn-success">
                            <i class="icon-rocket"></i> Publier
                        </button>
                    </div>
                </div>

                <!-- Configuration du thème -->
                <div class="editor-config">
                    <div class="config-row">
                        <div class="form-group">
                            <label for="theme-description">Description</label>
                            <textarea id="theme-description" rows="3" placeholder="Description du thème"></textarea>
                        </div>
                    </div>
                    <div class="config-row">
                        <div class="form-group">
                            <label for="theme-difficulty">Difficulté</label>
                            <select id="theme-difficulty">
                                <option value="beginner">Débutant</option>
                                <option value="intermediate" selected>Intermédiaire</option>
                                <option value="advanced">Avancé</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="theme-content-type">Type de contenu</label>
                            <select id="theme-content-type">
                                <option value="complete">Complet (Quiz + Flashcards + Fiche)</option>
                                <option value="quiz" selected>Quiz uniquement</option>
                                <option value="flashcards">Flashcards uniquement</option>
                                <option value="fiche">Fiche de révision</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="theme-subject">Matière</label>
                            <input type="text" id="theme-subject" placeholder="Ex: Mathématiques" />
                        </div>
                        <div class="form-group">
                            <label for="theme-duration">Durée estimée (min)</label>
                            <input type="number" id="theme-duration" min="1" max="300" value="30" />
                        </div>
                    </div>
                    <div class="config-row">
                        <div class="form-group">
                            <label for="theme-tags">Tags (séparés par des virgules)</label>
                            <input type="text" id="theme-tags" placeholder="mathématiques, algèbre, niveau 3ème" />
                        </div>
                    </div>
                </div>

                <!-- Onglets de contenu -->
                <div class="editor-tabs">
                    <button class="tab-btn active" data-tab="questions">
                        <i class="icon-quiz"></i> Questions (<span id="questions-count">0</span>)
                    </button>
                    <button class="tab-btn" data-tab="flashcards">
                        <i class="icon-cards"></i> Flashcards (<span id="flashcards-count">0</span>)
                    </button>
                    <button class="tab-btn" data-tab="fiche">
                        <i class="icon-doc"></i> Fiche de révision
                    </button>
                </div>

                <!-- Contenu des onglets -->
                <div class="editor-content">
                    <!-- Onglet Questions -->
                    <div id="tab-questions" class="tab-panel active">
                        <div class="panel-header">
                            <button id="btn-add-question" class="btn btn-success">
                                <i class="icon-plus"></i> Ajouter une question
                            </button>
                        </div>
                        <div id="questions-list" class="items-list"></div>
                    </div>

                    <!-- Onglet Flashcards -->
                    <div id="tab-flashcards" class="tab-panel">
                        <div class="panel-header">
                            <button id="btn-add-flashcard" class="btn btn-success">
                                <i class="icon-plus"></i> Ajouter une flashcard
                            </button>
                        </div>
                        <div id="flashcards-list" class="items-list"></div>
                    </div>

                    <!-- Onglet Fiche -->
                    <div id="tab-fiche" class="tab-panel">
                        <div class="panel-header">
                            <button id="btn-add-section" class="btn btn-success">
                                <i class="icon-plus"></i> Ajouter une section
                            </button>
                        </div>
                        <div class="form-group">
                            <label for="fiche-summary">Résumé global</label>
                            <textarea id="fiche-summary" rows="4" placeholder="Résumé de la fiche de révision"></textarea>
                        </div>
                        <div id="fiche-sections-list" class="items-list"></div>
                    </div>
                </div>

                <!-- Sidebar pour l'analyse et suggestions -->
                <div id="analysis-sidebar" class="sidebar hidden">
                    <div class="sidebar-header">
                        <h3>Analyse qualité</h3>
                        <button id="btn-close-sidebar" class="btn btn-icon">×</button>
                    </div>
                    <div id="analysis-content" class="sidebar-content"></div>
                </div>

                <!-- Status bar -->
                <div class="editor-statusbar">
                    <span id="status-message">Prêt</span>
                    <span id="status-autosave"></span>
                    <span id="status-validation"></span>
                </div>
            </div>
        `;
    }

    /**
     * Attacher les écouteurs d'événements
     */
    attachEventListeners() {
        // Actions principales
        document.getElementById('btn-save').addEventListener('click', () => this.saveTheme());
        document.getElementById('btn-preview').addEventListener('click', () => this.previewTheme());
        document.getElementById('btn-analyze').addEventListener('click', () => this.analyzeTheme());
        document.getElementById('btn-publish').addEventListener('click', () => this.publishTheme());
        document.getElementById('btn-undo').addEventListener('click', () => this.undo());
        document.getElementById('btn-redo').addEventListener('click', () => this.redo());

        // Onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Ajout d'éléments
        document.getElementById('btn-add-question').addEventListener('click', () => this.addQuestion());
        document.getElementById('btn-add-flashcard').addEventListener('click', () => this.addFlashcard());
        document.getElementById('btn-add-section').addEventListener('click', () => this.addFicheSection());

        // Changements de configuration
        ['theme-title', 'theme-description', 'theme-difficulty', 'theme-content-type',
         'theme-subject', 'theme-duration', 'theme-tags'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.markDirty());
            }
        });

        // Sidebar
        const closeSidebarBtn = document.getElementById('btn-close-sidebar');
        if (closeSidebarBtn) {
            closeSidebarBtn.addEventListener('click', () => this.closeSidebar());
        }
    }

    /**
     * Configurer les raccourcis clavier
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+S : Sauvegarder
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveTheme();
            }
            // Ctrl+Z : Annuler
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            // Ctrl+Y ou Ctrl+Shift+Z : Rétablir
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                this.redo();
            }
            // Ctrl+P : Prévisualiser
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                this.previewTheme();
            }
        });
    }

    /**
     * Changer d'onglet
     */
    switchTab(tabName) {
        // Désactiver tous les onglets et panneaux
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        // Activer l'onglet sélectionné
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }

    /**
     * Ajouter une question
     */
    addQuestion() {
        const questionId = 'q' + (Date.now() % 1000000);
        const questionData = {
            id: questionId,
            text: '',
            choices: ['', '', '', ''],
            correctAnswer: 0,
            explanation: '',
            difficulty: 'medium',
            points: 10
        };

        this.renderQuestion(questionData);
        this.updateCounts();
        this.markDirty();
    }

    /**
     * Rendre une question dans l'éditeur
     */
    renderQuestion(questionData) {
        const list = document.getElementById('questions-list');
        const questionElement = document.createElement('div');
        questionElement.className = 'item-card question-card';
        questionElement.dataset.id = questionData.id;

        questionElement.innerHTML = `
            <div class="item-header">
                <span class="item-id">${questionData.id}</span>
                <div class="item-actions">
                    <button class="btn btn-icon btn-improve" title="Améliorer via IA">
                        <i class="icon-wand"></i>
                    </button>
                    <button class="btn btn-icon btn-duplicate" title="Dupliquer">
                        <i class="icon-copy"></i>
                    </button>
                    <button class="btn btn-icon btn-delete" title="Supprimer">
                        <i class="icon-trash"></i>
                    </button>
                </div>
            </div>
            <div class="item-body">
                <div class="form-group">
                    <label>Question</label>
                    <textarea class="question-text" rows="3" placeholder="Entrez votre question">${questionData.text}</textarea>
                </div>
                <div class="form-group">
                    <label>Choix de réponses</label>
                    <div class="choices-list">
                        ${questionData.choices.map((choice, index) => `
                            <div class="choice-item">
                                <input type="radio" name="correct-${questionData.id}" value="${index}"
                                       ${index === questionData.correctAnswer ? 'checked' : ''}>
                                <input type="text" class="choice-text" placeholder="Choix ${index + 1}" value="${choice}">
                                <button class="btn btn-icon btn-remove-choice" data-index="${index}">×</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-sm btn-add-choice">+ Ajouter un choix</button>
                </div>
                <div class="form-group">
                    <label>Explication</label>
                    <textarea class="question-explanation" rows="2" placeholder="Expliquez pourquoi cette réponse est correcte">${questionData.explanation}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Difficulté</label>
                        <select class="question-difficulty">
                            <option value="easy" ${questionData.difficulty === 'easy' ? 'selected' : ''}>Facile</option>
                            <option value="medium" ${questionData.difficulty === 'medium' ? 'selected' : ''}>Moyen</option>
                            <option value="hard" ${questionData.difficulty === 'hard' ? 'selected' : ''}>Difficile</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Points</label>
                        <input type="number" class="question-points" min="1" max="100" value="${questionData.points}">
                    </div>
                </div>
            </div>
        `;

        list.appendChild(questionElement);

        // Attacher les événements
        this.attachQuestionEvents(questionElement);
    }

    /**
     * Attacher les événements à une question
     */
    attachQuestionEvents(questionElement) {
        // Améliorer via IA
        questionElement.querySelector('.btn-improve').addEventListener('click', () => {
            this.improveQuestion(questionElement.dataset.id);
        });

        // Dupliquer
        questionElement.querySelector('.btn-duplicate').addEventListener('click', () => {
            this.duplicateQuestion(questionElement.dataset.id);
        });

        // Supprimer
        questionElement.querySelector('.btn-delete').addEventListener('click', () => {
            if (confirm('Supprimer cette question ?')) {
                questionElement.remove();
                this.updateCounts();
                this.markDirty();
            }
        });

        // Ajouter un choix
        questionElement.querySelector('.btn-add-choice').addEventListener('click', () => {
            const choicesList = questionElement.querySelector('.choices-list');
            const index = choicesList.children.length;
            const choiceItem = document.createElement('div');
            choiceItem.className = 'choice-item';
            choiceItem.innerHTML = `
                <input type="radio" name="correct-${questionElement.dataset.id}" value="${index}">
                <input type="text" class="choice-text" placeholder="Choix ${index + 1}" value="">
                <button class="btn btn-icon btn-remove-choice" data-index="${index}">×</button>
            `;
            choicesList.appendChild(choiceItem);
            this.markDirty();
        });

        // Marquer comme modifié lors de changements
        questionElement.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('input', () => this.markDirty());
        });
    }

    /**
     * Ajouter une flashcard
     */
    addFlashcard() {
        const flashcardId = 'f' + (Date.now() % 1000000);
        const flashcardData = {
            id: flashcardId,
            front: '',
            back: '',
            difficulty: 'medium'
        };

        this.renderFlashcard(flashcardData);
        this.updateCounts();
        this.markDirty();
    }

    /**
     * Rendre une flashcard
     */
    renderFlashcard(flashcardData) {
        const list = document.getElementById('flashcards-list');
        const flashcardElement = document.createElement('div');
        flashcardElement.className = 'item-card flashcard-card';
        flashcardElement.dataset.id = flashcardData.id;

        flashcardElement.innerHTML = `
            <div class="item-header">
                <span class="item-id">${flashcardData.id}</span>
                <div class="item-actions">
                    <button class="btn btn-icon btn-improve" title="Améliorer via IA">
                        <i class="icon-wand"></i>
                    </button>
                    <button class="btn btn-icon btn-duplicate" title="Dupliquer">
                        <i class="icon-copy"></i>
                    </button>
                    <button class="btn btn-icon btn-delete" title="Supprimer">
                        <i class="icon-trash"></i>
                    </button>
                </div>
            </div>
            <div class="item-body flashcard-body">
                <div class="flashcard-side">
                    <label>Recto (Question/Concept)</label>
                    <textarea class="flashcard-front" rows="2" placeholder="Face avant de la carte">${flashcardData.front}</textarea>
                </div>
                <div class="flashcard-divider">⟷</div>
                <div class="flashcard-side">
                    <label>Verso (Réponse/Définition)</label>
                    <textarea class="flashcard-back" rows="3" placeholder="Face arrière de la carte">${flashcardData.back}</textarea>
                </div>
            </div>
            <div class="form-group">
                <label>Difficulté</label>
                <select class="flashcard-difficulty">
                    <option value="easy" ${flashcardData.difficulty === 'easy' ? 'selected' : ''}>Facile</option>
                    <option value="medium" ${flashcardData.difficulty === 'medium' ? 'selected' : ''}>Moyen</option>
                    <option value="hard" ${flashcardData.difficulty === 'hard' ? 'selected' : ''}>Difficile</option>
                </select>
            </div>
        `;

        list.appendChild(flashcardElement);
        this.attachFlashcardEvents(flashcardElement);
    }

    /**
     * Attacher les événements à une flashcard
     */
    attachFlashcardEvents(flashcardElement) {
        flashcardElement.querySelector('.btn-improve').addEventListener('click', () => {
            this.improveFlashcard(flashcardElement.dataset.id);
        });

        flashcardElement.querySelector('.btn-delete').addEventListener('click', () => {
            if (confirm('Supprimer cette flashcard ?')) {
                flashcardElement.remove();
                this.updateCounts();
                this.markDirty();
            }
        });

        flashcardElement.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('input', () => this.markDirty());
        });
    }

    /**
     * Ajouter une section de fiche
     */
    addFicheSection() {
        const sectionData = {
            title: '',
            content: '',
            keyPoints: [],
            order: document.querySelectorAll('.fiche-section-card').length
        };

        this.renderFicheSection(sectionData);
        this.markDirty();
    }

    /**
     * Rendre une section de fiche
     */
    renderFicheSection(sectionData) {
        const list = document.getElementById('fiche-sections-list');
        const sectionElement = document.createElement('div');
        sectionElement.className = 'item-card fiche-section-card';
        sectionElement.dataset.order = sectionData.order;

        sectionElement.innerHTML = `
            <div class="item-header">
                <span class="item-id">Section ${sectionData.order + 1}</span>
                <div class="item-actions">
                    <button class="btn btn-icon btn-move-up" title="Monter">↑</button>
                    <button class="btn btn-icon btn-move-down" title="Descendre">↓</button>
                    <button class="btn btn-icon btn-delete" title="Supprimer">
                        <i class="icon-trash"></i>
                    </button>
                </div>
            </div>
            <div class="item-body">
                <div class="form-group">
                    <label>Titre de la section</label>
                    <input type="text" class="section-title" placeholder="Titre" value="${sectionData.title}">
                </div>
                <div class="form-group">
                    <label>Contenu (supporte Markdown)</label>
                    <textarea class="section-content" rows="5" placeholder="Contenu détaillé de la section">${sectionData.content}</textarea>
                </div>
                <div class="form-group">
                    <label>Points clés</label>
                    <div class="keypoints-list"></div>
                    <button class="btn btn-sm btn-add-keypoint">+ Ajouter un point clé</button>
                </div>
            </div>
        `;

        list.appendChild(sectionElement);
        this.attachFicheSectionEvents(sectionElement);
    }

    /**
     * Attacher les événements à une section de fiche
     */
    attachFicheSectionEvents(sectionElement) {
        sectionElement.querySelector('.btn-delete').addEventListener('click', () => {
            if (confirm('Supprimer cette section ?')) {
                sectionElement.remove();
                this.markDirty();
            }
        });

        sectionElement.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', () => this.markDirty());
        });
    }

    /**
     * Collecter les données du thème depuis le formulaire
     */
    collectThemeData() {
        const themeData = {
            title: document.getElementById('theme-title').value,
            description: document.getElementById('theme-description').value,
            difficulty: document.getElementById('theme-difficulty').value,
            content_type: document.getElementById('theme-content-type').value,
            subject: document.getElementById('theme-subject').value,
            estimated_duration_minutes: parseInt(document.getElementById('theme-duration').value),
            tags: document.getElementById('theme-tags').value.split(',').map(t => t.trim()).filter(t => t),
            questions: [],
            flashcards: [],
            metadata: {
                source: 'manual',
                last_modified_at: new Date().toISOString()
            }
        };

        // Collecter les questions
        document.querySelectorAll('.question-card').forEach(card => {
            const choices = Array.from(card.querySelectorAll('.choice-text')).map(input => input.value);
            const correctAnswer = parseInt(card.querySelector('input[type="radio"]:checked')?.value || 0);

            themeData.questions.push({
                id: card.dataset.id,
                text: card.querySelector('.question-text').value,
                choices: choices,
                correctAnswer: correctAnswer,
                explanation: card.querySelector('.question-explanation').value,
                difficulty: card.querySelector('.question-difficulty').value,
                points: parseInt(card.querySelector('.question-points').value)
            });
        });

        // Collecter les flashcards
        document.querySelectorAll('.flashcard-card').forEach(card => {
            themeData.flashcards.push({
                id: card.dataset.id,
                front: card.querySelector('.flashcard-front').value,
                back: card.querySelector('.flashcard-back').value,
                difficulty: card.querySelector('.flashcard-difficulty').value
            });
        });

        // Collecter la fiche
        const ficheSections = [];
        document.querySelectorAll('.fiche-section-card').forEach(card => {
            ficheSections.push({
                title: card.querySelector('.section-title').value,
                content: card.querySelector('.section-content').value,
                keyPoints: [],
                order: parseInt(card.dataset.order)
            });
        });

        if (ficheSections.length > 0) {
            themeData.fiche = {
                summary: document.getElementById('fiche-summary').value,
                sections: ficheSections
            };
        }

        return themeData;
    }

    /**
     * Sauvegarder le thème
     */
    async saveTheme(autoSave = false) {
        const themeData = this.collectThemeData();

        try {
            this.updateStatus(autoSave ? 'Sauvegarde automatique...' : 'Sauvegarde...');

            const url = this.themeId
                ? `${this.options.apiBaseUrl}/themes/${this.themeId}`
                : `${this.options.apiBaseUrl}/themes`;

            const method = this.themeId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Id': this.options.tenantId,
                    'Authorization': 'Bearer ' + this.getToken()
                },
                body: JSON.stringify({
                    ...themeData,
                    auto_save: autoSave
                })
            });

            const result = await response.json();

            if (result.success) {
                if (!this.themeId) {
                    this.themeId = result.theme_id;
                }
                this.isDirty = false;
                this.updateStatus(autoSave ? 'Sauvegardé automatiquement' : 'Thème enregistré', 'success');
                this.options.onSave(result);
            } else {
                throw new Error(result.error || 'Erreur de sauvegarde');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.updateStatus('Erreur: ' + error.message, 'error');
        }
    }

    /**
     * Prévisualiser le thème
     */
    async previewTheme() {
        const themeData = this.collectThemeData();

        try {
            const response = await fetch(`${this.options.apiBaseUrl}/preview/render`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Id': this.options.tenantId,
                    'Authorization': 'Bearer ' + this.getToken()
                },
                body: JSON.stringify(themeData)
            });

            const result = await response.json();
            this.options.onPreview(result);
        } catch (error) {
            console.error('Preview error:', error);
            this.updateStatus('Erreur de prévisualisation', 'error');
        }
    }

    /**
     * Analyser la qualité du thème
     */
    async analyzeTheme() {
        const themeData = this.collectThemeData();

        try {
            this.updateStatus('Analyse en cours...');

            const response = await fetch(`${this.options.apiBaseUrl}/preview/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Id': this.options.tenantId,
                    'Authorization': 'Bearer ' + this.getToken()
                },
                body: JSON.stringify(themeData)
            });

            const result = await response.json();

            if (result.success) {
                this.displayAnalysisResults(result);
                this.updateStatus('Analyse terminée', 'success');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            this.updateStatus('Erreur d\'analyse', 'error');
        }
    }

    /**
     * Afficher les résultats d'analyse
     */
    displayAnalysisResults(analysis) {
        const sidebar = document.getElementById('analysis-sidebar');
        const content = document.getElementById('analysis-content');

        const quality = analysis.overall_quality;

        content.innerHTML = `
            <div class="analysis-score">
                <div class="score-circle ${this.getScoreClass(quality.pedagogical_score)}">
                    ${quality.pedagogical_score}
                </div>
                <h4>Score pédagogique</h4>
            </div>

            <div class="analysis-section">
                <h4>Validation du schéma</h4>
                <p class="${quality.schema_valid ? 'text-success' : 'text-error'}">
                    ${quality.schema_valid ? '✓ Valide' : '✗ Non valide'}
                </p>
            </div>

            <div class="analysis-section">
                <h4>Niveau estimé</h4>
                <p>${this.formatLevel(quality.estimated_level)}</p>
            </div>

            <div class="analysis-section">
                <h4>Cohérence de difficulté</h4>
                <p class="${quality.difficulty_consistent ? 'text-success' : 'text-warning'}">
                    ${quality.difficulty_consistent ? '✓ Cohérent' : '⚠ Incohérent'}
                </p>
            </div>

            ${quality.warnings_count > 0 ? `
                <div class="analysis-section">
                    <h4>Avertissements (${quality.warnings_count})</h4>
                    <ul class="warnings-list">
                        ${analysis.analysis.warnings.slice(0, 5).map(w => `
                            <li class="warning-item">${w.message}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            ${analysis.suggestions.length > 0 ? `
                <div class="analysis-section">
                    <h4>Suggestions d'amélioration</h4>
                    <ul class="suggestions-list">
                        ${analysis.suggestions.slice(0, 5).map(s => `
                            <li class="suggestion-item">
                                ${s.reason}
                                <button class="btn btn-sm btn-apply-suggestion" data-element="${s.element_id}">
                                    Appliquer
                                </button>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;

        sidebar.classList.remove('hidden');
    }

    /**
     * Améliorer une question via IA
     */
    async improveQuestion(questionId) {
        // Implémentation de l'amélioration IA
        console.log('Improve question:', questionId);
    }

    /**
     * Améliorer une flashcard via IA
     */
    async improveFlashcard(flashcardId) {
        // Implémentation de l'amélioration IA
        console.log('Improve flashcard:', flashcardId);
    }

    /**
     * Publier le thème sur ErgoMate
     */
    async publishTheme() {
        if (!confirm('Publier ce thème sur ErgoMate ?')) return;

        await this.saveTheme();

        try {
            const response = await fetch(`${this.options.apiBaseUrl}/themes/${this.themeId}/workflow`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Id': this.options.tenantId,
                    'Authorization': 'Bearer ' + this.getToken()
                },
                body: JSON.stringify({ status: 'published' })
            });

            const result = await response.json();

            if (result.success) {
                this.updateStatus('Thème publié !', 'success');
            }
        } catch (error) {
            console.error('Publish error:', error);
            this.updateStatus('Erreur de publication', 'error');
        }
    }

    /**
     * Marquer comme modifié
     */
    markDirty() {
        this.isDirty = true;
        this.pushToUndoStack();
    }

    /**
     * Annuler (Undo)
     */
    undo() {
        if (this.undoStack.length === 0) return;
        const previousState = this.undoStack.pop();
        this.redoStack.push(this.collectThemeData());
        this.loadThemeData(previousState);
    }

    /**
     * Rétablir (Redo)
     */
    redo() {
        if (this.redoStack.length === 0) return;
        const nextState = this.redoStack.pop();
        this.undoStack.push(this.collectThemeData());
        this.loadThemeData(nextState);
    }

    /**
     * Empiler dans l'historique d'annulation
     */
    pushToUndoStack() {
        const currentState = this.collectThemeData();
        this.undoStack.push(currentState);
        if (this.undoStack.length > 50) {
            this.undoStack.shift();
        }
        this.redoStack = [];
    }

    /**
     * Démarrer la sauvegarde automatique
     */
    startAutoSave() {
        if (this.options.autoSaveInterval > 0) {
            this.autoSaveTimer = setInterval(() => {
                if (this.isDirty && this.themeId) {
                    this.saveTheme(true);
                }
            }, this.options.autoSaveInterval);
        }
    }

    /**
     * Mettre à jour le compteur d'éléments
     */
    updateCounts() {
        document.getElementById('questions-count').textContent = document.querySelectorAll('.question-card').length;
        document.getElementById('flashcards-count').textContent = document.querySelectorAll('.flashcard-card').length;
    }

    /**
     * Mettre à jour le message de statut
     */
    updateStatus(message, type = 'info') {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.className = `status-${type}`;
    }

    /**
     * Fermer la sidebar
     */
    closeSidebar() {
        document.getElementById('analysis-sidebar').classList.add('hidden');
    }

    /**
     * Récupérer le token JWT
     */
    getToken() {
        return localStorage.getItem('jwt_token') || 'demo_token';
    }

    /**
     * Obtenir la classe CSS pour le score
     */
    getScoreClass(score) {
        if (score >= 80) return 'score-excellent';
        if (score >= 60) return 'score-good';
        if (score >= 40) return 'score-medium';
        return 'score-poor';
    }

    /**
     * Formater le niveau
     */
    formatLevel(level) {
        const levels = {
            'easy': 'Facile',
            'normal': 'Normal',
            'expert': 'Expert'
        };
        return levels[level] || level;
    }

    /**
     * Charger un thème existant
     */
    loadTheme(themeId) {
        // Implémentation du chargement
        this.themeId = themeId;
    }

    /**
     * Charger des données de thème
     */
    loadThemeData(themeData) {
        // Implémentation du chargement de données
        this.themeData = themeData;
    }

    /**
     * Dupliquer une question
     */
    duplicateQuestion(questionId) {
        const original = document.querySelector(`.question-card[data-id="${questionId}"]`);
        if (original) {
            const newId = 'q' + (Date.now() % 1000000);
            // Implémenter la duplication
        }
    }

    /**
     * Détruire l'éditeur
     */
    destroy() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeEditor;
}
