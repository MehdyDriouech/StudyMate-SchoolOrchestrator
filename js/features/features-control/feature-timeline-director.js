/**
 * Feature Timeline Director - Logique métier pour la timeline direction
 */

import ActivityTimelineStore from './store-timeline.js';
import { getThemeById } from './store-themes.js';

/**
 * Charge toutes les données de timeline (vue consolidée)
 * @returns {Array}
 */
export function loadTimelineData() {
  // Récupérer tous les événements
  const events = ActivityTimelineStore.getAllEvents();
  
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

