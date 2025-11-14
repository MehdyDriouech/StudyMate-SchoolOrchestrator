/**
 * Sprint 18 - Curriculum Builder
 * UI Component: Curriculum Builder avec séquences drag-drop
 * Permet aux enseignants de créer et structurer un programme annuel
 */

class CurriculumBuilder {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            apiBaseUrl: options.apiBaseUrl || '/api',
            tenantId: options.tenantId,
            teacherId: options.teacherId,
            classId: options.classId,
            curriculumId: options.curriculumId || null,
            onSave: options.onSave || (() => {}),
            ...options
        };

        this.curriculum = null;
        this.sequences = [];
        this.isDragging = false;
        this.draggedSequence = null;

        this.init();
    }

    async init() {
        this.render();
        this.attachEventListeners();

        if (this.options.curriculumId) {
            await this.loadCurriculum(this.options.curriculumId);
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="curriculum-builder">
                <!-- Header -->
                <div class="builder-header">
                    <h2>
                        <i class="icon-book"></i>
                        ${this.curriculum ? 'Modifier le curriculum' : 'Créer un curriculum'}
                    </h2>
                    <div class="header-actions">
                        <button id="btn-preview" class="btn btn-secondary" ${!this.curriculum ? 'disabled' : ''}>
                            <i class="icon-eye"></i> Aperçu
                        </button>
                        <button id="btn-save" class="btn btn-primary">
                            <i class="icon-save"></i> Enregistrer
                        </button>
                    </div>
                </div>

                <!-- Form général curriculum -->
                <div class="curriculum-form">
                    <div class="form-section">
                        <h3>Informations générales</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="curriculum-title">Titre du programme *</label>
                                <input type="text" id="curriculum-title"
                                       placeholder="Ex: Programme L1 Informatique 2025-2026"
                                       value="${this.curriculum?.title || ''}" required />
                            </div>
                            <div class="form-group">
                                <label for="curriculum-level">Niveau</label>
                                <select id="curriculum-level">
                                    <option value="">-- Sélectionner --</option>
                                    <option value="L1" ${this.curriculum?.level === 'L1' ? 'selected' : ''}>L1</option>
                                    <option value="L2" ${this.curriculum?.level === 'L2' ? 'selected' : ''}>L2</option>
                                    <option value="L3" ${this.curriculum?.level === 'L3' ? 'selected' : ''}>L3</option>
                                    <option value="M1" ${this.curriculum?.level === 'M1' ? 'selected' : ''}>M1</option>
                                    <option value="M2" ${this.curriculum?.level === 'M2' ? 'selected' : ''}>M2</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="curriculum-year-start">Année de début</label>
                                <input type="number" id="curriculum-year-start"
                                       placeholder="2025" min="2020" max="2099"
                                       value="${this.curriculum?.year_start || new Date().getFullYear()}" />
                            </div>
                            <div class="form-group">
                                <label for="curriculum-year-end">Année de fin</label>
                                <input type="number" id="curriculum-year-end"
                                       placeholder="2026" min="2020" max="2099"
                                       value="${this.curriculum?.year_end || (new Date().getFullYear() + 1)}" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="curriculum-description">Description</label>
                            <textarea id="curriculum-description" rows="4"
                                      placeholder="Description générale du programme annuel...">${this.curriculum?.description || ''}</textarea>
                        </div>
                    </div>
                </div>

                <!-- Séquences -->
                <div class="sequences-section">
                    <div class="section-header">
                        <h3>Séquences pédagogiques</h3>
                        <button id="btn-add-sequence" class="btn btn-secondary">
                            <i class="icon-plus"></i> Ajouter une séquence
                        </button>
                    </div>

                    <div class="sequences-help">
                        <i class="icon-info"></i>
                        <p>Organisez votre programme en séquences. Glissez-déposez pour réorganiser l'ordre.</p>
                    </div>

                    <div id="sequences-container" class="sequences-list">
                        ${this.renderSequences()}
                    </div>
                </div>
            </div>

            <!-- Modal: Créer/Modifier séquence -->
            <div id="modal-sequence" class="modal" style="display: none;">
                <div class="modal-content modal-lg">
                    <div class="modal-header">
                        <h3 id="modal-sequence-title">Nouvelle séquence</h3>
                        <button class="btn-close" id="btn-close-sequence-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="sequence-id" value="" />

                        <div class="form-group">
                            <label for="sequence-label">Titre de la séquence *</label>
                            <input type="text" id="sequence-label"
                                   placeholder="Ex: Séquence 1: Bases de la programmation" required />
                        </div>

                        <div class="form-group">
                            <label for="sequence-description">Description</label>
                            <textarea id="sequence-description" rows="3"
                                      placeholder="Description détaillée de la séquence..."></textarea>
                        </div>

                        <div class="form-grid">
                            <div class="form-group">
                                <label for="sequence-duration">Durée (semaines)</label>
                                <input type="number" id="sequence-duration" min="1" max="52" placeholder="4" />
                            </div>
                            <div class="form-group">
                                <label for="sequence-start-date">Date de début</label>
                                <input type="date" id="sequence-start-date" />
                            </div>
                            <div class="form-group">
                                <label for="sequence-end-date">Date de fin</label>
                                <input type="date" id="sequence-end-date" />
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Objectifs pédagogiques</label>
                            <div id="objectives-container"></div>
                            <button type="button" id="btn-add-objective" class="btn btn-sm btn-secondary">
                                <i class="icon-plus"></i> Ajouter un objectif
                            </button>
                        </div>

                        <div class="form-group">
                            <label for="sequence-skills">Compétences visées (séparées par des virgules)</label>
                            <input type="text" id="sequence-skills"
                                   placeholder="Ex: Algorithmique, Résolution de problèmes, Analyse..." />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="btn-cancel-sequence" class="btn btn-secondary">Annuler</button>
                        <button id="btn-save-sequence" class="btn btn-primary">Enregistrer la séquence</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderSequences() {
        if (!this.sequences || this.sequences.length === 0) {
            return `
                <div class="empty-state">
                    <i class="icon-layers"></i>
                    <p>Aucune séquence pour le moment</p>
                    <p class="help-text">Cliquez sur "Ajouter une séquence" pour commencer</p>
                </div>
            `;
        }

        return this.sequences
            .sort((a, b) => a.position - b.position)
            .map(seq => this.renderSequenceCard(seq))
            .join('');
    }

    renderSequenceCard(sequence) {
        const objectives = Array.isArray(sequence.objectives) ? sequence.objectives : [];
        const objectivesText = objectives.length > 0
            ? objectives.map(obj => obj.label || obj).join(', ')
            : 'Aucun objectif défini';

        return `
            <div class="sequence-card" data-sequence-id="${sequence.id}" draggable="true">
                <div class="sequence-handle">
                    <i class="icon-drag"></i>
                </div>
                <div class="sequence-content">
                    <div class="sequence-header">
                        <div class="sequence-title">
                            <strong>Séquence ${sequence.position}</strong> - ${sequence.label}
                        </div>
                        <div class="sequence-actions">
                            <button class="btn btn-icon btn-sm btn-link-assignments"
                                    data-sequence-id="${sequence.id}" title="Lier missions/thèmes">
                                <i class="icon-link"></i>
                            </button>
                            <button class="btn btn-icon btn-sm btn-edit-sequence"
                                    data-sequence-id="${sequence.id}" title="Modifier">
                                <i class="icon-edit"></i>
                            </button>
                            <button class="btn btn-icon btn-sm btn-delete-sequence"
                                    data-sequence-id="${sequence.id}" title="Supprimer">
                                <i class="icon-trash"></i>
                            </button>
                        </div>
                    </div>

                    ${sequence.description ? `<p class="sequence-description">${sequence.description}</p>` : ''}

                    <div class="sequence-meta">
                        ${sequence.duration_weeks ? `<span><i class="icon-clock"></i> ${sequence.duration_weeks} semaines</span>` : ''}
                        ${sequence.start_date ? `<span><i class="icon-calendar"></i> ${this.formatDate(sequence.start_date)}</span>` : ''}
                        <span class="badge badge-${this.getStatusColor(sequence.status)}">${this.getStatusLabel(sequence.status)}</span>
                    </div>

                    <div class="sequence-objectives">
                        <strong>Objectifs:</strong> ${objectivesText}
                    </div>

                    <div class="sequence-links">
                        <span><i class="icon-assignment"></i> ${sequence.assignment_count || 0} mission(s)</span>
                        <span><i class="icon-theme"></i> ${sequence.theme_count || 0} thème(s)</span>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Sauvegarder le curriculum
        document.getElementById('btn-save')?.addEventListener('click', () => this.saveCurriculum());

        // Ajouter une séquence
        document.getElementById('btn-add-sequence')?.addEventListener('click', () => this.openSequenceModal());

        // Fermer modal
        document.getElementById('btn-close-sequence-modal')?.addEventListener('click', () => this.closeSequenceModal());
        document.getElementById('btn-cancel-sequence')?.addEventListener('click', () => this.closeSequenceModal());

        // Sauvegarder séquence
        document.getElementById('btn-save-sequence')?.addEventListener('click', () => this.saveSequence());

        // Ajouter objectif
        document.getElementById('btn-add-objective')?.addEventListener('click', () => this.addObjectiveField());

        // Drag & Drop
        this.attachDragDropListeners();

        // Actions sur séquences (délégation d'événements)
        document.getElementById('sequences-container')?.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const sequenceId = target.dataset.sequenceId;

            if (target.classList.contains('btn-edit-sequence')) {
                this.editSequence(sequenceId);
            } else if (target.classList.contains('btn-delete-sequence')) {
                this.deleteSequence(sequenceId);
            } else if (target.classList.contains('btn-link-assignments')) {
                this.openLinkAssignmentsModal(sequenceId);
            }
        });
    }

    attachDragDropListeners() {
        const container = document.getElementById('sequences-container');
        if (!container) return;

        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('sequence-card')) {
                this.isDragging = true;
                this.draggedSequence = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('sequence-card')) {
                this.isDragging = false;
                e.target.classList.remove('dragging');
                this.draggedSequence = null;
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!this.isDragging) return;

            const afterElement = this.getDragAfterElement(container, e.clientY);
            if (afterElement == null) {
                container.appendChild(this.draggedSequence);
            } else {
                container.insertBefore(this.draggedSequence, afterElement);
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedSequence) {
                this.updateSequencePositions();
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.sequence-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    async updateSequencePositions() {
        const cards = document.querySelectorAll('.sequence-card');
        const updates = [];

        cards.forEach((card, index) => {
            const sequenceId = card.dataset.sequenceId;
            const sequence = this.sequences.find(s => s.id === sequenceId);

            if (sequence && sequence.position !== index + 1) {
                updates.push({
                    id: sequenceId,
                    old_position: sequence.position,
                    new_position: index + 1
                });
                sequence.position = index + 1;
            }
        });

        // Envoyer les mises à jour au serveur
        for (const update of updates) {
            try {
                await this.apiCall(`/curriculum/sequence/${update.id}/reorder`, 'PATCH', {
                    new_position: update.new_position
                });
            } catch (error) {
                console.error('Erreur lors de la réorganisation:', error);
                this.showNotification('Erreur lors de la réorganisation des séquences', 'error');
            }
        }

        if (updates.length > 0) {
            this.showNotification('Séquences réorganisées avec succès', 'success');
        }
    }

    openSequenceModal(sequence = null) {
        const modal = document.getElementById('modal-sequence');
        const title = document.getElementById('modal-sequence-title');

        if (sequence) {
            title.textContent = 'Modifier la séquence';
            document.getElementById('sequence-id').value = sequence.id;
            document.getElementById('sequence-label').value = sequence.label || '';
            document.getElementById('sequence-description').value = sequence.description || '';
            document.getElementById('sequence-duration').value = sequence.duration_weeks || '';
            document.getElementById('sequence-start-date').value = sequence.start_date || '';
            document.getElementById('sequence-end-date').value = sequence.end_date || '';

            if (sequence.skills && Array.isArray(sequence.skills)) {
                document.getElementById('sequence-skills').value = sequence.skills.join(', ');
            }

            // Remplir les objectifs
            const objectivesContainer = document.getElementById('objectives-container');
            objectivesContainer.innerHTML = '';

            if (sequence.objectives && Array.isArray(sequence.objectives)) {
                sequence.objectives.forEach((obj, idx) => {
                    this.addObjectiveField(obj.label || obj, obj.id || `obj-${idx}`);
                });
            }
        } else {
            title.textContent = 'Nouvelle séquence';
            document.getElementById('sequence-id').value = '';
            document.getElementById('sequence-label').value = '';
            document.getElementById('sequence-description').value = '';
            document.getElementById('sequence-duration').value = '';
            document.getElementById('sequence-start-date').value = '';
            document.getElementById('sequence-end-date').value = '';
            document.getElementById('sequence-skills').value = '';
            document.getElementById('objectives-container').innerHTML = '';

            // Ajouter un objectif par défaut
            this.addObjectiveField();
        }

        modal.style.display = 'flex';
    }

    closeSequenceModal() {
        const modal = document.getElementById('modal-sequence');
        modal.style.display = 'none';
    }

    addObjectiveField(value = '', id = '') {
        const container = document.getElementById('objectives-container');
        const objectiveId = id || `obj-${Date.now()}`;

        const div = document.createElement('div');
        div.className = 'objective-item';
        div.innerHTML = `
            <input type="hidden" class="objective-id" value="${objectiveId}" />
            <input type="text" class="objective-label" placeholder="Ex: Comprendre les variables"
                   value="${value}" />
            <button type="button" class="btn btn-icon btn-sm btn-remove-objective">
                <i class="icon-trash"></i>
            </button>
        `;

        div.querySelector('.btn-remove-objective').addEventListener('click', () => {
            div.remove();
        });

        container.appendChild(div);
    }

    async saveSequence() {
        const sequenceId = document.getElementById('sequence-id').value;
        const label = document.getElementById('sequence-label').value.trim();

        if (!label) {
            this.showNotification('Le titre de la séquence est requis', 'error');
            return;
        }

        // Collecter les objectifs
        const objectiveItems = document.querySelectorAll('.objective-item');
        const objectives = [];

        objectiveItems.forEach(item => {
            const id = item.querySelector('.objective-id').value;
            const label = item.querySelector('.objective-label').value.trim();
            if (label) {
                objectives.push({ id, label });
            }
        });

        // Collecter les compétences
        const skillsText = document.getElementById('sequence-skills').value.trim();
        const skills = skillsText ? skillsText.split(',').map(s => s.trim()).filter(s => s) : [];

        const data = {
            label,
            description: document.getElementById('sequence-description').value.trim(),
            duration_weeks: parseInt(document.getElementById('sequence-duration').value) || null,
            start_date: document.getElementById('sequence-start-date').value || null,
            end_date: document.getElementById('sequence-end-date').value || null,
            objectives,
            skills
        };

        try {
            if (sequenceId) {
                // Modifier
                await this.apiCall(`/curriculum/sequence/${sequenceId}`, 'PATCH', data);
                this.showNotification('Séquence mise à jour avec succès', 'success');
            } else {
                // Créer
                if (!this.curriculum?.id) {
                    this.showNotification('Veuillez d\'abord créer le curriculum', 'error');
                    return;
                }
                await this.apiCall(`/curriculum/${this.curriculum.id}/sequences`, 'POST', data);
                this.showNotification('Séquence créée avec succès', 'success');
            }

            this.closeSequenceModal();
            await this.loadCurriculum(this.curriculum.id);

        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la séquence:', error);
            this.showNotification('Erreur lors de la sauvegarde de la séquence', 'error');
        }
    }

    async editSequence(sequenceId) {
        const sequence = this.sequences.find(s => s.id === sequenceId);
        if (sequence) {
            this.openSequenceModal(sequence);
        }
    }

    async deleteSequence(sequenceId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette séquence ?')) {
            return;
        }

        try {
            await this.apiCall(`/curriculum/sequence/${sequenceId}`, 'DELETE');
            this.showNotification('Séquence supprimée avec succès', 'success');
            await this.loadCurriculum(this.curriculum.id);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            this.showNotification('Erreur lors de la suppression de la séquence', 'error');
        }
    }

    async saveCurriculum() {
        const title = document.getElementById('curriculum-title').value.trim();

        if (!title) {
            this.showNotification('Le titre du curriculum est requis', 'error');
            return;
        }

        const data = {
            title,
            description: document.getElementById('curriculum-description').value.trim(),
            level: document.getElementById('curriculum-level').value || null,
            year_start: parseInt(document.getElementById('curriculum-year-start').value),
            year_end: parseInt(document.getElementById('curriculum-year-end').value),
            class_id: this.options.classId,
            teacher_id: this.options.teacherId
        };

        try {
            if (this.curriculum?.id) {
                // Modifier
                await this.apiCall(`/curriculum/${this.curriculum.id}`, 'PATCH', data);
                this.showNotification('Curriculum mis à jour avec succès', 'success');
            } else {
                // Créer
                const response = await this.apiCall('/curriculum', 'POST', data);
                this.curriculum = { ...data, id: response.curriculum_id };
                this.options.curriculumId = response.curriculum_id;
                this.showNotification('Curriculum créé avec succès', 'success');

                // Recharger pour afficher le formulaire complet
                this.render();
                this.attachEventListeners();
            }

            this.options.onSave(this.curriculum);

        } catch (error) {
            console.error('Erreur lors de la sauvegarde du curriculum:', error);
            this.showNotification('Erreur lors de la sauvegarde du curriculum', 'error');
        }
    }

    async loadCurriculum(curriculumId) {
        try {
            const response = await this.apiCall(`/curriculum/${curriculumId}`, 'GET');

            if (response.success) {
                this.curriculum = response.data;
                this.sequences = response.data.sequences || [];
                this.render();
                this.attachEventListeners();
            }
        } catch (error) {
            console.error('Erreur lors du chargement du curriculum:', error);
            this.showNotification('Erreur lors du chargement du curriculum', 'error');
        }
    }

    async openLinkAssignmentsModal(sequenceId) {
        // TODO: Implémenter le modal pour lier missions/thèmes
        alert('Fonctionnalité "Lier missions/thèmes" - À implémenter');
    }

    // Utilities
    async apiCall(endpoint, method = 'GET', data = null) {
        const url = `${this.options.apiBaseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Tenant-Id': this.options.tenantId
        };

        const options = {
            method,
            headers
        };

        if (data && (method === 'POST' || method === 'PATCH')) {
            options.body = new URLSearchParams({ ...data, tenant_id: this.options.tenantId });
        }

        const response = await fetch(url, options);
        return await response.json();
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR');
    }

    getStatusLabel(status) {
        const labels = {
            'draft': 'Brouillon',
            'in_progress': 'En cours',
            'completed': 'Terminée',
            'archived': 'Archivée'
        };
        return labels[status] || status;
    }

    getStatusColor(status) {
        const colors = {
            'draft': 'secondary',
            'in_progress': 'primary',
            'completed': 'success',
            'archived': 'muted'
        };
        return colors[status] || 'secondary';
    }

    showNotification(message, type = 'info') {
        // Simple notification - peut être améliorée avec un système de toast
        if (type === 'error') {
            alert(`❌ ${message}`);
        } else if (type === 'success') {
            alert(`✅ ${message}`);
        } else {
            alert(`ℹ️ ${message}`);
        }
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CurriculumBuilder;
}
