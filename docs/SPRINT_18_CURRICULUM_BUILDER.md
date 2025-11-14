# Sprint 18 - Curriculum Builder & Séquences Pédagogiques

## Vue d'ensemble

Le Sprint 18 introduit un **Curriculum Builder** permettant aux enseignants de structurer leur programme annuel en séquences pédagogiques avec objectifs et missions. Les élèves peuvent visualiser leur progression long-terme dans une timeline interactive.

**Date de livraison:** 2025-11-14
**Statut:** ✅ Implémenté
**Niveau de risque:** High

---

## 🎯 Objectifs du Sprint

### Personas concernés
- **Principal:** Enseignant
- **Secondaire:** Direction
- **Bénéficiaire:** Élève

### Fonctionnalités principales

1. **Curriculum Builder** (Epic E18-CURR)
   - Créer un programme annuel avec métadonnées (titre, année, niveau)
   - Structurer en séquences pédagogiques
   - Définir objectifs et compétences par séquence
   - Lier missions et thèmes IA aux séquences
   - Réorganiser par drag-drop

2. **Vue Enseignant** (Epic E18-VIEW)
   - Dashboard de suivi avec statistiques
   - Visualisation de l'avancement par séquence
   - Export PDF du curriculum complet
   - Filtrage par classe

3. **Vue Élève** (Epic E18-STUDENT)
   - Timeline du parcours annuel
   - Indicateurs de progression (en avance/à l'heure/en retard)
   - Visualisation des missions par séquence
   - Accès aux objectifs pédagogiques

---

## 📊 Architecture

### Base de données

**Nouvelles tables créées:**

```sql
-- Programme annuel
curriculum (
    id, tenant_id, class_id, teacher_id,
    title, description, year_start, year_end, level,
    status, metadata, created_at, updated_at
)

-- Séquences pédagogiques
curriculum_sequences (
    id, curriculum_id, label, description,
    position, duration_weeks, start_date, end_date,
    objectives (JSON), skills (JSON), status,
    completion_percent, metadata, created_at, updated_at
)

-- Lien séquence ↔ missions
curriculum_sequence_assignments (
    id, sequence_id, assignment_id,
    position, is_required, created_at
)

-- Lien séquence ↔ thèmes IA
curriculum_sequence_themes (
    id, sequence_id, theme_id,
    position, created_at
)

-- Progression élève par séquence
curriculum_student_progress (
    id, sequence_id, student_id,
    completion_percent, completed_objectives (JSON),
    status, last_activity_at, created_at, updated_at
)
```

**Procédures stockées:**
- `UpdateSequenceCompletion(sequence_id)` - Recalcule le taux d'avancement d'une séquence
- `UpdateStudentSequenceProgress(sequence_id, student_id)` - Recalcule la progression d'un élève

### API Endpoints

**Base:** `/api/curriculum`

#### Gestion Curriculum

```
GET    /api/curriculum                    - Liste des curriculums
POST   /api/curriculum                    - Créer un curriculum
GET    /api/curriculum/{id}               - Détails + séquences
PATCH  /api/curriculum/{id}               - Modifier
DELETE /api/curriculum/{id}               - Archiver (soft delete)
```

#### Gestion Séquences

```
POST   /api/curriculum/{id}/sequences                - Créer une séquence
PATCH  /api/curriculum/sequence/{seq_id}             - Modifier
DELETE /api/curriculum/sequence/{seq_id}             - Archiver
PATCH  /api/curriculum/sequence/{seq_id}/reorder     - Réorganiser (drag-drop)
```

#### Liaisons Missions/Thèmes

```
POST   /api/curriculum/sequence/{seq_id}/link-assignment    - Lier une mission
DELETE /api/curriculum/sequence/{seq_id}/unlink-assignment  - Délier
POST   /api/curriculum/sequence/{seq_id}/link-theme         - Lier un thème
DELETE /api/curriculum/sequence/{seq_id}/unlink-theme       - Délier
```

#### Vue Élève

```
GET    /api/curriculum/student/{uuid}     - Progression complète de l'élève
```

#### Export

```
GET    /api/curriculum/{id}/export-pdf    - Télécharger le PDF du curriculum
```

### Frontend

#### Orchestrator (Enseignant)

**`/orchestrator/ui/curriculum_builder.js`**
- Classe JavaScript pour créer/modifier un curriculum
- Gestion des séquences avec drag-drop (HTML5 Drag API)
- Modal pour édition d'objectifs pédagogiques
- Support multi-objectifs par séquence

**`/orchestrator/ui/curriculum_dashboard.js`**
- Dashboard de suivi avec stats globales
- Cartes de progression par séquence
- Barre de progression classe
- Export PDF intégré

#### ErgoMate (Élève)

**`/ergomate/view-student-path.js`**
- Timeline verticale des séquences
- Indicateur de statut (en avance/à l'heure/en retard)
- Détails des missions à faire
- Visualisation des objectifs et compétences

---

## 🔒 Sécurité & Conformité

### Authentification
- JWT requis sur tous les endpoints
- Vérification tenant_id systématique
- RBAC: permission `curriculum:read/write/delete`

### Isolation multi-tenant
- Tous les `SELECT` filtrent sur `tenant_id`
- Vérifications croisées curriculum ↔ tenant

### Format des données
- **Par défaut:** `application/x-www-form-urlencoded`
- **Support:** `application/json`
- Header optionnel: `X-Orchestrator-Id` pour compatibilité

### Observabilité
- Télémétrie sur création/modification/suppression
- Logs dans `sync_logs` avec `curriculum_id`
- Tracking des réorganisations de séquences

---

## 📖 Utilisation

### Créer un curriculum (côté enseignant)

```javascript
const builder = new CurriculumBuilder('container-id', {
    apiBaseUrl: '/api',
    tenantId: 'school-123',
    teacherId: 'teacher-456',
    classId: 'class-l1-info',
    onSave: (curriculum) => {
        console.log('Curriculum sauvegardé:', curriculum);
    }
});
```

### Afficher le dashboard enseignant

```javascript
const dashboard = new CurriculumDashboard('dashboard-container', {
    apiBaseUrl: '/api',
    tenantId: 'school-123',
    teacherId: 'teacher-456',
    classId: 'class-l1-info',
    onEdit: (curriculumId) => {
        // Ouvrir le builder en mode édition
    }
});
```

### Afficher la vue élève (ErgoMate)

```javascript
const studentPath = new StudentPathView('student-path-container', {
    apiBaseUrl: 'https://orchestrator.studymate.com/api',
    studentUuid: 'uuid-eleve-123',
    tenantId: 'school-123',
    onMissionClick: (assignmentId) => {
        // Démarrer la mission
    }
});
```

---

## 🧪 Tests

### Tests manuels requis

1. **Création de curriculum**
   - Créer un curriculum avec toutes les métadonnées
   - Vérifier que `curriculum_id` est généré
   - Contrôler l'isolation tenant

2. **Gestion des séquences**
   - Ajouter 3+ séquences avec objectifs
   - Drag-drop pour réorganiser
   - Vérifier que `position` est bien mis à jour
   - Modifier/supprimer une séquence

3. **Liaison missions/thèmes**
   - Lier une mission existante à une séquence
   - Vérifier le compteur `assignment_count`
   - Lier un thème IA
   - Délier et vérifier la suppression

4. **Progression élève**
   - Compléter une mission liée à une séquence
   - Vérifier que `completion_percent` est recalculé
   - Tester l'indicateur "en avance/à l'heure/en retard"

5. **Export PDF**
   - Générer le PDF d'un curriculum complet
   - Vérifier que toutes les séquences apparaissent
   - Contrôler le formatage

### Points de vigilance

- **Performance:** Avec 10+ séquences, vérifier que le drag-drop reste fluide
- **Calcul de progression:** La procédure `UpdateStudentSequenceProgress` doit être appelée après chaque modification de stats
- **Dates:** Gérer les cas où `start_date` ou `end_date` sont NULL
- **JSON:** Valider que `objectives` et `skills` sont bien des tableaux

---

## 🚀 Migration

### Appliquer la migration

```bash
# Depuis le dossier orchestrator
mysql -u root -p studymate_orchestrator < sql/migrations/018_sprint18_curriculum_builder.sql
```

### Données de démonstration

La migration inclut un curriculum de démo avec 3 séquences pour `demo-school`.

---

## 📋 User Stories implémentées

### ✅ US18-1: Créer un curriculum annuel
- Endpoint `POST /api/curriculum`
- UI `curriculum_builder.js`
- Drag-drop pour réorganiser séquences

### ✅ US18-2: Lier missions et thèmes à une séquence
- Endpoints `link-assignment` et `link-theme`
- UI pour sélection dans le builder
- Support thèmes IA générés

### ✅ US18-3: Vue enseignant du curriculum
- Dashboard `curriculum_dashboard.js`
- Affichage complétion séquence via stats
- Filtrage par classe
- Export PDF

### ✅ US18-4: Vue élève du parcours annuel
- Timeline `view-student-path.js` (ErgoMate)
- Indicateur "Tu es en avance / à l'heure / en retard"
- Données chargées depuis Orchestrator

---

## 🔄 Intégration avec les sprints précédents

- **Sprint 2:** Utilise la table `assignments` pour lier missions
- **Sprint 10:** Intègre les thèmes générés par IA Copilot
- **Sprint 11:** Réutilise le pattern UI de `ThemeLibrary`
- **Sprint 15:** Respecte IA Governance et RGPD pour les données élèves
- **Sprint 17:** Compatible avec le mode démo

---

## 📝 Notes techniques

### Drag & Drop
- Utilise l'API HTML5 Drag & Drop native
- Events: `dragstart`, `dragover`, `dragend`, `drop`
- Mise à jour automatique des positions via `/reorder`

### Calcul de progression
Le taux d'avancement d'une séquence pour un élève est calculé ainsi:

```
completion_percent = (missions_complétées / missions_requises) × 100
```

Une mission est considérée complétée si `stats.completion_percent >= 80%`.

### Indicateur "en avance/retard"
Basé sur la comparaison entre:
- **Progression réelle:** moyenne des séquences complétées
- **Progression attendue:** calculée selon la date actuelle et les dates de début/fin du curriculum

```
si (progression_réelle - progression_attendue) >= 10% → En avance
si -10% <= diff <= 10% → À l'heure
si diff < -10% → En retard
```

### Export PDF
Le service `CurriculumPDFExporter.php` génère un HTML stylisé. Pour une version production:
- Installer une lib comme **TCPDF**, **mPDF** ou **Dompdf**
- Décommenter le code dans `export()` et adapter

---

## 🐛 Issues connues / TODO

- [ ] Modal "Lier missions/thèmes" à implémenter complètement
- [ ] Export PDF nécessite une bibliothèque PDF en production
- [ ] Stats détaillées par élève dans le dashboard enseignant
- [ ] Notifications temps réel (WebSocket) lors de mise à jour de séquence
- [ ] Gestion des duplications de curriculum d'une année sur l'autre

---

## 👥 Contact & Support

**Product Owner:** Direction pédagogique
**Tech Lead:** Équipe Backend StudyMate
**Documentation:** `/docs/SPRINT_18_CURRICULUM_BUILDER.md`

---

**Version:** 1.0
**Dernière mise à jour:** 2025-11-14
