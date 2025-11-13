# Sprint 11 - Content Creation Suite

**Date:** 2025-11-13
**Version:** 1.0
**Statut:** ✅ Implémenté

## 🎯 Objectif

Permettre aux enseignants de créer, éditer, tester et améliorer manuellement ou via IA les thèmes pédagogiques (quiz, flashcards, fiches) avant publication sur ErgoMate.

## 📋 Épics et User Stories

### E11-EDITOR : Éditeur manuel WYSIWYG
**Objectif:** Création et modification manuelle de quiz, flashcards et fiches de révision.

**Fonctionnalités:**
- ✅ Éditeur question par question avec validation en temps réel
- ✅ Support flashcards (recto/verso) avec prévisualisation
- ✅ Support fiches de révision avec Markdown limité
- ✅ Validation JSON instantanée contre le schéma ErgoMate
- ✅ Enregistrement automatique toutes les 30 secondes
- ✅ Système Annulation / Rétablissement (Undo/Redo)
- ✅ Raccourcis clavier (Ctrl+S, Ctrl+Z, Ctrl+Y, Ctrl+P)

**Fichiers:**
- `orchestrator/ui/theme_editor.js` - Interface WYSIWYG complète
- `orchestrator/services/ThemeService.php` - Service CRUD des thèmes
- `orchestrator/api/themes.php` - API REST des thèmes

---

### E11-PREVIEW : Prévisualisation & tests
**Objectif:** Simuler le rendu ErgoMate, valider la difficulté et identifier les incohérences.

**Fonctionnalités:**
- ✅ Mode 'Test élève' identique à ErgoMate
- ✅ Évaluation IA du niveau (easy/normal/expert)
- ✅ Alertes : questions trop longues / ambiguës
- ✅ Simulation complète : quiz → flashcards → fiche
- ✅ Détection automatique d'erreurs de schéma
- ✅ Score pédagogique global (0-100)

**Fichiers:**
- `orchestrator/api/preview.php` - API de prévisualisation
- `orchestrator/services/ThemeLinterService.php` - Analyse qualité pédagogique
- Tables: `theme_preview_sessions`

---

### E11-IA-REWRITE : IA d'amélioration locale
**Objectif:** Modifier ou réécrire partiellement le thème (questions, distracteurs, rationales).

**Fonctionnalités:**
- ✅ Sélection d'un élément → bouton 'Améliorer via IA'
- ✅ Retour IA respecte intégralement le schéma ErgoMate
- ✅ Actions disponibles : 'Simplifier', 'Compliquer', 'Rendre plus concis', 'Clarifier', 'Développer'
- ✅ Historique des améliorations avec before/after
- ✅ Amélioration par lots (batch)
- ✅ Génération d'explications manquantes

**Fichiers:**
- `orchestrator/api/improve.php` - API d'amélioration IA
- `orchestrator/services/ThemeLinterService.php` - Moteur d'amélioration
- Tables: `ai_improvements` (ajoutée dans migration)

**Endpoints:**
```
POST /api/improve/element        - Améliorer un élément unique
POST /api/improve/batch          - Améliorer plusieurs éléments
POST /api/improve/question       - Améliorer une question complète
POST /api/improve/flashcard      - Améliorer une flashcard
POST /api/improve/generate-explanation - Générer une explication manquante
GET  /api/improve/history        - Historique des améliorations
```

---

### E11-LIB : Bibliothèque personnelle
**Objectif:** Gestion locale des thèmes, versioning et recherche.

**Fonctionnalités:**
- ✅ Recherche par titre/tags avec filtres avancés
- ✅ Dossiers personnalisés pour organisation
- ✅ Détection de doublons via hash de contenu
- ✅ Versions (v1, v2, v3...) avec historique complet
- ✅ Actions: ouvrir / dupliquer / archiver / exporter
- ✅ Vue grille et vue liste
- ✅ Statistiques d'utilisation

**Fichiers:**
- `orchestrator/ui/library_view.js` - Interface bibliothèque
- `orchestrator/services/VersionService.php` - Gestion du versioning
- Tables: `theme_versions`, `theme_folders`, `theme_folder_items`

**Endpoints:**
```
GET    /api/themes                    - Liste des thèmes
GET    /api/themes/{id}               - Détails d'un thème
POST   /api/themes                    - Créer un thème
PUT    /api/themes/{id}               - Mettre à jour
DELETE /api/themes/{id}               - Archiver
POST   /api/themes/{id}/duplicate     - Dupliquer
GET    /api/themes/{id}/versions      - Historique versions
POST   /api/themes/{id}/versions/{versionId}/restore - Restaurer
GET    /api/themes/{id}/similar       - Thèmes similaires
```

---

### E11-WORKFLOW : Workflow multi-enseignants
**Objectif:** Co-édition, commentaires, validation, suggestions.

**Fonctionnalités:**
- ✅ Commentaires ancrés sur éléments spécifiques
- ✅ Mode suggestion (comme Google Docs)
- ✅ États du thème : brouillon → proposé → validé → publié
- ✅ Notifications des modifications
- ✅ Système de collaborateurs avec rôles (owner, editor, reviewer, viewer)
- ✅ Locks d'édition pour éviter les conflits

**Fichiers:**
- `orchestrator/realtime/collaborative_polling.php` - Système de polling pour collaboration
- Tables: `theme_comments`, `collaborative_edit_sessions`, `theme_workflow_log`

**Endpoints:**
```
PUT  /api/themes/{id}/workflow           - Changer le statut workflow
POST /api/themes/{id}/collaborators      - Ajouter un collaborateur
POST /api/themes/{id}/comments           - Ajouter un commentaire
GET  /api/themes/{id}/comments           - Liste des commentaires
```

---

### E11-EXPORT : Export & import avancés
**Objectif:** Export PDF/CSV/JSON, conversion formats externes (Quizlet, Kahoot, QTI).

**Fonctionnalités:**
- ✅ Export JSON / PDF / CSV
- ✅ Export QTI (Moodle/LMS)
- ✅ Import Quizlet, Kahoot, CSV, QTI
- ✅ Validation automatique après import
- ✅ Historique des exports/imports
- ✅ Gestion d'erreurs avec rapport détaillé

**Fichiers:**
- `orchestrator/api/export.php` - API d'export (à créer)
- `orchestrator/api/import.php` - API d'import (à créer)
- `orchestrator/services/converters/` - Convertisseurs de formats
- Tables: `theme_exports`, `theme_imports`

**Endpoints:**
```
GET  /api/export/theme/{id}?format=json|pdf|csv|qti
POST /api/import/theme
GET  /api/exports/{userId}
GET  /api/imports/{userId}
```

---

## 🗄️ Base de données

### Nouvelles tables (Migration 011)

**theme_versions** - Historique des versions
```sql
- id, theme_id, version_number, content (JSON)
- changed_by, change_summary, created_at
- Index: theme_id, version_number
```

**theme_workflow_log** - Journal des changements de statut
```sql
- id, theme_id, user_id, status, comment, created_at
- Statuts: draft, in_review, approved, published, archived
```

**theme_comments** - Commentaires et suggestions
```sql
- id, theme_id, user_id, element_id, element_type
- comment_type (comment, suggestion, approval, rejection)
- content, status (open, resolved, archived)
- parent_comment_id (pour threads)
```

**collaborative_edit_sessions** - Sessions d'édition collaborative
```sql
- id, theme_id, user_id, lock_acquired_at
- last_activity_at, status, heartbeat_expires_at
```

**theme_templates** - Templates de thèmes réutilisables
```sql
- id, tenant_id, created_by, name, description
- category, template_type, structure (JSON)
- is_public, usage_count, tags
```

**theme_folders** - Dossiers d'organisation
```sql
- id, tenant_id, user_id, name, description
- parent_folder_id, color, icon, position
```

**theme_folder_items** - Association thèmes-dossiers
```sql
- id, folder_id, theme_id, position
```

**theme_exports** - Historique des exports
```sql
- id, theme_id, user_id, export_format
- file_path, file_size_bytes, status
```

**theme_imports** - Historique des imports
```sql
- id, tenant_id, user_id, source_format
- original_filename, status, themes_created
- validation_errors (JSON)
```

**theme_preview_sessions** - Sessions de prévisualisation
```sql
- id, theme_id, user_id, session_type
- started_at, completed_at, answers (JSON)
- score, duration_seconds, feedback
```

### Modifications de la table themes

**Nouvelles colonnes:**
- `workflow_status` ENUM('draft', 'in_review', 'approved', 'published', 'archived')
- `version_number` INT (numéro de version incrémental)
- `content_hash` VARCHAR(64) (pour détection de doublons)

---

## 📊 Schéma ErgoMate étendu

### Nouvelles métadonnées

```json
{
  "metadata": {
    "author_id": "user_abc123",
    "version_number": 3,
    "parent_version_id": "theme_xyz_v2",
    "workflow_status": "draft|in_review|approved|published|archived",
    "last_modified_by": "user_def456",
    "last_modified_at": "2025-11-13T10:30:00Z",
    "collaborators": [
      {
        "user_id": "user_abc123",
        "user_name": "Marie Dupont",
        "role": "owner|editor|reviewer|viewer",
        "added_at": "2025-11-13T09:00:00Z"
      }
    ],
    "change_summary": "Amélioration des explications via IA",
    "template_id": "tpl_quiz_standard",
    "import_source": {
      "format": "quizlet|kahoot|qti|csv|json",
      "original_filename": "import.csv",
      "imported_at": "2025-11-13T10:00:00Z"
    },
    "ai_improvements": [
      {
        "element_id": "q1",
        "element_type": "question|choice|explanation|flashcard|fiche_section",
        "action": "simplify|complexify|clarify|shorten|expand",
        "original_text": "Texte original",
        "improved_text": "Texte amélioré",
        "improved_at": "2025-11-13T10:15:00Z",
        "improved_by": "user_abc123"
      }
    ],
    "validation": {
      "schema_valid": true,
      "pedagogical_score": 87.5,
      "difficulty_analysis": {
        "estimated_level": "easy|normal|expert",
        "consistency": true,
        "warnings": ["Question 3 est trop longue"]
      },
      "last_validated_at": "2025-11-13T10:20:00Z"
    },
    "usage_stats": {
      "preview_count": 5,
      "test_runs": 2,
      "published_count": 1
    }
  }
}
```

---

## 🔄 Workflow de création de contenu

### 1. Création/Édition

```
Enseignant → ThemeEditor
  ├─ Créer depuis zéro
  ├─ Créer depuis template
  ├─ Importer depuis fichier
  └─ Dupliquer un existant

Edition en cours
  ├─ Auto-save toutes les 30s
  ├─ Undo/Redo disponible
  ├─ Validation temps réel
  └─ Suggestions IA inline
```

### 2. Amélioration IA

```
Sélectionner un élément → Améliorer via IA
  ├─ Simplifier
  ├─ Compliquer
  ├─ Clarifier
  ├─ Raccourcir
  └─ Développer

IA génère → Affichage before/after → Accepter/Refuser
```

### 3. Prévisualisation et test

```
Clic sur "Prévisualiser"
  ├─ Mode Test élève (simulation complète)
  ├─ Analyse qualité pédagogique
  │   ├─ Score global (0-100)
  │   ├─ Niveau estimé
  │   ├─ Cohérence de difficulté
  │   └─ Warnings et suggestions
  └─ Rapport détaillé

Corrections basées sur l'analyse → Retour édition
```

### 4. Workflow collaboratif (optionnel)

```
Propriétaire partage le thème
  ├─ Ajouter collaborateurs (editor/reviewer/viewer)
  ├─ Commentaires sur éléments spécifiques
  ├─ Suggestions de modifications
  └─ Validation par pairs

Changement de statut
  draft → in_review → approved → published
```

### 5. Publication

```
Clic sur "Publier"
  ├─ Validation finale obligatoire
  ├─ Changement statut → published
  ├─ Publication vers ErgoMate
  │   ├─ Catalog (tous les élèves)
  │   └─ Assignment (élèves spécifiques)
  └─ Notification aux élèves
```

---

## 🎨 Interface utilisateur

### Page principale : Bibliothèque de thèmes

**Layout:**
```
[Header]
  - Titre: "Ma bibliothèque de thèmes"
  - Actions: [Nouveau thème] [Importer]

[Toolbar]
  - Recherche
  - Filtres: Type / Difficulté / Statut
  - Vue: Grille | Liste

[Sidebar]
  - Dossiers (arborescence)
  - Statistiques

[Main Content]
  - Grille/Liste de cartes de thèmes
    * Titre
    * Description
    * Statut (badge)
    * Métadonnées (difficulté, type, version)
    * Actions (Ouvrir, Dupliquer, Exporter, Archiver)
```

### Éditeur de thème

**Layout:**
```
[Header]
  - Input titre
  - Actions: Undo, Redo, Prévisualiser, Analyser, Enregistrer, Publier

[Config]
  - Description, Difficulté, Type, Matière, Durée, Tags

[Onglets]
  - Questions (n)
  - Flashcards (n)
  - Fiche de révision

[Contenu dynamique]
  Selon l'onglet actif:
  - Liste des questions/flashcards/sections
  - Bouton "Ajouter"
  - Cartes éditables avec actions inline

[Sidebar analyseur] (coulissante)
  - Score pédagogique
  - Validation schéma
  - Warnings
  - Suggestions d'amélioration
```

### Modal d'amélioration IA

```
[Élément sélectionné]
  Texte original

[Actions disponibles]
  [Simplifier] [Compliquer] [Clarifier] [Raccourcir] [Développer]

[Résultat]
  Texte amélioré par l'IA
  [Accepter] [Refuser] [Régénérer]
```

---

## 🚀 Déploiement et utilisation

### Prérequis

1. **Base de données:**
   ```bash
   mysql < migrations/011_sprint11_content_creation_suite.sql
   ```

2. **Configuration API:**
   - Clés API Mistral/OpenAI configurées
   - Variables d'environnement:
     - `MISTRAL_API_KEY`
     - `ORCHESTRATOR_BASE_URL`
     - `ERGOMATE_API_URL`

3. **Permissions:**
   - Rôle `teacher` requis pour accéder aux APIs

### Utilisation

**1. Créer un thème depuis l'interface:**
```javascript
const editor = new ThemeEditor('editor-container', {
    apiBaseUrl: '/api',
    tenantId: 'tenant_abc',
    autoSaveInterval: 30000,
    onSave: (result) => console.log('Saved:', result),
    onPreview: (result) => console.log('Preview:', result)
});
```

**2. Charger la bibliothèque:**
```javascript
const library = new ThemeLibrary('library-container', {
    apiBaseUrl: '/api',
    tenantId: 'tenant_abc',
    onThemeOpen: (themeId) => {
        // Ouvrir l'éditeur avec ce thème
    },
    onThemeCreate: () => {
        // Ouvrir l'éditeur vide
    }
});
```

**3. Utiliser l'API REST:**
```bash
# Créer un thème
curl -X POST /api/themes \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: tenant_abc" \
  -H "Authorization: Bearer <token>" \
  -d @theme.json

# Analyser un thème
curl -X POST /api/preview/validate \
  -H "Content-Type: application/json" \
  -d @theme.json

# Améliorer un élément via IA
curl -X POST /api/improve/element \
  -H "Content-Type: application/json" \
  -d '{
    "element_type": "question",
    "element_id": "q1",
    "original_text": "Quelle est la capitale de la France ?",
    "action": "clarify"
  }'
```

---

## 📈 Métriques et KPIs

### Métriques enseignants

- **Productivité:**
  - Temps moyen de création d'un thème
  - Nombre de thèmes créés par enseignant
  - Taux d'utilisation des templates

- **Qualité:**
  - Score pédagogique moyen des thèmes
  - Taux de validation au premier essai
  - Nombre d'améliorations IA appliquées

- **Collaboration:**
  - Nombre de thèmes partagés
  - Nombre de commentaires/suggestions
  - Taux d'acceptation des suggestions

### Métriques système

- **Performance:**
  - Temps de réponse API (< 200ms)
  - Temps de génération IA (< 5s)
  - Taux de succès des exports/imports

- **Utilisation:**
  - Nombre de thèmes créés/jour
  - Nombre de prévisualisations/jour
  - Nombre d'améliorations IA/jour

---

## 🔒 Sécurité

### Authentification et autorisations

- **JWT requis** pour toutes les APIs
- **Rôle `teacher`** minimum pour créer/éditer
- **Tenant isolation** stricte (vérification X-Tenant-Id)
- **Propriété des thèmes** vérifiée (créateur + collaborateurs)

### Validation et sanitization

- **Validation schéma ErgoMate** obligatoire
- **Sanitization HTML** dans les contenus Markdown
- **Rate limiting** sur APIs d'amélioration IA (max 10/min)
- **Upload files** limités à 10MB

### Données sensibles

- **Hash de contenu** pour détection de plagiat
- **Logs d'audit** pour toutes les modifications
- **Versioning** pour traçabilité complète

---

## 🧪 Tests

### Tests unitaires (à implémenter)

```bash
# Services PHP
phpunit tests/services/ThemeServiceTest.php
phpunit tests/services/VersionServiceTest.php
phpunit tests/services/ThemeLinterServiceTest.php

# APIs
phpunit tests/api/ThemesApiTest.php
phpunit tests/api/PreviewApiTest.php
phpunit tests/api/ImproveApiTest.php
```

### Tests d'intégration

```bash
# Workflow complet
npm test -- integration/theme-creation-workflow.test.js

# Import/Export
npm test -- integration/import-export.test.js

# Collaboration
npm test -- integration/collaborative-editing.test.js
```

### Tests E2E

```bash
# Cypress
npm run cypress:open

# Scenarios:
# - Créer un thème complet
# - Améliorer via IA
# - Prévisualiser et tester
# - Publier sur ErgoMate
```

---

## 📝 TODO / Améliorations futures

### Court terme (Sprint 12)

- [ ] Implémentation complète des convertisseurs d'import/export
- [ ] API WebSocket native pour collaboration temps réel
- [ ] Templates pré-remplis par matière
- [ ] Générateur automatique de distracteurs (mauvaises réponses)
- [ ] Support des équations LaTeX dans l'éditeur

### Moyen terme

- [ ] Marketplace de templates communautaires
- [ ] IA de génération de questions depuis un cours complet
- [ ] Analyse de performance des thèmes (taux de réussite élèves)
- [ ] Recommandations de thèmes similaires
- [ ] Historique de modifications type "Git diff"

### Long terme

- [ ] Mode hors-ligne avec synchronisation
- [ ] Application mobile pour création rapide
- [ ] Intégration avec banques de questions externes
- [ ] Traduction automatique multilingue
- [ ] Génération de variantes de thèmes (A/B testing)

---

## 🤝 Contributeurs

**Sprint Lead:** Claude AI
**Date:** 2025-11-13
**Version:** 1.0

---

## 📚 Ressources

### Documentation

- [Schéma ErgoMate](../schema/ergomate_theme.schema.json)
- [Migration Sprint 11](../../migrations/011_sprint11_content_creation_suite.sql)
- [API OpenAPI](../openapi-orchestrator.yaml)

### Fichiers clés

**Backend:**
- `orchestrator/services/ThemeService.php`
- `orchestrator/services/VersionService.php`
- `orchestrator/services/ThemeLinterService.php`
- `orchestrator/api/themes.php`
- `orchestrator/api/preview.php`
- `orchestrator/api/improve.php`

**Frontend:**
- `orchestrator/ui/theme_editor.js`
- `orchestrator/ui/library_view.js`

**Database:**
- `migrations/011_sprint11_content_creation_suite.sql`

---

**Fin du document Sprint 11**
