/**
 * Sprint 11 - Content Creation Suite
 * UI Component: Theme Library (E11-LIB)
 * Bibliothèque personnelle de thèmes avec recherche et organisation
 */

class ThemeLibrary {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            apiBaseUrl: options.apiBaseUrl || '/api',
            tenantId: options.tenantId,
            onThemeOpen: options.onThemeOpen || (() => {}),
            onThemeCreate: options.onThemeCreate || (() => {}),
            ...options
        };

        this.themes = [];
        this.folders = [];
        this.currentView = 'grid'; // 'grid' ou 'list'
        this.currentFolder = null;
        this.filters = {
            search: '',
            content_type: '',
            difficulty: '',
            workflow_status: ''
        };

        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.loadThemes();
    }

    render() {
        this.container.innerHTML = `
            <div class="library-container">
                <!-- Header -->
                <div class="library-header">
                    <h2>Ma bibliothèque de thèmes</h2>
                    <div class="header-actions">
                        <button id="btn-new-theme" class="btn btn-primary">
                            <i class="icon-plus"></i> Nouveau thème
                        </button>
                        <button id="btn-import" class="btn btn-secondary">
                            <i class="icon-upload"></i> Importer
                        </button>
                    </div>
                </div>

                <!-- Toolbar -->
                <div class="library-toolbar">
                    <div class="search-box">
                        <i class="icon-search"></i>
                        <input type="text" id="search-input" placeholder="Rechercher dans mes thèmes..." />
                    </div>
                    <div class="toolbar-filters">
                        <select id="filter-type">
                            <option value="">Tous les types</option>
                            <option value="quiz">Quiz</option>
                            <option value="flashcards">Flashcards</option>
                            <option value="fiche">Fiche</option>
                            <option value="complete">Complet</option>
                        </select>
                        <select id="filter-difficulty">
                            <option value="">Toutes les difficultés</option>
                            <option value="beginner">Débutant</option>
                            <option value="intermediate">Intermédiaire</option>
                            <option value="advanced">Avancé</option>
                        </select>
                        <select id="filter-status">
                            <option value="">Tous les statuts</option>
                            <option value="draft">Brouillon</option>
                            <option value="in_review">En révision</option>
                            <option value="approved">Approuvé</option>
                            <option value="published">Publié</option>
                        </select>
                    </div>
                    <div class="view-toggle">
                        <button id="btn-view-grid" class="btn btn-icon active" title="Vue grille">
                            <i class="icon-grid"></i>
                        </button>
                        <button id="btn-view-list" class="btn btn-icon" title="Vue liste">
                            <i class="icon-list"></i>
                        </button>
                    </div>
                </div>

                <!-- Sidebar folders -->
                <div class="library-layout">
                    <aside class="library-sidebar">
                        <div class="sidebar-section">
                            <h3>Dossiers</h3>
                            <button id="btn-new-folder" class="btn btn-sm btn-secondary">
                                <i class="icon-plus"></i> Nouveau dossier
                            </button>
                            <div id="folders-list" class="folders-tree"></div>
                        </div>
                        <div class="sidebar-section">
                            <h3>Statistiques</h3>
                            <div id="library-stats" class="stats-panel"></div>
                        </div>
                    </aside>

                    <!-- Main content -->
                    <main class="library-main">
                        <div id="themes-container" class="themes-grid"></div>
                        <div id="loading-indicator" class="loading hidden">Chargement...</div>
                        <div id="empty-state" class="empty-state hidden">
                            <i class="icon-empty"></i>
                            <p>Aucun thème trouvé</p>
                            <button class="btn btn-primary" id="btn-create-first">Créer mon premier thème</button>
                        </div>
                    </main>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Nouveau thème
        document.getElementById('btn-new-theme').addEventListener('click', () => {
            this.options.onThemeCreate();
        });

        // Import
        document.getElementById('btn-import').addEventListener('click', () => {
            this.showImportDialog();
        });

        // Recherche
        const searchInput = document.getElementById('search-input');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filters.search = e.target.value;
                this.loadThemes();
            }, 300);
        });

        // Filtres
        ['filter-type', 'filter-difficulty', 'filter-status'].forEach(id => {
            document.getElementById(id).addEventListener('change', (e) => {
                const filterKey = id.replace('filter-', '');
                this.filters[filterKey === 'type' ? 'content_type' : filterKey] = e.target.value;
                this.loadThemes();
            });
        });

        // Vue grille/liste
        document.getElementById('btn-view-grid').addEventListener('click', () => {
            this.switchView('grid');
        });
        document.getElementById('btn-view-list').addEventListener('click', () => {
            this.switchView('list');
        });

        // Créer premier thème
        const btnCreateFirst = document.getElementById('btn-create-first');
        if (btnCreateFirst) {
            btnCreateFirst.addEventListener('click', () => this.options.onThemeCreate());
        }
    }

    async loadThemes() {
        const loading = document.getElementById('loading-indicator');
        loading.classList.remove('hidden');

        try {
            const queryParams = new URLSearchParams({
                my_themes: 'true',
                ...this.filters
            });

            const response = await fetch(
                `${this.options.apiBaseUrl}/themes?${queryParams}`,
                {
                    headers: {
                        'X-Tenant-Id': this.options.tenantId,
                        'Authorization': 'Bearer ' + this.getToken()
                    }
                }
            );

            const result = await response.json();

            if (result.success) {
                this.themes = result.themes;
                this.renderThemes();
                this.updateStats();
            }
        } catch (error) {
            console.error('Load themes error:', error);
        } finally {
            loading.classList.add('hidden');
        }
    }

    renderThemes() {
        const container = document.getElementById('themes-container');
        const emptyState = document.getElementById('empty-state');

        if (this.themes.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        container.className = this.currentView === 'grid' ? 'themes-grid' : 'themes-list';

        container.innerHTML = this.themes.map(theme => this.renderThemeCard(theme)).join('');

        // Attacher les événements
        this.themes.forEach(theme => {
            this.attachThemeCardEvents(theme.id);
        });
    }

    renderThemeCard(theme) {
        const statusLabels = {
            'draft': 'Brouillon',
            'in_review': 'En révision',
            'approved': 'Approuvé',
            'published': 'Publié'
        };

        const difficultyLabels = {
            'beginner': 'Débutant',
            'intermediate': 'Intermédiaire',
            'advanced': 'Avancé'
        };

        return `
            <div class="theme-card" data-theme-id="${theme.id}">
                <div class="theme-card-header">
                    <span class="theme-status status-${theme.workflow_status}">
                        ${statusLabels[theme.workflow_status] || theme.workflow_status}
                    </span>
                    <div class="theme-actions">
                        <button class="btn btn-icon btn-open" title="Ouvrir">
                            <i class="icon-edit"></i>
                        </button>
                        <button class="btn btn-icon btn-duplicate" title="Dupliquer">
                            <i class="icon-copy"></i>
                        </button>
                        <button class="btn btn-icon btn-export" title="Exporter">
                            <i class="icon-download"></i>
                        </button>
                        <button class="btn btn-icon btn-delete" title="Archiver">
                            <i class="icon-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="theme-card-body">
                    <h3 class="theme-title">${theme.title}</h3>
                    <p class="theme-description">${theme.description?.substring(0, 100) || ''}${theme.description?.length > 100 ? '...' : ''}</p>
                    <div class="theme-meta">
                        <span class="meta-item">
                            <i class="icon-difficulty"></i>
                            ${difficultyLabels[theme.difficulty]}
                        </span>
                        <span class="meta-item">
                            <i class="icon-type"></i>
                            ${theme.content_type}
                        </span>
                        ${theme.metadata?.version_number ? `
                            <span class="meta-item">
                                <i class="icon-version"></i>
                                v${theme.metadata.version_number}
                            </span>
                        ` : ''}
                    </div>
                    <div class="theme-footer">
                        <span class="theme-date">
                            Modifié ${this.formatDate(theme.updated_at)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    attachThemeCardEvents(themeId) {
        const card = document.querySelector(`[data-theme-id="${themeId}"]`);
        if (!card) return;

        // Ouvrir
        card.querySelector('.btn-open').addEventListener('click', (e) => {
            e.stopPropagation();
            this.options.onThemeOpen(themeId);
        });

        // Dupliquer
        card.querySelector('.btn-duplicate').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Dupliquer ce thème ?')) {
                await this.duplicateTheme(themeId);
            }
        });

        // Exporter
        card.querySelector('.btn-export').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showExportDialog(themeId);
        });

        // Archiver
        card.querySelector('.btn-delete').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Archiver ce thème ?')) {
                await this.archiveTheme(themeId);
            }
        });

        // Double-clic pour ouvrir
        card.addEventListener('dblclick', () => {
            this.options.onThemeOpen(themeId);
        });
    }

    async duplicateTheme(themeId) {
        try {
            const response = await fetch(
                `${this.options.apiBaseUrl}/themes/${themeId}/duplicate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Tenant-Id': this.options.tenantId,
                        'Authorization': 'Bearer ' + this.getToken()
                    }
                }
            );

            const result = await response.json();

            if (result.success) {
                await this.loadThemes();
            }
        } catch (error) {
            console.error('Duplicate error:', error);
        }
    }

    async archiveTheme(themeId) {
        try {
            const response = await fetch(
                `${this.options.apiBaseUrl}/themes/${themeId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'X-Tenant-Id': this.options.tenantId,
                        'Authorization': 'Bearer ' + this.getToken()
                    }
                }
            );

            const result = await response.json();

            if (result.success) {
                await this.loadThemes();
            }
        } catch (error) {
            console.error('Archive error:', error);
        }
    }

    showExportDialog(themeId) {
        // Créer une modale d'export
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Exporter le thème</h3>
                <div class="export-formats">
                    <button class="btn btn-format" data-format="json">JSON</button>
                    <button class="btn btn-format" data-format="pdf">PDF</button>
                    <button class="btn btn-format" data-format="csv">CSV</button>
                    <button class="btn btn-format" data-format="qti">QTI (Moodle)</button>
                </div>
                <button class="btn btn-secondary btn-close-modal">Annuler</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('.btn-format').forEach(btn => {
            btn.addEventListener('click', async () => {
                const format = btn.dataset.format;
                await this.exportTheme(themeId, format);
                modal.remove();
            });
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => {
            modal.remove();
        });
    }

    async exportTheme(themeId, format) {
        try {
            const response = await fetch(
                `${this.options.apiBaseUrl}/export/theme/${themeId}?format=${format}`,
                {
                    headers: {
                        'X-Tenant-Id': this.options.tenantId,
                        'Authorization': 'Bearer ' + this.getToken()
                    }
                }
            );

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `theme_${themeId}.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('Export error:', error);
        }
    }

    showImportDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Importer un thème</h3>
                <div class="import-zone">
                    <input type="file" id="import-file" accept=".json,.csv,.xml" />
                    <p>Formats supportés: JSON, CSV, QTI (XML)</p>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary btn-import">Importer</button>
                    <button class="btn btn-secondary btn-close-modal">Annuler</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.btn-import').addEventListener('click', async () => {
            const fileInput = document.getElementById('import-file');
            if (fileInput.files.length > 0) {
                await this.importTheme(fileInput.files[0]);
                modal.remove();
            }
        });

        modal.querySelector('.btn-close-modal').addEventListener('click', () => {
            modal.remove();
        });
    }

    async importTheme(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(
                `${this.options.apiBaseUrl}/import/theme`,
                {
                    method: 'POST',
                    headers: {
                        'X-Tenant-Id': this.options.tenantId,
                        'Authorization': 'Bearer ' + this.getToken()
                    },
                    body: formData
                }
            );

            const result = await response.json();

            if (result.success) {
                await this.loadThemes();
            }
        } catch (error) {
            console.error('Import error:', error);
        }
    }

    switchView(view) {
        this.currentView = view;
        document.getElementById('btn-view-grid').classList.toggle('active', view === 'grid');
        document.getElementById('btn-view-list').classList.toggle('active', view === 'list');
        this.renderThemes();
    }

    updateStats() {
        const stats = {
            total: this.themes.length,
            draft: this.themes.filter(t => t.workflow_status === 'draft').length,
            published: this.themes.filter(t => t.workflow_status === 'published').length
        };

        document.getElementById('library-stats').innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${stats.total}</span>
                <span class="stat-label">Total</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${stats.draft}</span>
                <span class="stat-label">Brouillons</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${stats.published}</span>
                <span class="stat-label">Publiés</span>
            </div>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'à l\'instant';
        if (diffMins < 60) return `il y a ${diffMins} min`;
        if (diffHours < 24) return `il y a ${diffHours}h`;
        if (diffDays < 7) return `il y a ${diffDays}j`;

        return date.toLocaleDateString('fr-FR');
    }

    getToken() {
        return localStorage.getItem('jwt_token') || 'demo_token';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeLibrary;
}
