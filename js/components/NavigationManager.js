/**
 * NavigationManager - Gère la structure de navigation par persona
 * Définit les top-nav items et les sidebars pour chaque rôle
 */

/**
 * Configuration de navigation par persona
 */
export const NAVIGATION_CONFIG = {
  student: {
    topNav: [
      { view: 'dashboard-student', label: '📊 Dashboard' },
      { view: 'student-themes', label: '📚 Mes Thèmes' },
      { view: 'student-social', label: '👥 Social' },
      { view: 'timeline-student', label: '📅 Historique' }
    ],
    sidebars: {} // Pas de sidebar pour l'élève
  },
  teacher: {
    topNav: [
      { view: 'dashboard-teacher', label: '📊 Dashboard' },
      { view: 'teacher-content', label: '📚 Contenus & Curriculum' },
      { view: 'teacher-followup', label: '👥 Suivi des élèves' },
      { view: 'timeline-teacher', label: '📅 Timeline' }
    ],
    sidebars: {
      'teacher-content': [
        { route: 'teacher-content/studio', label: '🎨 AI Theme Studio' },
        { route: 'teacher-content/library', label: '📚 Bibliothèque' },
        { route: 'teacher-content/curriculum', label: '📖 Curriculum Builder' }
      ],
      'teacher-followup': [
        { route: 'teacher-followup/submissions', label: '📋 Devoirs & Rendus' },
        { route: 'teacher-followup/social', label: '📊 Analytics / Social Classe' }
      ]
    }
  },
  director: {
    topNav: [
      { view: 'dashboard-director', label: '📊 Dashboard' },
      { view: 'director-admin', label: '⚙️ Administration' },
      { view: 'director-analytics', label: '📊 Analytics' },
      { view: 'timeline-director', label: '📅 Historique' }
    ],
    sidebars: {
      'director-admin': [
        { route: 'director-admin/schools', label: '🏫 Établissements' },
        { route: 'director-admin/classes', label: '👥 Classes' },
        { route: 'director-admin/users', label: '👤 Utilisateurs' }
      ],
      'director-analytics': [
        { route: 'director-analytics/school', label: '📈 Stats établissement' },
        { route: 'director-analytics/inter', label: '🔍 Comparaison inter-établissements' }
      ]
    }
  },
  pedago: {
    topNav: [
      { view: 'dashboard-pedago', label: '📊 Dashboard' },
      { view: 'quality', label: '✅ Qualité' },
      { view: 'pedago-curriculum', label: '📚 Curriculum' },
      { view: 'timeline-pedago', label: '📅 Historique' }
    ],
    sidebars: {} // Pas de sidebar pour le référent pédagogique
  }
};

/**
 * Retourne la configuration de navigation pour un rôle
 * @param {string} role - Rôle de l'utilisateur
 * @returns {object|null}
 */
export function getNavigationConfig(role) {
  return NAVIGATION_CONFIG[role] || null;
}

/**
 * Retourne les items du top-nav pour un rôle
 * @param {string} role - Rôle de l'utilisateur
 * @returns {Array}
 */
export function getTopNavItems(role) {
  const config = getNavigationConfig(role);
  return config ? config.topNav : [];
}

/**
 * Retourne les items de sidebar pour une route parente
 * @param {string} role - Rôle de l'utilisateur
 * @param {string} parentRoute - Route parente (ex: 'teacher-content')
 * @returns {Array|null}
 */
export function getSidebarItems(role, parentRoute) {
  const config = getNavigationConfig(role);
  if (!config || !config.sidebars) return null;
  return config.sidebars[parentRoute] || null;
}

/**
 * Vérifie si une route nécessite une sidebar
 * @param {string} role - Rôle de l'utilisateur
 * @param {string} route - Route actuelle
 * @returns {boolean}
 */
export function needsSidebar(role, route) {
  const config = getNavigationConfig(role);
  if (!config || !config.sidebars) return false;
  
  // Extraire la route parente (avant le /)
  const parentRoute = route.split('/')[0];
  return config.sidebars.hasOwnProperty(parentRoute);
}

/**
 * Retourne la route parente d'une route avec sous-route
 * @param {string} route - Route complète (ex: 'teacher-content/studio')
 * @returns {string} - Route parente (ex: 'teacher-content')
 */
export function getParentRoute(route) {
  return route.split('/')[0];
}

/**
 * Retourne la sous-route d'une route complète
 * @param {string} route - Route complète (ex: 'teacher-content/studio')
 * @returns {string|null} - Sous-route (ex: 'studio') ou null
 */
export function getSubRoute(route) {
  const parts = route.split('/');
  return parts.length > 1 ? parts.slice(1).join('/') : null;
}

export default {
  NAVIGATION_CONFIG,
  getNavigationConfig,
  getTopNavItems,
  getSidebarItems,
  needsSidebar,
  getParentRoute,
  getSubRoute
};

