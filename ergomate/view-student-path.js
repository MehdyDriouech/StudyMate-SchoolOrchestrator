/**
 * Sprint 18 - Vue Élève du Parcours Annuel (ErgoMate)
 * Permet aux élèves de visualiser leur progression dans le curriculum annuel
 * Affiche une timeline avec séquences, objectifs et missions
 */

class StudentPathView {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            apiBaseUrl: options.apiBaseUrl || 'https://orchestrator.studymate.example.com/api',
            studentUuid: options.studentUuid, // UUID ErgoMate de l'élève
            tenantId: options.tenantId,
            onMissionClick: options.onMissionClick || (() => {}),
            ...options
        };

        this.curriculum = null;
        this.sequences = [];
        this.currentSequenceIndex = 0;

        this.init();
    }

    async init() {
        this.renderLoading();
        await this.loadStudentPath();
    }

    renderLoading() {
        this.container.innerHTML = `
            <div class="student-path-loading">
                <div class="spinner"></div>
                <p>Chargement de ton parcours...</p>
            </div>
        `;
    }

    render() {
        if (!this.curriculum) {
            this.renderEmptyState();
            return;
        }

        this.container.innerHTML = `
            <div class="student-path-view">
                <!-- Header -->
                <div class="path-header">
                    <h2><i class="icon-map"></i> Mon parcours de l'année</h2>
                    <p class="curriculum-title">${this.curriculum.title}</p>
                </div>

                <!-- Stats globales élève -->
                ${this.renderStudentGlobalStats()}

                <!-- Timeline des séquences -->
                <div class="sequences-timeline">
                    ${this.renderTimeline()}
                </div>

                <!-- Détails de la séquence courante -->
                ${this.renderCurrentSequenceDetail()}
            </div>
        `;

        this.attachEventListeners();
    }

    renderEmptyState() {
        this.container.innerHTML = `
            <div class="empty-state">
                <i class="icon-book-open"></i>
                <h3>Aucun programme disponible</h3>
                <p>Ton enseignant n'a pas encore créé de programme pour cette année.</p>
            </div>
        `;
    }

    renderStudentGlobalStats() {
        const totalSequences = this.sequences.length;
        const completedSequences = this.sequences.filter(s => s.student_status === 'completed').length;
        const inProgressSequences = this.sequences.filter(s => s.student_status === 'in_progress').length;

        const avgCompletion = this.sequences.length > 0
            ? (this.sequences.reduce((sum, s) => sum + parseFloat(s.student_completion || 0), 0) / this.sequences.length).toFixed(1)
            : 0;

        // Calculer le statut global
        const globalStatus = this.calculateGlobalStatus(avgCompletion);

        return `
            <div class="student-global-stats">
                <div class="progress-indicator ${globalStatus.class}">
                    <div class="indicator-icon">
                        <i class="${globalStatus.icon}"></i>
                    </div>
                    <div class="indicator-content">
                        <strong>${globalStatus.label}</strong>
                        <p>${globalStatus.message}</p>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${totalSequences}</div>
                        <div class="stat-label">Séquences totales</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${completedSequences}</div>
                        <div class="stat-label">Terminées</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${inProgressSequences}</div>
                        <div class="stat-label">En cours</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${avgCompletion}%</div>
                        <div class="stat-label">Progression</div>
                    </div>
                </div>
            </div>
        `;
    }

    calculateGlobalStatus(avgCompletion) {
        // Calculer si l'élève est en avance, à l'heure ou en retard
        // Basé sur la date actuelle et les dates des séquences
        const now = new Date();
        let expectedCompletion = 0;

        // Calculer la complétion attendue basée sur les dates
        if (this.curriculum.year_start && this.curriculum.year_end) {
            const startDate = new Date(this.curriculum.year_start, 8, 1); // 1er septembre
            const endDate = new Date(this.curriculum.year_end, 5, 30); // 30 juin
            const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
            const elapsedDays = (now - startDate) / (1000 * 60 * 60 * 24);

            if (elapsedDays > 0 && elapsedDays < totalDays) {
                expectedCompletion = (elapsedDays / totalDays) * 100;
            } else if (elapsedDays >= totalDays) {
                expectedCompletion = 100;
            }
        }

        const diff = avgCompletion - expectedCompletion;

        if (diff >= 10) {
            return {
                class: 'status-ahead',
                icon: 'icon-trending-up',
                label: '🎉 Tu es en avance !',
                message: 'Continue comme ça, tu es au-dessus de la progression attendue.'
            };
        } else if (diff >= -10) {
            return {
                class: 'status-on-track',
                icon: 'icon-check-circle',
                label: '✅ Tu es à l\'heure',
                message: 'Tu suis bien le rythme de la classe.'
            };
        } else {
            return {
                class: 'status-behind',
                icon: 'icon-alert-circle',
                label: '⚠️ Attention, tu es en retard',
                message: 'N\'hésite pas à demander de l\'aide à ton enseignant.'
            };
        }
    }

    renderTimeline() {
        if (this.sequences.length === 0) {
            return '<p class="text-muted">Aucune séquence définie pour le moment.</p>';
        }

        return `
            <div class="timeline">
                ${this.sequences.map((seq, index) => this.renderTimelineItem(seq, index)).join('')}
            </div>
        `;
    }

    renderTimelineItem(sequence, index) {
        const completion = parseFloat(sequence.student_completion || 0);
        const status = sequence.student_status || 'not_started';
        const isCurrent = status === 'in_progress' || (index === this.currentSequenceIndex);

        const statusConfig = {
            'completed': { icon: 'icon-check-circle', class: 'completed', color: 'green' },
            'in_progress': { icon: 'icon-activity', class: 'in-progress', color: 'blue' },
            'not_started': { icon: 'icon-circle', class: 'not-started', color: 'gray' },
            'behind': { icon: 'icon-alert-circle', class: 'behind', color: 'orange' }
        };

        const config = statusConfig[status] || statusConfig['not_started'];

        return `
            <div class="timeline-item ${config.class} ${isCurrent ? 'current' : ''}"
                 data-sequence-index="${index}">
                <div class="timeline-marker">
                    <div class="marker-icon" style="background-color: ${config.color}">
                        <i class="${config.icon}"></i>
                    </div>
                    <div class="marker-line"></div>
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h4>${sequence.label}</h4>
                        <span class="completion-badge">${completion.toFixed(0)}%</span>
                    </div>
                    ${sequence.description ? `<p class="timeline-description">${sequence.description}</p>` : ''}
                    ${sequence.start_date || sequence.end_date ? `
                        <div class="timeline-dates">
                            ${sequence.start_date ? `<span><i class="icon-calendar"></i> ${this.formatDate(sequence.start_date)}</span>` : ''}
                            ${sequence.end_date ? `<span>→ ${this.formatDate(sequence.end_date)}</span>` : ''}
                        </div>
                    ` : ''}
                    <div class="progress-bar-mini">
                        <div class="progress-fill" style="width: ${completion}%; background-color: ${config.color}"></div>
                    </div>
                    ${isCurrent ? `
                        <button class="btn btn-sm btn-primary btn-view-sequence" data-index="${index}">
                            Voir les missions <i class="icon-arrow-right"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderCurrentSequenceDetail() {
        const currentSeq = this.sequences[this.currentSequenceIndex];
        if (!currentSeq) return '';

        const objectives = Array.isArray(currentSeq.objectives) ? currentSeq.objectives : [];
        const assignments = Array.isArray(currentSeq.assignments) ? currentSeq.assignments : [];
        const themes = Array.isArray(currentSeq.themes) ? currentSeq.themes : [];

        return `
            <div class="current-sequence-detail">
                <div class="detail-header">
                    <h3>${currentSeq.label}</h3>
                    <button id="btn-close-detail" class="btn btn-icon">
                        <i class="icon-x"></i>
                    </button>
                </div>

                ${objectives.length > 0 ? `
                    <div class="objectives-section">
                        <h4><i class="icon-target"></i> Objectifs à atteindre</h4>
                        <ul class="objectives-list">
                            ${objectives.map(obj => `
                                <li>
                                    <i class="icon-check-circle"></i>
                                    ${obj.label || obj}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${assignments.length > 0 ? `
                    <div class="missions-section">
                        <h4><i class="icon-assignment"></i> Missions à faire</h4>
                        <div class="missions-list">
                            ${assignments.map(a => this.renderMissionCard(a)).join('')}
                        </div>
                    </div>
                ` : ''}

                ${themes.length > 0 ? `
                    <div class="themes-section">
                        <h4><i class="icon-book"></i> Thèmes associés</h4>
                        <div class="themes-list">
                            ${themes.map(t => this.renderThemeCard(t)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderMissionCard(assignment) {
        const completion = parseFloat(assignment.completion_percent || 0);
        const isCompleted = completion >= 80;
        const status = assignment.status || 'not_started';

        const typeIcons = {
            'quiz': 'icon-help-circle',
            'flashcards': 'icon-layers',
            'fiche': 'icon-file-text',
            'annales': 'icon-book-open'
        };

        const icon = typeIcons[assignment.type] || 'icon-file';

        return `
            <div class="mission-card ${isCompleted ? 'completed' : ''}"
                 data-assignment-id="${assignment.id}">
                <div class="mission-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="mission-content">
                    <h5>${assignment.title}</h5>
                    <div class="mission-meta">
                        <span class="mission-type">${this.getTypeLabel(assignment.type)}</span>
                        ${assignment.due_at ? `
                            <span class="mission-due">
                                <i class="icon-clock"></i> ${this.formatDate(assignment.due_at)}
                            </span>
                        ` : ''}
                    </div>
                    <div class="mission-progress">
                        <div class="progress-bar-mini">
                            <div class="progress-fill" style="width: ${completion}%"></div>
                        </div>
                        <span class="progress-text">${completion.toFixed(0)}%</span>
                    </div>
                </div>
                <div class="mission-action">
                    ${isCompleted ? `
                        <span class="badge badge-success">
                            <i class="icon-check"></i> Terminé
                        </span>
                    ` : `
                        <button class="btn btn-sm btn-primary btn-start-mission"
                                data-assignment-id="${assignment.id}">
                            ${status === 'in_progress' ? 'Continuer' : 'Commencer'}
                        </button>
                    `}
                </div>
            </div>
        `;
    }

    renderThemeCard(theme) {
        const difficultyColors = {
            'beginner': 'green',
            'intermediate': 'orange',
            'advanced': 'red'
        };

        const color = difficultyColors[theme.difficulty] || 'gray';

        return `
            <div class="theme-card">
                <div class="theme-icon">
                    <i class="icon-book"></i>
                </div>
                <div class="theme-content">
                    <h5>${theme.title}</h5>
                    ${theme.description ? `<p>${theme.description}</p>` : ''}
                    <span class="badge" style="background-color: ${color}">
                        ${this.getDifficultyLabel(theme.difficulty)}
                    </span>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Voir séquence
        document.querySelectorAll('.btn-view-sequence').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.currentSequenceIndex = index;
                this.render();
            });
        });

        // Fermer détail
        document.getElementById('btn-close-detail')?.addEventListener('click', () => {
            this.currentSequenceIndex = -1;
            this.render();
        });

        // Commencer mission
        document.querySelectorAll('.btn-start-mission').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assignmentId = e.target.dataset.assignmentId;
                this.options.onMissionClick(assignmentId);
            });
        });
    }

    async loadStudentPath() {
        try {
            const response = await this.apiCall(`/curriculum/student/${this.options.studentUuid}`, 'GET');

            if (response.success) {
                this.curriculum = response.data.curriculum;
                this.sequences = this.curriculum.sequences || [];

                // Trouver la séquence courante (première en cours ou non commencée)
                const currentIndex = this.sequences.findIndex(s =>
                    s.student_status === 'in_progress' || s.student_status === 'not_started'
                );
                this.currentSequenceIndex = currentIndex >= 0 ? currentIndex : 0;

                this.render();
            } else {
                this.renderEmptyState();
            }
        } catch (error) {
            console.error('Erreur lors du chargement du parcours:', error);
            this.container.innerHTML = `
                <div class="error-state">
                    <i class="icon-alert-circle"></i>
                    <h3>Erreur</h3>
                    <p>Impossible de charger ton parcours. Réessaie plus tard.</p>
                </div>
            `;
        }
    }

    // Utilities
    async apiCall(endpoint, method = 'GET') {
        const url = `${this.options.apiBaseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Tenant-Id': this.options.tenantId
        };

        const response = await fetch(url, {
            method,
            headers
        });

        return await response.json();
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    }

    getTypeLabel(type) {
        const labels = {
            'quiz': 'Quiz',
            'flashcards': 'Flashcards',
            'fiche': 'Fiche',
            'annales': 'Annales'
        };
        return labels[type] || type;
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            'beginner': 'Débutant',
            'intermediate': 'Intermédiaire',
            'advanced': 'Avancé'
        };
        return labels[difficulty] || difficulty;
    }
}

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudentPathView;
}
