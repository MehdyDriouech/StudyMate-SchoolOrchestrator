/**
 * Abstraction des appels API pour SMSO Tester
 * Gère les appels vers le backend réel et le FakeRouter
 */

import { TEST_CONFIG } from './test-config.js';

// État global
let currentToken = null;
let fakeRouterModule = null;

/**
 * Récupère la session d'authentification depuis localStorage
 * @returns {object|null} Session avec token, user, expires_in
 */
export function getAuthSession() {
    try {
        const raw = localStorage.getItem(TEST_CONFIG.AUTH_SESSION_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (error) {
        console.error('[TestAPI] Erreur lors de la lecture de la session:', error);
        return null;
    }
}

/**
 * Récupère le token d'authentification actuel
 * @returns {string|null} Token JWT ou null
 */
export function getCurrentToken() {
    if (currentToken) return currentToken;
    const session = getAuthSession();
    currentToken = session?.token || null;
    return currentToken;
}

/**
 * Sauvegarde la session d'authentification dans localStorage
 * @param {object} session - Session avec token, user, expires_in
 */
export function saveAuthSession(session) {
    try {
        localStorage.setItem(TEST_CONFIG.AUTH_SESSION_KEY, JSON.stringify(session));
        currentToken = session.token;
        console.log('[TestAPI] Session sauvegardée');
    } catch (error) {
        console.error('[TestAPI] Erreur lors de la sauvegarde de la session:', error);
    }
}

/**
 * Efface la session d'authentification
 */
export function clearAuthSession() {
    try {
        localStorage.removeItem(TEST_CONFIG.AUTH_SESSION_KEY);
        currentToken = null;
        console.log('[TestAPI] Session effacée');
    } catch (error) {
        console.error('[TestAPI] Erreur lors de l\'effacement de la session:', error);
    }
}

/**
 * Effectue le login vers le backend réel
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @param {string} apiBaseUrl - URL de base de l'API
 * @returns {Promise<object>} Résultat du login avec token, user, etc.
 */
export async function login(email, password, apiBaseUrl = TEST_CONFIG.API_BASE_URL_DEFAULT) {
    try {
        const body = new URLSearchParams({ email, password });
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error('Réponse non-JSON reçue');
        }

        if (response.ok && data.success && data.data && data.data.token) {
            const { token, user, expires_in } = data.data;
            saveAuthSession({
                token,
                user,
                expires_in,
                expires_at: expires_in ? Date.now() + (expires_in * 1000) : null
            });
            return { success: true, data: { token, user, expires_in } };
        } else {
            return { success: false, error: data.error || 'Erreur de connexion' };
        }
    } catch (error) {
        return { success: false, error: error.message || 'Erreur réseau' };
    }
}

/**
 * Appelle le backend réel via fetch
 * @param {string} method - Méthode HTTP (GET, POST, PUT, DELETE)
 * @param {string} path - Chemin de l'endpoint
 * @param {object} options - Options (body, headers, requiresAuth, tokenMode, apiBaseUrl)
 * @returns {Promise<Response>} Réponse fetch
 */
export async function callBackend(method, path, options = {}) {
    const apiBaseUrl = options.apiBaseUrl || TEST_CONFIG.API_BASE_URL_DEFAULT;
    const token = getCurrentToken();
    const tokenMode = options.tokenMode || TEST_CONFIG.TOKEN_TRANSPORT_DEFAULT;
    
    let url = path.startsWith('http') ? path : `${apiBaseUrl}${path.startsWith('/') ? path : '/' + path}`;
    const headers = { ...options.headers };

    if (token && options.requiresAuth !== false) {
        if (tokenMode === 'header') {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            const separator = url.includes('?') ? '&' : '?';
            url = `${url}${separator}token=${encodeURIComponent(token)}`;
        }
    }

    if (options.body && (method === 'POST' || method === 'PUT')) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    return response;
}

/**
 * Charge et initialise le FakeRouter
 * @returns {Promise<object>} Module FakeRouter
 */
async function loadFakeRouter() {
    if (fakeRouterModule) return fakeRouterModule;
    
    try {
        fakeRouterModule = await createFakeRouterWrapper();
        console.log('[TestAPI] FakeRouter chargé');
        return fakeRouterModule;
    } catch (error) {
        console.error('[TestAPI] Erreur lors du chargement du FakeRouter:', error);
        throw error;
    }
}

/**
 * Crée un wrapper simplifié du FakeRouter (version standalone)
 * @returns {Promise<object>} Module FakeRouter avec fakeRequest
 */
async function createFakeRouterWrapper() {
    // Simuler getActiveSchoolId
    function getActiveSchoolId() {
        return '1'; // Par défaut, établissement 1
    }

    // Données mockées simplifiées (extrait du FakeRouter.js)
    const MOCK_STATS_OVERVIEW = {
        kpis: {
            totalStudents: 245,
            totalClasses: 8,
            activeAssignments: 23,
            completionRate: 78.5,
            averageGrade: 13.2
        },
        topSubjects: [
            { name: 'Mathématiques', assignmentsCount: 8, avgCompletion: 82.3 },
            { name: 'Philosophie', assignmentsCount: 7, avgCompletion: 71.5 }
        ],
        recentActivity: []
    };

    const MOCK_ASSIGNMENTS = [
        {
            id: 1,
            class_id: 1,
            title: 'DM - Suites numériques',
            description: 'Exercices sur les suites arithmétiques et géométriques.',
            subject: 'Mathématiques',
            due_date: '2024-11-25T23:59:59Z',
            available_at: '2024-11-20T08:00:00Z',
            status: 'published',
            created_at: '2024-11-10T09:00:00Z',
            updated_at: '2024-11-10T09:00:00Z'
        },
        {
            id: 2,
            class_id: 1,
            title: 'Dissertation - La conscience',
            description: 'Rédiger une dissertation de 4 pages.',
            subject: 'Philosophie',
            due_date: '2024-11-22T23:59:59Z',
            available_at: '2024-11-15T08:00:00Z',
            status: 'published',
            created_at: '2024-11-08T09:00:00Z',
            updated_at: '2024-11-08T09:00:00Z'
        }
    ];

    const MOCK_CURRICULUM = {
        subjects: [
            {
                id: 'math-term',
                name: 'Mathématiques Terminale',
                level: 'Terminale',
                chapters: [
                    { id: 'ch1', title: 'Suites numériques', progress: 85 },
                    { id: 'ch2', title: 'Fonctions exponentielles', progress: 60 }
                ]
            },
            {
                id: 'philo-term',
                name: 'Philosophie Terminale',
                level: 'Terminale',
                chapters: [
                    { id: 'ch1', title: 'La conscience', progress: 100 }
                ]
            }
        ]
    };

    const MOCK_THEMES = [
        {
            id: 1,
            title: 'Suites numériques',
            description: 'Introduction aux suites arithmétiques et géométriques.',
            tags: ['maths', 'suites', 'terminale'],
            subject: 'Maths',
            type: 'quiz',
            status: 'published'
        }
    ];

    const MOCK_CLASSES = [
        {
            id: 1,
            name: 'Terminale 2 – Spé Maths',
            short_name: 'Tle2',
            level: 'Terminale',
            academic_year: '2024-2025',
            school_id: 1
        }
    ];

    const MOCK_SOCIAL_ENTRIES = [
        {
            id: 1,
            school_id: 1,
            type: 'rule',
            title: 'Classement hebdomadaire activé',
            description: 'Les scores de cette semaine comptent pour le classement social.',
            payload: { ranking_period: 'week', enabled: true },
            created_at: '2025-11-01T09:00:00Z'
        }
    ];

    // Fonction de routage simplifiée
    function routeRequest(method, path, body) {
        const normalizedPath = path.replace(/^\/api/, '');
        const activeSchoolId = getActiveSchoolId();

        // GET /stats/overview
        if (method === 'GET' && normalizedPath === '/stats/overview') {
            return { success: true, data: MOCK_STATS_OVERVIEW };
        }

        // GET /stats/schools
        if (method === 'GET' && normalizedPath === '/stats/schools') {
            return {
                success: true,
                data: [{
                    school_id: 1,
                    school_name: 'Demo School A',
                    avg_score: 14.5,
                    completion_rate: 0.8,
                    active_students: 100,
                    classes_count: 5
                }]
            };
        }

        // GET /assignments/sync
        if (method === 'GET' && normalizedPath === '/assignments/sync') {
            const syncedAssignments = MOCK_ASSIGNMENTS
                .filter(a => a.class_id === 1 && a.status === 'published')
                .map(a => ({
                    title: a.title,
                    date: a.due_date,
                    matiere: a.subject,
                    description: a.description,
                    available_at: a.available_at
                }));
            return { success: true, data: syncedAssignments };
        }

        // GET /assignments
        if (method === 'GET' && normalizedPath === '/assignments') {
            return { success: true, data: MOCK_ASSIGNMENTS };
        }

        // GET /assignments/:id
        if (method === 'GET' && normalizedPath.match(/^\/assignments\/[^/]+$/)) {
            const id = parseInt(normalizedPath.split('/')[2]);
            const assignment = MOCK_ASSIGNMENTS.find(a => a.id === id);
            if (assignment) {
                return { success: true, data: assignment };
            }
            throw new Error(`Assignment ${id} introuvable`);
        }

        // POST /assignments
        if (method === 'POST' && normalizedPath === '/assignments') {
            const newAssignment = {
                id: MOCK_ASSIGNMENTS.length + 1,
                ...body,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            MOCK_ASSIGNMENTS.push(newAssignment);
            return { success: true, data: newAssignment, message: 'Devoir créé avec succès' };
        }

        // PUT /assignments/:id
        if (method === 'PUT' && normalizedPath.match(/^\/assignments\/[^/]+$/)) {
            const id = parseInt(normalizedPath.split('/')[2]);
            const assignment = MOCK_ASSIGNMENTS.find(a => a.id === id);
            if (assignment) {
                Object.assign(assignment, {
                    ...body,
                    updated_at: new Date().toISOString()
                });
                return { success: true, data: assignment, message: 'Devoir mis à jour avec succès' };
            }
            throw new Error(`Assignment ${id} introuvable`);
        }

        // DELETE /assignments/:id
        if (method === 'DELETE' && normalizedPath.match(/^\/assignments\/[^/]+$/)) {
            return { success: true, message: 'Devoir supprimé avec succès' };
        }

        // GET /curriculum
        if (method === 'GET' && normalizedPath === '/curriculum') {
            return { success: true, data: MOCK_CURRICULUM };
        }

        // GET /curriculum/subjects
        if (method === 'GET' && normalizedPath === '/curriculum/subjects') {
            const subjects = MOCK_CURRICULUM.subjects.map(subject => ({
                id: subject.id,
                name: subject.name,
                level: subject.level,
                chapters_count: subject.chapters.length,
                average_progress: subject.chapters.reduce((sum, ch) => sum + ch.progress, 0) / subject.chapters.length
            }));
            return { success: true, data: { subjects } };
        }

        // GET /curriculum/subjects/:id
        if (method === 'GET' && normalizedPath.match(/^\/curriculum\/subjects\/[^/]+$/)) {
            const subjectId = normalizedPath.split('/')[3];
            const subject = MOCK_CURRICULUM.subjects.find(s => s.id === subjectId);
            if (subject) {
                return { success: true, data: subject };
            }
            throw new Error(`Subject ${subjectId} introuvable`);
        }

        // GET /curriculum/subjects/:subjectId/chapters/:chapterId
        if (method === 'GET' && normalizedPath.match(/^\/curriculum\/subjects\/[^/]+\/chapters\/[^/]+$/)) {
            const parts = normalizedPath.split('/');
            const subjectId = parts[3];
            const chapterId = parts[5];
            const subject = MOCK_CURRICULUM.subjects.find(s => s.id === subjectId);
            if (subject) {
                const chapter = subject.chapters.find(ch => ch.id === chapterId);
                if (chapter) {
                    return { success: true, data: chapter };
                }
                throw new Error(`Chapter ${chapterId} introuvable`);
            }
            throw new Error(`Subject ${subjectId} introuvable`);
        }

        // PUT /curriculum/subjects/:subjectId/chapters/:chapterId
        if (method === 'PUT' && normalizedPath.match(/^\/curriculum\/subjects\/[^/]+\/chapters\/[^/]+$/)) {
            const parts = normalizedPath.split('/');
            const subjectId = parts[3];
            const chapterId = parts[5];
            const subject = MOCK_CURRICULUM.subjects.find(s => s.id === subjectId);
            if (subject) {
                const chapter = subject.chapters.find(ch => ch.id === chapterId);
                if (chapter && body && typeof body.progress === 'number') {
                    chapter.progress = body.progress;
                    return { success: true, data: { ...chapter }, message: 'Progression mise à jour' };
                }
                throw new Error(`Chapter ${chapterId} introuvable`);
            }
            throw new Error(`Subject ${subjectId} introuvable`);
        }

        // GET /themes
        if (method === 'GET' && normalizedPath === '/themes') {
            return { success: true, data: MOCK_THEMES };
        }

        // GET /themes/:id
        if (method === 'GET' && normalizedPath.match(/^\/themes\/[^/]+$/)) {
            const id = parseInt(normalizedPath.split('/')[2]);
            const theme = MOCK_THEMES.find(t => t.id === id);
            if (theme) {
                return { success: true, data: theme };
            }
            throw new Error(`Theme ${id} introuvable`);
        }

        // POST /themes
        if (method === 'POST' && normalizedPath === '/themes') {
            const newTheme = {
                id: MOCK_THEMES.length + 1,
                ...body,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            MOCK_THEMES.push(newTheme);
            return { success: true, data: newTheme, message: 'Thème créé avec succès' };
        }

        // PUT /themes/:id
        if (method === 'PUT' && normalizedPath.match(/^\/themes\/[^/]+$/)) {
            const id = parseInt(normalizedPath.split('/')[2]);
            const theme = MOCK_THEMES.find(t => t.id === id);
            if (theme) {
                Object.assign(theme, { ...body, updated_at: new Date().toISOString() });
                return { success: true, data: theme, message: 'Thème mis à jour avec succès' };
            }
            throw new Error(`Theme ${id} introuvable`);
        }

        // DELETE /themes/:id
        if (method === 'DELETE' && normalizedPath.match(/^\/themes\/[^/]+$/)) {
            return { success: true, message: 'Thème supprimé avec succès' };
        }

        // POST /themes/generate
        if (method === 'POST' && normalizedPath === '/themes/generate') {
            return {
                success: true,
                data: {
                    id: Date.now(),
                    title: body.title || 'Thème généré',
                    description: body.description || '',
                    tags: body.tags || [],
                    subject: body.subject || 'Maths',
                    type: 'quiz',
                    status: 'draft',
                    source: 'ai_studio',
                    created_at: new Date().toISOString()
                }
            };
        }

        // POST /ai/themes/generate
        if (method === 'POST' && normalizedPath === '/ai/themes/generate') {
            return {
                success: true,
                data: {
                    id: Date.now(),
                    title: body.title || 'Thème généré',
                    description: body.description || '',
                    tags: body.tags || [],
                    subject: body.subject || 'Maths',
                    type: 'quiz',
                    status: 'draft',
                    source: 'ai_studio',
                    created_at: new Date().toISOString()
                }
            };
        }

        // POST /themes/import
        if (method === 'POST' && normalizedPath === '/themes/import') {
            return {
                success: true,
                data: {
                    id: MOCK_THEMES.length + 1,
                    title: body.title || 'Thème importé',
                    description: body.description || '',
                    tags: body.tags || [],
                    subject: body.subject || 'Maths',
                    type: 'quiz',
                    status: 'draft',
                    source: 'pdf_import',
                    created_at: new Date().toISOString()
                },
                message: 'Thème importé avec succès'
            };
        }

        // GET /themes/:id/reviews
        if (method === 'GET' && normalizedPath.match(/^\/themes\/[^/]+\/reviews$/)) {
            return { success: true, data: [] };
        }

        // POST /themes/:id/reviews
        if (method === 'POST' && normalizedPath.match(/^\/themes\/[^/]+\/reviews$/)) {
            return {
                success: true,
                data: {
                    id: 1,
                    theme_id: parseInt(normalizedPath.split('/')[2]),
                    action: body.action || 'submitted',
                    comment: body.comment || null,
                    created_at: new Date().toISOString()
                },
                message: 'Review créée avec succès'
            };
        }

        // GET /classes
        if (method === 'GET' && normalizedPath === '/classes') {
            return { success: true, data: MOCK_CLASSES };
        }

        // GET /classes/:id
        if (method === 'GET' && normalizedPath.match(/^\/classes\/[^/]+$/)) {
            const id = parseInt(normalizedPath.split('/')[2]);
            const classItem = MOCK_CLASSES.find(c => c.id === id);
            if (classItem) {
                return { success: true, data: classItem };
            }
            throw new Error(`Classe ${id} introuvable`);
        }

        // GET /classes/:id/students
        if (method === 'GET' && normalizedPath.match(/^\/classes\/[^/]+\/students$/)) {
            return { success: true, data: [] };
        }

        // GET /students/:id
        if (method === 'GET' && normalizedPath.match(/^\/students\/[^/]+$/)) {
            return {
                success: true,
                data: {
                    id: parseInt(normalizedPath.split('/')[2]),
                    name: 'Étudiant Test',
                    email: 'etudiant@test.fr',
                    school_id: 1
                }
            };
        }

        // GET /social
        if (method === 'GET' && normalizedPath === '/social') {
            return { success: true, data: MOCK_SOCIAL_ENTRIES };
        }

        // GET /social/:id
        if (method === 'GET' && normalizedPath.match(/^\/social\/[^/]+$/)) {
            const id = parseInt(normalizedPath.split('/')[2]);
            const entry = MOCK_SOCIAL_ENTRIES.find(e => e.id === id);
            if (entry) {
                return { success: true, data: entry };
            }
            throw new Error(`Social entry ${id} introuvable`);
        }

        // POST /social
        if (method === 'POST' && normalizedPath === '/social') {
            const newEntry = {
                id: MOCK_SOCIAL_ENTRIES.length + 1,
                ...body,
                school_id: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            MOCK_SOCIAL_ENTRIES.push(newEntry);
            return { success: true, data: newEntry, message: 'Entrée sociale créée avec succès' };
        }

        // PUT /social/:id
        if (method === 'PUT' && normalizedPath.match(/^\/social\/[^/]+$/)) {
            const id = parseInt(normalizedPath.split('/')[2]);
            const entry = MOCK_SOCIAL_ENTRIES.find(e => e.id === id);
            if (entry) {
                Object.assign(entry, { ...body, updated_at: new Date().toISOString() });
                return { success: true, data: entry, message: 'Entrée sociale mise à jour avec succès' };
            }
            throw new Error(`Social entry ${id} introuvable`);
        }

        // DELETE /social/:id
        if (method === 'DELETE' && normalizedPath.match(/^\/social\/[^/]+$/)) {
            return { success: true, message: 'Entrée sociale supprimée avec succès' };
        }

        // POST /social/friend-code (doit être avant /social/{id})
        if (method === 'POST' && normalizedPath === '/social/friend-code') {
            const generateCode = () => {
                const part1 = Math.random().toString(36).slice(2, 6).toUpperCase();
                const part2 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
                const part3 = Math.random().toString(36).slice(2, 6).toUpperCase();
                return `${part1}-${part2}-${part3}`;
            };
            return {
                success: true,
                data: {
                    user_id: 10,
                    school_id: 1,
                    social_code: generateCode(),
                    created_at: new Date().toISOString()
                }
            };
        }

        // GET /social/friend-code (doit être avant /social/{id})
        if (method === 'GET' && normalizedPath === '/social/friend-code') {
            const generateCode = () => {
                const part1 = Math.random().toString(36).slice(2, 6).toUpperCase();
                const part2 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
                const part3 = Math.random().toString(36).slice(2, 6).toUpperCase();
                return `${part1}-${part2}-${part3}`;
            };
            return {
                success: true,
                data: {
                    social_code: generateCode()
                }
            };
        }

        // POST /social/friends (doit être avant /social/{id})
        if (method === 'POST' && normalizedPath === '/social/friends') {
            if (!body || !body.social_code) {
                throw new Error('social_code est requis');
            }
            return {
                success: true,
                data: {
                    id: 1,
                    owner_user_id: 10,
                    friend_user_id: 11,
                    created_at: new Date().toISOString()
                }
            };
        }

        // GET /social/friends (doit être avant /social/{id})
        if (method === 'GET' && normalizedPath === '/social/friends') {
            return {
                success: true,
                data: [
                    {
                        id: 1,
                        friend_user_id: 11,
                        friend_name: 'Sarah Benali',
                        school_id: 1,
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 2,
                        friend_user_id: 12,
                        friend_name: 'Julien Morel',
                        school_id: 1,
                        created_at: new Date().toISOString()
                    }
                ]
            };
        }

        // DELETE /social/friends/:id (doit être avant /social/{id})
        if (method === 'DELETE' && normalizedPath.match(/^\/social\/friends\/[^/]+$/)) {
            return { success: true };
        }

        // GET /social/stats
        if (method === 'GET' && normalizedPath === '/social/stats') {
            return { success: true, data: [] };
        }

        // GET /social/stats/:id
        if (method === 'GET' && normalizedPath.match(/^\/social\/stats\/[^/]+$/)) {
            return { success: true, data: { id: 1, class_id: 1, collaboration_score: 85.5 } };
        }

        // POST /social/stats
        if (method === 'POST' && normalizedPath === '/social/stats') {
            return {
                success: true,
                data: {
                    id: 1,
                    ...body,
                    created_at: new Date().toISOString()
                },
                message: 'Stat sociale créée avec succès'
            };
        }

        // PUT /social/stats/:id
        if (method === 'PUT' && normalizedPath.match(/^\/social\/stats\/[^/]+$/)) {
            return { success: true, data: { id: 1, ...body }, message: 'Stat sociale mise à jour avec succès' };
        }

        // DELETE /social/stats/:id
        if (method === 'DELETE' && normalizedPath.match(/^\/social\/stats\/[^/]+$/)) {
            return { success: true, message: 'Stat sociale supprimée avec succès' };
        }

        // POST /submissions
        if (method === 'POST' && normalizedPath === '/submissions') {
            return {
                success: true,
                data: {
                    assignment_id: body.assignment_id,
                    student_id: body.student_id,
                    score: body.score,
                    duration_seconds: body.duration,
                    raw_response: body.responses,
                    completed_at: new Date().toISOString()
                },
                message: 'Soumission enregistrée avec succès'
            };
        }

        // GET /assignments/:id/submissions
        if (method === 'GET' && normalizedPath.match(/^\/assignments\/[^/]+\/submissions$/)) {
            return { success: true, data: [] };
        }

        // Route non trouvée
        throw new Error(`Route non implémentée: ${method} ${normalizedPath}`);
    }

    // Fonction fakeRequest qui simule une réponse fetch
    async function fakeRequest(method, path, body = null) {
        console.log(`[FakeRouter] ${method} ${path}`, body || '');
        
        // Simuler un délai réseau
        const delay = 150 + Math.random() * 150;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
            const result = routeRequest(method, path, body);
            console.log(`[FakeRouter] ✅ Réponse:`, result);
            
            // Retourner un objet qui ressemble à une Response fetch
            return {
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => result,
                text: async () => JSON.stringify(result)
            };
        } catch (error) {
            console.error(`[FakeRouter] ❌ Erreur:`, error);
            
            const errorResponse = {
                success: false,
                error: error.message
            };
            
            return {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                json: async () => errorResponse,
                text: async () => JSON.stringify(errorResponse)
            };
        }
    }

    return { fakeRequest };
}

/**
 * Appelle le FakeRouter
 * @param {string} method - Méthode HTTP
 * @param {string} path - Chemin de l'endpoint
 * @param {object} body - Corps de la requête (pour POST/PUT)
 * @returns {Promise<Response>} Réponse similaire à fetch
 */
export async function callFakeRouter(method, path, body = null) {
    if (!fakeRouterModule) {
        await loadFakeRouter();
    }
    
    if (!fakeRouterModule) {
        throw new Error('FakeRouter non disponible');
    }

    // Normaliser le path (enlever /api si présent)
    const normalizedPath = path.replace(/^\/api/, '');
    
    // Parser le body si c'est une string
    let parsedBody = body;
    if (typeof body === 'string') {
        try {
            parsedBody = JSON.parse(body);
        } catch (e) {
            parsedBody = body;
        }
    }

    return await fakeRouterModule.fakeRequest(method, normalizedPath, parsedBody);
}

/**
 * Appel API générique qui route vers backend ou FakeRouter selon le mode
 * @param {string} mode - 'backend' ou 'fakerouter'
 * @param {string} method - Méthode HTTP
 * @param {string} path - Chemin de l'endpoint
 * @param {object} options - Options (body, headers, requiresAuth, tokenMode, apiBaseUrl)
 * @returns {Promise<Response>} Réponse fetch ou FakeRouter
 */
export async function callAPI(mode, method, path, options = {}) {
    if (mode === 'fakerouter') {
        return await callFakeRouter(method, path, options.body);
    } else {
        return await callBackend(method, path, options);
    }
}

