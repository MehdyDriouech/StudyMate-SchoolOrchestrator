/**
 * Gestion de l'UI pour SMSO Tester
 * Génère dynamiquement l'interface et gère les événements
 */

import { TEST_FEATURES } from './test-config.js';
import { login, getAuthSession, clearAuthSession, getCurrentToken, callAPI } from './test-api.js';
import { runSingleTest, runAllTestsForFeature, runAllTests, compareBackendVsFakeRouter } from './test-runner.js';

// État global de l'UI
let currentMode = 'backend';
let currentOptions = {
    apiBaseUrl: '/SMSO/backend/public/api',
    tokenMode: 'query'
};

/**
 * Affiche une notification
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification (success, error, warning)
 */
export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Échappe le HTML pour éviter les injections
 * @param {string} text - Texte à échapper
 * @returns {string}
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Met à jour l'affichage du token
 */
function updateTokenDisplay() {
    const session = getAuthSession();
    const tokenSection = document.getElementById('token-info-section');
    
    if (session && session.token) {
        tokenSection.style.display = 'block';
        document.getElementById('token-display').value = session.token.substring(0, 50) + '...';
        document.getElementById('user-display').value = session.user?.email || session.user?.full_name || 'Utilisateur';
    } else {
        tokenSection.style.display = 'none';
    }
}

/**
 * Gère le login
 */
export async function handleLogin() {
    const email = document.getElementById('test-email').value.trim();
    const password = document.getElementById('test-password').value;
    const apiBaseUrl = document.getElementById('api-base-url').value.trim() || currentOptions.apiBaseUrl;
    
    currentOptions.apiBaseUrl = apiBaseUrl;

    if (!email || !password) {
        showNotification('Veuillez remplir tous les champs', 'error');
        return;
    }

    const result = await login(email, password, apiBaseUrl);
    
    if (result.success) {
        updateTokenDisplay();
        showNotification('Connexion réussie', 'success');
    } else {
        showNotification(result.error || 'Erreur de connexion', 'error');
    }
}

/**
 * Gère la déconnexion
 */
export function handleLogout() {
    clearAuthSession();
    updateTokenDisplay();
    showNotification('Déconnexion réussie', 'success');
}

/**
 * Change le mode de test
 * @param {string} mode - 'backend', 'fakerouter' ou 'compare'
 */
export function selectMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-option').forEach(opt => opt.classList.remove('active'));
    const modeClass = mode === 'backend' ? 'backend' : mode === 'fakerouter' ? 'fakerouter' : 'compare';
    document.querySelector(`.mode-option.${modeClass}`).classList.add('active');
    document.querySelector(`input[value="${mode}"]`).checked = true;
}

/**
 * Affiche une section
 * @param {string} sectionId - Nom de la section
 */
export function showSection(sectionId) {
    // Masquer toutes les sections
    document.getElementById('section-config').style.display = 'none';
    document.getElementById('section-sandbox').style.display = 'none';
    document.getElementById('section-compare').style.display = 'none';
    document.querySelectorAll('.feature-section').forEach(el => {
        el.style.display = 'none';
    });
    
    // Retirer la classe active de tous les nav-items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Afficher la section demandée
    if (sectionId === 'config') {
        document.getElementById('section-config').style.display = 'block';
        document.getElementById('nav-config').classList.add('active');
    } else if (sectionId === 'sandbox') {
        document.getElementById('section-sandbox').style.display = 'block';
        document.getElementById('nav-sandbox').classList.add('active');
    } else if (sectionId === 'compare') {
        document.getElementById('section-compare').style.display = 'block';
        document.getElementById('nav-compare').classList.add('active');
    } else {
        // Section de feature
        const featureSection = document.getElementById(`section-feature-${sectionId}`);
        const navItem = document.getElementById(`nav-feature-${sectionId}`);
        if (featureSection) {
            featureSection.style.display = 'block';
        }
        if (navItem) {
            navItem.classList.add('active');
        }
    }
}

/**
 * Affiche les résultats de tests dans un tableau
 * @param {Array} results - Résultats des tests
 * @param {string} featureId - ID de la feature
 */
export function renderTestResults(results, featureId) {
    const resultsContainer = document.getElementById(`test-results-${featureId}`);
    if (!resultsContainer) return;
    
    const okCount = results.filter(r => r.status === 'OK').length;
    const totalCount = results.length;
    
    let html = `
        <div class="test-results-header">
            <h4>📊 Résultats des tests (${okCount}/${totalCount} OK) - Mode: ${currentMode}</h4>
        </div>
        <table class="test-results-table">
            <thead>
                <tr>
                    <th>Endpoint</th>
                    <th>Résultat</th>
                    <th>Détail</th>
                    <th>Temps</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    results.forEach(result => {
        const statusClass = `test-status-${result.status.toLowerCase()}`;
        const duration = result.duration ? `${result.duration}ms` : '—';
        
        html += `
            <tr>
                <td><code style="font-size: 0.8rem;">${escapeHtml(result.endpoint)}</code></td>
                <td><span class="${statusClass}">${result.status}</span></td>
                <td><span class="test-detail">${escapeHtml(result.detail)}</span></td>
                <td>${duration}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
}

/**
 * Affiche les résultats de comparaison
 * @param {Array} results - Résultats de la comparaison
 */
export function renderComparisonResults(results) {
    const container = document.getElementById('comparison-results-container');
    
    const okCount = results.filter(r => r.aligned).length;
    const warningCount = results.filter(r => r.alignment === 'WARNING').length;
    const errorCount = results.filter(r => r.alignment === 'ERROR').length;
    
    let html = `
        <div class="test-results-header">
            <h4>🔄 Résultats de la comparaison (${okCount} alignés, ${warningCount} différences, ${errorCount} désalignés)</h4>
        </div>
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Endpoint</th>
                    <th>Backend</th>
                    <th>FakeRouter</th>
                    <th>Alignement</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    results.forEach(result => {
        const alignmentClass = result.alignment === 'OK' ? 'alignment-ok' : 
                              result.alignment === 'WARNING' ? 'alignment-warning' : 'alignment-error';
        
        html += `
            <tr>
                <td><code style="font-size: 0.8rem;">${result.method} ${escapeHtml(result.endpoint)}</code></td>
                <td><span class="test-status-${result.backend.toLowerCase()}">${result.backend}</span><br><small class="test-detail">${escapeHtml(result.backendDetail)}</small></td>
                <td><span class="test-status-${result.fakerouter.toLowerCase()}">${result.fakerouter}</span><br><small class="test-detail">${escapeHtml(result.fakerouterDetail)}</small></td>
                <td><span class="${alignmentClass}">${result.alignmentDetail}</span></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
    container.style.display = 'block';
}

/**
 * Gère le test d'un endpoint unique
 * @param {object} endpoint - Configuration de l'endpoint
 * @param {string} featureId - ID de la feature
 */
export async function handleRunSingleTest(endpoint, featureId) {
    const resultsContainer = document.getElementById(`test-results-${featureId}`);
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = `
            <div class="test-results-header">
                <h4>⏳ Test en cours...</h4>
            </div>
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <div class="test-loading" style="margin: 0 auto 1rem;"></div>
                <p>Exécution du test ${endpoint.method} ${endpoint.path}...</p>
            </div>
        `;
    }

    // Récupérer les options
    currentOptions.tokenMode = document.querySelector('input[name="token-mode"]:checked')?.value || 'query';
    currentOptions.apiBaseUrl = document.getElementById('api-base-url').value.trim() || currentOptions.apiBaseUrl;

    const result = await runSingleTest(endpoint, currentMode, currentOptions);
    renderTestResults([result], featureId);
}

/**
 * Gère les tests d'une feature complète
 * @param {string} featureId - ID de la feature
 */
export async function handleRunFeatureTests(featureId) {
    const resultsContainer = document.getElementById(`test-results-${featureId}`);
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = `
            <div class="test-results-header">
                <h4>⏳ Tests en cours...</h4>
            </div>
            <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                <div class="test-loading" style="margin: 0 auto 1rem;"></div>
                <p>Exécution des tests pour la feature ${featureId}...</p>
            </div>
        `;
    }

    currentOptions.tokenMode = document.querySelector('input[name="token-mode"]:checked')?.value || 'query';
    currentOptions.apiBaseUrl = document.getElementById('api-base-url').value.trim() || currentOptions.apiBaseUrl;

    try {
        const results = await runAllTestsForFeature(featureId, currentMode, currentOptions);
        renderTestResults(results, featureId);
        const okCount = results.filter(r => r.status === 'OK').length;
        showNotification(`Tests terminés: ${okCount}/${results.length} réussis`, 'success');
    } catch (error) {
        showNotification(`Erreur: ${error.message}`, 'error');
    }
}

/**
 * Gère tous les tests globaux
 */
export async function handleRunAllTests() {
    currentOptions.tokenMode = document.querySelector('input[name="token-mode"]:checked')?.value || 'query';
    currentOptions.apiBaseUrl = document.getElementById('api-base-url').value.trim() || currentOptions.apiBaseUrl;

    showNotification('Démarrage de tous les tests...', 'warning');

    try {
        const results = await runAllTests(currentMode, currentOptions);
        const okCount = results.filter(r => r.status === 'OK').length;
        showNotification(`Tous les tests terminés: ${okCount}/${results.length} réussis`, 'success');
        
        // Afficher les résultats dans la première feature trouvée
        if (results.length > 0 && TEST_FEATURES.length > 0) {
            renderTestResults(results, TEST_FEATURES[0].id);
            showSection(TEST_FEATURES[0].id);
        }
    } catch (error) {
        showNotification(`Erreur: ${error.message}`, 'error');
    }
}

/**
 * Gère la comparaison Backend vs FakeRouter
 */
export async function handleCompare() {
    const container = document.getElementById('comparison-results-container');
    container.style.display = 'block';
    container.innerHTML = `
        <div class="test-results-header">
            <h4>⏳ Comparaison en cours...</h4>
        </div>
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
            <div class="test-loading" style="margin: 0 auto 1rem;"></div>
            <p>Comparaison des réponses Backend vs FakeRouter...</p>
        </div>
    `;

    currentOptions.tokenMode = document.querySelector('input[name="token-mode"]:checked')?.value || 'query';
    currentOptions.apiBaseUrl = document.getElementById('api-base-url').value.trim() || currentOptions.apiBaseUrl;

    try {
        const results = await compareBackendVsFakeRouter(currentOptions);
        renderComparisonResults(results);
        const okCount = results.filter(r => r.aligned).length;
        showNotification(`Comparaison terminée: ${okCount}/${results.length} alignés`, 'success');
    } catch (error) {
        showNotification(`Erreur: ${error.message}`, 'error');
    }
}

/**
 * Initialise les features et crée l'UI dynamiquement
 */
export function initFeatures() {
    const navFeaturesList = document.getElementById('nav-features-list');
    const featureSectionsContainer = document.getElementById('feature-sections-container');
    
    navFeaturesList.innerHTML = '';
    featureSectionsContainer.innerHTML = '';
    
    TEST_FEATURES.forEach(feature => {
        // Créer l'item de navigation dans la sidebar
        const navItem = document.createElement('div');
        navItem.className = 'nav-item';
        navItem.id = `nav-feature-${feature.id}`;
        navItem.textContent = `${feature.icon} ${feature.label}`;
        navItem.onclick = () => showSection(feature.id);
        navFeaturesList.appendChild(navItem);
        
        // Créer la section de contenu pour cette feature
        const featureSection = document.createElement('div');
        featureSection.className = 'feature-section';
        featureSection.id = `section-feature-${feature.id}`;
        featureSection.style.display = 'none';
        
        const formSection = document.createElement('div');
        formSection.className = 'form-section';
        
        const titleRow = document.createElement('div');
        titleRow.style.display = 'flex';
        titleRow.style.justifyContent = 'space-between';
        titleRow.style.alignItems = 'center';
        titleRow.style.marginBottom = '1rem';
        
        const title = document.createElement('h3');
        title.textContent = `${feature.icon} ${feature.label}`;
        title.style.margin = '0';
        titleRow.appendChild(title);
        
        const playTestBtn = document.createElement('button');
        playTestBtn.className = 'btn btn-test-play btn-test';
        playTestBtn.textContent = '▶ Play tests (feature)';
        playTestBtn.onclick = () => handleRunFeatureTests(feature.id);
        titleRow.appendChild(playTestBtn);
        
        formSection.appendChild(titleRow);
        
        const description = document.createElement('p');
        description.style.fontSize = '0.875rem';
        description.style.color = 'var(--text-muted)';
        description.style.marginBottom = '1rem';
        description.textContent = `Endpoints disponibles pour la feature ${feature.label}. Cliquez sur "Run test" pour tester un endpoint individuellement.`;
        formSection.appendChild(description);
        
        // Conteneur pour les résultats de tests
        const testResultsContainer = document.createElement('div');
        testResultsContainer.id = `test-results-${feature.id}`;
        testResultsContainer.className = 'test-results-container';
        testResultsContainer.style.display = 'none';
        formSection.appendChild(testResultsContainer);
        
        const endpointsList = document.createElement('div');
        endpointsList.className = 'preset-list';
        
        feature.endpoints.forEach(endpoint => {
            const item = document.createElement('div');
            item.className = 'preset-item';
            
            const header = document.createElement('div');
            header.style.marginBottom = '0.5rem';
            
            const methodBadge = document.createElement('span');
            methodBadge.className = 'preset-method';
            methodBadge.textContent = endpoint.method;
            
            const path = document.createElement('span');
            path.className = 'preset-path';
            path.textContent = endpoint.path;
            
            header.appendChild(methodBadge);
            header.appendChild(path);
            
            const desc = document.createElement('div');
            desc.className = 'preset-description';
            desc.textContent = endpoint.description;
            
            const actions = document.createElement('div');
            actions.style.marginTop = '0.75rem';
            actions.style.display = 'flex';
            actions.style.gap = '0.5rem';
            
            const runTestBtn = document.createElement('button');
            runTestBtn.className = 'btn btn-test-run btn-test';
            runTestBtn.style.padding = '0.4rem 0.75rem';
            runTestBtn.style.fontSize = '0.75rem';
            runTestBtn.textContent = '▶ Run test';
            runTestBtn.onclick = async (e) => {
                e.stopPropagation();
                await handleRunSingleTest(endpoint, feature.id);
            };
            
            const fillBtn = document.createElement('button');
            fillBtn.className = 'btn btn-success btn-test';
            fillBtn.style.padding = '0.4rem 0.75rem';
            fillBtn.style.fontSize = '0.75rem';
            fillBtn.textContent = 'Remplir sandbox';
            fillBtn.onclick = (e) => {
                e.stopPropagation();
                fillSandboxFromPreset({
                    method: endpoint.method,
                    path: endpoint.path,
                    body: endpoint.body ? JSON.parse(endpoint.body) : null,
                    requiresAuth: endpoint.requiresAuth
                });
            };
            
            actions.appendChild(runTestBtn);
            actions.appendChild(fillBtn);
            
            item.appendChild(header);
            item.appendChild(desc);
            item.appendChild(actions);
            
            endpointsList.appendChild(item);
        });
        
        formSection.appendChild(endpointsList);
        featureSection.appendChild(formSection);
        featureSectionsContainer.appendChild(featureSection);
    });
}

/**
 * Met à jour l'affichage JSON
 * @param {object} data - Données à afficher
 * @param {string} status - Statut (success, error, pending)
 * @param {number} statusCode - Code HTTP
 */
export function updateJsonViewer(data, status = 'success', statusCode = 200) {
    const output = document.getElementById('json-output');
    const badge = document.getElementById('status-badge');
    
    badge.innerHTML = '';
    if (status === 'success') {
        badge.innerHTML = `<span class="status-badge status-success">✓ ${statusCode} Success</span>`;
    } else if (status === 'error') {
        badge.innerHTML = `<span class="status-badge status-error">✗ ${statusCode} Error</span>`;
    } else {
        badge.innerHTML = `<span class="status-badge status-pending">⏳ Loading...</span>`;
    }

    if (data === null) {
        output.classList.add('empty');
        output.textContent = 'Chargement...';
    } else {
        output.classList.remove('empty');
        output.textContent = JSON.stringify(data, null, 2);
    }
}

/**
 * Remplit le sandbox depuis un preset d'endpoint
 * @param {object} preset - Preset d'endpoint
 */
export function fillSandboxFromPreset(preset) {
    document.getElementById('sandbox-method').value = preset.method;
    document.getElementById('sandbox-path').value = preset.path;
    if (preset.body) {
        const bodyObj = typeof preset.body === 'string' ? JSON.parse(preset.body) : preset.body;
        document.getElementById('sandbox-body').value = JSON.stringify(bodyObj, null, 2);
    } else {
        document.getElementById('sandbox-body').value = '';
    }
    document.getElementById('sandbox-use-auth').checked = preset.requiresAuth !== false;
    
    // Basculer vers la sandbox
    showSection('sandbox');
    
    showNotification('Preset chargé dans la sandbox', 'success');
}

/**
 * Gère l'envoi d'une requête depuis le sandbox
 */
export async function handleSandboxRequest() {
    const method = document.getElementById('sandbox-method').value;
    const path = document.getElementById('sandbox-path').value.trim();
    const bodyText = document.getElementById('sandbox-body').value.trim();
    const useAuth = document.getElementById('sandbox-use-auth').checked;

    if (!path) {
        showNotification('Veuillez entrer un chemin d\'endpoint', 'error');
        return;
    }

    updateJsonViewer(null, 'pending');

    try {
        let requestOptions = {
            method,
            headers: {},
            requiresAuth: useAuth,
            apiBaseUrl: currentOptions.apiBaseUrl,
            tokenMode: currentOptions.tokenMode
        };

        // Gérer le body pour POST/PUT
        if ((method === 'POST' || method === 'PUT') && bodyText) {
            try {
                const bodyObj = JSON.parse(bodyText);
                requestOptions.body = bodyObj;
            } catch (e) {
                updateJsonViewer(
                    { success: false, error: 'Body JSON invalide: ' + e.message },
                    'error',
                    400
                );
                return;
            }
        }

        // Appel API selon le mode (utiliser 'backend' si mode est 'compare')
        const modeToUse = currentMode === 'compare' ? 'backend' : currentMode;
        const response = await callAPI(modeToUse, method, path, requestOptions);

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            updateJsonViewer(
                {
                    success: false,
                    error: 'Réponse non-JSON reçue',
                    raw_response: text.substring(0, 500),
                    status: response.status
                },
                'error',
                response.status
            );
            return;
        }

        updateJsonViewer(data, response.ok ? 'success' : 'error', response.status);
    } catch (error) {
        showNotification('Erreur: ' + error.message, 'error');
        updateJsonViewer({ success: false, error: error.message }, 'error', 500);
    }
}

/**
 * Initialise l'interface de test
 */
export function initTestUI() {
    // Charger le token depuis localStorage
    updateTokenDisplay();

    // Initialiser les features
    initFeatures();

    // Bind les événements
    document.getElementById('btn-login').onclick = handleLogin;
    document.getElementById('btn-logout').onclick = handleLogout;
    document.getElementById('btn-compare').onclick = handleCompare;
    document.getElementById('btn-run-all-tests').onclick = handleRunAllTests;
    document.getElementById('btn-sandbox-send').onclick = handleSandboxRequest;

    // Bind les modes
    document.querySelectorAll('input[name="test-mode"]').forEach(radio => {
        radio.onchange = (e) => selectMode(e.target.value);
    });

    // Initialiser le mode par défaut
    selectMode('backend');

    console.log('[TestUI] Interface initialisée');
}

