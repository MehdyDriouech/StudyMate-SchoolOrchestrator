# StudyMate School Orchestrator - MVP Demo

## 🎯 Description

Application SPA (Single Page Application) pour la gestion de contenus pédagogiques dans les établissements scolaires. Ce MVP démonstrateur fonctionne entièrement en mode démo avec des données fictives.

## 📁 Structure du projet

```
public/
├── index.html                 # Point d'entrée HTML
├── assets/
│   └── styles.css            # Styles réutilisés d'ErgoMate
├── mock/
│   ├── mock_stats_overview.json
│   ├── mock_assignments.json
│   └── mock_curriculum.json
└── js/
    ├── config.js             # Configuration globale
    ├── app.js                # Point d'entrée JS + Routing
    ├── app-service.js        # Abstraction API
    ├── demo/
    │   └── FakeRouter.js     # Simulateur d'API
    ├── components/
    │   ├── DemoBadge.js
    │   └── TopNav.js
    └── features/
        ├── features-view/    # Composants de vue
        │   ├── view-auth.js
        │   ├── view-dashboard-teacher.js
        │   └── [autres vues...]
        └── features-control/ # Logique métier
            ├── feature-auth.js
            ├── feature-demo-mode.js
            ├── feature-dashboard-teacher.js
            └── [autres features...]
```

## 🚀 Installation et démarrage

### Option 1 : Serveur Python (recommandé)

```bash
cd public
python3 -m http.server 8080
```

Puis ouvrez : http://localhost:8080

### Option 2 : Serveur Node.js

```bash
npm install -g http-server
cd public
http-server -p 8080
```

### Option 3 : Ouvrir directement (peut avoir des limitations)

Ouvrez simplement `public/index.html` dans votre navigateur.

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

## 🛠️ Développement

### Ajouter une nouvelle vue

1. Créer `js/features/features-view/view-example.js` :
```javascript
export function renderExampleView(container) {
  container.innerHTML = `<div class="card">Contenu</div>`;
}
window.renderExampleView = renderExampleView;
```

2. Créer `js/features/features-control/feature-example.js` :
```javascript
export async function loadExampleData() {
  return await api.get('/example');
}
```

3. Ajouter la route dans `app.js` :
```javascript
const VIEWS = {
  ...
  example: 'view-example'
};
```

### Ajouter un endpoint mock

Dans `FakeRouter.js`, ajouter le routage :
```javascript
if (method === 'GET' && normalizedPath === '/example') {
  return { success: true, data: MOCK_EXAMPLE };
}
```

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
