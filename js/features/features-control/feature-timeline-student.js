/**
 * Feature Timeline Student - Logique métier pour la timeline étudiant
 */

import ActivityTimelineStore from './store-timeline.js';
import { getCurrentUser } from './feature-auth.js';
import { getThemeById } from './store-themes.js';

/**
 * Charge les données de timeline pour l'étudiant courant
 * @returns {Array}
 */
export function loadTimelineData() {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    console.warn('[Timeline Student] Aucun utilisateur connecté');
    return [];
  }
  
  // Récupérer les événements de l'utilisateur
  const events = ActivityTimelineStore.getEventsForUser(currentUser.email);
  
  // Enrichir les événements avec les informations des thèmes
  return events.map(event => {
    const enriched = { ...event };
    
    // Enrichir avec les informations du thème si disponible
    if (event.payload.themeId) {
      const theme = getThemeById(event.payload.themeId);
      if (theme) {
        enriched.payload = {
          ...enriched.payload,
          themeTitle: theme.title,
          subject: theme.subject
        };
      }
    }
    
    return enriched;
  });
}

export default {
  loadTimelineData
};

