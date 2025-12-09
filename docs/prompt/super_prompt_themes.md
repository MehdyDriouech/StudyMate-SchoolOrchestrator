# 🎯 Super‑Prompt Orchestrateur – Implémentation complète de la Feature “Themes” (Backend + FakeRouter + testendpoint.html)

Ce fichier contient **le super‑prompt complet**, prêt à être utilisé par ton agent IA Fullstack, conformément au mode BMAD‑orchestrateur et à la DOD imposant que **chaque feature backend doit fournir ses endpoints dans testendpoint.html**.

---

## 🔥 Rôle demandé à l’agent IA

Tu agis comme **équipe fullstack experte** travaillant sur le projet StudyMate School Orchestrator (SMSO).  
Tu lis attentivement le contexte, tu proposes un plan, puis tu implémentes le code (backend PHP + FakeRouter + UI testendpoint.html).

Tu dois respecter :

- l’architecture existante (backend PHP MVC-like + FakeRouter + app-service),
- les conventions de réponse JSON `{ success, data, message }`,
- la tokenisation en query `?token=`,
- le fonctionnement testendpoint.html,
- la nouvelle règle DOD (Definition of Done) concernant la testabilité des endpoints.

---

# 1️⃣ CONTEXTE PROJET (à relire intégralement avant d’agir)

### 📌 Architecture globale
Le projet comprend :

- **Frontend léger HTML/JS** piloté par `app-service.js`
- **FakeRouter.js** utilisé en mode démo
- **Backend PHP** dans `backend/src/Controllers`, `Services`, `Repositories`
- **Interface de test interne** : `backend/ui/testendpoint.html`

### 📌 app-service.js
- Redirige tous les appels vers FakeRouter (`ALWAYS_USE_FAKE = true`)
- Ajoute automatiquement le token (query ou header)
- Gère les erreurs 401 (purge + alerte + redirection)
- Abstraction des appels GET/POST/PUT/DELETE

### 📌 FakeRouter.js
Déjà implémente :
- `/stats/overview`
- `/assignments` (CRUD complet)
- `/curriculum`
- `/ai/themes/generate`

Structure :
```js
fakeRequest(method, path, body)
routeRequest(method, normalizedPath, body)
MOCK_STATS_OVERVIEW
MOCK_ASSIGNMENTS
MOCK_CURRICULUM
MOCK_AI_THEME
```

### 📌 Backend PHP actuel
Endpoints existants :
- `/api/auth/login`
- `/api/stats/overview`
- `/api/assignments*`
- `/api/curriculum`

### 📌 Base SQL
Tables :
- themes
- theme_questions
- assignments
- submissions
- social_stats
- activity_logs
- ...

### 📌 testendpoint.html
UI Postman-like permettant de tester :
- Auth
- Assignments
- Stats
- Curriculum
- Ai Theme Creator (à renommer)

Nouvelle règle UI : **un onglet par feature** via `FEATURE_TABS`.

---

# 2️⃣ NOUVELLE RÈGLE GLOBALE (Definition of Done)

Pour **toutes** les futures features :

### ✅ DOD Backend Feature
Chaque nouvelle feature backend doit obligatoirement :

1. **Implémenter tous les endpoints backend PHP** attendus.
2. **Ajouter leurs équivalents dans FakeRouter.js** (avec mocks cohérents).
3. **Ajouter un onglet complet dans testendpoint.html** contenant :
   - tous les endpoints de la feature,
   - un preset par endpoint,
   - des bodies pré-remplis,
   - des exemples de paramètres (`{id}` etc.),
   - des labels clairs.

🎯 **Objectif : la feature est testable end‑to‑end sans toucher au code.**

---

# 3️⃣ OBJECTIF DU JOUR – Structurer la Feature “Themes”

Actuellement la feature est limitée à :

- `POST /ai/themes/generate`

🚫 Mauvais nom  
🚫 Pas de CRUD  
🚫 Pas de listing  
🚫 Pas de récupération individuelle  
🚫 Pas d’import PDF  
🚫 Impossible à tester proprement

🎯 On veut une vraie feature **/themes** :

### ⭐ ENDPOINTS À CRÉER

| Endpoint | Rôle |
|---------|------|
| `GET /api/themes` | Lister tous les thèmes |
| `POST /api/themes` | Créer un thème manuel |
| `GET /api/themes/:id` | Récupérer un thème complet |
| `PUT /api/themes/:id` | Mettre à jour un thème |
| `DELETE /api/themes/:id` | Supprimer un thème |
| `POST /api/themes/generate` | Générer un thème via IA |
| `POST /api/themes/import` | Mock d’import PDF |

### ⭐ REMPLACEMENT
`POST /api/ai/themes/generate` → **redirigé** vers `/api/themes/generate` (FakeRouter seulement pour compatibilité).

---

# 4️⃣ SPÉCIFICATION DE LA FEATURE “THEMES”

### ✔ Structure d’un thème

Un thème contient :

```
id
title
description
classes: [{id, label}]
contentTypes: {quiz, flashcards, revision_sheet}
quiz: [...]
flashcards: [...]
revision_sheet: { blocks: [...] }
status
created_at
updated_at
```

### ✔ Permissions minimales
- Tous les rôles authentifiés : GET /themes, GET /themes/:id
- Teacher/Pedago/Director : POST/PUT/DELETE

---

# 5️⃣ TRAVAIL ATTENDU PAR L’AGENT

Tu dois effectuer les **4 étapes suivantes** :

---

## 🧩 ÉTAPE 1 — Analyse & Plan d’implémentation

Tu fournis :
- un plan clair,
- une liste des fichiers à créer/modifier,
- la stratégie utilisée pour ThemeService et ThemeRepository,
- la stratégie CRUD,
- l’approche pour la migration FakeRouter,
- la logique UI pour testendpoint.html.

Ne code rien encore, commence par valider le plan.

---

## 🧩 ÉTAPE 2 — Implémentation Backend PHP

Tu crées :

- `ThemesController.php`
- `ThemesService.php`
- `ThemesRepository.php`
- routes `/api/themes*`

Tu implémentes :

- GET /themes
- POST /themes
- GET /themes/:id
- PUT /themes/:id
- DELETE /themes/:id
- POST /themes/generate
- POST /themes/import

Tu utilises les tables SQL existantes `themes`, `theme_questions`.

---

## 🧩 ÉTAPE 3 — Mise à jour du FakeRouter

Dans `FakeRouter.js` :

1. Ajouter :

```
MOCK_THEMES = [...]
```

2. Implémenter :

```
GET /themes
POST /themes
GET /themes/:id
PUT /themes/:id
DELETE /themes/:id
POST /themes/generate
POST /themes/import
```

3. Rediriger l’ancien :
```
POST /ai/themes/generate → POST /themes/generate
```

4. Utiliser `buildAiThemeResponse()` pour les mocks générés.

---

## 🧩 ÉTAPE 4 — Mise à jour testendpoint.html

Créer un **onglet “Themes”** dans `FEATURE_TABS` contenant :

```
GET /themes
POST /themes
GET /themes/{id}
PUT /themes/{id}
DELETE /themes/{id}
POST /themes/generate
POST /themes/import
```

Chaque entrée doit avoir :
- un id unique,
- un body prérempli,
- un exemple d’ID (`theme_123`),
- un descriptif.

---

# 6️⃣ DÉFINITION DE DONE (DOD)

La feature “Themes” est DONE si :

### ✔ Backend PHP
- Tous les endpoints fonctionnent.
- Les réponses suivent `{ success, data, message }`.
- Permissions minimales respectées.
- Tests manuels possibles via testendpoint.html.

### ✔ FakeRouter
- Toutes les routes mockées correctement.
- Ancien endpoint AiTheme redirigé.
- Plusieurs thèmes mocks présents.

### ✔ testendpoint.html
- Onglet “Themes” complet.
- Chaque endpoint testable.
- Bodies pré-remplis.
- Tout fonctionne via `?token=`.

### ✔ Non‑régression
- Stats, Assignments, Curriculum fonctionnent toujours.
- Tokenisation intacte.

---

# 7️⃣ MODALITÉ D’INTERACTION

Ordre d’exécution imposé pour l’agent :

1. **Proposer un plan clair**
2. Attendre validation si nécessaire
3. Implémenter backend
4. Implémenter FakeRouter
5. Mettre à jour testendpoint.html
6. Faire un récapitulatif final des fichiers modifiés

---

Fin du prompt.
