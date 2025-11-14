/**
 * Sprint 19 - Multi-Review Workflow
 * UI: Workflow Management Interface
 * Gestion du workflow de validation des thèmes
 */

class WorkflowManager {
    constructor(containerId, apiBaseUrl = '/api') {
        this.container = document.getElementById(containerId);
        this.apiBaseUrl = apiBaseUrl;
        this.currentTheme = null;
        this.history = [];
        this.pendingReviews = [];

        this.init();
    }

    async init() {
        await this.loadWorkflowStats();
        await this.loadPendingReviews();
        await this.loadMyReviews();
        this.render();
        this.attachEventListeners();
    }

    async loadWorkflowStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/workflow/stats`, {
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Failed to load workflow stats');

            const data = await response.json();
            this.stats = data.stats || {};
        } catch (error) {
            console.error('Error loading workflow stats:', error);
            this.showNotification('Erreur lors du chargement des statistiques', 'error');
        }
    }

    async loadPendingReviews() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/workflow/pending`, {
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Failed to load pending reviews');

            const data = await response.json();
            this.pendingReviews = data.themes || [];
        } catch (error) {
            console.error('Error loading pending reviews:', error);
        }
    }

    async loadMyReviews() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/workflow/my-reviews`, {
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Failed to load my reviews');

            const data = await response.json();
            this.myReviews = data.reviews || [];
        } catch (error) {
            console.error('Error loading my reviews:', error);
        }
    }

    async loadThemeHistory(themeId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/workflow/themes/${themeId}/history`, {
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Failed to load theme history');

            const data = await response.json();
            this.history = data.history || [];
            return this.history;
        } catch (error) {
            console.error('Error loading theme history:', error);
            return [];
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="workflow-manager">
                <!-- En-tête avec statistiques -->
                <div class="workflow-header">
                    <h2>Gestion du Workflow de Validation</h2>
                    ${this.renderStats()}
                </div>

                <!-- Navigation par onglets -->
                <div class="workflow-tabs">
                    <button class="tab-btn active" data-tab="pending">
                        En attente (${this.pendingReviews.length})
                    </button>
                    <button class="tab-btn" data-tab="my-reviews">
                        Mes revues (${(this.myReviews || []).length})
                    </button>
                    <button class="tab-btn" data-tab="notifications">
                        Notifications
                        <span class="badge">3</span>
                    </button>
                </div>

                <!-- Contenu des onglets -->
                <div class="workflow-content">
                    <div class="tab-content active" id="tab-pending">
                        ${this.renderPendingReviews()}
                    </div>

                    <div class="tab-content" id="tab-my-reviews">
                        ${this.renderMyReviews()}
                    </div>

                    <div class="tab-content" id="tab-notifications">
                        ${this.renderNotifications()}
                    </div>
                </div>
            </div>

            <!-- Modal pour actions de workflow -->
            <div id="workflow-action-modal" class="modal" style="display:none;">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <div id="modal-body"></div>
                </div>
            </div>
        `;
    }

    renderStats() {
        const stats = this.stats || {};
        return `
            <div class="workflow-stats">
                <div class="stat-card">
                    <div class="stat-number">${stats.draft || 0}</div>
                    <div class="stat-label">Brouillons</div>
                </div>
                <div class="stat-card pending">
                    <div class="stat-number">${stats.pending_review || 0}</div>
                    <div class="stat-label">En validation</div>
                </div>
                <div class="stat-card approved">
                    <div class="stat-number">${stats.approved || 0}</div>
                    <div class="stat-label">Approuvés</div>
                </div>
                <div class="stat-card published">
                    <div class="stat-number">${stats.published || 0}</div>
                    <div class="stat-label">Publiés</div>
                </div>
            </div>
        `;
    }

    renderPendingReviews() {
        if (this.pendingReviews.length === 0) {
            return `
                <div class="empty-state">
                    <p>Aucun thème en attente de validation</p>
                </div>
            `;
        }

        return `
            <div class="pending-reviews-list">
                ${this.pendingReviews.map(theme => `
                    <div class="review-card" data-theme-id="${theme.id}">
                        <div class="review-header">
                            <h3>${this.escapeHtml(theme.title)}</h3>
                            <span class="status-badge pending">En attente</span>
                        </div>
                        <div class="review-meta">
                            <span class="author">Par ${this.escapeHtml(theme.author_firstname)} ${this.escapeHtml(theme.author_lastname)}</span>
                            <span class="date">Soumis le ${this.formatDate(theme.submitted_at)}</span>
                            ${theme.open_annotations > 0 ? `
                                <span class="annotations-count">
                                    <i class="icon-annotation"></i> ${theme.open_annotations} annotation(s)
                                </span>
                            ` : ''}
                        </div>
                        <div class="review-description">
                            ${this.escapeHtml(theme.description || 'Aucune description')}
                        </div>
                        <div class="review-actions">
                            <button class="btn btn-primary" onclick="workflowManager.viewTheme('${theme.id}')">
                                Examiner
                            </button>
                            <button class="btn btn-success" onclick="workflowManager.approveTheme('${theme.id}')">
                                Approuver
                            </button>
                            <button class="btn btn-danger" onclick="workflowManager.rejectTheme('${theme.id}')">
                                Rejeter
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderMyReviews() {
        const reviews = this.myReviews || [];

        if (reviews.length === 0) {
            return `
                <div class="empty-state">
                    <p>Aucune revue assignée</p>
                </div>
            `;
        }

        return `
            <div class="my-reviews-list">
                ${reviews.map(review => `
                    <div class="review-card" data-assignment-id="${review.id}">
                        <div class="review-header">
                            <h3>${this.escapeHtml(review.theme_title)}</h3>
                            <span class="priority-badge ${review.priority}">${review.priority}</span>
                        </div>
                        <div class="review-meta">
                            <span>Assigné par ${this.escapeHtml(review.assigned_by_firstname)} ${this.escapeHtml(review.assigned_by_lastname)}</span>
                            ${review.due_date ? `<span class="due-date">Échéance: ${this.formatDate(review.due_date)}</span>` : ''}
                        </div>
                        <div class="review-actions">
                            <button class="btn btn-primary" onclick="workflowManager.startReview('${review.theme_id}')">
                                Commencer la revue
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderNotifications() {
        return `
            <div class="notifications-list">
                <p>Liste des notifications (à implémenter)</p>
            </div>
        `;
    }

    attachEventListeners() {
        // Gestion des onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Fermer la modal
        const modal = document.getElementById('workflow-action-modal');
        if (modal) {
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }
        }
    }

    switchTab(tabName) {
        // Désactiver tous les onglets
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Activer l'onglet sélectionné
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(`tab-${tabName}`);

        if (tabBtn) tabBtn.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
    }

    async viewTheme(themeId) {
        window.location.href = `/themes/${themeId}?view=workflow`;
    }

    async approveTheme(themeId) {
        const comment = prompt('Commentaire d\'approbation (optionnel):');

        try {
            const response = await fetch(`${this.apiBaseUrl}/workflow/themes/${themeId}/approve`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ comment })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showNotification('Thème approuvé avec succès', 'success');
                await this.loadPendingReviews();
                await this.loadWorkflowStats();
                this.render();
            } else {
                this.showNotification(data.error || 'Erreur lors de l\'approbation', 'error');
            }
        } catch (error) {
            console.error('Error approving theme:', error);
            this.showNotification('Erreur lors de l\'approbation', 'error');
        }
    }

    async rejectTheme(themeId) {
        const comment = prompt('Motif du rejet (obligatoire):');

        if (!comment || comment.trim() === '') {
            this.showNotification('Le motif du rejet est obligatoire', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/workflow/themes/${themeId}/reject`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ comment })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showNotification('Thème rejeté', 'success');
                await this.loadPendingReviews();
                await this.loadWorkflowStats();
                this.render();
            } else {
                this.showNotification(data.error || 'Erreur lors du rejet', 'error');
            }
        } catch (error) {
            console.error('Error rejecting theme:', error);
            this.showNotification('Erreur lors du rejet', 'error');
        }
    }

    async startReview(themeId) {
        window.location.href = `/themes/${themeId}?view=review`;
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
        // Créer une notification toast
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialiser le gestionnaire de workflow
let workflowManager;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('workflow-manager-container');
    if (container) {
        workflowManager = new WorkflowManager('workflow-manager-container');
    }
});
