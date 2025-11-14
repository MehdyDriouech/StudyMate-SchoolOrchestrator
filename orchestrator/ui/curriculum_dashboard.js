/**
 * Sprint 18 - Curriculum Dashboard
 * UI Component: Vue enseignant du curriculum avec stats d'avancement
 * Permet aux enseignants de suivre la progression de leur classe
 */

class CurriculumDashboard {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            apiBaseUrl: options.apiBaseUrl || '/api',
            tenantId: options.tenantId,
            teacherId: options.teacherId,
            classId: options.classId,
            onEdit: options.onEdit || (() => {}),
            ...options
        };

        this.curriculums = [];
        this.selectedCurriculum = null;
        this.stats = null;

        this.init();
    }

    async init() {
        this.render();
        this.attachEventListeners();
        await this.loadCurriculums();
    }

    render() {
        this.container.innerHTML = `
            <div class="curriculum-dashboard">
                <!-- Header -->
                <div class="dashboard-header">
                    <h2><i class="icon-book"></i> Mes programmes annuels</h2>
                    <div class="header-actions">
                        <select id="select-curriculum" class="form-select">
                            <option value="">-- Sélectionner un programme --</option>
                            ${this.curriculums.map(c => `
                                <option value="${c.id}" ${this.selectedCurriculum?.id === c.id ? 'selected' : ''}>
                                    ${c.title} (${c.class_name})
                                </option>
                            `).join('')}
                        </select>
                        <button id="btn-new-curriculum" class="btn btn-primary">
                            <i class="icon-plus"></i> Nouveau programme
                        </button>
                        <button id="btn-export-pdf" class="btn btn-secondary" ${!this.selectedCurriculum ? 'disabled' : ''}>
                            <i class="icon-download"></i> Export PDF
                        </button>
                    </div>
                </div>

                <!-- Stats globales -->
                ${this.selectedCurriculum ? this.renderGlobalStats() : ''}

                <!-- Séquences avec progression -->
                <div id="sequences-progress-container">
                    ${this.selectedCurriculum ? this.renderSequencesProgress() : this.renderEmptyState()}
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <i class="icon-book-open"></i>
                <h3>Aucun programme sélectionné</h3>
                <p>Sélectionnez un programme existant ou créez-en un nouveau pour commencer</p>
                <button id="btn-create-first" class="btn btn-primary">
                    <i class="icon-plus"></i> Créer mon premier programme
                </button>
            </div>
        `;
    }

    renderGlobalStats() {
        const sequences = this.selectedCurriculum.sequences || [];
        const totalSequences = sequences.length;
        const completedSequences = sequences.filter(s => s.status === 'completed').length;
        const inProgressSequences = sequences.filter(s => s.status === 'in_progress').length;

        const avgCompletion = sequences.length > 0
            ? (sequences.reduce((sum, s) => sum + parseFloat(s.completion_percent || 0), 0) / sequences.length).toFixed(1)
            : 0;

        return `
            <div class="global-stats">
                <div class="stat-card">
                    <div class="stat-icon bg-primary">
                        <i class="icon-layers"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${totalSequences}</div>
                        <div class="stat-label">Séquences totales</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon bg-success">
                        <i class="icon-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${completedSequences}</div>
                        <div class="stat-label">Séquences terminées</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon bg-info">
                        <i class="icon-activity"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${inProgressSequences}</div>
                        <div class="stat-label">En cours</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon bg-warning">
                        <i class="icon-trending-up"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">${avgCompletion}%</div>
                        <div class="stat-label">Avancement moyen</div>
                    </div>
                </div>
            </div>

            <div class="curriculum-info">
                <h3>${this.selectedCurriculum.title}</h3>
                <p>${this.selectedCurriculum.description || ''}</p>
                <div class="curriculum-meta">
                    <span><i class="icon-calendar"></i> ${this.selectedCurriculum.year_start} - ${this.selectedCurriculum.year_end}</span>
                    <span><i class="icon-users"></i> ${this.selectedCurriculum.class_name}</span>
                    ${this.selectedCurriculum.level ? `<span><i class="icon-award"></i> ${this.selectedCurriculum.level}</span>` : ''}
                </div>
                <button id="btn-edit-curriculum" class="btn btn-sm btn-secondary">
                    <i class="icon-edit"></i> Modifier le programme
                </button>
            </div>
        `;
    }

    renderSequencesProgress() {
        const sequences = this.selectedCurriculum.sequences || [];

        if (sequences.length === 0) {
            return `
                <div class="empty-sequences">
                    <p>Ce programme ne contient aucune séquence pour le moment.</p>
                    <button id="btn-add-sequence" class="btn btn-primary">
                        <i class="icon-plus"></i> Ajouter une séquence
                    </button>
                </div>
            `;
        }

        return `
            <div class="sequences-progress-section">
                <h3>Progression par séquence</h3>
                <div class="sequences-progress-list">
                    ${sequences.map(seq => this.renderSequenceProgressCard(seq)).join('')}
                </div>
            </div>
        `;
    }

    renderSequenceProgressCard(sequence) {
        const completion = parseFloat(sequence.completion_percent || 0);
        const statusLabel = this.getStatusLabel(sequence.status);
        const statusColor = this.getStatusColor(sequence.status);

        const objectives = Array.isArray(sequence.objectives) ? sequence.objectives : [];
        const assignmentCount = sequence.assignment_count || 0;
        const themeCount = sequence.theme_count || 0;

        return `
            <div class="sequence-progress-card">
                <div class="sequence-header">
                    <div class="sequence-title">
                        <strong>Séquence ${sequence.position}</strong> - ${sequence.label}
                        <span class="badge badge-${statusColor}">${statusLabel}</span>
                    </div>
                    <div class="sequence-dates">
                        ${sequence.start_date ? `
                            <span title="Date de début"><i class="icon-calendar"></i> ${this.formatDate(sequence.start_date)}</span>
                        ` : ''}
                        ${sequence.end_date ? `
                            <span title="Date de fin"><i class="icon-calendar"></i> ${this.formatDate(sequence.end_date)}</span>
                        ` : ''}
                        ${sequence.duration_weeks ? `
                            <span title="Durée"><i class="icon-clock"></i> ${sequence.duration_weeks} sem.</span>
                        ` : ''}
                    </div>
                </div>

                ${sequence.description ? `<p class="sequence-description">${sequence.description}</p>` : ''}

                <!-- Barre de progression -->
                <div class="progress-bar-container">
                    <div class="progress-bar-label">
                        <span>Avancement de la classe</span>
                        <span class="progress-value">${completion.toFixed(1)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${completion}%"></div>
                    </div>
                </div>

                <!-- Objectifs -->
                ${objectives.length > 0 ? `
                    <div class="sequence-objectives">
                        <strong>Objectifs pédagogiques:</strong>
                        <ul>
                            ${objectives.map(obj => `<li>${obj.label || obj}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- Ressources liées -->
                <div class="sequence-resources">
                    <div class="resource-count">
                        <i class="icon-assignment"></i>
                        <span>${assignmentCount} mission(s) liée(s)</span>
                    </div>
                    <div class="resource-count">
                        <i class="icon-theme"></i>
                        <span>${themeCount} thème(s) lié(s)</span>
                    </div>
                </div>

                <!-- Actions -->
                <div class="sequence-actions">
                    <button class="btn btn-sm btn-secondary btn-view-details" data-sequence-id="${sequence.id}">
                        <i class="icon-eye"></i> Voir détails
                    </button>
                    <button class="btn btn-sm btn-secondary btn-view-students" data-sequence-id="${sequence.id}">
                        <i class="icon-users"></i> Voir élèves
                    </button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Sélection de curriculum
        document.getElementById('select-curriculum')?.addEventListener('change', async (e) => {
            const curriculumId = e.target.value;
            if (curriculumId) {
                await this.loadCurriculum(curriculumId);
            } else {
                this.selectedCurriculum = null;
                this.render();
                this.attachEventListeners();
            }
        });

        // Nouveau curriculum
        document.getElementById('btn-new-curriculum')?.addEventListener('click', () => {
            this.options.onEdit(null);
        });

        // Modifier curriculum
        document.getElementById('btn-edit-curriculum')?.addEventListener('click', () => {
            if (this.selectedCurriculum) {
                this.options.onEdit(this.selectedCurriculum.id);
            }
        });

        // Export PDF
        document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
            this.exportToPDF();
        });

        // Créer premier programme
        document.getElementById('btn-create-first')?.addEventListener('click', () => {
            this.options.onEdit(null);
        });

        // Ajouter séquence
        document.getElementById('btn-add-sequence')?.addEventListener('click', () => {
            this.options.onEdit(this.selectedCurriculum?.id);
        });

        // Actions sur séquences (délégation)
        const container = document.getElementById('sequences-progress-container');
        container?.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const sequenceId = target.dataset.sequenceId;

            if (target.classList.contains('btn-view-details')) {
                this.viewSequenceDetails(sequenceId);
            } else if (target.classList.contains('btn-view-students')) {
                this.viewStudentsProgress(sequenceId);
            }
        });
    }

    async loadCurriculums() {
        try {
            const params = new URLSearchParams({
                tenant_id: this.options.tenantId,
                limit: 100
            });

            if (this.options.teacherId) {
                params.append('teacher_id', this.options.teacherId);
            }
            if (this.options.classId) {
                params.append('class_id', this.options.classId);
            }

            const response = await this.apiCall(`/curriculum?${params.toString()}`, 'GET');

            if (response.success) {
                this.curriculums = response.data || [];

                // Sélectionner le premier par défaut
                if (this.curriculums.length > 0 && !this.selectedCurriculum) {
                    await this.loadCurriculum(this.curriculums[0].id);
                } else {
                    this.render();
                    this.attachEventListeners();
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des curriculums:', error);
            this.showNotification('Erreur lors du chargement des programmes', 'error');
        }
    }

    async loadCurriculum(curriculumId) {
        try {
            const response = await this.apiCall(`/curriculum/${curriculumId}`, 'GET');

            if (response.success) {
                this.selectedCurriculum = response.data;
                this.render();
                this.attachEventListeners();
            }
        } catch (error) {
            console.error('Erreur lors du chargement du curriculum:', error);
            this.showNotification('Erreur lors du chargement du programme', 'error');
        }
    }

    async viewSequenceDetails(sequenceId) {
        const sequence = this.selectedCurriculum.sequences.find(s => s.id === sequenceId);
        if (!sequence) return;

        // TODO: Implémenter modal détaillé avec stats par élève
        alert(`Détails de la séquence "${sequence.label}"\n\nÀ implémenter: statistiques détaillées par élève`);
    }

    async viewStudentsProgress(sequenceId) {
        const sequence = this.selectedCurriculum.sequences.find(s => s.id === sequenceId);
        if (!sequence) return;

        // TODO: Implémenter modal avec liste des élèves et leur progression
        alert(`Progression des élèves pour "${sequence.label}"\n\nÀ implémenter: liste des élèves avec % de complétion`);
    }

    async exportToPDF() {
        if (!this.selectedCurriculum) return;

        try {
            this.showNotification('Génération du PDF en cours...', 'info');

            // Appeler l'API d'export
            const response = await fetch(`${this.options.apiBaseUrl}/curriculum/${this.selectedCurriculum.id}/export-pdf`, {
                method: 'GET',
                headers: {
                    'X-Tenant-Id': this.options.tenantId
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `curriculum_${this.selectedCurriculum.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                this.showNotification('PDF exporté avec succès', 'success');
            } else {
                throw new Error('Erreur lors de l\'export PDF');
            }
        } catch (error) {
            console.error('Erreur lors de l\'export PDF:', error);
            this.showNotification('Erreur lors de l\'export PDF', 'error');
        }
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
    module.exports = CurriculumDashboard;
}
