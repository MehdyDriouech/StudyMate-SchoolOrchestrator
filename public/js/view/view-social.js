/**
 * Sprint 8: Social & Collaborative Learning - View Components
 * UI pour classements, partages, commentaires, sessions collaboratives, modération
 */

// ============================================================
// E8-LB: LEADERBOARD / CLASSEMENTS
// ============================================================

/**
 * Afficher le classement
 */
async function renderLeaderboard(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
        themeId = null,
        classId = null,
        period = 'all_time',
        anonymize = false
    } = options;

    container.innerHTML = '<p>⏳ Chargement du classement...</p>';

    try {
        const params = new URLSearchParams({
            period,
            anonymize: anonymize.toString(),
            limit: '50'
        });

        if (themeId) params.append('theme_id', themeId);
        if (classId) params.append('class_id', classId);

        const data = await apiCall(`/api/social/leaderboard?${params.toString()}`);

        if (!data.data || data.data.length === 0) {
            container.innerHTML = '<p class="empty-message">Aucun classement disponible</p>';
            return;
        }

        // Build leaderboard UI
        let html = `
            <div class="leaderboard-header">
                <h3>🏆 Classement ${getPeriodLabel(period)}</h3>
                ${data.anonymized ? '<p class="anonymized-badge">🔒 Anonymisé</p>' : ''}
            </div>

            <div class="leaderboard-filters">
                <label>
                    Période:
                    <select onchange="updateLeaderboardPeriod(this.value)">
                        <option value="weekly" ${period === 'weekly' ? 'selected' : ''}>Hebdomadaire</option>
                        <option value="monthly" ${period === 'monthly' ? 'selected' : ''}>Mensuel</option>
                        <option value="all_time" ${period === 'all_time' ? 'selected' : ''}>Tout le temps</option>
                    </select>
                </label>
                <label>
                    <input type="checkbox" ${anonymize ? 'checked' : ''} onchange="toggleLeaderboardAnonymize(this.checked)">
                    Anonymiser
                </label>
            </div>

            <div class="leaderboard-list">
        `;

        data.data.forEach((entry, index) => {
            const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const isCurrentUser = entry.student_id === currentUser?.id;

            html += `
                <div class="leaderboard-entry ${isCurrentUser ? 'current-user' : ''}" data-rank="${entry.rank}">
                    <span class="rank">${medalEmoji} ${entry.rank}</span>
                    <div class="student-info">
                        <strong>${entry.firstname} ${entry.lastname}</strong>
                        ${entry.class_name ? `<span class="class-badge">${entry.class_name}</span>` : ''}
                    </div>
                    <div class="stats">
                        <span class="score">📊 ${entry.total_score.toFixed(1)} pts</span>
                        <span class="sessions">📝 ${entry.total_sessions} sessions</span>
                        <span class="mastery">🎯 ${(entry.avg_mastery * 100).toFixed(0)}% maîtrise</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = `
            <div class="error-message">
                <p>❌ Erreur lors du chargement du classement</p>
                <p class="error-details">${error.message}</p>
            </div>
        `;
    }
}

function getPeriodLabel(period) {
    const labels = {
        'weekly': 'de la semaine',
        'monthly': 'du mois',
        'all_time': 'général'
    };
    return labels[period] || period;
}

// ============================================================
// E8-SHARE: SHARED CONTENT / PARTAGE
// ============================================================

/**
 * Afficher les contenus partagés
 */
async function renderSharedContent(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
        themeId = null,
        classId = null,
        contentType = null
    } = options;

    container.innerHTML = '<p>⏳ Chargement des contenus partagés...</p>';

    try {
        const params = new URLSearchParams({ limit: '20' });
        if (themeId) params.append('theme_id', themeId);
        if (classId) params.append('class_id', classId);
        if (contentType) params.append('content_type', contentType);

        const data = await apiCall(`/api/social/content/shared?${params.toString()}`);

        if (!data.data || data.data.length === 0) {
            container.innerHTML = `
                <p class="empty-message">Aucun contenu partagé pour le moment</p>
                <button onclick="showShareContentModal()" class="btn-primary">
                    ➕ Partager du contenu
                </button>
            `;
            return;
        }

        let html = `
            <div class="shared-content-header">
                <h3>📚 Contenus partagés par les élèves</h3>
                <button onclick="showShareContentModal()" class="btn-primary">
                    ➕ Partager
                </button>
            </div>

            <div class="shared-content-grid">
        `;

        data.data.forEach(content => {
            const typeEmoji = getContentTypeEmoji(content.content_type);

            html += `
                <div class="shared-content-card" data-id="${content.id}">
                    <div class="card-header">
                        <span class="content-type">${typeEmoji} ${content.content_type}</span>
                        ${content.theme_title ? `<span class="theme-badge">${content.theme_title}</span>` : ''}
                    </div>
                    <h4>${content.title}</h4>
                    <p class="description">${content.description || ''}</p>
                    <div class="card-footer">
                        <span class="author">Par ${content.firstname} ${content.lastname}</span>
                        <div class="stats">
                            <span>👁️ ${content.views_count}</span>
                            <span>❤️ ${content.likes_count}</span>
                        </div>
                    </div>
                    <button onclick="viewSharedContent('${content.id}')" class="btn-view">
                        Voir le contenu
                    </button>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = `
            <div class="error-message">
                <p>❌ Erreur lors du chargement des contenus partagés</p>
                <p class="error-details">${error.message}</p>
            </div>
        `;
    }
}

function getContentTypeEmoji(type) {
    const emojis = {
        'flashcard': '🗂️',
        'note': '📝',
        'summary': '📋',
        'mnemo': '🧠',
        'quiz': '❓'
    };
    return emojis[type] || '📄';
}

/**
 * Voir un contenu partagé avec commentaires
 */
async function viewSharedContent(contentId) {
    try {
        const [content, commentsData] = await Promise.all([
            apiCall(`/api/social/content/shared/${contentId}`),
            apiCall(`/api/social/content/${contentId}/comments`)
        ]);

        // Show in modal
        const modalHtml = `
            <div class="modal-overlay" onclick="closeModal()">
                <div class="modal-content shared-content-modal" onclick="event.stopPropagation()">
                    <button class="modal-close" onclick="closeModal()">✕</button>

                    <div class="content-header">
                        <h2>${content.data.title}</h2>
                        <p class="author">Par ${content.data.firstname} ${content.data.lastname}</p>
                        ${content.data.theme_title ? `<p class="theme">Thème: ${content.data.theme_title}</p>` : ''}
                    </div>

                    <div class="content-body">
                        ${renderContentBody(content.data.content, content.data.content_type)}
                    </div>

                    <div class="content-actions">
                        <button onclick="likeContent('${contentId}')" class="btn-like">
                            ❤️ J'aime (${content.data.likes_count})
                        </button>
                    </div>

                    <div class="comments-section">
                        <h3>💬 Commentaires (${commentsData.count})</h3>
                        <div class="comment-form">
                            <textarea id="comment-text" placeholder="Ajouter un commentaire..."></textarea>
                            <button onclick="postComment('${contentId}')" class="btn-primary">
                                Publier
                            </button>
                        </div>
                        <div class="comments-list">
                            ${renderComments(commentsData.data || [])}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

function renderContentBody(content, type) {
    if (type === 'flashcard') {
        return `
            <div class="flashcard-preview">
                <div class="flashcard-front">
                    <strong>Question:</strong>
                    <p>${content.question || content.front || 'N/A'}</p>
                </div>
                <div class="flashcard-back">
                    <strong>Réponse:</strong>
                    <p>${content.answer || content.back || 'N/A'}</p>
                </div>
            </div>
        `;
    }

    return `<div class="content-preview">${JSON.stringify(content, null, 2)}</div>`;
}

function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<p class="empty-message">Aucun commentaire pour le moment</p>';
    }

    return comments.map(comment => `
        <div class="comment" data-id="${comment.id}">
            <div class="comment-header">
                <strong>${comment.firstname} ${comment.lastname}</strong>
                <span class="timestamp">${new Date(comment.created_at).toLocaleString('fr-FR')}</span>
            </div>
            <p class="comment-text">${comment.comment_text}</p>
            <div class="comment-actions">
                <button onclick="markAsHelpful('${comment.id}')" class="btn-helpful">
                    👍 Utile (${comment.helpful_count || 0})
                </button>
                <button onclick="replyToComment('${comment.id}')" class="btn-reply">
                    💬 Répondre
                </button>
            </div>
        </div>
    `).join('');
}

async function postComment(contentId) {
    const textarea = document.getElementById('comment-text');
    const text = textarea.value.trim();

    if (!text) {
        alert('Veuillez saisir un commentaire');
        return;
    }

    try {
        await apiCall('/api/social/comments', {
            method: 'POST',
            body: JSON.stringify({
                student_id: currentUser.id,
                shared_content_id: contentId,
                comment_text: text
            })
        });

        textarea.value = '';
        // Reload comments
        viewSharedContent(contentId);

    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

// ============================================================
// E8-COLLAB: COLLABORATIVE SESSIONS
// ============================================================

/**
 * Créer une session collaborative
 */
async function createCollaborativeSession() {
    const title = prompt('Titre de la session:');
    if (!title) return;

    const themeId = prompt('ID du thème:');
    if (!themeId) return;

    try {
        const data = await apiCall('/api/social/sessions/collaborative', {
            method: 'POST',
            body: JSON.stringify({
                creator_student_id: currentUser.id,
                theme_id: themeId,
                title: title,
                max_participants: 10,
                duration_minutes: 30
            })
        });

        alert(`✅ Session créée!\nCode: ${data.session_code}\nPartagez ce code avec vos camarades.`);

        // Join the session
        joinCollaborativeSession(data.session_id);

    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

/**
 * Rejoindre une session collaborative
 */
async function joinCollaborativeSessionByCode() {
    const code = prompt('Code de la session:');
    if (!code) return;

    try {
        const data = await apiCall('/api/social/sessions/collaborative/join', {
            method: 'POST',
            body: JSON.stringify({
                session_code: code.toUpperCase(),
                student_id: currentUser.id
            })
        });

        joinCollaborativeSession(data.session_id);

    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

/**
 * Interface de session collaborative
 */
async function joinCollaborativeSession(sessionId) {
    try {
        const sessionData = await apiCall(`/api/social/sessions/collaborative/${sessionId}`);

        // Show session UI in modal
        const modalHtml = `
            <div class="modal-overlay collaborative-session-modal">
                <div class="modal-content session-content">
                    <div class="session-header">
                        <h2>${sessionData.data.title}</h2>
                        <p>Code: <strong>${sessionData.data.session_code}</strong></p>
                        <p>Thème: ${sessionData.data.theme_title}</p>
                        <span class="session-status ${sessionData.data.status}">${sessionData.data.status}</span>
                    </div>

                    <div class="session-body">
                        <div class="participants-panel">
                            <h3>👥 Participants (${sessionData.data.current_participants}/${sessionData.data.max_participants})</h3>
                            <div id="participants-list"></div>
                        </div>

                        <div class="session-main">
                            <div id="session-content">
                                ${sessionData.data.status === 'waiting' ? `
                                    <p>⏳ En attente du démarrage...</p>
                                    <button onclick="markAsReady('${sessionId}')" class="btn-ready">
                                        ✓ Je suis prêt(e)
                                    </button>
                                ` : `
                                    <div id="session-questions"></div>
                                `}
                            </div>
                        </div>
                    </div>

                    <div class="session-footer">
                        <button onclick="leaveSession('${sessionId}')" class="btn-danger">
                            Quitter la session
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Start polling for real-time updates
        startSessionPolling(sessionId);

    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

/**
 * Polling pour sessions collaboratives (temps réel)
 */
let pollingInterval = null;
let lastPollTimestamp = null;

function startSessionPolling(sessionId) {
    if (pollingInterval) clearInterval(pollingInterval);

    const poll = async () => {
        try {
            const params = new URLSearchParams({
                session_id: sessionId,
                student_id: currentUser.id
            });

            if (lastPollTimestamp) {
                params.append('last_poll', lastPollTimestamp.toString());
            }

            const data = await apiCall(`/realtime/collaborative/polling?${params.toString()}`);
            lastPollTimestamp = data.timestamp;

            // Update UI
            updateSessionUI(data);

            // Process updates
            if (data.updates && data.updates.length > 0) {
                handleSessionUpdates(data.updates);
            }

        } catch (error) {
            console.error('Polling error:', error);
        }
    };

    // Initial poll
    poll();

    // Poll every 15 seconds
    pollingInterval = setInterval(poll, 15000);
}

function updateSessionUI(data) {
    // Update participants list
    const participantsList = document.getElementById('participants-list');
    if (participantsList) {
        participantsList.innerHTML = data.participants.map(p => `
            <div class="participant ${p.is_ready ? 'ready' : ''}">
                <span>${p.firstname} ${p.lastname}</span>
                ${p.is_ready ? '<span class="ready-badge">✓</span>' : ''}
            </div>
        `).join('');
    }

    // Update session status if changed
    if (data.session.status === 'active') {
        const sessionContent = document.getElementById('session-content');
        if (sessionContent && !sessionContent.querySelector('#session-questions')) {
            // Session has started, load questions
            loadSessionQuestions(data.session);
        }
    }
}

function handleSessionUpdates(updates) {
    updates.forEach(update => {
        switch (update.type) {
            case 'new_participants':
                console.log('New participants joined:', update.data);
                break;
            case 'session_status_change':
                console.log('Session status changed:', update.data);
                break;
            case 'ready_status_change':
                console.log('Ready status changed:', update.data);
                break;
        }
    });
}

// ============================================================
// E8-MOD: MODERATION QUEUE (Teachers/Admins)
// ============================================================

/**
 * Afficher la file de modération
 */
async function renderModerationQueue(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!canModerate(currentUser.role)) {
        container.innerHTML = '<p class="error-message">Accès réservé aux enseignants</p>';
        return;
    }

    container.innerHTML = '<p>⏳ Chargement de la file de modération...</p>';

    try {
        const data = await apiCall('/api/social/moderation/queue?status=pending');

        if (!data.data || data.data.length === 0) {
            container.innerHTML = '<p class="empty-message">✅ Aucun contenu en attente de modération</p>';
            return;
        }

        let html = `
            <div class="moderation-header">
                <h3>⚖️ File de modération (${data.count})</h3>
            </div>

            <div class="moderation-queue">
        `;

        data.data.forEach(item => {
            html += `
                <div class="moderation-item priority-${item.priority}">
                    <div class="item-header">
                        <span class="content-type">${item.content_type}</span>
                        <span class="priority-badge ${item.priority}">${item.priority}</span>
                        <span class="student">Par: ${item.firstname} ${item.lastname}</span>
                    </div>

                    ${item.ai_score ? `
                        <div class="ai-analysis">
                            <span>IA Score: ${(item.ai_score * 100).toFixed(0)}%</span>
                            ${item.ai_flags ? `<span>Flags: ${JSON.stringify(item.ai_flags)}</span>` : ''}
                        </div>
                    ` : ''}

                    <p class="reason">${item.reason}</p>

                    <div class="actions">
                        <button onclick="approveModeration('${item.id}')" class="btn-approve">
                            ✓ Approuver
                        </button>
                        <button onclick="rejectModeration('${item.id}')" class="btn-reject">
                            ✕ Rejeter
                        </button>
                        <button onclick="viewModerationContent('${item.content_id}')" class="btn-view">
                            👁️ Voir
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = `
            <div class="error-message">
                <p>❌ Erreur lors du chargement de la file</p>
                <p class="error-details">${error.message}</p>
            </div>
        `;
    }
}

async function approveModeration(queueId) {
    const reason = prompt('Raison de l\'approbation (optionnel):');

    try {
        await apiCall(`/api/social/moderation/queue/${queueId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });

        alert('✅ Contenu approuvé');
        renderModerationQueue('moderation-queue-container');

    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

async function rejectModeration(queueId) {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;

    try {
        await apiCall(`/api/social/moderation/queue/${queueId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });

        alert('✅ Contenu rejeté');
        renderModerationQueue('moderation-queue-container');

    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

function canModerate(role) {
    return ['teacher', 'admin', 'direction'].includes(role);
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function closeModal() {
    document.querySelectorAll('.modal-overlay').forEach(modal => modal.remove());
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}
