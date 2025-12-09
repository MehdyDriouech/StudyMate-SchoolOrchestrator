# StudyMate School Orchestrator - MVP Demo

## 🎯 Description

Application SPA (Single Page Application) pour la gestion de contenus pédagogiques dans les établissements scolaires. Ce MVP démonstrateur fonctionne entièrement en mode démo avec des données fictives.

## 📁 Structure du projet

```
SMSO/
├── index.html                 # Point d'entrée HTML (frontend)
├── assets/                    # Assets statiques (CSS, images)
│   └── styles.css            # Styles réutilisés d'ErgoMate
├── mock/                      # Données mockées pour le mode démo
│   ├── mock_stats_overview.json
│   ├── mock_assignments.json
│   └── mock_curriculum.json
├── js/                        # Code JavaScript frontend
│   ├── config.js             # Configuration globale
│   ├── app.js                # Point d'entrée JS + Routing
│   ├── app-service.js        # Abstraction API
│   ├── demo/
│   │   └── FakeRouter.js     # Simulateur d'API (mode démo)
│   ├── components/           # Composants réutilisables
│   │   ├── DemoBadge.js
│   │   ├── TopNav.js
│   │   ├── Sidebar.js
│   │   └── ...
│   └── features/
│       ├── features-view/    # Composants de vue (UI)
│       │   ├── view-auth.js
│       │   ├── view-dashboard-teacher.js
│       │   └── [autres vues...]
│       └── features-control/ # Logique métier
│           ├── feature-auth.js
│           ├── feature-demo-mode.js
│           ├── feature-dashboard-teacher.js
│           └── [autres features...]
├── backend/                   # Backend PHP
│   ├── public/
│   │   └── api.php          # Point d'entrée API
│   ├── src/
│   │   ├── Controllers/     # Contrôleurs HTTP
│   │   ├── Services/        # Services métier
│   │   ├── Repositories/    # Accès données (DB)
│   │   ├── Models/          # Modèles de données
│   │   └── Router/          # Routage des endpoints
│   ├── sql/                 # Schémas et migrations DB
│   └── ui/
│       └── testendpoint.html # Outil de test API
└── docs/                     # Documentation du projet
    └── [documentation...]
```

## 🚀 Installation et démarrage

### Frontend (Application SPA)

#### Option 1 : Serveur Python (recommandé)

```bash
python3 -m http.server 8080
```

Puis ouvrez : http://localhost:8080

#### Option 2 : Serveur Node.js

```bash
npm install -g http-server
http-server -p 8080
```

#### Option 3 : AMPPS / XAMPP

Si vous utilisez AMPPS ou XAMPP, placez le projet dans le dossier `www` et accédez-y via :
```
http://localhost/SMSO/
```

### Backend PHP

Le backend PHP nécessite un serveur web avec PHP 7.4+ et MySQL/MariaDB.

#### Configuration

1. Configurez la base de données dans `backend/src/Config/Database.php`
2. Importez les schémas SQL depuis `backend/sql/`
3. Accédez à l'API via : `http://localhost/SMSO/backend/public/api`

Pour plus de détails, consultez `backend/README.md`.

## 🎭 Mode Démo

L'application démarre en mode démo par défaut :

1. Cliquez sur "Découvrir la démo" sur l'écran d'authentification
2. Le flag `DEMO_SESSION` est stocké dans `localStorage`
3. Tous les appels API sont interceptés par `FakeRouter.js`
4. Les données mockées sont servies depuis `/mock/*.json`

Pour quitter la démo, cliquez sur "🚪 Quitter" dans la navigation.

## 🧩 Features implémentées

### ✅ Complètes
- **Authentification** : Écran de login + Mode démo
- **Dashboard enseignant** : 
  - KPIs (élèves, classes, devoirs, taux de complétion)
  - Devoirs urgents
  - Matières principales
  - Liste complète des devoirs
- **Navigation** : TopNav réutilisant le design d'ErgoMate
- **Demo Badge** : Indicateur visuel du mode démo

### 🚧 Stubs (structure en place)
- Curriculum Builder
- Catalogue de contenus
- Workflow qualité
- Workflow annotations
- Workflow versions
- Administration tenant
- Onboarding tour

## 📊 Données mockées

### Contexte pédagogique
- **Niveau** : Lycée (Seconde, Première, Terminale)
- **Matières** : Mathématiques, Philosophie, Histoire-Géographie
- **Classes** : 8 classes actives
- **Élèves** : 245 élèves au total

### Structure des devoirs
```json
{
  "id": "assign-001",
  "title": "DM - Suites numériques",
  "subject": "Mathématiques",
  "class": "Terminale S1",
  "dueDate": "2024-11-25",
  "status": "active|completed|draft",
  "submittedCount": 18,
  "totalStudents": 28,
  "avgGrade": 12.5,
  "createdAt": "2024-11-10"
}
```

## 🎨 Design System

Le design réutilise intégralement le CSS d'ErgoMate :

- **Variables CSS** : Thème clair/sombre automatique
- **Composants** : `.card`, `.btn`, `.badge`, etc.
- **Animations** : Transitions fluides
- **Responsive** : Mobile-first avec burger menu

## 🔧 Configuration

Voir `js/config.js` pour modifier :
- `DEMO_MODE` : Active/désactive le mode démo
- `API_BASE_URL` : URL de l'API réelle (future)

## 🧪 Test des endpoints API

L'application inclut un outil complet de test des endpoints API : **testendpoint.html**.

### Fonctionnalités principales

- **Authentification** : Connexion avec gestion automatique du token JWT
- **Presets d'endpoints** : Catalogue de requêtes prêtes à l'emploi (Stats, Assignments, Curriculum, AI Themes)
- **Sandbox libre** : Interface complète pour tester n'importe quel endpoint (GET, POST, PUT, DELETE)
- **Gestion des erreurs** : Détection automatique des sessions expirées (401) avec redirection
- **Visualisation** : Affichage formaté des réponses JSON avec coloration syntaxique

### Accès

Le fichier se trouve dans `backend/ui/testendpoint.html` et est accessible via :
```
http://localhost/SMSO/backend/ui/testendpoint.html
```

### Documentation complète

Pour plus de détails sur l'utilisation de l'outil de test, consultez le fichier **[README_testendpoint.md](README_testendpoint.md)** qui contient :
- Guide d'utilisation détaillé
- Configuration et personnalisation
- Format de session et authentification
- Compatibilité avec le backend PHP

## 🛠️ Guide pour les développeurs

### Architecture de l'application

#### Vue d'ensemble

SMSO suit une architecture **SPA (Single Page Application)** avec séparation claire entre :
- **Présentation** (features-view) : Composants UI et rendu
- **Logique métier** (features-control) : Traitement des données et appels API
- **Services** : Abstraction API et routage

#### Structure Frontend

```
┌─────────────────────────────────────────┐
│         index.html                     │
│    (Point d'entrée unique)            │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│         app.js                         │
│   - Routing hash-based (#/route)      │
│   - Gestion des permissions           │
│   - Initialisation globale            │
└──────────────┬─────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼─────┐   ┌─────▼────────┐
│ app-service│   │ Components   │
│ (API calls)│   │ (TopNav, etc)│
└──────┬─────┘   └──────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│      FakeRouter (mode démo)         │
│  ou Backend PHP (mode réel)         │
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

#### Composants principaux

**1. `app.js` - Point d'entrée et routage**
- Gère le routing basé sur le hash (`#/dashboard-teacher`)
- Vérifie les permissions utilisateur (`VIEW_PERMISSIONS`)
- Initialise les composants globaux (TopNav, Sidebar)
- Gère le cycle de vie des vues

**2. `app-service.js` - Abstraction API**
- Intercepte tous les appels API
- Redirige vers `FakeRouter` en mode démo ou vers le backend réel
- Gère automatiquement l'authentification (token JWT)
- Gère les erreurs 401 (session expirée)

**3. `FakeRouter.js` - Simulateur d'API**
- Simule les délais réseau
- Retourne des données mockées depuis `/mock/*.json`
- Utilisé uniquement en mode démo

**4. Features - Séparation View/Control**
- **features-view/** : Composants de rendu (UI pure)
- **features-control/** : Logique métier (appels API, traitement données)

#### Structure Backend

```
backend/
├── public/
│   └── api.php              # Point d'entrée API (Router)
├── src/
│   ├── Controllers/         # Contrôleurs HTTP
│   ├── Services/            # Services métier
│   ├── Repositories/        # Accès données (DB)
│   ├── Models/              # Modèles de données
│   └── Router/              # Routage des endpoints
├── sql/                     # Schémas et migrations DB
└── ui/
    └── testendpoint.html    # Outil de test API
```

### Comment ajouter une nouvelle feature

#### Étape 1 : Créer le fichier de logique métier

Créez `js/features/features-control/feature-ma-feature.js` :

```javascript
/**
 * Feature Ma Feature - Logique métier
 */

import api from '../../app-service.js';

/**
 * Charge les données de la feature
 * @returns {Promise<object>}
 */
export async function loadMaFeatureData() {
  try {
    const response = await api.get('/ma-feature');
    return response.data;
  } catch (error) {
    console.error('[Ma Feature] Erreur:', error);
    throw error;
  }
}

/**
 * Fonction utilitaire pour formater les données
 */
export function formatMaFeatureData(rawData) {
  // Traitement des données
  return processedData;
}
```

#### Étape 2 : Créer le composant de vue

Créez `js/features/features-view/view-ma-feature.js` :

```javascript
/**
 * View Ma Feature - Interface utilisateur
 */

import { loadMaFeatureData, formatMaFeatureData } from '../features-control/feature-ma-feature.js';

let maFeatureContainer = null;

/**
 * Rend la vue principale
 * @param {HTMLElement} container - Conteneur DOM
 */
export function renderMaFeatureView(container) {
  maFeatureContainer = container;
  container.innerHTML = `
    <div class="card">
      <h2>Ma Feature</h2>
      <div id="ma-feature-content">Chargement...</div>
    </div>
  `;
  
  // Charger les données
  loadAndRenderData();
}

/**
 * Charge et affiche les données
 */
async function loadAndRenderData() {
  try {
    const data = await loadMaFeatureData();
    const formatted = formatMaFeatureData(data);
    renderData(formatted);
  } catch (error) {
    showError(error);
  }
}

/**
 * Affiche les données dans le DOM
 */
function renderData(data) {
  const content = document.getElementById('ma-feature-content');
  content.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

/**
 * Affiche une erreur
 */
function showError(error) {
  const content = document.getElementById('ma-feature-content');
  content.innerHTML = `<div class="error">Erreur: ${error.message}</div>`;
}

// Export pour le routing
window.renderMaFeatureView = renderMaFeatureView;
```

#### Étape 3 : Ajouter la route dans `app.js`

Dans `js/app.js`, ajoutez la vue dans le mapping `VIEWS` :

```javascript
const VIEWS = {
  // ... autres vues
  'ma-feature': 'view-ma-feature'
};
```

Si la feature nécessite des permissions spécifiques, ajoutez-les dans `VIEW_PERMISSIONS` :

```javascript
const VIEW_PERMISSIONS = {
  // ... autres permissions
  'ma-feature': ['teacher', 'director'] // Rôles autorisés
};
```

#### Étape 4 : Ajouter l'endpoint mock (mode démo)

Dans `js/demo/FakeRouter.js`, ajoutez le routage :

```javascript
// Importer les données mockées si nécessaire
import MOCK_MA_FEATURE from '../../../mock/mock-ma-feature.json' assert { type: 'json' };

// Dans la fonction fakeRequest, ajouter :
if (method === 'GET' && normalizedPath === '/ma-feature') {
  return {
    success: true,
    data: MOCK_MA_FEATURE
  };
}
```

Créez le fichier de données mockées `mock/mock-ma-feature.json` :

```json
{
  "id": "feature-001",
  "name": "Ma Feature",
  "data": []
}
```

#### Étape 5 : Ajouter l'endpoint backend (optionnel)

Si vous implémentez le backend PHP :

1. **Créer le contrôleur** : `backend/src/Controllers/MaFeatureController.php`
2. **Créer le repository** : `backend/src/Repositories/MaFeatureRepository.php`
3. **Ajouter la route** dans `backend/src/Router/Router.php` :

```php
$router->get('/ma-feature', [MaFeatureController::class, 'index']);
```

### Conventions de code

#### Nommage

- **Fichiers** : `kebab-case` (ex: `feature-dashboard-teacher.js`)
- **Fonctions** : `camelCase` (ex: `loadDashboardData()`)
- **Constantes** : `UPPER_SNAKE_CASE` (ex: `API_BASE_URL`)
- **Composants** : `PascalCase` pour les classes (ex: `TopNav`)

#### Structure des fichiers

**Features Control** (logique métier) :
- Exporter des fonctions pures quand possible
- Gérer les erreurs avec try/catch
- Logger les actions importantes avec `console.log`

**Features View** (UI) :
- Exporter une fonction principale `renderXxxView(container)`
- Exposer la fonction sur `window` pour le routing
- Gérer le cycle de vie (nettoyage si nécessaire)

#### Gestion des erreurs

```javascript
try {
  const data = await api.get('/endpoint');
  // Traitement
} catch (error) {
  console.error('[Feature] Erreur:', error);
  // Afficher un message à l'utilisateur
  showErrorMessage('Une erreur est survenue');
}
```

#### Appels API

Utiliser toujours `app-service.js` pour les appels API :

```javascript
import api from '../../app-service.js';

// GET
const response = await api.get('/endpoint');

// POST
const response = await api.post('/endpoint', { data: 'value' });

// PUT
const response = await api.put('/endpoint/123', { data: 'value' });

// DELETE
const response = await api.delete('/endpoint/123');
```

### Bonnes pratiques

1. **Séparation des responsabilités**
   - La vue ne doit contenir que du rendu HTML/CSS
   - La logique métier doit être dans `features-control`
   - Les appels API uniquement dans `features-control`

2. **Réutilisabilité**
   - Créer des fonctions utilitaires réutilisables
   - Extraire les composants UI communs dans `components/`

3. **Performance**
   - Utiliser `Promise.all()` pour les appels API parallèles
   - Éviter les re-renders inutiles
   - Nettoyer les listeners et timers lors du changement de vue

4. **Accessibilité**
   - Utiliser les balises sémantiques HTML5
   - Ajouter des attributs ARIA si nécessaire
   - Gérer le focus clavier

5. **Debugging**
   - Utiliser des préfixes dans les logs : `[Feature Name]`
   - Activer les logs détaillés en développement
   - Utiliser les DevTools du navigateur

### Ressources supplémentaires

- **Architecture détaillée** : Voir `docs/ARBORESCENCE.txt`
- **Contexte backend** : Voir `backend/README.md`
- **Documentation API** : Voir `backend/docs/openapi.yaml`

## 📝 Notes techniques

- **ES Modules** : Utilisation native (pas de bundler)
- **No dependencies** : Vanilla JS pur
- **Offline-ready** : Prêt pour PWA (Service Worker à ajouter)
- **localStorage** : Gestion de session simple

## 🔐 Sécurité

⚠️ **ATTENTION** : Ce MVP est uniquement pour démonstration !

- Aucune vraie authentification
- Pas de validation côté backend
- Données en clair dans localStorage
- Pas de protection CSRF/XSS

## 📱 Compatibilité

- ✅ Chrome/Edge (dernières versions)
- ✅ Firefox (dernières versions)
- ✅ Safari (iOS 14+)
- ✅ Responsive mobile

## 🚧 Roadmap

- [ ] Intégration Chart.js pour graphiques
- [ ] Implémentation des features en stub
- [ ] Connexion backend réel
- [ ] Tests unitaires
- [ ] Service Worker pour PWA
- [ ] Authentification JWT

## 📄 Licence

MVP Démo - Usage interne uniquement

---

**Version** : 0.1.0-mvp  
**Dernière mise à jour** : Novembre 2024
