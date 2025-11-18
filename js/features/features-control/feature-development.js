/**
 * Feature Développement - Roadmap interne
 */

const ROADMAP_DATA = {
  in_progress: [
    {
      id: 'dev_ai_theme_enhancements',
      title: 'AI Theme Studio v2',
      description: 'Pré-remplissage contextuel et partage inter-classes.',
      owner: 'Equipe Pédago',
      eta: 'Déc. 2024'
    },
    {
      id: 'dev_quality_dashboard',
      title: 'Dashboard Qualité enrichi',
      description: 'Filtrage par matière + export CSV.',
      owner: 'Equipe Produit',
      eta: 'Jan. 2025'
    }
  ],
  upcoming: [
    {
      id: 'dev_chat',
      title: 'Chat élève ↔ professeur',
      description: 'Messagerie sécurisée avec modèles de réponses.',
      owner: 'Equipe Plateforme',
      eta: 'T1 2025'
    },
    {
      id: 'dev_collab_teacher',
      title: 'Mode collaboratif entre enseignants',
      description: 'Co-édition des curricula et devoirs.',
      owner: 'Equipe Expérience',
      eta: 'T1 2025'
    }
  ],
  ideas: [
    {
      id: 'dev_ai_simulation',
      title: 'Simulation IA avancée',
      description: 'Prévisualisation immersive des parcours IA.',
      owner: 'Lab R&D',
      eta: 'Idée'
    },
    {
      id: 'dev_api_establishments',
      title: 'API établissements',
      description: 'Connexion SSO et provisioning automatique.',
      owner: 'Equipe Plateforme',
      eta: 'Idée'
    }
  ]
};

let roadmapState = {
  in_progress: [...ROADMAP_DATA.in_progress],
  upcoming: [...ROADMAP_DATA.upcoming],
  ideas: [...ROADMAP_DATA.ideas]
};

export function getRoadmapColumns() {
  return {
    in_progress: roadmapState.in_progress.map(card => ({ ...card })),
    upcoming: roadmapState.upcoming.map(card => ({ ...card })),
    ideas: roadmapState.ideas.map(card => ({ ...card }))
  };
}

export function suggestIdea(data) {
  const newIdea = {
    id: `idea_${Date.now()}`,
    title: data.title || 'Nouvelle idée',
    description: data.description || 'Description à compléter',
    owner: data.owner || 'Communauté',
    eta: 'Suggestion'
  };
  roadmapState = {
    ...roadmapState,
    ideas: [newIdea, ...roadmapState.ideas]
  };
  return newIdea;
}

export default {
  getRoadmapColumns,
  suggestIdea
};

