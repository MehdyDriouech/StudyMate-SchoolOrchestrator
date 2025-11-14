# Sprint 19 - Multi-Review Workflow & Quality Validation

**Date**: 2025-11-14
**Version**: 1.0.0
**Statut**: ✅ Implémenté

## 📋 Vue d'ensemble

Le Sprint 19 implémente un système complet de validation multi-acteurs pour les thèmes pédagogiques, permettant un workflow de qualité avec annotations, versioning et collaboration entre enseignants, référents et direction.

### Objectifs

- ✅ Workflow de validation structuré : enseignant → référent → direction
- ✅ Système d'annotations avec suggestions IA
- ✅ Versioning automatique avec comparaison de versions
- ✅ Historique complet des actions et transitions
- ✅ Notifications en temps réel
- ✅ Interface utilisateur intuitive

## 🎯 Epics et User Stories

### Epic E19-WORKFLOW : Workflow de Validation

**Workflow complet** : `draft` → `pending_review` → `approved` → `published`

#### US19-1-STATE : Changer le statut d'un thème

**En tant qu'enseignant**, je veux soumettre mon thème pour validation, afin que le référent puisse le vérifier.

**Critères d'acceptation** :
- ✅ Endpoint `PATCH /api/workflow/themes/:id/submit`
- ✅ Statuts stricts avec transitions validées
- ✅ Historique des actions visible
- ✅ Notifications automatiques

**Implémentation** :
- Service : `ThemeWorkflowService.php`
- API : `api/workflow.php`
- Tables : `themes`, `theme_status_history`

### Epic E19-NOTES : Annotations et Commentaires

#### US19-2-ANNOTATIONS : Annoter un thème

**En tant que référent pédagogique**, je veux annoter sections et questions, afin de corriger le contenu.

**Critères d'acceptation** :
- ✅ Commentaires attachés à une clé du JSON
- ✅ UI surlignage et bulles
- ✅ IA propose correction (si autorisé tenant)

**Implémentation** :
- Service : `AnnotationService.php`
- API : `api/annotations.php`
- UI : `annotation_editor.js`
- Table : `annotations`

### Epic E19-VERSION : Versioning Automatique

#### US19-3-VERS : Historique des versions

**En tant qu'enseignant**, je veux voir l'historique des versions, afin de comparer et restaurer si besoin.

**Critères d'acceptation** :
- ✅ Chaque modification crée une nouvelle version
- ✅ Diff JSON visible
- ✅ Rollback possible

**Implémentation** :
- API : `api/versions.php`
- UI : `version_diff_viewer.js`
- Table : `theme_versions`

## 🗄️ Architecture de données

### Nouvelles tables

#### 1. `theme_status_history`
Historique des changements de statut

```sql
CREATE TABLE theme_status_history (
    id VARCHAR(50) PRIMARY KEY,
    theme_id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    status_from ENUM('draft', 'pending_review', 'approved', 'published', 'archived'),
    status_to ENUM('draft', 'pending_review', 'approved', 'published', 'archived'),
    actor_user_id VARCHAR(50) NULL,
    comment TEXT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
);
```

#### 2. `annotations`
Annotations et commentaires sur les thèmes

```sql
CREATE TABLE annotations (
    id VARCHAR(50) PRIMARY KEY,
    theme_id VARCHAR(50) NOT NULL,
    theme_version INT NOT NULL DEFAULT 1,
    tenant_id VARCHAR(50) NOT NULL,
    author_user_id VARCHAR(50) NOT NULL,
    json_path VARCHAR(500) NOT NULL,
    annotation_type ENUM('comment', 'suggestion', 'error', 'warning', 'info'),
    content TEXT NOT NULL,
    ai_suggestion TEXT NULL,
    status ENUM('open', 'resolved', 'rejected') DEFAULT 'open',
    resolved_at TIMESTAMP NULL,
    resolved_by VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
);
```

#### 3. `theme_versions`
Historique des versions des thèmes

```sql
CREATE TABLE theme_versions (
    id VARCHAR(50) PRIMARY KEY,
    theme_id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    version INT NOT NULL,
    data JSON NOT NULL,
    title VARCHAR(255) NOT NULL,
    status ENUM('draft', 'pending_review', 'approved', 'published', 'archived'),
    created_by VARCHAR(50) NOT NULL,
    change_summary TEXT NULL,
    diff_metadata JSON DEFAULT NULL,
    is_milestone BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
);
```

#### 4. `review_assignments`
Affectations de révision aux référents

```sql
CREATE TABLE review_assignments (
    id VARCHAR(50) PRIMARY KEY,
    theme_id VARCHAR(50) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    reviewer_user_id VARCHAR(50) NOT NULL,
    assigned_by VARCHAR(50) NOT NULL,
    reviewer_role ENUM('referent', 'direction', 'inspector'),
    status ENUM('pending', 'in_progress', 'completed', 'declined'),
    priority ENUM('low', 'normal', 'high', 'urgent'),
    due_date TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
);
```

#### 5. `workflow_notifications`
Notifications pour le workflow

```sql
CREATE TABLE workflow_notifications (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    theme_id VARCHAR(50) NULL,
    notification_type ENUM('status_change', 'new_annotation', 'review_assigned', 'review_completed', 'publish_request'),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Modifications de la table `themes`

```sql
ALTER TABLE themes MODIFY COLUMN status
    ENUM('draft', 'pending_review', 'approved', 'published', 'archived')
    DEFAULT 'draft';

ALTER TABLE themes ADD COLUMN submitted_at TIMESTAMP NULL;
ALTER TABLE themes ADD COLUMN submitted_by VARCHAR(50) NULL;
ALTER TABLE themes ADD COLUMN reviewed_at TIMESTAMP NULL;
ALTER TABLE themes ADD COLUMN reviewed_by VARCHAR(50) NULL;
ALTER TABLE themes ADD COLUMN published_at TIMESTAMP NULL;
ALTER TABLE themes ADD COLUMN published_by VARCHAR(50) NULL;
```

## 🔌 API Endpoints

### Workflow Management

| Endpoint | Méthode | Description | Rôle requis |
|----------|---------|-------------|-------------|
| `/api/workflow/stats` | GET | Statistiques du workflow | Tous |
| `/api/workflow/themes/:id/submit` | POST | Soumettre pour validation | Teacher |
| `/api/workflow/themes/:id/approve` | POST | Approuver un thème | Referent, Direction |
| `/api/workflow/themes/:id/reject` | POST | Rejeter un thème | Referent, Direction |
| `/api/workflow/themes/:id/publish` | POST | Publier un thème | Direction |
| `/api/workflow/themes/:id/archive` | POST | Archiver un thème | Admin, Direction |
| `/api/workflow/themes/:id/history` | GET | Historique du workflow | Tous |
| `/api/workflow/pending` | GET | Thèmes en attente | Referent, Direction |
| `/api/workflow/my-reviews` | GET | Mes revues assignées | Referent, Direction |
| `/api/workflow/themes/:id/assign-reviewer` | POST | Assigner un référent | Direction |
| `/api/workflow/notifications` | GET | Mes notifications | Tous |

### Annotations Management

| Endpoint | Méthode | Description | Rôle requis |
|----------|---------|-------------|-------------|
| `/api/annotations` | POST | Créer une annotation | Tous |
| `/api/annotations/:id` | GET | Récupérer une annotation | Tous |
| `/api/annotations/:id` | PUT | Mettre à jour | Auteur |
| `/api/annotations/:id` | DELETE | Supprimer | Auteur, Admin |
| `/api/annotations/:id/resolve` | PATCH | Résoudre | Tous |
| `/api/annotations/:id/reject` | PATCH | Rejeter | Tous |
| `/api/annotations/:id/ai-suggestion` | POST | Générer suggestion IA | Tous |
| `/api/annotations/themes/:id` | GET | Annotations d'un thème | Tous |
| `/api/annotations/themes/:id/stats` | GET | Statistiques annotations | Tous |

### Versions Management

| Endpoint | Méthode | Description | Rôle requis |
|----------|---------|-------------|-------------|
| `/api/versions/themes/:id` | GET | Historique des versions | Tous |
| `/api/versions/:id` | GET | Détails d'une version | Tous |
| `/api/versions/compare` | GET | Comparer deux versions | Tous |
| `/api/versions/:id/restore` | POST | Restaurer une version | Teacher, Admin |

## 🎨 Interfaces utilisateur

### 1. Workflow Management (`workflow_management.js`)

**Fonctionnalités** :
- Dashboard avec statistiques par statut
- Liste des thèmes en attente de validation
- Mes revues assignées avec priorité et échéances
- Actions rapides : approuver, rejeter, examiner
- Notifications en temps réel

### 2. Annotation Editor (`annotation_editor.js`)

**Fonctionnalités** :
- Mode annotation activable
- Sélection de texte pour annoter
- Types d'annotations : commentaire, suggestion, erreur, attention, info
- Suggestions IA générées automatiquement
- Résolution et rejet d'annotations
- Filtres par statut et type
- Statistiques des annotations

### 3. Version Diff Viewer (`version_diff_viewer.js`)

**Fonctionnalités** :
- Timeline des versions avec milestones
- Sélection de deux versions à comparer
- Visualisation du diff avec changements colorés
- Résumé des modifications (ajouts, suppressions, modifications)
- Comparaison côte à côte
- Restauration de version
- Export du diff en JSON

## 🔐 Sécurité et permissions

### Matrice de permissions

| Action | Teacher | Referent | Direction | Admin |
|--------|---------|----------|-----------|-------|
| Soumettre thème | ✅ (propre) | ✅ | ✅ | ✅ |
| Approuver thème | ❌ | ✅ | ✅ | ✅ |
| Rejeter thème | ❌ | ✅ | ✅ | ✅ |
| Publier thème | ❌ | ❌ | ✅ | ✅ |
| Créer annotation | ✅ | ✅ | ✅ | ✅ |
| Modifier annotation | ✅ (propre) | ✅ (propre) | ✅ (propre) | ✅ |
| Supprimer annotation | ✅ (propre) | ✅ (propre) | ✅ | ✅ |
| Voir historique | ✅ | ✅ | ✅ | ✅ |
| Restaurer version | ✅ (propre) | ✅ | ✅ | ✅ |
| Assigner reviewer | ❌ | ❌ | ✅ | ✅ |

### Validation et contrôles

1. **Soumission** : Le thème doit être complet (titre, contenu, au moins questions ou flashcards)
2. **Approbation** : Aucune annotation critique ouverte
3. **Publication** : Thème doit être approuvé
4. **Isolation tenant** : Toutes les requêtes vérifient le tenant_id

## 🔄 Workflow états et transitions

```
                        ┌─────────┐
                        │  Draft  │
                        └────┬────┘
                             │ submit
                             ↓
                     ┌───────────────┐
           ┌─reject─│ Pending Review │
           │        └───────┬───────┘
           │                │ approve
           ↓                ↓
        ┌─────┐      ┌──────────┐
        │Draft│      │ Approved │
        └─────┘      └─────┬────┘
                           │ publish
                           ↓
                    ┌───────────┐
                    │ Published │
                    └───────────┘
                           │ archive
                           ↓
                    ┌──────────┐
                    │ Archived │
                    └──────────┘
```

## 📊 Triggers et automatisation

### Triggers SQL

1. **`trg_themes_version_on_update`** : Crée automatiquement une version lors de la modification d'un thème
2. **`trg_themes_status_history`** : Enregistre automatiquement les changements de statut dans l'historique

### Notifications automatiques

- Soumission → Notifie tous les référents du tenant
- Approbation → Notifie l'auteur du thème
- Rejet → Notifie l'auteur avec le commentaire
- Publication → Notifie l'auteur
- Nouvelle annotation → Notifie l'auteur du thème
- Annotation résolue → Notifie l'auteur de l'annotation

## 🚀 Installation et migration

### 1. Appliquer la migration

```bash
mysql -u root -p orchestrator < orchestrator/sql/migrations/019_sprint19_multi_review_workflow.sql
```

### 2. Vérifier les tables

```sql
SHOW TABLES LIKE 'theme_%';
SHOW TABLES LIKE 'annotation%';
SHOW TABLES LIKE 'review_%';
SHOW TABLES LIKE 'workflow_%';
```

### 3. Tester les triggers

```sql
-- Vérifier les triggers
SHOW TRIGGERS WHERE `Table` = 'themes';
```

## 📝 Utilisation

### Scénario 1 : Enseignant soumet un thème

```javascript
// 1. Créer un thème (draft par défaut)
POST /api/themes
{
  "title": "Les fractions",
  "content": { ... }
}

// 2. Soumettre pour validation
POST /api/workflow/themes/{id}/submit
{
  "comment": "Thème prêt pour validation"
}
```

### Scénario 2 : Référent annote et approuve

```javascript
// 1. Récupérer les thèmes en attente
GET /api/workflow/pending

// 2. Ajouter une annotation
POST /api/annotations
{
  "theme_id": "...",
  "json_path": "questions[0].text",
  "annotation_type": "suggestion",
  "content": "Reformuler la question pour plus de clarté"
}

// 3. Générer suggestion IA
POST /api/annotations/{id}/ai-suggestion

// 4. Approuver le thème
POST /api/workflow/themes/{id}/approve
{
  "comment": "Contenu validé"
}
```

### Scénario 3 : Direction publie

```javascript
// 1. Récupérer les thèmes approuvés
GET /api/themes?workflow_status=approved

// 2. Publier
POST /api/workflow/themes/{id}/publish
{
  "comment": "Publication officielle"
}
```

### Scénario 4 : Comparer des versions

```javascript
// 1. Récupérer l'historique
GET /api/versions/themes/{id}

// 2. Comparer deux versions
GET /api/versions/compare?version1={v1_id}&version2={v2_id}

// 3. Restaurer une version si besoin
POST /api/versions/{version_id}/restore
```

## 🧪 Tests

### Tests à effectuer

1. **Workflow** :
   - ✅ Soumission d'un thème draft
   - ✅ Rejet avec commentaire obligatoire
   - ✅ Approbation avec vérification annotations
   - ✅ Publication par direction uniquement
   - ✅ Transitions interdites (ex: draft → published directement)

2. **Annotations** :
   - ✅ Création d'annotation
   - ✅ Génération suggestion IA
   - ✅ Résolution d'annotation
   - ✅ Filtrage par statut et type
   - ✅ Permissions (seul auteur peut modifier)

3. **Versioning** :
   - ✅ Création automatique de version à chaque modification
   - ✅ Comparaison de versions
   - ✅ Restauration de version
   - ✅ Milestones (publication = milestone)

## 📈 Métriques et KPIs

### Métriques disponibles

- Nombre de thèmes par statut
- Temps moyen de validation
- Nombre d'annotations par thème
- Taux d'approbation vs rejet
- Nombre de versions par thème
- Activité des référents

### Requêtes SQL utiles

```sql
-- Thèmes en attente depuis plus de 7 jours
SELECT t.id, t.title, t.submitted_at,
       DATEDIFF(NOW(), t.submitted_at) as days_waiting
FROM themes t
WHERE t.status = 'pending_review'
  AND t.submitted_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Top 10 référents les plus actifs
SELECT u.firstname, u.lastname, COUNT(*) as reviews_count
FROM theme_status_history h
JOIN users u ON h.actor_user_id = u.id
WHERE h.status_to IN ('approved', 'draft')
  AND u.role = 'referent'
GROUP BY u.id
ORDER BY reviews_count DESC
LIMIT 10;

-- Annotations non résolues par thème
SELECT t.id, t.title, COUNT(a.id) as open_annotations
FROM themes t
JOIN annotations a ON t.id = a.theme_id
WHERE a.status = 'open'
GROUP BY t.id
ORDER BY open_annotations DESC;
```

## 🔮 Améliorations futures

### Fonctionnalités envisagées

1. **Workflow avancé** :
   - Validation multi-niveaux (référent → responsable → direction)
   - Délais de validation configurables
   - Rappels automatiques

2. **Annotations enrichies** :
   - Annotations audio/vidéo
   - Annotations collaboratives en temps réel
   - Résolution de conflits entre annotations

3. **Intelligence artificielle** :
   - Détection automatique d'erreurs
   - Suggestions de corrections avancées
   - Analyse de qualité pédagogique

4. **Analytique** :
   - Dashboard de suivi du workflow
   - Rapports de qualité
   - Benchmarking entre établissements

## 📚 Références

- [Documentation OpenAPI Sprint 19](../orchestrator/docs/openapi-sprint19-workflow.yaml)
- [Migration SQL](../orchestrator/sql/migrations/019_sprint19_multi_review_workflow.sql)
- [Service Workflow](../orchestrator/services/ThemeWorkflowService.php)
- [Service Annotations](../orchestrator/services/AnnotationService.php)

## 👥 Rôles et responsabilités

- **Enseignant** : Crée et soumet des thèmes
- **Référent pédagogique** : Valide, annote et approuve
- **Direction** : Publie les thèmes approuvés
- **Admin** : Gestion complète + paramétrage

## ✅ Checklist de déploiement

- [x] Migration SQL appliquée
- [x] Services PHP créés et testés
- [x] Endpoints API documentés
- [x] Interfaces UI développées
- [x] Documentation complète
- [x] Tests fonctionnels effectués
- [ ] Tests de charge
- [ ] Formation utilisateurs
- [ ] Déploiement production

---

**Auteur** : Claude AI
**Date de création** : 2025-11-14
**Dernière mise à jour** : 2025-11-14
