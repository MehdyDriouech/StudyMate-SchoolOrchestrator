/**
 * Sprint 19 - Multi-Review Workflow
 * UI: Version Diff Viewer
 * Visualisateur de différences entre versions de thèmes
 */

class VersionDiffViewer {
    constructor(themeId, containerId, apiBaseUrl = '/api') {
        this.themeId = themeId;
        this.container = document.getElementById(containerId);
        this.apiBaseUrl = apiBaseUrl;
        this.versions = [];
        this.selectedVersion1 = null;
        this.selectedVersion2 = null;
        this.diffData = null;

        this.init();
    }

    async init() {
        await this.loadVersions();
        this.render();
        this.attachEventListeners();
    }

    async loadVersions() {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/versions/themes/${this.themeId}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) throw new Error('Failed to load versions');

            const data = await response.json();
            this.versions = data.versions || [];

            // Sélectionner automatiquement les deux dernières versions
            if (this.versions.length >= 2) {
                this.selectedVersion1 = this.versions[1].id;
                this.selectedVersion2 = this.versions[0].id;
                await this.loadDiff();
            }
        } catch (error) {
            console.error('Error loading versions:', error);
            this.showNotification('Erreur lors du chargement des versions', 'error');
        }
    }

    async loadDiff() {
        if (!this.selectedVersion1 || !this.selectedVersion2) {
            return;
        }

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/versions/compare?version1=${this.selectedVersion1}&version2=${this.selectedVersion2}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) throw new Error('Failed to load diff');

            const data = await response.json();
            this.diffData = data;
            this.render();
        } catch (error) {
            console.error('Error loading diff:', error);
            this.showNotification('Erreur lors de la comparaison', 'error');
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="version-diff-viewer">
                <!-- En-tête -->
                <div class="diff-header">
                    <h2>Comparaison de versions</h2>
                    ${this.renderVersionSelector()}
                </div>

                <!-- Timeline des versions -->
                <div class="version-timeline">
                    ${this.renderVersionTimeline()}
                </div>

                <!-- Visualisation du diff -->
                <div class="diff-content">
                    ${this.diffData ? this.renderDiff() : this.renderSelectVersionsPrompt()}
                </div>

                <!-- Actions -->
                <div class="diff-actions">
                    ${this.selectedVersion1 ? `
                        <button class="btn btn-primary" onclick="versionDiffViewer.restoreVersion('${this.selectedVersion1}')">
                            <i class="icon-restore"></i> Restaurer version ${this.getVersionNumber(this.selectedVersion1)}
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="versionDiffViewer.exportDiff()">
                        <i class="icon-export"></i> Exporter le diff
                    </button>
                </div>
            </div>
        `;
    }

    renderVersionSelector() {
        return `
            <div class="version-selector">
                <div class="version-select-group">
                    <label>Version 1 (ancienne)</label>
                    <select id="version1-select" class="form-control">
                        <option value="">Sélectionner...</option>
                        ${this.versions.map(v => `
                            <option value="${v.id}" ${this.selectedVersion1 === v.id ? 'selected' : ''}>
                                v${v.version} - ${this.formatDate(v.created_at)}
                                ${v.is_milestone ? '⭐' : ''}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="version-arrow">→</div>

                <div class="version-select-group">
                    <label>Version 2 (récente)</label>
                    <select id="version2-select" class="form-control">
                        <option value="">Sélectionner...</option>
                        ${this.versions.map(v => `
                            <option value="${v.id}" ${this.selectedVersion2 === v.id ? 'selected' : ''}>
                                v${v.version} - ${this.formatDate(v.created_at)}
                                ${v.is_milestone ? '⭐' : ''}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <button class="btn btn-primary" id="compare-btn">
                    Comparer
                </button>
            </div>
        `;
    }

    renderVersionTimeline() {
        if (this.versions.length === 0) {
            return '<p class="empty-state">Aucune version disponible</p>';
        }

        return `
            <div class="timeline">
                ${this.versions.map((version, index) => `
                    <div class="timeline-item ${version.is_milestone ? 'milestone' : ''}"
                         data-version-id="${version.id}">
                        <div class="timeline-marker">
                            ${version.is_milestone ? '⭐' : '•'}
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <strong>Version ${version.version}</strong>
                                <span class="timeline-date">${this.formatDate(version.created_at)}</span>
                            </div>
                            <div class="timeline-meta">
                                Par ${this.escapeHtml(version.created_by_firstname)} ${this.escapeHtml(version.created_by_lastname)}
                                ${version.status ? `<span class="status-badge ${version.status}">${version.status}</span>` : ''}
                            </div>
                            ${version.change_summary ? `
                                <div class="timeline-summary">
                                    ${this.escapeHtml(version.change_summary)}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderSelectVersionsPrompt() {
        return `
            <div class="empty-state">
                <p>Sélectionnez deux versions pour voir les différences</p>
            </div>
        `;
    }

    renderDiff() {
        if (!this.diffData || !this.diffData.diff) {
            return '<p class="empty-state">Aucune différence à afficher</p>';
        }

        const { version1, version2, diff } = this.diffData;

        return `
            <div class="diff-view">
                <!-- Résumé des changements -->
                <div class="diff-summary">
                    <h3>Résumé des modifications</h3>
                    <div class="diff-stats">
                        <span class="stat added">
                            <strong>${diff.changes.added.length}</strong> ajouts
                        </span>
                        <span class="stat removed">
                            <strong>${diff.changes.removed.length}</strong> suppressions
                        </span>
                        <span class="stat modified">
                            <strong>${diff.changes.modified.length}</strong> modifications
                        </span>
                    </div>
                </div>

                <!-- Détails des changements -->
                <div class="diff-details">
                    ${this.renderDiffChanges(diff.changes)}
                </div>

                <!-- Visualisation côte à côte -->
                <div class="diff-side-by-side">
                    <div class="diff-column">
                        <div class="diff-column-header">
                            <h4>Version ${version1.version}</h4>
                            <small>${this.formatDate(version1.created_at)}</small>
                        </div>
                        <div class="diff-column-content">
                            ${this.renderVersionContent(version1, diff)}
                        </div>
                    </div>

                    <div class="diff-column">
                        <div class="diff-column-header">
                            <h4>Version ${version2.version}</h4>
                            <small>${this.formatDate(version2.created_at)}</small>
                        </div>
                        <div class="diff-column-content">
                            ${this.renderVersionContent(version2, diff)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderDiffChanges(changes) {
        let html = '';

        // Modifications
        if (changes.modified && changes.modified.length > 0) {
            html += '<div class="change-group modified">';
            html += '<h4><i class="icon-modified"></i> Modifications</h4>';
            html += '<ul class="change-list">';
            changes.modified.forEach(change => {
                html += `
                    <li>
                        <strong>${this.escapeHtml(change.field)}:</strong>
                        <div class="change-value">
                            <span class="old-value">${this.escapeHtml(String(change.from))}</span>
                            →
                            <span class="new-value">${this.escapeHtml(String(change.to))}</span>
                        </div>
                    </li>
                `;
            });
            html += '</ul>';
            html += '</div>';
        }

        // Ajouts
        if (changes.added && changes.added.length > 0) {
            html += '<div class="change-group added">';
            html += '<h4><i class="icon-added"></i> Ajouts</h4>';
            html += '<ul class="change-list">';
            changes.added.forEach(change => {
                html += `
                    <li>
                        <strong>${this.escapeHtml(change.field)}:</strong>
                        ${Array.isArray(change.items) ?
                            change.items.map(item => `<span class="badge">${this.escapeHtml(item)}</span>`).join(' ') :
                            this.escapeHtml(String(change.items || change.value))}
                    </li>
                `;
            });
            html += '</ul>';
            html += '</div>';
        }

        // Suppressions
        if (changes.removed && changes.removed.length > 0) {
            html += '<div class="change-group removed">';
            html += '<h4><i class="icon-removed"></i> Suppressions</h4>';
            html += '<ul class="change-list">';
            changes.removed.forEach(change => {
                html += `
                    <li>
                        <strong>${this.escapeHtml(change.field)}:</strong>
                        ${Array.isArray(change.items) ?
                            change.items.map(item => `<span class="badge">${this.escapeHtml(item)}</span>`).join(' ') :
                            this.escapeHtml(String(change.items || change.value))}
                    </li>
                `;
            });
            html += '</ul>';
            html += '</div>';
        }

        if (!html) {
            return '<p class="no-changes">Aucune différence détectée</p>';
        }

        return html;
    }

    renderVersionContent(version, diff) {
        // Placeholder pour le rendu du contenu avec highlighting
        return `
            <div class="version-content">
                <p><strong>Titre:</strong> ${this.escapeHtml(version.title)}</p>
                <p><strong>Statut:</strong> <span class="status-badge ${version.status}">${version.status}</span></p>
                <p class="hint">Contenu détaillé disponible en cliquant sur "Voir détails"</p>
            </div>
        `;
    }

    attachEventListeners() {
        // Sélecteurs de version
        const version1Select = document.getElementById('version1-select');
        const version2Select = document.getElementById('version2-select');
        const compareBtn = document.getElementById('compare-btn');

        if (version1Select) {
            version1Select.addEventListener('change', (e) => {
                this.selectedVersion1 = e.target.value;
            });
        }

        if (version2Select) {
            version2Select.addEventListener('change', (e) => {
                this.selectedVersion2 = e.target.value;
            });
        }

        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                if (this.selectedVersion1 && this.selectedVersion2) {
                    this.loadDiff();
                } else {
                    this.showNotification('Veuillez sélectionner deux versions', 'warning');
                }
            });
        }

        // Timeline - clic sur version
        document.querySelectorAll('.timeline-item').forEach(item => {
            item.addEventListener('click', () => {
                const versionId = item.dataset.versionId;
                this.showVersionDetails(versionId);
            });
        });
    }

    async restoreVersion(versionId) {
        if (!confirm('Êtes-vous sûr de vouloir restaurer cette version ? Cela créera une nouvelle version.')) {
            return;
        }

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/versions/${versionId}/restore`,
                {
                    method: 'POST',
                    headers: this.getHeaders()
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                this.showNotification('Version restaurée avec succès', 'success');
                await this.loadVersions();
                this.render();
            } else {
                this.showNotification(data.error || 'Erreur lors de la restauration', 'error');
            }
        } catch (error) {
            console.error('Error restoring version:', error);
            this.showNotification('Erreur lors de la restauration', 'error');
        }
    }

    exportDiff() {
        if (!this.diffData) {
            this.showNotification('Aucun diff à exporter', 'warning');
            return;
        }

        const diffText = JSON.stringify(this.diffData, null, 2);
        const blob = new Blob([diffText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `theme-${this.themeId}-diff-v${this.diffData.version1.version}-v${this.diffData.version2.version}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Diff exporté', 'success');
    }

    async showVersionDetails(versionId) {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/versions/${versionId}`,
                { headers: this.getHeaders() }
            );

            if (!response.ok) throw new Error('Failed to load version details');

            const data = await response.json();
            const version = data.version;

            // Afficher dans une modal
            const modal = this.createModal('Détails de la version', `
                <div class="version-details">
                    <h3>Version ${version.version}</h3>
                    <p><strong>Créée par:</strong> ${this.escapeHtml(version.created_by_firstname)} ${this.escapeHtml(version.created_by_lastname)}</p>
                    <p><strong>Date:</strong> ${this.formatDate(version.created_at)}</p>
                    <p><strong>Statut:</strong> <span class="status-badge ${version.status}">${version.status}</span></p>
                    ${version.change_summary ? `<p><strong>Résumé:</strong> ${this.escapeHtml(version.change_summary)}</p>` : ''}
                    ${version.is_milestone ? '<p><span class="badge milestone">⭐ Version milestone</span></p>' : ''}
                </div>
            `);

            document.body.appendChild(modal);
            modal.style.display = 'block';

        } catch (error) {
            console.error('Error loading version details:', error);
            this.showNotification('Erreur lors du chargement', 'error');
        }
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>${title}</h2>
                ${content}
            </div>
        `;

        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => modal.remove());

        return modal;
    }

    getVersionNumber(versionId) {
        const version = this.versions.find(v => v.id === versionId);
        return version ? version.version : '?';
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

// Initialiser le diff viewer
let versionDiffViewer;

function initVersionDiffViewer(themeId) {
    const container = document.getElementById('version-diff-container');
    if (container) {
        versionDiffViewer = new VersionDiffViewer(themeId, 'version-diff-container');
    }
}
