# 📚 CONTEXT - StudyMate School Orchestrator

> **Fichier de contexte complet pour AI Assistant**  
> Version : 0.3.0-chartjs  
> Dernière mise à jour : Novembre 2024

---

## 🎯 Vue d'ensemble du projet

**StudyMate School Orchestrator** est une plateforme de gestion pédagogique multi-tenant destinée aux établissements scolaires (lycées). C'est une **Single Page Application (SPA)** développée en **Vanilla JavaScript** (ES Modules) sans framework ni bundler.

### Objectifs principaux
1. Permettre aux enseignants de gérer leurs cours et devoirs
2. Offrir aux directeurs une vue d'ensemble de l'établissement
3. Donner aux étudiants un espace de suivi de leur progression
4. Intégrer des workflows de validation qualité
5. Gérer un catalogue de contenus pédagogiques

### Contraintes techniques
- ✅ **Vanilla JS uniquement** (pas de React/Vue/Angular)
- ✅ **ES Modules natifs** (pas de bundler type Webpack/Vite)
- ✅ **0 dépendance NPM** (sauf Chart.js via CDN)
- ✅ **Mode démo fonctionnel** sans backend
- ✅ **Design réutilisé d'ErgoMate** (cohérence visuelle)
- ✅ **Multi-personas** (enseignant, directeur, étudiant)

---

## 🏗️ Architecture technique

### Stack technologique
```yaml
Frontend:
  - HTML5 (sémantique)
  - CSS3 (Variables natives, Grid, Flexbox)
  - JavaScript ES6+ (Modules natifs)
  - Chart.js 4.4.0 (Graphiques, via CDN uniquement)

Backend (prévu, non implémenté en MVP):
  - PHP 8.x
  - MySQL 8.x
  - Architecture REST API

Design System:
  - Font: Inter (Google Fonts)
  - Couleurs: Variables CSS (thème light/dark)
  - Components: Réutilisés d'ErgoMate PWA

Déploiement:
  - Serveur web statique (Python HTTP, Nginx, Apache)
  - Pas de build step requis
```

### Patterns architecturaux
```
┌─────────────────────────────────────┐
│         index.html                  │
│   (Point d'entrée unique)           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         app.js                      │
│   - Routing hash-based              │
│   - Initialisation                  │
│   - Gestion navigation              │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼─────┐   ┌─────▼────────┐
│ app-service│   │ TopNav       │
│ (API calls)│   │ (Navigation) │
└──────┬─────┘   └──────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│      FakeRouter                     │
│  (Simulateur API - mode démo)       │
│  Retourne des mocks JSON            │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│      Features                       │
│                                     │
│  ┌─────────────┬─────────────┐     │
│  │ feature-    │ view-       │     │
│  │ control     │ view        │     │
│  │ (logique)   │ (UI)        │     │
│  └─────────────┴─────────────┘     │
└─────────────────────────────────────┘
```

**Séparation des responsabilités** :
- **features-control/** : Logique métier, appels API, calculs
- **features-view/** : Rendu UI, interactions utilisateur, événements
- **components/** : Composants réutilisables (TopNav, DemoBadge, Charts)
- **demo/** : Simulateur d'API pour mode démo

---

## 📁 Arborescence complète du projet

```
studymate-school-orchestrator/
│
├── 📄 index.html                           # Point d'entrée HTML
├── 📖 README.md                            # Documentation complète
├── 🚀 DEMARRAGE.md                         # Guide démarrage rapide
├── 📋 ARBORESCENCE.txt                     # Structure détaillée
├── 📋 CONTEXT.md                           # Ce fichier (contexte global)
├── 📋 SYNTHESE.md                          # Synthèse MVP initial
├── 📋 RECAP-MULTI-PERSONAS.md              # Récap sprint multi-personas
├── 📋 INTEGRATION-CHART-JS.md              # Guide intégration Chart.js
├── 📋 INDEX.md                             # Index sprint Chart.js
│
├── assets/
│   └── styles.css                          # Design system ErgoMate (2060 lignes)
│
├── mock/                                   # Données mockées (mode démo)
│   ├── mock_stats_overview.json           # KPIs dashboard enseignant
│   ├── mock_assignments.json              # 8 devoirs fictifs
│   └── mock_curriculum.json               # Structure curriculum
│
└── js/
    │
    ├── 🔧 config.js                        # Configuration globale
    ├── 🚦 app.js                           # Routing + Init (167 lignes)
    ├── 📡 app-service.js                   # Abstraction API
    │
    ├── demo/
    │   └── FakeRouter.js                   # Simulateur API (~200 lignes)
    │
    ├── components/
    │   ├── DemoBadge.js                    # Badge "Mode Démo"
    │   ├── TopNav.js                       # Navigation responsive (95 lignes)
    │   └── Charts.js                       # 🆕 Utilitaires Chart.js (380 lignes)
    │
    └── features/
        │
        ├── features-view/                  # Composants UI
        │   │
        │   ├── ✅ view-auth.js                         # Écran auth (168 lignes)
        │   ├── ✅ view-dashboard-teacher.js            # Dashboard enseignant (modifié Chart.js)
        │   ├── ✅ view-dashboard-director.js           # Dashboard directeur (modifié Chart.js)
        │   ├── ✅ view-dashboard-student.js            # Dashboard étudiant (modifié Chart.js)
        │   ├── ✅ view-curriculum-builder.js           # Kanban curriculum (218 lignes)
        │   ├── 🚧 view-catalog-library.js             # Stub - Catalogue
        │   ├── 🚧 view-workflow-quality.js            # Stub - Qualité
        │   ├── 🚧 view-workflow-annotations.js        # Stub - Annotations
        │   ├── 🚧 view-workflow-versions.js           # Stub - Versions
        │   ├── 🚧 view-tenant-admin.js                # Stub - Admin
        │   └── 🚧 view-onboarding-tour.js             # Stub - Onboarding
        │
        └── features-control/               # Logique métier
            │
            ├── ✅ feature-auth.js                      # Auth multi-personas (178 lignes)
            ├── ✅ feature-demo-mode.js                 # Gestion session démo
            ├── ✅ feature-dashboard-teacher.js         # Logique dashboard enseignant
            ├── ✅ feature-dashboard-director.js        # Logique dashboard directeur (185 lignes)
            ├── ✅ feature-dashboard-student.js         # Logique dashboard étudiant (147 lignes)
            ├── ✅ feature-curriculum-builder.js        # Logique curriculum (85 lignes)
            ├── 🚧 feature-catalog-library.js          # Stub - Logique catalogue
            ├── 🚧 feature-workflow-quality.js         # Stub - Logique qualité
            ├── 🚧 feature-workflow-annotations.js     # Stub - Logique annotations
            ├── 🚧 feature-workflow-versions.js        # Stub - Logique versions
            ├── 🚧 feature-tenant-admin.js             # Stub - Logique admin
            └── 🚧 feature-onboarding-tour.js          # Stub - Logique onboarding

Légende:
✅ = Feature complète et fonctionnelle
🚧 = Stub (structure en place, implémentation future)
🆕 = Ajouté dans le dernier sprint (Chart.js)
```

**Statistiques** :
- Total fichiers : 36
- Vues implémentées : 5 complètes + 6 stubs
- Features control : 6 complètes + 6 stubs
- Composants : 3 (DemoBadge, TopNav, Charts)
- Fichiers JSON : 3
- **Lignes de code total** : ~4400 lignes
- **Dépendances externes** : 1 (Chart.js CDN uniquement)

---

## 📜 Historique des versions

### Version 0.1.0-mvp (Sprint Initial)
**Date** : Novembre 2024  
**Objectif** : MVP fonctionnel avec dashboard enseignant

**Livrables** :
- ✅ Architecture SPA complète
- ✅ Routing hash-based
- ✅ Mode démo avec FakeRouter
- ✅ Dashboard enseignant (KPIs, devoirs, matières)
- ✅ Design ErgoMate réutilisé
- ✅ 8 stubs pour features futures
- ✅ Documentation complète (README, SYNTHESE)

**Fichiers créés** : 31

---

### Version 0.2.0-multi-personas (Sprint 2)
**Date** : Novembre 2024  
**Objectif** : Support de 3 personas distincts

**Livrables** :
- ✅ Système d'authentification multi-personas
- ✅ Dashboard directeur complet (comparatifs, formulaires)
- ✅ Dashboard étudiant complet (progression, UUID social)
- ✅ Curriculum builder simplifié (Kanban 3 périodes)
- ✅ Routing étendu avec redirection selon rôle
- ✅ Navigation adaptative par persona
- ✅ Timeline d'activité pour enseignant
- ✅ Modales de formulaires (établissement, utilisateur)

**Fichiers créés** : 6  
**Fichiers modifiés** : 4  
**Lignes ajoutées** : ~1800

**Identifiants de test** :
```
Enseignant : enseignant@ecole.fr / smso01**
Directeur  : directeur@ecole.fr  / smso01**
Étudiant   : etudiant@ecole.fr   / smso01**
Mode Démo  : Clic "Découvrir la démo" (pas de login)
```

---

### Version 0.3.0-chartjs (Sprint 3 - ACTUEL)
**Date** : Novembre 2024  
**Objectif** : Intégration de Chart.js pour visualisations

**Livrables** :
- ✅ Module Charts.js (utilitaires Chart.js)
- ✅ Graphique enseignant : Bar chart horizontal (taux complétion matières)
- ✅ Graphique directeur : Bar chart groupé (comparatif 6 classes)
- ✅ Graphique étudiant : Donut chart (répartition devoirs)
- ✅ Tooltips enrichis et interactifs
- ✅ Couleurs thème ErgoMate respectées
- ✅ Responsive et performant

**Fichiers créés** : 1 (Charts.js)  
**Fichiers modifiés** : 4 (index.html + 3 dashboards)  
**Lignes ajoutées** : ~620

**Graphiques créés** :
| Dashboard | Type | Canvas ID | Données |
|-----------|------|-----------|---------|
| Enseignant | Bar horizontal | `teacher-completion-chart` | topSubjects (3) |
| Directeur | Bar groupé | `director-classes-chart` | classesComparison (6) |
| Étudiant | Donut | `student-progress-chart` | assignments (5) |

---

## 🎨 Design System (ErgoMate)

### Variables CSS principales
```css
/* Couleurs principales */
--accent: #22c55e          /* Vert - Succès / Complétion haute */
--accent-light: #86efac    /* Vert clair */
--danger: #ef4444          /* Rouge - Danger / Retard */
--danger-light: #fca5a5    /* Rouge clair */
--warning: #f59e0b         /* Orange - Attention */
--info: #3b82f6            /* Bleu - Info */
--muted: #64748b           /* Gris - Texte secondaire */
--fg: #0f172a              /* Noir - Texte principal */

/* Fond et cartes */
--bg: linear-gradient(...)  /* Dégradé de fond */
--card: #ffffff             /* Fond carte */
--card-hover: #fefefe       /* Hover carte */
--card-border: #e2e8f0      /* Bordure carte */

/* Boutons */
--btn-bg: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)
--btn-bg-hover: linear-gradient(135deg, #0284c7 0%, #0891b2 100%)
--btn-ghost: #f1f5f9        /* Bouton ghost */

/* Espacements */
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-full: 9999px

/* Transitions */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Classes utilitaires disponibles
```css
.btn              /* Bouton de base */
.btn.primary      /* Bouton primaire */
.btn.ghost        /* Bouton transparent */
.card             /* Carte avec shadow */
.badge            /* Badge coloré */
.badge.danger     /* Badge rouge */
.badge.warning    /* Badge orange */
.form-input       /* Input de formulaire */
```

---

## 👥 Personas & Parcours utilisateurs

### 👨‍🏫 Persona Enseignant

**Objectif** : Gérer mes cours et suivre la progression de mes élèves

**Navigation** :
- 📊 Dashboard (KPIs, devoirs urgents, graphique complétion)
- 📚 Curriculum (Kanban 3 périodes, 6 séquences)
- 🗂️ Catalogue (stub)
- ✅ Qualité (stub)
- 🚪 Déconnexion

**Features disponibles** :
- Vue d'ensemble : 245 élèves, 8 classes, 23 devoirs en cours
- Devoirs urgents : Filtre automatique (échéance < 3 jours)
- Top 3 matières avec taux de complétion
- Liste de tous les devoirs avec statuts
- **🆕 Graphique** : Bar chart horizontal - Taux de complétion par matière (3 matières)
- Timeline d'activité récente (4 événements)
- Notification : "2 devoirs arrivent à échéance dans 3 jours"

**Données mockées** :
- 8 devoirs (5 actifs, 2 terminés, 1 brouillon)
- 3 matières (Maths, Philo, Histoire-Géo)
- Taux de complétion : 78.5% moyen

---

### 👔 Persona Directeur

**Objectif** : Piloter l'établissement et suivre la performance globale

**Navigation** :
- 📊 Dashboard (comparatifs, performance, graphiques)
- ⚙️ Administration (stub)
- ✅ Qualité (stub)
- 🗂️ Catalogue (stub)
- 🚪 Déconnexion

**Features disponibles** :
- KPIs : 6 classes, 5 enseignants, 52.8% complétion, 11 validations
- Tableau comparatif classes (6 lignes avec taux, retards, moyennes)
- Tableau performance enseignants (5 lignes avec métriques)
- **🆕 Graphique** : Bar chart groupé - Comparatif 6 classes (complétion % + séquences en retard)
- Timeline macro (4 événements établissement)
- Bouton "Ajouter établissement" (modale avec formulaire)
- Bouton "Ajouter utilisateur" (modale avec formulaire)

**Données mockées** :
- 6 classes : Term S1, Term L, Prem ES2, Prem S3, Seconde 4, Seconde 1
- 5 enseignants avec métriques de performance
- 2 établissements existants, 3 utilisateurs

---

### 🎓 Persona Étudiant

**Objectif** : Suivre ma progression et gérer mes devoirs

**Navigation** :
- 📊 Mon espace (statistiques, progression, devoirs)
- 🗂️ Contenus (stub)
- 🚪 Déconnexion

**Features disponibles** :
- 4 statistiques : Devoirs (12/17), Moyenne (14.2/20), Classement (Top 20%), Série (5 jours)
- Barre de progression globale : 70%
- **🆕 Graphique** : Donut chart - Répartition devoirs (1 terminé, 1 en cours, 3 à faire)
- Section UUID Social :
  - Génération UUID avec crypto.randomUUID() + fallback
  - Copie dans presse-papier
  - Stockage localStorage (`SM_SO_SOCIAL_UUID`)
- Liste devoirs à faire (4 cartes avec priorités colorées)
- Liste devoirs terminés (1 carte avec note 15/20)
- Message encouragement : "Continue comme ça ! Tu es dans le Top 20%"

**Données mockées** :
- 5 devoirs : 1 terminé (note 15/20), 2 todo, 1 in_progress, 1 futur
- Progression : 70% (12/17 devoirs complétés)

---

## 📊 Données mockées (Mode démo)

### mock_stats_overview.json
```json
{
  "kpis": {
    "totalStudents": 245,
    "totalClasses": 8,
    "activeAssignments": 23,
    "completionRate": 78.5,
    "averageGrade": 13.2
  },
  "topSubjects": [
    {
      "name": "Mathématiques",
      "assignmentsCount": 8,
      "avgCompletion": 82.3
    },
    {
      "name": "Philosophie",
      "assignmentsCount": 7,
      "avgCompletion": 71.5
    },
    {
      "name": "Histoire-Géographie",
      "assignmentsCount": 8,
      "avgCompletion": 80.1
    }
  ],
  "recentActivity": [...]
}
```

### mock_assignments.json
```json
[
  {
    "id": "assign-001",
    "title": "DM - Suites numériques",
    "subject": "Mathématiques",
    "class": "Terminale S1",
    "dueDate": "2024-11-25",
    "status": "active",
    "submittedCount": 18,
    "totalStudents": 28,
    "avgGrade": 12.5
  },
  // ... 7 autres devoirs
]
```

### Données dashboard directeur (hardcodées)
```javascript
const MOCK_CLASSES = [
  {
    className: "Terminale S1",
    completionRate: 85.2,
    sequencesLate: 0,
    avgGrade: 14.5,
    teacher: "M. Dupont"
  },
  // ... 5 autres classes
];

const MOCK_TEACHERS = [
  {
    name: "M. Dupont",
    classesCount: 2,
    avgCompletion: 82.5,
    pendingValidations: 3,
    avgResponseTime: "2.5h"
  },
  // ... 4 autres enseignants
];
```

### Données dashboard étudiant (hardcodées)
```javascript
const MOCK_STUDENT_ASSIGNMENTS = [
  {
    id: "1",
    title: "DM - Suites numériques",
    subject: "Mathématiques",
    status: "completed",
    dueDate: "2024-11-15",
    priority: "high",
    grade: 15
  },
  // ... 4 autres devoirs
];

const MOCK_STUDENT_STATS = {
  assignmentsCompleted: 12,
  assignmentsTotal: 17,
  avgGrade: 14.2,
  classRanking: "Top 20%",
  currentStreak: 5
};
```

---

## 🔐 Système d'authentification

### Base d'utilisateurs (hardcodée)
```javascript
const USERS = [
  {
    email: "enseignant@ecole.fr",
    password: "smso01**",
    role: "teacher",
    name: "Jean Dupont"
  },
  {
    email: "directeur@ecole.fr",
    password: "smso01**",
    role: "director",
    name: "Marie Martin"
  },
  {
    email: "etudiant@ecole.fr",
    password: "smso01**",
    role: "student",
    name: "Lucas Petit"
  }
];
```

### Flow d'authentification
```
1. Chargement index.html
2. app.js vérifie localStorage
3. Si pas de session → view-auth.js
4. Utilisateur saisit email/password OU clique "Découvrir la démo"
5. feature-auth.js valide les credentials
6. Stockage dans localStorage :
   - SM_SO_USER_ROLE
   - SM_SO_USER_EMAIL
   - (STUDYMATE_DEMO_SESSION si mode démo)
7. Redirection vers dashboard selon rôle :
   - teacher → /#dashboard-teacher
   - director → /#dashboard-director
   - student → /#dashboard-student
8. TopNav.js adapte la navigation selon le rôle
```

### localStorage Keys utilisées
```javascript
// Authentification
SM_SO_USER_ROLE        // "teacher" | "director" | "student"
SM_SO_USER_EMAIL       // Email de l'utilisateur
STUDYMATE_DEMO_SESSION // "true" si mode démo

// Étudiant uniquement
SM_SO_SOCIAL_UUID      // UUID social généré (crypto.randomUUID)
```

---

## 🔄 Routing & Navigation

### Routes disponibles
```javascript
const VIEWS = {
  auth: 'view-auth',
  dashboardTeacher: 'view-dashboard-teacher',
  dashboardDirector: 'view-dashboard-director',
  dashboardStudent: 'view-dashboard-student',
  curriculum: 'view-curriculum-builder',
  catalog: 'view-catalog-library',
  quality: 'view-workflow-quality',
  annotations: 'view-workflow-annotations',
  versions: 'view-workflow-versions',
  admin: 'view-tenant-admin',
  onboarding: 'view-onboarding-tour'
};
```

### Mapping route → vue
```javascript
const ROUTE_MAP = {
  'auth': VIEWS.auth,
  'dashboard-teacher': VIEWS.dashboardTeacher,
  'dashboard-director': VIEWS.dashboardDirector,
  'dashboard-student': VIEWS.dashboardStudent,
  'curriculum': VIEWS.curriculum,
  'catalog': VIEWS.catalog,
  'quality': VIEWS.quality,
  'annotations': VIEWS.annotations,
  'versions': VIEWS.versions,
  'admin': VIEWS.admin,
  'onboarding': VIEWS.onboarding
};
```

### Navigation par rôle
```javascript
// Enseignant
const teacherNav = [
  { label: '📊 Dashboard', route: 'dashboard-teacher' },
  { label: '📚 Curriculum', route: 'curriculum' },
  { label: '🗂️ Catalogue', route: 'catalog' },
  { label: '✅ Qualité', route: 'quality' }
];

// Directeur
const directorNav = [
  { label: '📊 Dashboard', route: 'dashboard-director' },
  { label: '⚙️ Administration', route: 'admin' },
  { label: '✅ Qualité', route: 'quality' },
  { label: '🗂️ Catalogue', route: 'catalog' }
];

// Étudiant
const studentNav = [
  { label: '📊 Mon espace', route: 'dashboard-student' },
  { label: '🗂️ Contenus', route: 'catalog' }
];
```

---

## 📈 Graphiques Chart.js

### Configuration globale
```javascript
// CDN utilisé
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

// Accessibilité
window.Chart // Disponible globalement

// Module utilitaire
import { createBarChart, createLineChart, createDonutChart } from './components/Charts.js';
```

### Fonctions disponibles dans Charts.js

#### 1. createBarChart(canvas, labels, datasets, options)
```javascript
// Bar chart vertical ou horizontal
createBarChart(
  canvas,                          // HTMLCanvasElement
  ['Math', 'Philo', 'H-G'],       // Labels
  [{
    label: 'Taux de complétion',
    data: [82.3, 71.5, 80.1],
    backgroundColor: '#22c55e'
  }],
  {
    horizontal: true,               // true = horizontal
    plugins: { legend: { display: false } }
  }
);
```

#### 2. createLineChart(canvas, labels, datasets, options)
```javascript
// Line chart avec courbes lisses
createLineChart(
  canvas,
  ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
  [{
    label: 'Progression',
    data: [65, 70, 72, 78, 80],
    borderColor: '#22c55e',
    tension: 0.4                    // Courbe lisse
  }]
);
```

#### 3. createDonutChart(canvas, labels, data, options)
```javascript
// Donut chart
createDonutChart(
  canvas,
  ['Terminés', 'En cours', 'À faire'],
  [1, 1, 3],
  {
    colors: ['#22c55e', '#f59e0b', '#3b82f6'],
    cutout: '65%'                   // Taille du trou central
  }
);
```

#### 4. createCompletionBarChart(canvas, subjects)
```javascript
// Helper spécialisé avec couleurs conditionnelles
createCompletionBarChart(
  canvas,
  [
    { name: 'Math', avgCompletion: 82.3 },
    { name: 'Philo', avgCompletion: 71.5 }
  ]
);
// Couleurs automatiques selon performance :
// ≥80% : Vert, 60-79% : Bleu, 40-59% : Orange, <40% : Rouge
```

#### 5. destroyChart(chartInstance)
```javascript
// Détruit proprement un graphique
if (myChart) {
  destroyChart(myChart);
  myChart = null;
}
```

#### 6. getThemeColors()
```javascript
// Récupère les couleurs du thème ErgoMate
const colors = getThemeColors();
// Retourne : { accent, danger, warning, info, muted, fg, cardBorder }
```

### Initialisation typique d'un graphique
```javascript
// 1. Déclarer une variable de référence
let myChart = null;

// 2. Créer la fonction d'initialisation
function initMyChart() {
  // Détruire l'ancien graphique si existant
  if (myChart) {
    destroyChart(myChart);
    myChart = null;
  }
  
  // Récupérer le canvas
  const canvas = document.getElementById('my-chart');
  if (!canvas || !dashboardData) return;
  
  // Créer le nouveau graphique
  myChart = createBarChart(
    canvas,
    ['Label 1', 'Label 2'],
    [{ label: 'Dataset', data: [10, 20] }]
  );
  
  console.log('✅ Graphique initialisé');
}

// 3. Appeler après le rendu du DOM
requestAnimationFrame(() => {
  initMyChart();
});
```

---

## 🚀 Guide de développement

### Démarrage local
```bash
# Cloner le projet
git clone [repo-url]
cd studymate-school-orchestrator

# Lancer un serveur HTTP
python3 -m http.server 8080

# Ouvrir dans le navigateur
http://localhost:8080
```

### Ajouter une nouvelle vue

**Étape 1 : Créer les fichiers**
```bash
# Créer la vue
touch js/features/features-view/view-ma-nouvelle-feature.js

# Créer la logique
touch js/features/features-control/feature-ma-nouvelle-feature.js
```

**Étape 2 : Structure de base de la vue**
```javascript
// js/features/features-view/view-ma-nouvelle-feature.js

import { loadData } from '../features-control/feature-ma-nouvelle-feature.js';

let data = null;

export async function renderMaNouvelleFeatureView(container) {
  console.log('[View Ma Feature] Rendu de la vue');
  
  // Loader
  container.innerHTML = `<div>Chargement...</div>`;
  
  try {
    // Charger les données
    data = await loadData();
    
    // Rendre le contenu
    renderContent(container);
  } catch (error) {
    console.error('[View Ma Feature] Erreur:', error);
    container.innerHTML = `<div class="card">Erreur: ${error.message}</div>`;
  }
}

function renderContent(container) {
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
      <h1>Ma Nouvelle Feature</h1>
      <div class="card">
        <!-- Contenu ici -->
      </div>
    </div>
  `;
}

// Export global pour app.js
window.renderMaNouvelleFeatureView = renderMaNouvelleFeatureView;
export default { renderMaNouvelleFeatureView };
```

**Étape 3 : Structure de base de la logique**
```javascript
// js/features/features-control/feature-ma-nouvelle-feature.js

import api from '../../app-service.js';

export async function loadData() {
  console.log('[Feature Ma Feature] Chargement des données');
  
  try {
    const response = await api.get('/mon-endpoint');
    return response;
  } catch (error) {
    console.error('[Feature Ma Feature] Erreur chargement:', error);
    throw error;
  }
}

export function calculateSomething(data) {
  // Logique métier ici
  return result;
}

export default {
  loadData,
  calculateSomething
};
```

**Étape 4 : Ajouter la route dans app.js**
```javascript
// Dans js/app.js

const VIEWS = {
  // ... vues existantes
  maNouvelleFeature: 'view-ma-nouvelle-feature'
};

const ROUTE_MAP = {
  // ... routes existantes
  'ma-nouvelle-feature': VIEWS.maNouvelleFeature
};
```

**Étape 5 : Ajouter dans index.html**
```html
<!-- Features - Views -->
<script type="module" src="js/features/features-view/view-ma-nouvelle-feature.js"></script>

<!-- Features - Control -->
<script type="module" src="js/features/features-control/feature-ma-nouvelle-feature.js"></script>
```

**Étape 6 : Ajouter dans TopNav.js (si nécessaire)**
```javascript
// Dans js/components/TopNav.js

const teacherNav = [
  // ... navigation existante
  { label: '🆕 Ma Feature', route: 'ma-nouvelle-feature' }
];
```

---

### Ajouter un mock dans FakeRouter

**Dans js/demo/FakeRouter.js** :
```javascript
// 1. Définir la constante mock
const MOCK_MA_NOUVELLE_FEATURE = {
  data: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ],
  total: 2
};

// 2. Ajouter la route dans routeRequest()
function routeRequest(method, url) {
  // ... routes existantes
  
  if (url === '/api/mon-endpoint') {
    return MOCK_MA_NOUVELLE_FEATURE;
  }
  
  // ...
}
```

---

### Ajouter un graphique Chart.js

**Étape 1 : Ajouter le canvas dans la vue**
```javascript
// Dans renderContent()
container.innerHTML = `
  <div class="card">
    <h2>Mon Graphique</h2>
    <div style="position: relative; height: 300px;">
      <canvas id="mon-graphique"></canvas>
    </div>
  </div>
`;

// Initialiser après le rendu
requestAnimationFrame(() => {
  initMonGraphique();
});
```

**Étape 2 : Créer la fonction d'initialisation**
```javascript
import { createBarChart, destroyChart } from '../components/Charts.js';

let monChart = null;

function initMonGraphique() {
  if (monChart) {
    destroyChart(monChart);
    monChart = null;
  }
  
  const canvas = document.getElementById('mon-graphique');
  if (!canvas || !data) return;
  
  monChart = createBarChart(
    canvas,
    ['Label A', 'Label B', 'Label C'],
    [{
      label: 'Mon Dataset',
      data: [10, 20, 30]
    }]
  );
  
  console.log('✅ Graphique initialisé');
}
```

---

### Bonnes pratiques

#### Console logs
```javascript
// Toujours préfixer avec le module
console.log('[View Dashboard] Rendu de la vue');
console.error('[Feature Auth] Erreur de connexion:', error);
console.warn('[Charts] Canvas non trouvé');
```

#### Gestion d'erreurs
```javascript
try {
  const data = await api.get('/endpoint');
  return data;
} catch (error) {
  console.error('[Module] Erreur:', error);
  throw error; // Remonter l'erreur pour le catch parent
}
```

#### Nommage
```javascript
// Fonctions render*View pour les vues
export function renderDashboardView(container) { }

// Fonctions load* pour charger des données
export async function loadDashboardData() { }

// Fonctions calculate* pour les calculs
export function calculateCompletionRate(submitted, total) { }

// Fonctions format* pour le formatage
export function formatDate(date) { }
```

#### Lifecycle des graphiques
```javascript
// TOUJOURS détruire avant de recréer
if (chartInstance) {
  destroyChart(chartInstance);
  chartInstance = null;
}

// TOUJOURS vérifier que le canvas existe
const canvas = document.getElementById('chart-id');
if (!canvas) {
  console.warn('Canvas non trouvé');
  return;
}

// TOUJOURS utiliser requestAnimationFrame
requestAnimationFrame(() => {
  initChart();
});
```

---

## 🎯 Roadmap & Priorités

### ✅ Fait (v0.1.0 → v0.3.0)
- [x] Architecture SPA complète
- [x] Mode démo avec FakeRouter
- [x] Dashboard enseignant complet
- [x] Système multi-personas (3 rôles)
- [x] Dashboard directeur complet
- [x] Dashboard étudiant complet
- [x] Curriculum builder simplifié
- [x] Intégration Chart.js (3 graphiques)
- [x] Navigation adaptative par rôle
- [x] Design responsive mobile

### 🔜 Prochains sprints suggérés

#### Sprint 4 : Curriculum Builder avancé
- [ ] Formulaire création/édition de séquence
- [ ] Drag & drop avec SortableJS
- [ ] Gestion des compétences par séquence
- [ ] Duplication de séquences
- [ ] Export PDF du curriculum

#### Sprint 5 : Catalogue de contenus
- [ ] Grille de contenus avec filtres
- [ ] Barre de recherche multi-critères
- [ ] Modal de prévisualisation (markdown, vidéo, PDF)
- [ ] Import de contenu dans curriculum
- [ ] Tags et catégorisation

#### Sprint 6 : Workflow qualité
- [ ] Liste des contenus en attente de validation
- [ ] Checklist de critères qualité
- [ ] Actions : Approuver / Rejeter / Commenter
- [ ] Historique des validations
- [ ] Notifications temps réel

#### Sprint 7 : Backend PHP
- [ ] API REST en PHP 8
- [ ] Authentification JWT
- [ ] Base MySQL avec migrations
- [ ] Architecture multi-tenant
- [ ] Upload de fichiers (S3/local)

#### Sprint 8 : Features avancées
- [ ] Graphiques temps réel (évolution 30 jours)
- [ ] Export PDF/Excel des rapports
- [ ] Système de notifications
- [ ] Mode hors ligne (Service Worker)
- [ ] Tests unitaires (Vitest)

---

## ⚠️ Points d'attention & Limitations

### Sécurité (Mode Démo)
- ⚠️ **Pas d'authentification réelle** - Mots de passe en clair
- ⚠️ **Données en localStorage** - Accessible via DevTools
- ⚠️ **Pas de validation serveur** - Tout est côté client
- ⚠️ **Pas de protection CSRF/XSS** - Mode démo uniquement

**Pour la production** :
- Implémenter JWT avec refresh tokens
- Chiffrer les données sensibles
- Valider côté serveur
- Ajouter CORS, CSP, HSTS

### Performance
- ⚠️ **Pas de pagination** - Tous les devoirs chargés en mémoire
- ⚠️ **Pas de cache API** - Rechargement complet à chaque navigation
- ⚠️ **Pas de lazy loading** - Tous les modules chargés au démarrage
- ⚠️ **Graphiques recréés** - Pas de mise à jour incrémentale

**Optimisations futures** :
- Implémenter pagination (limit/offset)
- Cache API avec invalidation intelligente
- Lazy load des modules non critiques
- Update des graphiques au lieu de recréer

### Browser Support
- ✅ Chrome/Edge 90+ (ES Modules natifs)
- ✅ Firefox 89+ (ES Modules natifs)
- ✅ Safari 14+ (ES Modules natifs)
- ❌ Internet Explorer (non supporté)

### Mobile
- ✅ Responsive design
- ✅ Burger menu fonctionnel
- ⚠️ Graphiques peuvent être petits sur mobile
- ⚠️ Pas de gestures tactiles (swipe, pinch)

---

## 🧪 Tests & QA

### Tests manuels (Checklist)

#### Mode Démo
- [ ] Clic "Découvrir la démo" → Badge apparaît
- [ ] Dashboard enseignant s'affiche avec données
- [ ] Graphique complétion matières visible
- [ ] Navigation fonctionne (Curriculum, Catalogue)
- [ ] Clic "Quitter démo" → Retour auth

#### Login Enseignant
- [ ] Login `enseignant@ecole.fr` / `smso01**` → Dashboard
- [ ] 5 KPIs affichés avec valeurs correctes
- [ ] Devoirs urgents filtrés (échéance < 3 jours)
- [ ] Liste de 8 devoirs visible
- [ ] Graphique horizontal 3 barres (Math, Philo, H-G)
- [ ] Navigation vers Curriculum → Kanban 3 périodes
- [ ] Déconnexion → Retour auth

#### Login Directeur
- [ ] Login `directeur@ecole.fr` / `smso01**` → Dashboard
- [ ] 4 KPIs affichés
- [ ] Tableau 6 classes visible avec métriques
- [ ] Tableau 5 enseignants visible
- [ ] Graphique groupé 6 classes (2 datasets)
- [ ] Clic "Ajouter établissement" → Modale s'ouvre
- [ ] Soumission formulaire → Alert + fermeture
- [ ] Clic "Ajouter utilisateur" → Modale s'ouvre
- [ ] Déconnexion → Retour auth

#### Login Étudiant
- [ ] Login `etudiant@ecole.fr` / `smso01**` → Dashboard
- [ ] 4 statistiques affichées
- [ ] Barre progression 70% visible
- [ ] Donut chart 3 segments (1 vert, 1 orange, 3 bleu)
- [ ] Clic "Générer UUID" → UUID affiché
- [ ] Clic "Copier" → Copie dans presse-papier
- [ ] 4 devoirs à faire visibles
- [ ] 1 devoir terminé avec note 15/20
- [ ] Déconnexion → Retour auth

#### Console
- [ ] Aucune erreur JavaScript
- [ ] Logs clairs et informatifs
- [ ] Chart.js chargé (`window.Chart` défini)

### Tests automatisés (À implémenter)
```javascript
// Exemple avec Vitest
describe('Dashboard Enseignant', () => {
  it('devrait charger les KPIs correctement', async () => {
    const data = await loadDashboardData();
    expect(data.kpis.totalStudents).toBe(245);
    expect(data.kpis.totalClasses).toBe(8);
  });
  
  it('devrait filtrer les devoirs urgents', () => {
    const urgent = filterUrgentAssignments(mockAssignments);
    expect(urgent.length).toBe(2);
  });
});
```

---

## 🐛 Bugs connus & Solutions

### 1. Graphique ne s'affiche pas
**Symptôme** : Canvas vide, pas d'erreur console  
**Cause** : Chart.js pas encore chargé ou canvas introuvable  
**Solution** :
```javascript
// Vérifier que Chart.js est chargé
if (typeof Chart === 'undefined') {
  console.error('Chart.js non chargé');
  return;
}

// Toujours utiliser requestAnimationFrame
requestAnimationFrame(() => {
  initChart();
});
```

### 2. Graphique déformé sur mobile
**Symptôme** : Graphique trop petit ou déformé  
**Cause** : Container trop petit  
**Solution** :
```javascript
// Dans les options du graphique
{
  maintainAspectRatio: false,
  aspectRatio: 2 // Largeur / Hauteur
}

// Et dans le HTML
<div style="height: 300px; min-height: 250px;">
  <canvas></canvas>
</div>
```

### 3. LocalStorage plein
**Symptôme** : Erreur "QuotaExceededError"  
**Cause** : Trop de données dans localStorage  
**Solution** :
```javascript
try {
  localStorage.setItem('key', value);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    // Nettoyer les anciennes données
    localStorage.clear();
    alert('Stockage plein, données effacées');
  }
}
```

### 4. Navigation cassée après refresh
**Symptôme** : Page blanche après F5  
**Cause** : Route inconnue dans le hash  
**Solution** : Vérifier dans app.js :
```javascript
function navigateTo(view) {
  if (!ROUTE_MAP[view]) {
    console.warn(`Route inconnue: ${view}`);
    view = 'auth'; // Fallback
  }
  // ...
}
```

---

## 📚 Ressources & Références

### Documentation externe
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [MDN ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

### Projets connexes
- **ErgoMate** : PWA source du design system
- **DAWP Engineering** : Organisation parente

### Design inspiration
- Material Design (Google)
- Tailwind CSS (Utility classes)
- Ant Design (Composants)

---

## 🤝 Contribution

### Pour les développeurs
1. Lire ce fichier CONTEXT.md en entier
2. Consulter INTEGRATION-CHART-JS.md pour Chart.js
3. Consulter RECAP-MULTI-PERSONAS.md pour les personas
4. Lancer le serveur local et tester chaque persona
5. Respecter la structure features-control / features-view
6. Documenter tout changement dans ce fichier

### Standards de code
- **Indentation** : 2 espaces
- **Quotes** : Simple quotes `'`
- **Semicolons** : Toujours
- **Console logs** : Toujours préfixer avec `[Module]`
- **Comments** : JSDoc pour les fonctions publiques
- **Files** : Nommer en kebab-case (`my-feature.js`)
- **Classes CSS** : kebab-case (`btn-primary`)

### Git workflow (si applicable)
```bash
# Feature branch
git checkout -b feature/ma-nouvelle-feature

# Commits clairs
git commit -m "feat: ajouter graphique line chart dashboard"
git commit -m "fix: corriger bug graphique mobile"
git commit -m "docs: mettre à jour CONTEXT.md"

# Pull request
git push origin feature/ma-nouvelle-feature
```

---

## 📞 Support & Contact

### Questions fréquentes

**Q : Peut-on utiliser React/Vue ?**  
R : Non, le projet est en Vanilla JS par contrainte. Pas de framework.

**Q : Pourquoi pas de bundler ?**  
R : Simplicité de déploiement. Pas de build step. ES Modules natifs.

**Q : Chart.js est la seule dépendance ?**  
R : Oui, et uniquement via CDN (pas de NPM).

**Q : Comment ajouter une autre lib externe ?**  
R : Via CDN uniquement, avant les scripts modules dans index.html.

**Q : Le mode démo est-il sécurisé ?**  
R : Non, c'est pour la démo uniquement. Pas de prod.

**Q : Quand implémenter le backend ?**  
R : Sprint 7, après avoir finalisé toutes les features front.

---

## 📝 Changelog

### [0.3.0-chartjs] - 2024-11
#### Added
- Module Charts.js avec 6 fonctions utilitaires
- Graphique bar horizontal dashboard enseignant (complétion matières)
- Graphique bar groupé dashboard directeur (comparatif classes)
- Graphique donut dashboard étudiant (répartition devoirs)
- Tooltips enrichis avec callbacks personnalisés
- Intégration couleurs thème ErgoMate dans graphiques

#### Changed
- index.html : Ajout CDN Chart.js v4.4.0
- view-dashboard-teacher.js : Remplacement placeholder par canvas
- view-dashboard-director.js : Ajout section graphique
- view-dashboard-student.js : Ajout section graphique

#### Fixed
- Aucun bug corrigé dans ce sprint

---

### [0.2.0-multi-personas] - 2024-11
#### Added
- Système authentification multi-personas (3 rôles)
- Dashboard directeur complet (comparatifs, formulaires)
- Dashboard étudiant complet (progression, UUID social)
- Curriculum builder simplifié (Kanban 3 périodes)
- Timeline activité pour enseignant
- Modales formulaires (établissement, utilisateur)
- Navigation adaptative par rôle

#### Changed
- app.js : Routing étendu avec redirection selon rôle
- TopNav.js : Navigation adaptée par persona
- feature-auth.js : Base utilisateurs + validation login
- view-auth.js : Formulaire actif + affichage identifiants test

#### Fixed
- Aucun bug corrigé dans ce sprint

---

### [0.1.0-mvp] - 2024-11
#### Added
- Architecture SPA complète
- Routing hash-based
- Mode démo avec FakeRouter
- Dashboard enseignant (KPIs, devoirs, matières)
- Design system ErgoMate
- 8 stubs pour features futures
- Documentation complète (README, SYNTHESE, ARBORESCENCE)

---

## 🎯 Conclusion

Ce fichier CONTEXT.md contient **TOUT** ce qu'un développeur (humain ou AI) doit savoir pour travailler efficacement sur StudyMate School Orchestrator. Il doit être mis à jour à chaque sprint significatif.

**Version actuelle** : 0.3.0-chartjs  
**État** : ✅ Production-ready pour mode démo  
**Prochaine étape** : Sprint 4 - Curriculum Builder avancé

---

**Maintenu par** : Claude (Anthropic AI Assistant)  
**Dernière mise à jour** : Novembre 2024  
**Licence** : Propriétaire - DAWP Engineering
