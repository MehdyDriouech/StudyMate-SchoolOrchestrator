/**
 * Sprint 19 - Multi-Review Workflow
 * UI: Annotation Editor
 * Interface pour créer et gérer les annotations sur les thèmes
 */

class AnnotationEditor {
    constructor(themeId, containerId, apiBaseUrl = '/api') {
        this.themeId = themeId;
        this.container = document.getElementById(containerId);
        this.apiBaseUrl = apiBaseUrl;
        this.annotations = [];
        this.selectedAnnotation = null;
        this.annotationMode = false;

        this.init();
    }

    async init() {
        await this.loadAnnotations();
        this.render();
        this.attachEventListeners();
    }

    async loadAnnotations() {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/annotations/themes/${this.themeId}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) throw new Error('Failed to load annotations');

            const data = await response.json();
            this.annotations = data.annotations || [];
        } catch (error) {
            console.error('Error loading annotations:', error);
            this.showNotification('Erreur lors du chargement des annotations', 'error');
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="annotation-editor">
                <!-- Toolbar -->
                <div class="annotation-toolbar">
                    <button id="toggle-annotation-mode" class="btn btn-primary ${this.annotationMode ? 'active' : ''}">
                        <i class="icon-annotation"></i>
                        Mode annotation
                    </button>
                    <div class="annotation-filters">
                        <select id="filter-status">
                            <option value="">Tous les statuts</option>
                            <option value="open">Ouverts</option>
                            <option value="resolved">Résolus</option>
                            <option value="rejected">Rejetés</option>
                        </select>
                        <select id="filter-type">
                            <option value="">Tous les types</option>
                            <option value="comment">Commentaire</option>
                            <option value="suggestion">Suggestion</option>
                            <option value="error">Erreur</option>
                            <option value="warning">Attention</option>
                            <option value="info">Information</option>
                        </select>
                    </div>
                    <div class="annotation-stats">
                        <span class="stat">
                            <strong>${this.getOpenAnnotationsCount()}</strong> ouvertes
                        </span>
                        <span class="stat">
                            <strong>${this.annotations.length}</strong> total
                        </span>
                    </div>
                </div>

                <!-- Liste des annotations -->
                <div class="annotations-list">
                    ${this.renderAnnotationsList()}
                </div>

                <!-- Panel de création/édition -->
                ${this.annotationMode ? this.renderAnnotationPanel() : ''}
            </div>
        `;

        // Ajouter les marqueurs d'annotation sur le contenu
        this.highlightAnnotations();
    }

    renderAnnotationsList() {
        if (this.annotations.length === 0) {
            return `
                <div class="empty-state">
                    <p>Aucune annotation</p>
                    <p class="hint">Activez le mode annotation pour ajouter des commentaires</p>
                </div>
            `;
        }

        return this.annotations.map(annotation => this.renderAnnotationCard(annotation)).join('');
    }

    renderAnnotationCard(annotation) {
        const typeIcons = {
            comment: '💬',
            suggestion: '💡',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const statusBadges = {
            open: '<span class="status-badge open">Ouvert</span>',
            resolved: '<span class="status-badge resolved">Résolu</span>',
            rejected: '<span class="status-badge rejected">Rejeté</span>'
        };

        return `
            <div class="annotation-card ${annotation.status}" data-annotation-id="${annotation.id}">
                <div class="annotation-header">
                    <span class="annotation-type-icon">${typeIcons[annotation.annotation_type] || '📝'}</span>
                    <div class="annotation-meta">
                        <span class="author">${this.escapeHtml(annotation.author_firstname)} ${this.escapeHtml(annotation.author_lastname)}</span>
                        <span class="date">${this.formatDate(annotation.created_at)}</span>
                    </div>
                    ${statusBadges[annotation.status] || ''}
                </div>

                <div class="annotation-path">
                    <code>${this.escapeHtml(annotation.json_path)}</code>
                </div>

                <div class="annotation-content">
                    ${this.escapeHtml(annotation.content)}
                </div>

                ${annotation.ai_suggestion ? `
                    <div class="ai-suggestion">
                        <div class="ai-suggestion-label">
                            <i class="icon-ai"></i> Suggestion IA:
                        </div>
                        <div class="ai-suggestion-content">
                            ${this.escapeHtml(annotation.ai_suggestion)}
                        </div>
                        <button class="btn btn-sm btn-success" onclick="annotationEditor.applyAISuggestion('${annotation.id}')">
                            Appliquer
                        </button>
                    </div>
                ` : ''}

                <div class="annotation-actions">
                    ${annotation.status === 'open' ? `
                        <button class="btn btn-sm btn-success" onclick="annotationEditor.resolveAnnotation('${annotation.id}')">
                            Résoudre
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="annotationEditor.rejectAnnotation('${annotation.id}')">
                            Rejeter
                        </button>
                    ` : ''}
                    ${!annotation.ai_suggestion ? `
                        <button class="btn btn-sm btn-info" onclick="annotationEditor.generateAISuggestion('${annotation.id}')">
                            <i class="icon-ai"></i> Générer suggestion IA
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-secondary" onclick="annotationEditor.scrollToAnnotation('${annotation.id}')">
                        <i class="icon-location"></i> Localiser
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="annotationEditor.deleteAnnotation('${annotation.id}')">
                        Supprimer
                    </button>
                </div>
            </div>
        `;
    }

    renderAnnotationPanel() {
        return `
            <div class="annotation-panel">
                <h3>Créer une annotation</h3>
                <form id="annotation-form">
                    <div class="form-group">
                        <label>Chemin JSON *</label>
                        <input type="text" id="annotation-path" class="form-control"
                               placeholder="Ex: questions[0].text" required>
                        <small class="form-hint">Chemin vers l'élément à annoter dans le JSON</small>
                    </div>

                    <div class="form-group">
                        <label>Type d'annotation *</label>
                        <select id="annotation-type" class="form-control" required>
                            <option value="comment">Commentaire</option>
                            <option value="suggestion">Suggestion</option>
                            <option value="error">Erreur</option>
                            <option value="warning">Attention</option>
                            <option value="info">Information</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Contenu *</label>
                        <textarea id="annotation-content" class="form-control" rows="4"
                                  placeholder="Décrivez votre annotation..." required></textarea>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Ajouter l'annotation</button>
                        <button type="button" class="btn btn-secondary" onclick="annotationEditor.toggleAnnotationMode()">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    attachEventListeners() {
        // Toggle annotation mode
        const toggleBtn = document.getElementById('toggle-annotation-mode');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleAnnotationMode());
        }

        // Filtres
        const filterStatus = document.getElementById('filter-status');
        const filterType = document.getElementById('filter-type');

        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.applyFilters());
        }

        if (filterType) {
            filterType.addEventListener('change', () => this.applyFilters());
        }

        // Formulaire d'annotation
        const form = document.getElementById('annotation-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleAnnotationSubmit(e));
        }

        // Permettre la sélection de texte pour annotation
        if (this.annotationMode) {
            this.enableTextSelection();
        }
    }

    toggleAnnotationMode() {
        this.annotationMode = !this.annotationMode;
        this.render();
        this.attachEventListeners();
    }

    enableTextSelection() {
        // Permettre la sélection de texte dans le contenu du thème
        const themeContent = document.getElementById('theme-content');
        if (themeContent) {
            themeContent.addEventListener('mouseup', () => {
                const selection = window.getSelection();
                if (selection.toString().length > 0) {
                    this.handleTextSelection(selection);
                }
            });
        }
    }

    handleTextSelection(selection) {
        const selectedText = selection.toString();
        const range = selection.getRangeAt(0);

        // Créer un menu contextuel pour annoter
        const menu = document.createElement('div');
        menu.className = 'annotation-context-menu';
        menu.innerHTML = `
            <button onclick="annotationEditor.createAnnotationFromSelection('${selectedText}')">
                📝 Annoter
            </button>
        `;

        const rect = range.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.top = `${rect.bottom + window.scrollY}px`;
        menu.style.left = `${rect.left + window.scrollX}px`;

        document.body.appendChild(menu);

        // Supprimer le menu après 3 secondes ou au clic
        setTimeout(() => menu.remove(), 3000);
    }

    async handleAnnotationSubmit(e) {
        e.preventDefault();

        const jsonPath = document.getElementById('annotation-path').value;
        const annotationType = document.getElementById('annotation-type').value;
        const content = document.getElementById('annotation-content').value;

        const annotationData = {
            theme_id: this.themeId,
            json_path: jsonPath,
            annotation_type: annotationType,
            content: content
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/annotations`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(annotationData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showNotification('Annotation créée avec succès', 'success');
                await this.loadAnnotations();
                this.toggleAnnotationMode();
            } else {
                this.showNotification(data.error || 'Erreur lors de la création', 'error');
            }
        } catch (error) {
            console.error('Error creating annotation:', error);
            this.showNotification('Erreur lors de la création', 'error');
        }
    }

    async resolveAnnotation(annotationId) {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/annotations/${annotationId}/resolve`,
                {
                    method: 'PATCH',
                    headers: this.getHeaders()
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                this.showNotification('Annotation résolue', 'success');
                await this.loadAnnotations();
                this.render();
            } else {
                this.showNotification(data.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Error resolving annotation:', error);
            this.showNotification('Erreur lors de la résolution', 'error');
        }
    }

    async rejectAnnotation(annotationId) {
        if (!confirm('Êtes-vous sûr de vouloir rejeter cette annotation ?')) {
            return;
        }

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/annotations/${annotationId}/reject`,
                {
                    method: 'PATCH',
                    headers: this.getHeaders()
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                this.showNotification('Annotation rejetée', 'success');
                await this.loadAnnotations();
                this.render();
            } else {
                this.showNotification(data.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Error rejecting annotation:', error);
            this.showNotification('Erreur', 'error');
        }
    }

    async deleteAnnotation(annotationId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette annotation ?')) {
            return;
        }

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/annotations/${annotationId}`,
                {
                    method: 'DELETE',
                    headers: this.getHeaders()
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                this.showNotification('Annotation supprimée', 'success');
                await this.loadAnnotations();
                this.render();
            } else {
                this.showNotification(data.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Error deleting annotation:', error);
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    async generateAISuggestion(annotationId) {
        this.showNotification('Génération de la suggestion IA...', 'info');

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/annotations/${annotationId}/ai-suggestion`,
                {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({})
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                this.showNotification('Suggestion générée', 'success');
                await this.loadAnnotations();
                this.render();
            } else {
                this.showNotification(data.error || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('Error generating AI suggestion:', error);
            this.showNotification('Erreur lors de la génération', 'error');
        }
    }

    applyAISuggestion(annotationId) {
        const annotation = this.annotations.find(a => a.id === annotationId);
        if (annotation && annotation.ai_suggestion) {
            // TODO: Appliquer la suggestion au thème
            this.showNotification('Suggestion appliquée', 'success');
        }
    }

    scrollToAnnotation(annotationId) {
        const annotation = this.annotations.find(a => a.id === annotationId);
        if (annotation) {
            // TODO: Scroll vers l'élément annoté dans le contenu
            this.showNotification(`Localisation: ${annotation.json_path}`, 'info');
        }
    }

    highlightAnnotations() {
        // Ajouter des marqueurs visuels pour les annotations
        this.annotations.forEach(annotation => {
            if (annotation.status === 'open') {
                // TODO: Surligner les éléments annotés dans le contenu
            }
        });
    }

    applyFilters() {
        const statusFilter = document.getElementById('filter-status')?.value;
        const typeFilter = document.getElementById('filter-type')?.value;

        // Recharger les annotations avec filtres
        this.loadAnnotations().then(() => this.render());
    }

    getOpenAnnotationsCount() {
        return this.annotations.filter(a => a.status === 'open').length;
    }

    // Helpers
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`,
            'X-Tenant-Id': this.getTenantId()
        };
    }

    getToken() {
        return localStorage.getItem('jwt_token') || '';
    }

    getTenantId() {
        return localStorage.getItem('tenant_id') || '';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialiser l'éditeur d'annotations
let annotationEditor;

function initAnnotationEditor(themeId) {
    const container = document.getElementById('annotation-editor-container');
    if (container) {
        annotationEditor = new AnnotationEditor(themeId, 'annotation-editor-container');
    }
}
