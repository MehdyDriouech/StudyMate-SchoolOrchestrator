/**
 * Logique de tests pour SMSO Tester
 * Gère les tests unitaires, globaux et la comparaison Backend vs FakeRouter
 */

import { callAPI, getCurrentToken } from './test-api.js';
import { TEST_FEATURES } from './test-config.js';

/**
 * Teste un seul endpoint
 * @param {object} endpointConfig - Configuration de l'endpoint
 * @param {string} mode - 'backend' ou 'fakerouter'
 * @param {object} options - Options (apiBaseUrl, tokenMode)
 * @returns {Promise<object>} Résultat du test
 */
export async function runSingleTest(endpointConfig, mode, options = {}) {
    const endpointName = `${endpointConfig.method} ${endpointConfig.path}`;
    console.log(`[TestRunner] Démarrage du test: ${endpointName} (mode: ${mode})`);
    
    const result = {
        endpoint: endpointName,
        status: 'ERROR',
        detail: '',
        statusCode: 0,
        duration: 0,
        mode: mode
    };
    
    const startTime = Date.now();
    
    try {
        let requestOptions = {
            method: endpointConfig.method,
            headers: {},
            requiresAuth: endpointConfig.requiresAuth !== false,
            apiBaseUrl: options.apiBaseUrl,
            tokenMode: options.tokenMode
        };

        // Gérer le body pour POST/PUT
        if ((endpointConfig.method === 'POST' || endpointConfig.method === 'PUT') && endpointConfig.body) {
            try {
                requestOptions.body = typeof endpointConfig.body === 'string' 
                    ? JSON.parse(endpointConfig.body) 
                    : endpointConfig.body;
            } catch (e) {
                result.status = 'ERROR';
                result.detail = `Body JSON invalide: ${e.message}`;
                result.duration = Date.now() - startTime;
                return result;
            }
        }

        // Vérifier l'auth si nécessaire
        if (endpointConfig.requiresAuth && mode === 'backend' && !getCurrentToken()) {
            result.status = 'UNAUTHORIZED';
            result.detail = 'Token manquant';
            result.statusCode = 401;
            result.duration = Date.now() - startTime;
            return result;
        }

        // Appel API selon le mode
        const response = await callAPI(mode, endpointConfig.method, endpointConfig.path, requestOptions);

        result.statusCode = response.status;
        result.duration = Date.now() - startTime;

        // Déterminer le statut selon le code HTTP
        if (response.status >= 200 && response.status < 300) {
            result.status = 'OK';
            try {
                const text = await response.text();
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    result.detail = `${response.status} + réponse non-JSON`;
                    return result;
                }
                
                // Générer un détail court
                if (data.success && data.data) {
                    if (Array.isArray(data.data)) {
                        result.detail = `${response.status} + data.length=${data.data.length}`;
                    } else if (typeof data.data === 'object') {
                        const keys = Object.keys(data.data);
                        result.detail = `${response.status} + data.${keys.slice(0, 2).join(', ')}`;
                    } else {
                        result.detail = `${response.status} + data`;
                    }
                } else {
                    result.detail = `${response.status} + ${JSON.stringify(data).substring(0, 50)}`;
                }
            } catch (e) {
                result.detail = `${response.status} + erreur parsing`;
            }
        } else if (response.status === 401) {
            result.status = 'UNAUTHORIZED';
            result.detail = `${response.status} - Token invalide ou expiré`;
        } else if (response.status === 403) {
            result.status = 'FORBIDDEN';
            result.detail = `${response.status} - Accès refusé (rôle insuffisant)`;
        } else {
            result.status = 'ERROR';
            try {
                const text = await response.text();
                const data = JSON.parse(text);
                result.detail = `${response.status} - ${data.error || data.message || 'Erreur inconnue'}`;
            } catch (e) {
                result.detail = `${response.status} - Erreur HTTP`;
            }
        }
    } catch (error) {
        result.status = 'ERROR';
        result.detail = error.message || 'Erreur inconnue';
        result.duration = Date.now() - startTime;
    }
    
    return result;
}

/**
 * Teste tous les endpoints d'une feature
 * @param {string} featureId - ID de la feature
 * @param {string} mode - 'backend' ou 'fakerouter'
 * @param {object} options - Options (apiBaseUrl, tokenMode)
 * @returns {Promise<Array>} Résultats de tous les tests
 */
export async function runAllTestsForFeature(featureId, mode, options = {}) {
    console.log(`[TestRunner] Démarrage des tests pour la feature: ${featureId} (mode: ${mode})`);
    
    const feature = TEST_FEATURES.find(f => f.id === featureId);
    if (!feature) {
        throw new Error(`Feature ${featureId} introuvable`);
    }
    
    const results = [];
    
    // Vérifier l'auth si nécessaire
    const needsAuth = feature.endpoints.some(e => e.requiresAuth);
    if (needsAuth && mode === 'backend' && !getCurrentToken()) {
        results.push({
            endpoint: 'Authentification',
            status: 'UNAUTHORIZED',
            detail: 'Token manquant - connexion requise',
            statusCode: 401,
            duration: 0,
            mode: mode
        });
        return results;
    }
    
    // Tester tous les endpoints
    for (const endpoint of feature.endpoints) {
        const testResult = await runSingleTest(endpoint, mode, options);
        results.push(testResult);
        
        // Petit délai entre les tests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
}

/**
 * Teste toutes les features (batterie complète)
 * @param {string} mode - 'backend' ou 'fakerouter'
 * @param {object} options - Options (apiBaseUrl, tokenMode)
 * @returns {Promise<Array>} Résultats de tous les tests
 */
export async function runAllTests(mode, options = {}) {
    console.log(`[TestRunner] Démarrage de tous les tests (mode: ${mode})`);
    
    const allResults = [];
    
    // Test santé API (uniquement pour backend)
    if (mode === 'backend') {
        try {
            const healthStart = Date.now();
            const apiBaseUrl = options.apiBaseUrl || '/SMSO/backend/public/api';
            const response = await fetch(`${apiBaseUrl.replace('/api', '')}/check.php`).catch(() => null);
            
            allResults.push({
                endpoint: 'GET /api (Health Check)',
                status: response && response.ok ? 'OK' : 'ERROR',
                detail: response ? `${response.status} - API accessible` : 'API non accessible',
                statusCode: response?.status || 0,
                duration: Date.now() - healthStart,
                mode: mode
            });
        } catch (e) {
            allResults.push({
                endpoint: 'GET /api (Health Check)',
                status: 'ERROR',
                detail: `Erreur: ${e.message}`,
                statusCode: 0,
                duration: 0,
                mode: mode
            });
        }
    }
    
    // Tester toutes les features
    for (const feature of TEST_FEATURES) {
        const featureResults = await runAllTestsForFeature(feature.id, mode, options);
        allResults.push(...featureResults);
        
        // Délai entre les features
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return allResults;
}

/**
 * Compare les résultats Backend vs FakeRouter pour un endpoint
 * @param {object} backendResult - Résultat du test backend
 * @param {object} fakerouterResult - Résultat du test FakeRouter
 * @returns {object} Résultat de la comparaison
 */
export function compareResults(backendResult, fakerouterResult) {
    // Les deux sont OK
    if (backendResult.status === 'OK' && fakerouterResult.status === 'OK') {
        return {
            status: 'OK',
            detail: '✅ Aligné',
            aligned: true
        };
    }
    
    // L'un est OK et l'autre ERROR
    if ((backendResult.status === 'OK' && fakerouterResult.status === 'ERROR') ||
        (backendResult.status === 'ERROR' && fakerouterResult.status === 'OK')) {
        return {
            status: 'ERROR',
            detail: '❌ Désaligné',
            aligned: false
        };
    }
    
    // Différence de codes logiques (ex: 403 vs OK)
    if (backendResult.statusCode !== fakerouterResult.statusCode) {
        return {
            status: 'WARNING',
            detail: '⚠️ Différence rôle/permission',
            aligned: false
        };
    }
    
    // Même statut mais détails différents
    if (backendResult.status === fakerouterResult.status) {
        return {
            status: 'OK',
            detail: '✅ Aligné (statut)',
            aligned: true
        };
    }
    
    return {
        status: 'WARNING',
        detail: '⚠️ Différence',
        aligned: false
    };
}

/**
 * Compare Backend vs FakeRouter pour tous les endpoints
 * @param {object} options - Options (apiBaseUrl, tokenMode)
 * @returns {Promise<Array>} Résultats de la comparaison
 */
export async function compareBackendVsFakeRouter(options = {}) {
    console.log('[TestRunner] Démarrage de la comparaison Backend vs FakeRouter');
    
    const comparisonResults = [];
    
    // Collecter tous les endpoints
    for (const feature of TEST_FEATURES) {
        for (const endpoint of feature.endpoints) {
            // Test backend
            const backendResult = await runSingleTest(endpoint, 'backend', options);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Test FakeRouter
            const fakerouterResult = await runSingleTest(endpoint, 'fakerouter', options);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Comparer les résultats
            const alignment = compareResults(backendResult, fakerouterResult);
            
            comparisonResults.push({
                endpoint: endpoint.path,
                method: endpoint.method,
                feature: feature.label,
                backend: backendResult.status,
                backendDetail: backendResult.detail,
                backendStatusCode: backendResult.statusCode,
                fakerouter: fakerouterResult.status,
                fakerouterDetail: fakerouterResult.detail,
                fakerouterStatusCode: fakerouterResult.statusCode,
                alignment: alignment.status,
                alignmentDetail: alignment.detail,
                aligned: alignment.aligned
            });
        }
    }
    
    return comparisonResults;
}

