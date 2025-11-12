/**
 * Module Assignments - Gestion des affectations
 * UI pour créer, lister et suivre les assignments
 */

const AssignmentsModule = {
    currentAssignment: null,
    assignments: [],

    /**
     * Initialiser le module
     */
    init() {
        console.log('Assignments module initialized');
        this.bindEvents();
        this.loadAssignments();
    },

    /**
     * Attacher les événements
     */
    bindEvents() {
        // Bouton créer un assignment
        const btnCreate = document.getElementById('btn-create-assignment');
        if (btnCreate) {
            btnCreate.addEventListener('click', () => this.showCreateForm());
        }

        // Formulaire de création
        const formCreate = document.getElementById('form-create-assignment');
        if (formCreate) {
            formCreate.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createAssignment();
            });
        }

        // Sélecteur de type de cible
        const targetTypeSelect = document.getElementById('target-type');
        if (targetTypeSelect) {
            targetTypeSelect.addEventListener('change', (e) => {
                this.loadTargets(e.target.value);
            });
        }
    },

    /**
     * Charger la liste des assignments
     */
    async loadAssignments(filters = {}) {
        try {
            const params = new URLSearchParams({
                limit: filters.limit || 50,
                offset: filters.offset || 0,
                ...filters
            });

            const response = await fetch(`/api/assignments?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load assignments');
            }

            const data = await response.json();
            this.assignments = data.assignments;

            this.renderAssignmentsList(data.assignments);
            this.renderPagination(data.pagination);

        } catch (error) {
            console.error('Error loading assignments:', error);
            this.showError('Erreur lors du chargement des missions');
        }
    },

    /**
     * Afficher la liste des assignments
     */
    renderAssignmentsList(assignments) {
        const container = document.getElementById('assignments-list');
        if (!container) return;

        if (assignments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Aucune mission trouvée</p>
                    <button onclick="AssignmentsModule.showCreateForm()" class="btn-primary">
                        Créer une mission
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = assignments.map(assignment => `
            <div class="assignment-card" data-id="${assignment.id}">
                <div class="assignment-header">
                    <h3>${this.escapeHtml(assignment.title)}</h3>
                    <span class="badge badge-${this.getStatusClass(assignment.status)}">
                        ${this.getStatusLabel(assignment.status)}
                    </span>
                </div>
                <div class="assignment-body">
                    <div class="assignment-info">
                        <span class="label">Type:</span>
                        <span class="value">${this.getTypeLabel(assignment.type)}</span>
                    </div>
                    <div class="assignment-info">
                        <span class="label">Thème:</span>
                        <span class="value">${this.escapeHtml(assignment.theme_title)}</span>
                    </div>
                    <div class="assignment-info">
                        <span class="label">Enseignant:</span>
                        <span class="value">${this.escapeHtml(assignment.teacher_name)}</span>
                    </div>
                    ${assignment.due_at ? `
                    <div class="assignment-info">
                        <span class="label">À rendre avant:</span>
                        <span class="value">${this.formatDate(assignment.due_at)}</span>
                    </div>
                    ` : ''}
                    <div class="assignment-stats">
                        <div class="stat">
                            <span class="stat-label">Cibles</span>
                            <span class="stat-value">${assignment.target_count || 0}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Reçu</span>
                            <span class="stat-value">${assignment.received_count || 0}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Complété</span>
                            <span class="stat-value">${assignment.completed_count || 0}</span>
                        </div>
                    </div>
                </div>
                <div class="assignment-footer">
                    <button onclick="AssignmentsModule.viewDetails('${assignment.id}')" class="btn-secondary">
                        Voir détails
                    </button>
                    <button onclick="AssignmentsModule.viewTracking('${assignment.id}')" class="btn-primary">
                        Suivi
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Afficher le formulaire de création
     */
    showCreateForm() {
        const modal = document.getElementById('modal-create-assignment');
        if (modal) {
            modal.style.display = 'block';
            this.loadThemes();
            this.loadTargets('class'); // Par défaut, charger les classes
        }
    },

    /**
     * Masquer le formulaire de création
     */
    hideCreateForm() {
        const modal = document.getElementById('modal-create-assignment');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    /**
     * Charger les thèmes disponibles
     */
    async loadThemes() {
        try {
            const response = await fetch('/api/themes?status=active', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load themes');
            }

            const data = await response.json();
            const select = document.getElementById('assignment-theme');

            if (select) {
                select.innerHTML = '<option value="">Sélectionner un thème</option>' +
                    data.themes.map(theme => `
                        <option value="${theme.id}">${this.escapeHtml(theme.title)}</option>
                    `).join('');
            }

        } catch (error) {
            console.error('Error loading themes:', error);
        }
    },

    /**
     * Charger les cibles (classes, promos, étudiants)
     */
    async loadTargets(type) {
        try {
            let endpoint = '';
            switch(type) {
                case 'class':
                    endpoint = '/api/classes';
                    break;
                case 'promo':
                    endpoint = '/api/promotions';
                    break;
                case 'student':
                    endpoint = '/api/students';
                    break;
                default:
                    return;
            }

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load targets');
            }

            const data = await response.json();
            const select = document.getElementById('assignment-targets');

            if (select) {
                const items = data.classes || data.promotions || data.students || [];
                select.innerHTML = items.map(item => `
                    <option value="${item.id}">${this.escapeHtml(item.name || `${item.firstname} ${item.lastname}`)}</option>
                `).join('');
            }

        } catch (error) {
            console.error('Error loading targets:', error);
        }
    },

    /**
     * Créer un assignment
     */
    async createAssignment() {
        const form = document.getElementById('form-create-assignment');
        if (!form) return;

        const formData = new FormData(form);
        const targetType = formData.get('target_type');
        const targetIds = Array.from(document.getElementById('assignment-targets').selectedOptions)
            .map(opt => opt.value);

        const payload = {
            title: formData.get('title'),
            type: formData.get('type'),
            theme_id: formData.get('theme_id'),
            mode: formData.get('mode'),
            instructions: formData.get('instructions'),
            due_at: formData.get('due_at') || null,
            targets: targetIds.map(id => ({
                type: targetType,
                id: id
            }))
        };

        try {
            const response = await fetch('/api/assignments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create assignment');
            }

            const data = await response.json();

            this.showSuccess('Mission créée avec succès!');
            this.hideCreateForm();
            this.loadAssignments();

        } catch (error) {
            console.error('Error creating assignment:', error);
            this.showError(error.message || 'Erreur lors de la création de la mission');
        }
    },

    /**
     * Voir les détails d'un assignment
     */
    async viewDetails(assignmentId) {
        try {
            const response = await fetch(`/api/assignments/${assignmentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load assignment details');
            }

            const assignment = await response.json();
            this.renderAssignmentDetails(assignment);

        } catch (error) {
            console.error('Error loading assignment details:', error);
            this.showError('Erreur lors du chargement des détails');
        }
    },

    /**
     * Afficher le suivi d'un assignment
     */
    async viewTracking(assignmentId) {
        try {
            const response = await fetch(`/api/assignments/${assignmentId}/events`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load tracking data');
            }

            const data = await response.json();
            this.renderTrackingView(assignmentId, data.events);

        } catch (error) {
            console.error('Error loading tracking data:', error);
            this.showError('Erreur lors du chargement du suivi');
        }
    },

    /**
     * Afficher la vue de suivi
     */
    renderTrackingView(assignmentId, events) {
        const container = document.getElementById('tracking-view');
        if (!container) return;

        // Grouper les événements par étudiant
        const studentEvents = {};
        events.forEach(event => {
            if (!studentEvents[event.student_id]) {
                studentEvents[event.student_id] = {
                    name: event.student_name,
                    email: event.student_email,
                    events: []
                };
            }
            studentEvents[event.student_id].events.push(event);
        });

        container.innerHTML = `
            <div class="tracking-header">
                <h2>Suivi de la mission</h2>
                <button onclick="AssignmentsModule.closeTracking()" class="btn-close">×</button>
            </div>
            <div class="tracking-body">
                <table class="tracking-table">
                    <thead>
                        <tr>
                            <th>Étudiant</th>
                            <th>État</th>
                            <th>Reçu</th>
                            <th>Ouvert</th>
                            <th>Complété</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.values(studentEvents).map(student => {
                            const lastEvent = student.events[0];
                            const receivedEvent = student.events.find(e => e.event_type === 'received');
                            const openedEvent = student.events.find(e => e.event_type === 'opened');
                            const completedEvent = student.events.find(e => e.event_type === 'completed');

                            return `
                                <tr>
                                    <td>${this.escapeHtml(student.name)}</td>
                                    <td>
                                        <span class="badge badge-${this.getEventClass(lastEvent.event_type)}">
                                            ${this.getEventLabel(lastEvent.event_type)}
                                        </span>
                                    </td>
                                    <td>${receivedEvent ? this.formatDate(receivedEvent.created_at) : '-'}</td>
                                    <td>${openedEvent ? this.formatDate(openedEvent.created_at) : '-'}</td>
                                    <td>${completedEvent ? this.formatDate(completedEvent.created_at) : '-'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.style.display = 'block';
    },

    /**
     * Helpers
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    getStatusClass(status) {
        const classes = {
            'draft': 'secondary',
            'queued': 'info',
            'pushed': 'primary',
            'ack': 'success',
            'error': 'danger'
        };
        return classes[status] || 'secondary';
    },

    getStatusLabel(status) {
        const labels = {
            'draft': 'Brouillon',
            'queued': 'En attente',
            'pushed': 'Envoyé',
            'ack': 'Reçu',
            'error': 'Erreur'
        };
        return labels[status] || status;
    },

    getTypeLabel(type) {
        const labels = {
            'quiz': 'Quiz',
            'flashcards': 'Flashcards',
            'fiche': 'Fiche',
            'annales': 'Annales'
        };
        return labels[type] || type;
    },

    getEventClass(eventType) {
        const classes = {
            'received': 'info',
            'opened': 'warning',
            'started': 'primary',
            'in_progress': 'primary',
            'completed': 'success',
            'error': 'danger'
        };
        return classes[eventType] || 'secondary';
    },

    getEventLabel(eventType) {
        const labels = {
            'received': 'Reçu',
            'opened': 'Ouvert',
            'started': 'Commencé',
            'in_progress': 'En cours',
            'completed': 'Terminé',
            'error': 'Erreur'
        };
        return labels[eventType] || eventType;
    },

    showSuccess(message) {
        // TODO: Implémenter un système de notifications toast
        alert(message);
    },

    showError(message) {
        // TODO: Implémenter un système de notifications toast
        alert('Erreur: ' + message);
    },

    closeTracking() {
        const container = document.getElementById('tracking-view');
        if (container) {
            container.style.display = 'none';
        }
    },

    renderPagination(pagination) {
        // TODO: Implémenter la pagination
    },

    renderAssignmentDetails(assignment) {
        // TODO: Implémenter la vue détaillée
    }
};

// Auto-initialiser si le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AssignmentsModule.init());
} else {
    AssignmentsModule.init();
}

// Exposer globalement
window.AssignmentsModule = AssignmentsModule;
