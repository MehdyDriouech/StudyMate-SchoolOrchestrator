/**
 * Store Activity Timeline - Gestion centralisée des événements de timeline
 * Enregistre tous les événements du système pour affichage dans les timelines par persona
 */

const ActivityTimelineStore = {
  events: [],

  /**
   * Enregistre un événement dans la timeline
   * @param {string} type - Type d'événement
   * @param {string} userId - ID de l'utilisateur
   * @param {string} role - Rôle de l'utilisateur (teacher, student, director, pedago)
   * @param {object} payload - Données supplémentaires de l'événement
   */
  logEvent(type, userId, role, payload = {}) {
    const event = {
      id: "evt_" + crypto.randomUUID(),
      type,
      userId,
      role,
      timestamp: Date.now(),
      payload
    };
    
    this.events.push(event);
    console.log('[ActivityTimelineStore] ✅ Événement enregistré:', type, 'pour', userId);
    
    return event;
  },

  /**
   * Récupère tous les événements d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Array}
   */
  getEventsForUser(userId) {
    return this.events
      .filter(e => e.userId === userId)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  /**
   * Récupère tous les événements d'un rôle
   * @param {string} role - Rôle (teacher, student, director, pedago)
   * @returns {Array}
   */
  getEventsByRole(role) {
    return this.events
      .filter(e => e.role === role)
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  /**
   * Récupère tous les événements (pour la direction)
   * @returns {Array}
   */
  getAllEvents() {
    return this.events.sort((a, b) => a.timestamp - b.timestamp);
  },

  /**
   * Récupère les événements filtrés par type
   * @param {string} type - Type d'événement
   * @returns {Array}
   */
  getEventsByType(type) {
    return this.events
      .filter(e => e.type === type)
      .sort((a, b) => a.timestamp - b.timestamp);
  }
};

export default ActivityTimelineStore;

