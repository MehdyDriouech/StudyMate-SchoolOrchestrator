# 🎯 Super-Prompt Orchestrateur – Feature “Curriculum” pour SMSO

Ce fichier est un **super-prompt** destiné à un agent IA Fullstack (backend PHP + FakeRouter + UI de test interne).  
Il suit la même logique que les features “Themes” et “Classes & Students” et respecte la règle :

> **Definition of Done globale :**  
> Toute nouvelle feature backend doit être intégralement testable via un onglet dédié dans `backend/ui/testendpoint.html`  
> (avec l’ensemble de ses endpoints exposés, des presets fonctionnels et des mocks alignés dans `FakeRouter.js`).

---

## 🧩 Rôle demandé à l’agent IA

Tu agis comme **équipe fullstack expérimentée** sur le projet **StudyMate School Orchestrator (SMSO)**.

Ta mission sur cette itération :

1. Concevoir et implémenter une **feature “Curriculum” structurée** côté backend PHP.  
2. Aligner cette feature avec une **API cohérente et REST-ish**.  
3. Implémenter les **mocks correspondants dans `FakeRouter.js`**.  
4. Ajouter un **onglet “Curriculum” complet** dans `testendpoint.html` permettant de tester tous les endpoints de la feature.

Tu dois :

- Commencer par un **plan détaillé** (analyse + approche).
- Implémenter ensuite le code (backend + fake + UI).
- Respecter les conventions existantes (architecture, format JSON, token, etc.).
- Documenter brièvement ce que tu fais à chaque gros bloc.

---

# 1️⃣ CONTEXTE PROJET (Rappel synthétique)

### Front – `app-service.js`

- Fournit `api.get`, `api.post`, `api.put`, `api.delete`.
- Ajoute un token en **query string** (`?token=`) si `AUTH_TOKEN_TRANSPORT === 'query'`.
- Peut router vers :
  - **FakeRouter** (`fakeRequest`) en mode démo (actuellement `ALWAYS_USE_FAKE = true`),
  - ou **backend réel PHP** via `fetch`.
- Gère les erreurs `401` :
  - lecture du body JSON si possible,
  - purge de la session,
  - message “Session expirée, veuillez vous reconnecter”,
  - redirection vers la page de login après 5s.

### FakeRouter – `js/demo/FakeRouter.js`

Actuellement, il gère :

- `GET /stats/overview`
- `GET /assignments`
- `GET /assignments/:id`
- `POST /assignments`
- `PUT /assignments/:id`
- `DELETE /assignments/:id`
- `GET /curriculum` (vue globale, unique endpoint pour le moment)
- `POST /ai/themes/generate` (en cours de migration vers `/themes/generate`)

Il contient notamment :

```js
const MOCK_CURRICULUM = {
  subjects: [
    {
      id: 'math-term',
      name: 'Mathématiques Terminale',
      level: 'Terminale',
      chapters: [
        { id: 'ch1', title: 'Suites numériques', progress: 85 },
        { id: 'ch2', title: 'Fonctions exponentielles', progress: 60 },
        { id: 'ch3', title: 'Probabilités conditionnelles', progress: 30 }
      ]
    },
    {
      id: 'philo-term',
      name: 'Philosophie Terminale',
      level: 'Terminale',
      chapters: [
        { id: 'ch1', title: 'La conscience', progress: 100 },
        { id: 'ch2', title: 'Le bonheur', progress: 70 },
        { id: 'ch3', title: 'La vérité', progress: 40 }
      ]
    }
  ]
};
```

Et une fonction `getMockBySchoolId` qui renvoie, entre autres, `curriculum: MOCK_CURRICULUM`.

### Backend PHP – Architecture

```text
backend/
  src/
    Controllers/
    Services/
    Repositories/
    Core/
  sql/
    schema.sql
    seeds.sql
  ui/
    testendpoint.html
```

- Il existe des endpoints pour Auth, Stats, Assignments, etc.
- Pour Curriculum, le backend réel n’est pas encore organisé en feature structurée.

La base SQL comporte déjà des tables pour :
- `schools`, `users`, `classes`, `class_students`,
- `themes`, `theme_questions`,
- `assignments`, `submissions`,
- `social_stats`, `activity_logs`,
- (pas forcément une table `curriculum` explicite, tu devras faire des hypothèses raisonnables ou garder une implémentation “mock/v1” côté backend).

### testendpoint.html – Mini Postman Interne

- Emplacement : `backend/ui/testendpoint.html`
- Rôle : tester rapidement tous les endpoints du backend.
- UI basée sur des onglets :
  - Auth
  - Sandbox libre
  - Assignments
  - Stats
  - Curriculum (actuel, très limité)
  - Themes
  - Classes (en cours)
  - Futures features (Analytics, Social, etc.)

Structure centrale côté JS :

```js
const FEATURE_TABS = [
  {
    id: 'assignments',
    label: 'Assignments',
    endpoints: [
      { id: 'assignment-list', method: 'GET', path: '/assignments', ... },
      // ...
    ]
  },
  // ...
];
```

Les fonctions importantes sont notamment :

- `sendAuthedRequest(method, path, body, options)`
- `fillSandboxFromPreset(preset)`
- `initTabs()`
- `initFeatureTabs()`
- `showNotification(message, type)`

---

# 2️⃣ VISION DE LA FEATURE “CURRICULUM”

Actuellement, Curriculum se résume à un `GET /curriculum` qui renvoie une vue globale Mock.  
On veut transformer cela en **feature structurée** permettant de :

- Consulter **l’overview global** du curriculum pour un établissement.
- Lister les **matières (subjects)**.
- Récupérer le détail d’une matière, avec ses chapitres.
- Récupérer le détail d’un chapitre.
- Mettre à jour la **progression** d’un chapitre (au minimum).
- Préparer le terrain pour, plus tard :
  - un CRUD complet (ajout/suppression/restructuration),
  - des liens plus étroits avec Themes, Assignments, Analytics.

Pour cette V1, on reste **majoritairement en lecture** avec un endpoint de mise à jour simple sur le `progress`.

---

# 3️⃣ SPÉCIFICATION FONCTIONNELLE & API “CURRICULUM”

Tu dois implémenter les endpoints suivants côté backend PHP (préfixés `/api`), avec leurs équivalents côté FakeRouter (sans `/api` grâce à la normalisation) :

## 3.1. `GET /api/curriculum`

- Rôle : récupérer la vue globale du curriculum pour l’établissement actif.
- Réutilise la structure de `MOCK_CURRICULUM`.
- Réponse attendue (exemple) :

```json
{
  "success": true,
  "data": {
    "subjects": [
      {
        "id": "math-term",
        "name": "Mathématiques Terminale",
        "level": "Terminale",
        "chapters": [
          { "id": "ch1", "title": "Suites numériques", "progress": 85 },
          { "id": "ch2", "title": "Fonctions exponentielles", "progress": 60 }
        ]
      }
    ]
  }
}
```

---

## 3.2. `GET /api/curriculum/subjects`

- Rôle : lister les matières du curriculum (sans le détail complet de chaque chapitre si tu veux alléger).
- Peut être un simple “view” de `data.subjects` sans les détails les plus lourds si tu le souhaites.

---

## 3.3. `GET /api/curriculum/subjects/:id`

- Rôle : récupérer une matière spécifique et ses chapitres.
- `:id` correspond au `id` d’un subject (ex: `math-term`).
- Réponse : même structure que l’élément trouvé dans `subjects`.

---

## 3.4. `GET /api/curriculum/chapters/:id`

- Rôle : récupérer un chapitre spécifique.
- `:id` correspond à `ch1`, `ch2`, etc.
- Selon ton design, l’ID peut être global ou unique dans un subject ; fais un choix cohérent et documente-le :
  - soit `chapterId` global unique,
  - soit combinaison `(subjectId, chapterId)` – dans ce cas `chapters/:subjectId/:chapterId`.

Pour simplifier la V1, tu peux :

- soit considérer que les IDs de chapitre sont uniques,
- soit définir un endpoint `GET /api/curriculum/subjects/:subjectId/chapters/:chapterId` explicitement (recommandé pour éviter les ambiguïtés).

👉 Tu choisis le modèle, mais tu expliques lequel et tu l’appliques partout (backend + FakeRouter + testendpoint).

---

## 3.5. `PUT /api/curriculum/chapters/:id` (ou équivalent)

- Rôle : mettre à jour la progression d’un chapitre (au minimum).
- Exemple de body :

```json
{
  "progress": 90
}
```

- Réponse :

```json
{
  "success": true,
  "data": {
    "id": "ch1",
    "title": "Suites numériques",
    "progress": 90
  },
  "message": "Progression du chapitre mise à jour avec succès"
}
```

---

## 3.6. Permissions minimales

Pour la V1 :

- `GET` Curriculum / Subjects / Chapters → accessible à tous les rôles authentifiés (student, teacher, pedago, director).
- `PUT` sur un chapitre :
  - réservé aux rôles pédagogiques et d’encadrement (teacher, pedago, director).
  - La logique exacte peut s’inspirer de ce qui existe pour Assignments.

Tu peux réutiliser ou étendre la logique de permissions existante.

---

# 4️⃣ TRAVAIL ATTENDU – ÉTAPES DÉTAILLÉES

## 🧩 ÉTAPE 1 — Analyse & Plan d’implémentation

Avant de coder :

1. Inspecter :
   - `backend/sql/schema.sql` pour vérifier s’il existe des tables liées au curriculum ou si, pour cette V1, on considère que Curriculum est dérivé d’autres tables ou d’un mock persistant.
   - Le pattern Controllers/Services/Repositories déjà utilisé (ex: Assignments).
2. Proposer un **plan** avec :
   - noms exacts des classes PHP à créer/modifier,
   - structure des méthodes (services, repositories),
   - stratégie de stockage/lecture pour Curriculum (full DB ou DB + fallback mock),
   - design exact des endpoints (en particulier pour la gestion des chapitres : `chapters/:id` vs `subjects/:subjectId/chapters/:chapterId`),
   - plan de mise à jour de `FakeRouter.js`,
   - plan de mise à jour de `testendpoint.html`.

Tu fournis ce plan d’abord, puis tu passes à l’implémentation.

---

## 🧩 ÉTAPE 2 — Implémentation Backend PHP “Curriculum”

Tu crées ou complètes :

- `CurriculumController.php` (dans `Controllers/`)
- `CurriculumService.php` (dans `Services/`)
- `CurriculumRepository.php` (dans `Repositories/`)

Tu ajoutes les routes correspondantes dans le système de routing existant :

- `GET /api/curriculum`
- `GET /api/curriculum/subjects`
- `GET /api/curriculum/subjects/:id`
- `GET /api/curriculum/chapters/:id` ou `GET /api/curriculum/subjects/:subjectId/chapters/:chapterId`
- `PUT /api/curriculum/chapters/:id` (ou variante choisie)

Tu veilles à :

- respecter le format de réponse JSON global : `{ success: boolean, data?: any, message?: string }`,
- renvoyer des erreurs explicites en cas d’ID inconnu (404 logique, ou message d’erreur clair),
- appliquer les permissions minimales.

Si tu ne trouves pas de table SQL “curriculum” :

- tu choisis une stratégie :
  - soit lecture seule depuis des données *“semi-statiques”* (par exemple seeds ou structure dérivée de Themes),
  - soit tu implémentes la logique “en mémoire” pour V1 (à expliquer en commentaire),
- dans tous les cas, tu gardes la même structure de réponse pour aligner backend réel et FakeRouter.

---

## 🧩 ÉTAPE 3 — Mise à jour du FakeRouter pour “Curriculum”

Dans `js/demo/FakeRouter.js` :

1. Tu réutilises `MOCK_CURRICULUM` comme source principale.
2. Tu implémentes les routes normalisées :

- `GET /curriculum` → renvoie la vue globale (comme actuellement, mais avec la nouvelle enveloppe `{ success, data }` si ce n’est pas encore le cas).
- `GET /curriculum/subjects` → renvoie uniquement les subjects (et éventuellement un résumé).
- `GET /curriculum/subjects/:id` → renvoie un subject avec ses chapitres.
- `GET /curriculum/chapters/:id` ou `GET /curriculum/subjects/:subjectId/chapters/:chapterId` selon le design choisi.
- `PUT /curriculum/chapters/:id` (ou variante) → met à jour le `progress` dans le mock (en mémoire).

3. Tu respectes le pattern de routing existant, par ex. :

```js
if (method === 'GET' && normalizedPath === '/curriculum') { ... }

if (method === 'GET' && normalizedPath === '/curriculum/subjects') { ... }

if (method === 'GET' && normalizedPath.match(/^\/curriculum\/subjects\//)) { ... }
```

4. Tu ajoutes des erreurs claires si une matière / un chapitre n’existe pas, avec un `throw new Error(...)` cohérent avec le reste du FakeRouter.

---

## 🧩 ÉTAPE 4 — Mise à jour de `backend/ui/testendpoint.html`

Tu ajoutes ou complètes un onglet **“Curriculum”** dans `FEATURE_TABS` en suivant le pattern de ce qui est fait pour Assignments, Themes, Classes.

Par exemple :

```js
{
  id: 'curriculum',
  label: 'Curriculum',
  endpoints: [
    {
      id: 'curriculum-overview',
      method: 'GET',
      path: '/curriculum',
      description: 'Vue globale du curriculum (toutes les matières + chapitres)',
      body: null
    },
    {
      id: 'curriculum-subjects',
      method: 'GET',
      path: '/curriculum/subjects',
      description: 'Lister les matières du curriculum',
      body: null
    },
    {
      id: 'curriculum-subject-by-id',
      method: 'GET',
      path: '/curriculum/subjects/{subjectId}',
      description: 'Récupérer une matière par son ID',
      body: null,
      exampleParams: { subjectId: 'math-term' }
    },
    {
      id: 'curriculum-chapter-by-id',
      method: 'GET',
      path: '/curriculum/chapters/{chapterId}', // ou variante choisie
      description: 'Récupérer un chapitre par son ID',
      body: null,
      exampleParams: { chapterId: 'ch1' }
    },
    {
      id: 'curriculum-update-chapter',
      method: 'PUT',
      path: '/curriculum/chapters/{chapterId}',
      description: 'Mettre à jour la progression d’un chapitre',
      body: {
        progress: 90
      },
      exampleParams: { chapterId: 'ch1' }
    }
  ]
}
```

Tu veilles à ce que :

- `fillSandboxFromPreset` soit exploité correctement (préremplir la sandbox avec `method`, `path`, `body`).
- Les IDs d’exemple (`math-term`, `ch1`, etc.) existent bien dans tes mocks (FakeRouter).
- L’UX soit cohérente avec les autres onglets.

---

# 5️⃣ DEFINITION OF DONE (DOD) – FEATURE “CURRICULUM”

La feature “Curriculum” est considérée comme **terminée** lorsque :

### ✅ Backend PHP

- [ ] `GET /api/curriculum` renvoie une vue globale structurée du curriculum.
- [ ] `GET /api/curriculum/subjects` renvoie la liste des matières.
- [ ] `GET /api/curriculum/subjects/:id` renvoie une matière avec ses chapitres.
- [ ] `GET /api/curriculum/chapters/:id` (ou variante) renvoie un chapitre.
- [ ] `PUT /api/curriculum/chapters/:id` met à jour le `progress` d’un chapitre, avec validations minimales.
- [ ] Les réponses suivent toutes le format `{ success, data, message? }`.
- [ ] Les permissions minimales sont respectées (lecture pour tous, écriture réservée aux rôles pédagogiques).

### ✅ FakeRouter.js

- [ ] Tous les endpoints `/curriculum*` sont mockés. (et doivent rester fonctionnelsen mode demo)
- [ ] Les données de `MOCK_CURRICULUM` sont cohérentes avec les IDs utilisés dans `testendpoint.html`.
- [ ] La mise à jour de progression (`PUT`) est reflétée dans le mock en mémoire.
- [ ] Aucune route existante (Stats, Assignments, Themes, Classes) n’est cassée.

### ✅ testendpoint.html

- [ ] Un onglet **“Curriculum”** existe dans `FEATURE_TABS`.
- [ ] Tous les endpoints de la feature y sont présents sous forme de presets.
- [ ] Un utilisateur peut, depuis cette UI:
  - visualiser l’overview,
  - voir la liste des matières,
  - consulter une matière et ses chapitres,
  - consulter un chapitre,
  - tester une mise à jour de progression.
- [ ] Les presets utilisent des IDs réels d’exemple (définis dans FakeRouter).

### ✅ Non-régression

- [ ] Les autres features (Auth, Stats, Assignments, Themes, Classes, etc.) continuent de fonctionner.
- [ ] La logique de token en query `?token=` est intacte (via `app-service.js`).

---

# 6️⃣ MODALITÉ D’INTERACTION POUR L’AGENT IA

Tu suis cet ordre :

1. **Plan d’implémentation détaillé** (Étape 1)  
   - Tu expliques les choix de design pour les endpoints, les IDs de chapitres, la source de vérité du curriculum (DB vs mock).
2. **Implémentation backend Curriculum** (Étape 2).
3. **Mise à jour de FakeRouter** (Étape 3).
4. **Mise à jour de testendpoint.html** (Étape 4).
5. **Récapitulatif final** :
   - fichiers créés/modifiés,
   - endpoints disponibles,
   - exemples d’appels,
   - hypothèses et choix importants (documentés).

---

Fin du prompt.