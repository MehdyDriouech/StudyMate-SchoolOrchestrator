/**
 * Point d'entrée principal de l'application StudyMate School Orchestrator
 * Gère le routing multi-personas, l'état global et l'initialisation
 */

import CONFIG from './config.js';
import { isDemoSession } from './features/features-control/feature-demo-mode.js';
import { isAuthenticated, getUserRole, getDashboardRoute, getCurrentUser } from './features/features-control/feature-auth.js';
import { initTopNav } from './components/TopNav.js';
import { updateDemoBadge } from './components/DemoBadge.js';
import { setActiveSchoolId, getActiveSchoolId } from './features/features-control/store-multischool.js';
import { needsSidebar, getSidebarItems, getParentRoute } from './components/NavigationManager.js';
import { renderSidebar, removeSidebar } from './components/Sidebar.js';

// État global de l'application
export const AppState = {
  currentView: null,
  user: null,
  isDemo: false,
  ignoreNextHashChange: false // Flag pour ignorer le prochain hashchange
};

// Mapping des vues
const VIEWS = {
  auth: 'view-auth',
  'dashboard-teacher': 'view-dashboard-teacher',
  'dashboard-director': 'view-dashboard-director',
  'dashboard-student': 'view-dashboard-student',
  'dashboard-pedago': 'view-dashboard-pedago',
  curriculum: 'view-curriculum-builder',
  library: 'view-library',
  catalog: 'view-catalog-library',
  'student-catalog': 'view-student-catalog',
  quality: 'view-quality',
  annotations: 'view-workflow-annotations',
  versions: 'view-workflow-versions',
  admin: 'view-admin',
  onboarding: 'view-onboarding-tour',
  'ai-theme-studio': 'view-ai-theme-studio',
  'timeline-teacher': 'view-timeline-teacher',
  'timeline-student': 'view-timeline-student',
  'timeline-director': 'view-timeline-director',
  'timeline-pedago': 'view-timeline-pedago',
  'student-result': 'view-student-result',
  'teacher-submissions': 'view-teacher-submissions',
  training: 'view-training',
  development: 'view-development',
  // Nouvelles routes restructurées
  'student-themes': 'view-student-themes',
  'student-social': 'view-student-social',
  'teacher-content': 'view-teacher-content',
  'teacher-content/studio': 'view-ai-theme-studio',
  'teacher-content/library': 'view-library',
  'teacher-content/curriculum': 'view-curriculum-builder',
  'teacher-followup': 'view-teacher-followup',
  'teacher-followup/submissions': 'view-teacher-submissions',
  'teacher-followup/social': 'view-teacher-followup-social',
  'director-admin': 'view-director-admin',
  'director-admin/schools': 'view-director-admin-schools',
  'director-admin/classes': 'view-director-admin-classes',
  'director-admin/users': 'view-director-admin-users',
  'director-analytics': 'view-director-analytics',
  'director-analytics/school': 'view-director-analytics-school',
  'director-analytics/inter': 'view-director-analytics-inter',
  'pedago-curriculum': 'view-pedago-curriculum'
};

const VIEW_PERMISSIONS = {
  'ai-theme-studio': ['teacher', 'director', 'pedago'],
  'dashboard-pedago': ['pedago'],
  'admin': ['director', 'pedago'],
  'quality': ['teacher', 'director', 'pedago'],
  'library': ['teacher', 'director', 'pedago'],
  'student-catalog': ['student'],
  'student-themes': ['student'],
  'student-social': ['student'],
  'timeline-teacher': ['teacher'],
  'timeline-student': ['student'],
  'timeline-director': ['director'],
  'timeline-pedago': ['pedago'],
  'student-result': ['student'],
  'teacher-submissions': ['teacher'],
  'teacher-content': ['teacher'],
  'teacher-content/studio': ['teacher'],
  'teacher-content/library': ['teacher'],
  'teacher-content/curriculum': ['teacher'],
  'teacher-followup': ['teacher'],
  'teacher-followup/submissions': ['teacher'],
  'teacher-followup/social': ['teacher'],
  'director-admin': ['director'],
  'director-admin/schools': ['director'],
  'director-admin/classes': ['director'],
  'director-admin/users': ['director'],
  'director-analytics': ['director'],
  'director-analytics/school': ['director'],
  'director-analytics/inter': ['director'],
  'pedago-curriculum': ['pedago'],
  'training': ['student'],
  'development': ['teacher', 'director', 'pedago']
};

/**
 * Navigue vers une vue spécifique
 * @param {string} viewName - Nom de la vue (clé de VIEWS)
 * @param {boolean} skipAuthCheck - Si true, ignore la vérification d'authentification (pour la navigation après login)
 */
export function navigateTo(viewName, skipAuthCheck = false, queryParams = null) {
  console.log(`[Router] Navigation vers: ${viewName} (skipAuthCheck: ${skipAuthCheck})`);
  console.log(`[Router] isAuthenticated():`, isAuthenticated());
  console.log(`[Router] getUserRole():`, getUserRole());
  
  // Vérifier si on est déjà sur cette vue ou une sous-route de la même route parente
  if (AppState.currentView === viewName) {
    console.log('[Router] Déjà sur cette vue, navigation ignorée');
    return;
  }
  
  // Vérifier que la vue existe (ou est une route parent/child)
  const viewKey = VIEWS[viewName] ? viewName : (viewName.includes('/') ? getParentRoute(viewName) : null);
  if (!VIEWS[viewName] && !viewKey) {
    console.error(`[Router] Vue inconnue: ${viewName}`);
    return;
  }
  
  // Vérifier l'authentification (sauf pour la vue auth et si skipAuthCheck est true)
  if (!skipAuthCheck && viewName !== 'auth' && !isAuthenticated()) {
    console.warn('[Router] Non authentifié, redirection vers auth');
    navigateTo('auth');
    return;
  }

  // Vérifier les permissions spécifiques
  const allowedRoles = VIEW_PERMISSIONS[viewName];
  if (allowedRoles) {
    const userRole = getUserRole();
    if (!userRole || !allowedRoles.includes(userRole)) {
      console.warn('[Router] Accès refusé pour la vue', viewName);
      const fallback = userRole ? getDashboardRoute(userRole) : 'auth';
      navigateTo(fallback);
      return;
    }
  }
  
  // Mettre à jour l'état
  AppState.currentView = viewName;
  
  // Construire le hash avec les paramètres de requête si fournis
  let hash = viewName;
  if (queryParams && typeof queryParams === 'object') {
    const params = new URLSearchParams();
    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] !== null && queryParams[key] !== undefined) {
        params.append(key, queryParams[key]);
      }
    });
    const queryString = params.toString();
    if (queryString) {
      hash = `${viewName}?${queryString}`;
    }
  }
  
  // Rendre la vue immédiatement (avant de mettre à jour le hash pour éviter les conflits)
  renderView(viewName);
  
  // Mettre à jour le hash (pour l'historique navigateur)
  // Ne mettre à jour le hash que si nécessaire pour éviter de déclencher hashchange inutilement
  const currentHash = window.location.hash.slice(1);
  if (currentHash !== hash) {
    // Utiliser replaceState pour éviter d'ajouter une entrée dans l'historique
    // et pour éviter de déclencher hashchange (mais ça ne fonctionne pas avec hash)
    // On va plutôt utiliser un flag pour ignorer le prochain hashchange
    AppState.ignoreNextHashChange = true;
    window.location.hash = hash;
  }
  
  // Mettre à jour la navigation active
  updateActiveNav(viewName);
}

/**
 * Rend la vue dans le conteneur principal
 * @param {string} viewName - Nom de la vue
 */
function renderView(viewName) {
  const appRoot = document.getElementById('app-root');
  if (!appRoot) {
    console.error('[Router] Conteneur app-root introuvable');
    return;
  }
  
  // Nettoyer le conteneur
  appRoot.innerHTML = '';
  
  const userRole = getUserRole();
  
  // Si on clique sur une route parente alors qu'on est déjà sur une sous-route de cette famille,
  // utiliser la sous-route actuelle pour le rendu
  let actualViewName = viewName;
  if (!viewName.includes('/') && AppState.currentView && AppState.currentView.includes('/')) {
    const currentParent = AppState.currentView.split('/')[0];
    if (currentParent === viewName) {
      // On est déjà sur une sous-route de cette route parente, utiliser la sous-route actuelle
      actualViewName = AppState.currentView;
      console.log('[Router] Utilisation de la sous-route actuelle:', actualViewName);
    }
  }
  
  // Déterminer si cette route (ou la sous-route actuelle) nécessite une sidebar
  const needsSidebarForRoute = userRole && needsSidebar(userRole, actualViewName);
  const parentRoute = needsSidebarForRoute ? getParentRoute(actualViewName) : null;
  const sidebarItems = needsSidebarForRoute ? getSidebarItems(userRole, parentRoute) : null;
  
  // Déterminer la vue réelle à rendre (peut être une sous-route)
  let viewId = VIEWS[actualViewName];
  
  // Si la route contient un /, c'est une sous-route
  if (actualViewName.includes('/')) {
    // Utiliser la vue correspondant à la sous-route si elle existe
    viewId = VIEWS[actualViewName] || VIEWS[parentRoute] || `view-${actualViewName.replace(/\//g, '-')}`;
  } else if (!viewId) {
    viewId = `view-${actualViewName.replace(/\//g, '-')}`;
  }
  
  // Si la route nécessite une sidebar mais n'a pas de sous-route, rediriger vers la première sous-route
  if (needsSidebarForRoute && sidebarItems && !actualViewName.includes('/')) {
    const firstSubRoute = sidebarItems[0]?.route;
    if (firstSubRoute) {
      // Mettre à jour l'état AVANT de changer le hash pour éviter la boucle
      AppState.currentView = firstSubRoute;
      AppState.ignoreNextHashChange = true;
      window.location.hash = firstSubRoute;
      // Ne pas rendre ici, le hashchange va déclencher le rendu
      return;
    }
  }
  
  // Créer le layout avec sidebar si nécessaire
  if (needsSidebarForRoute && sidebarItems) {
    const layout = document.createElement('div');
    layout.className = 'view-layout-with-sidebar';
    layout.style.cssText = 'display: flex; height: 100%; min-height: calc(100vh - 200px); position: relative;';
    
    // Calculer la hauteur du header
    const header = document.querySelector('.app-header');
    const headerHeight = header ? header.offsetHeight : 70;
    
    // Créer le conteneur sidebar (positionné à gauche, sous le header)
    const sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'sidebar-container';
    sidebarContainer.className = 'sidebar-container';
    sidebarContainer.style.cssText = `position: fixed; left: 0; top: ${headerHeight}px; bottom: 0; width: 240px; z-index: 99;`;
    
    // Créer le conteneur de la vue (avec marge pour la sidebar)
    const viewContainer = document.createElement('div');
    viewContainer.id = viewId;
    viewContainer.className = 'view-container';
    viewContainer.style.cssText = `flex: 1; overflow-y: auto; margin-left: 240px; min-height: calc(100vh - ${headerHeight}px);`;
    
    layout.appendChild(sidebarContainer);
    layout.appendChild(viewContainer);
    appRoot.appendChild(layout);
    
    // Rendre la sidebar (utiliser actualViewName pour l'item actif)
    renderSidebar(sidebarContainer, sidebarItems, actualViewName, parentRoute);
    
    // Rendre la vue (utiliser actualViewName pour le rendu)
    renderViewContent(viewContainer, actualViewName, viewId);
  } else {
    // Pas de sidebar, rendu classique
    const viewContainer = document.createElement('div');
    viewContainer.id = viewId;
    viewContainer.className = 'view-container';
    appRoot.appendChild(viewContainer);
    
    renderViewContent(viewContainer, viewName, viewId);
  }
}

/**
 * Rend le contenu d'une vue
 * @param {HTMLElement} viewContainer - Conteneur de la vue
 * @param {string} viewName - Nom de la route
 * @param {string} viewId - ID de la vue
 */
function renderViewContent(viewContainer, viewName, viewId) {
  // Appeler la fonction de rendu de la vue
  try {
    // Pour les routes parent/child, essayer d'abord la route exacte, puis la route parente
    let renderFunctionName = getRenderFunctionName(viewName);
    let renderFunction = window[renderFunctionName];
    
    // Si la fonction n'existe pas et que c'est une sous-route, essayer la route parente
    if (typeof renderFunction !== 'function' && viewName.includes('/')) {
      const parentRoute = getParentRoute(viewName);
      renderFunctionName = getRenderFunctionName(parentRoute);
      renderFunction = window[renderFunctionName];
    }
    
    if (typeof renderFunction === 'function') {
      // Gérer les fonctions async
      const result = renderFunction(viewContainer, viewName);
      if (result instanceof Promise) {
        result.catch(error => {
          console.error(`[Router] Erreur dans la fonction async ${renderFunctionName}:`, error);
          viewContainer.innerHTML = `
            <div class="card" style="margin: 24px auto; max-width: 600px; text-align: center;">
              <h2>❌ Erreur de chargement</h2>
              <p style="color: var(--danger); margin-top: 12px;">
                ${error.message || 'Erreur lors du chargement de la vue'}
              </p>
            </div>
          `;
        });
      }
    } else {
      console.warn(`[Router] Fonction de rendu non trouvée pour: ${viewName}`);
      viewContainer.innerHTML = `
        <div class="card" style="margin: 24px auto; max-width: 600px; text-align: center;">
          <h2>🚧 Vue "${viewName}" en construction</h2>
          <p style="color: var(--muted); margin-top: 12px;">
            Cette fonctionnalité sera disponible prochainement.
          </p>
        </div>
      `;
    }
  } catch (error) {
    console.error(`[Router] Erreur lors du rendu de ${viewName}:`, error);
    viewContainer.innerHTML = `
      <div class="card" style="margin: 24px auto; max-width: 600px; text-align: center;">
        <h2>❌ Erreur de chargement</h2>
        <p style="color: var(--danger); margin-top: 12px;">
          ${error.message}
        </p>
      </div>
    `;
  }
}

/**
 * Met à jour l'état actif de la navigation
 * @param {string} viewName - Nom de la vue active
 */
function updateActiveNav(viewName) {
  const navButtons = document.querySelectorAll('#top-nav .btn');
  navButtons.forEach(btn => {
    if (btn.dataset.view === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Capitalise la première lettre d'une chaîne
 * @param {string} str - Chaîne à capitaliser
 * @returns {string}
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Construit le nom de la fonction de rendu attendue pour une vue
 * @param {string} viewName
 * @returns {string}
 */
function getRenderFunctionName(viewName) {
  // Gérer les routes avec slashes (ex: 'teacher-content/studio' -> 'teacherContentStudio')
  const normalized = viewName.replace(/\//g, '-');
  const pascalCase = normalized
    .split('-')
    .map(segment => capitalize(segment))
    .join('');
  return `render${pascalCase}View`;
}

/**
 * Initialise l'application
 */
function initApp() {
  console.log(`[App] Initialisation de ${CONFIG.APP_NAME} v${CONFIG.APP_VERSION}`);
  
  // Vérifier si une session démo est active
  AppState.isDemo = isDemoSession();
  
  // Initialiser la navigation
  initTopNav();
  
  // Mettre à jour le badge démo
  updateDemoBadge();
  
  // Gérer le routing depuis l'URL
  const handleHashChange = () => {
    // Ignorer le hashchange si on vient de le déclencher programmatiquement
    if (AppState.ignoreNextHashChange) {
      AppState.ignoreNextHashChange = false;
      console.log('[Router] Hashchange ignoré (déclenché programmatiquement)');
      return;
    }
    
    const hash = window.location.hash.slice(1); // Enlever le #
    
    // Extraire le nom de la vue (avant le ?)
    const viewName = hash.split('?')[0];
    
    // Si on est déjà sur cette vue, ne rien faire
    if (AppState.currentView === viewName) {
      console.log('[Router] Déjà sur la vue', viewName);
      return;
    }
    
    // Vérifier si on est sur une sous-route de la même route parente
    // Si on clique sur la route parente alors qu'on est déjà sur une sous-route, rendre la vue actuelle
    if (AppState.currentView && AppState.currentView.includes('/')) {
      const currentParent = AppState.currentView.split('/')[0];
      if (currentParent === viewName) {
        // On est déjà sur une sous-route de cette route parente
        // Rendre la vue actuelle (renderView utilisera AppState.currentView pour détecter la sous-route)
        console.log('[Router] Déjà sur une sous-route de', viewName, '- rendu de la vue actuelle', AppState.currentView);
        // Ne pas mettre à jour AppState.currentView, garder la sous-route actuelle
        renderView(viewName);
        return;
      }
    }
    
    // Si l'utilisateur est authentifié mais qu'on essaie d'aller sur auth, rediriger vers le dashboard
    if (viewName === 'auth' && isAuthenticated()) {
      console.log('[Router] Utilisateur authentifié, redirection depuis auth vers dashboard');
      const userRole = getUserRole();
      if (userRole) {
        const dashboardRoute = getDashboardRoute(userRole);
        navigateTo(dashboardRoute, true);
      }
      return;
    }
    
    // Mettre à jour TopNav si l'utilisateur est authentifié
    if (isAuthenticated()) {
      initTopNav();
    }
    
    if (viewName && VIEWS[viewName]) {
      // Extraire les paramètres de requête si présents
      const queryString = hash.includes('?') ? hash.split('?')[1] : null;
      const queryParams = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : null;
      navigateTo(viewName, false, queryParams);
    } else if (!viewName && isAuthenticated()) {
      // Pas de hash mais utilisateur authentifié, rediriger vers le dashboard
      const userRole = getUserRole();
      if (userRole) {
        const dashboardRoute = getDashboardRoute(userRole);
        navigateTo(dashboardRoute, true);
      }
    } else if (!hash && !isAuthenticated()) {
      // Pas de hash et pas authentifié, aller vers auth
      navigateTo('auth');
    }
  };
  
  window.addEventListener('hashchange', handleHashChange);
  
  // Déterminer la vue initiale
  const initialHash = window.location.hash.slice(1);
  const initialViewName = initialHash.split('?')[0];
  const initialQueryString = initialHash.includes('?') ? initialHash.split('?')[1] : null;
  const initialQueryParams = initialQueryString ? Object.fromEntries(new URLSearchParams(initialQueryString)) : null;
  
  // Vérifier si l'utilisateur est authentifié
  const authenticated = isAuthenticated();
  const userRole = getUserRole();
  
  if (authenticated && userRole) {
    // Utilisateur authentifié
    console.log('[App] Utilisateur authentifié -', userRole);
    
    // Initialiser l'établissement actif selon le schoolId de l'utilisateur
    const currentUser = getCurrentUser();
    if (currentUser?.schoolId) {
      const storedSchoolId = getActiveSchoolId();
      if (storedSchoolId !== currentUser.schoolId) {
        setActiveSchoolId(currentUser.schoolId);
      }
    }
    
    if (initialViewName && VIEWS[initialViewName]) {
      // Hash présent dans l'URL, naviguer vers cette vue avec les paramètres
      navigateTo(initialViewName, false, initialQueryParams);
    } else {
      // Pas de hash, rediriger vers le dashboard approprié
      const dashboardRoute = getDashboardRoute(userRole);
      navigateTo(dashboardRoute);
    }
  } else {
    // Pas d'authentification, afficher l'écran d'auth
    console.log('[App] Pas d\'authentification, affichage de l\'écran de connexion');
    navigateTo('auth');
  }
  
  // Écouter les changements d'établissement pour recharger la vue actuelle
  window.addEventListener('schoolChanged', (e) => {
    console.log('[App] Changement d\'établissement détecté:', e.detail.schoolId);
    const currentView = AppState.currentView;
    // Ne recharger que si on a déjà une vue active (pas pendant l'initialisation ou sur auth)
    if (currentView && VIEWS[currentView] && currentView !== 'auth') {
      // Recharger la vue actuelle avec les nouvelles données
      // Utiliser skipAuthCheck car on est déjà authentifié
      navigateTo(currentView, true);
    }
  });
  
  console.log('[App] ✅ Initialisation terminée');
}

// Initialiser l'app au chargement du DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Export pour utilisation externe
export default {
  navigateTo,
  AppState,
  VIEWS
};
