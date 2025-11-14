# Sprint 16: Pilotage Enseignants, Qualité & Risques Élèves

**Version:** BMAD_SPRINT_16_TEACHER_QUALITY_ANALYTICS
**Status:** ✅ Completed
**Date:** 2025-11-14
**Duration:** 2 weeks
**Risk Level:** High

## 📋 Vue d'ensemble

Le Sprint 16 introduit les **dashboards de pilotage pour la direction et les référents pédagogiques**, permettant de:
- 📊 Mesurer la **performance pédagogique des enseignants**
- ⚠️ Détecter les **élèves à risque** (décrochage, retards, performances faibles)
- 🔍 Suivre les **problèmes de qualité** remontés par l'IA et les élèves
- 👁️ Offrir une **vue inspecteur** en lecture seule pour l'évaluation externe

## 🎯 Objectifs

### Personas
- **Primary:** Direction (school principals)
- **Secondary:** Référent pédagogique (pedagogical coordinators)
- **Tertiary:** Inspecteur académique (academic inspectors)

### Fonctionnalités clés
1. **Teacher Quality Dashboard** - KPIs enseignants avec comparaisons
2. **Student Risk Analytics** - Détection et remédiation des élèves en difficulté
3. **Quality Feed** - Fil d'actualité des problèmes pédagogiques
4. **Inspector View** - Vue en lecture seule pour évaluation externe

## 🏗️ Architecture

### Nouveaux endpoints

```
GET  /api/analytics/teacher-kpi     - Teacher performance metrics
GET  /api/analytics/risk            - Student risk detection
POST /api/analytics/risk            - Update risk status
GET  /api/feed/quality              - Quality issues feed
POST /api/feed/quality              - Create quality issue
PATCH /api/feed/quality             - Update quality issue
```

### Nouvelles tables

```sql
teacher_kpi              - Teacher performance metrics
risk_student             - Student risk scores & detection
quality_feed             - Quality issues tracking
class_risk_aggregate     - Class-level risk aggregation
```

## 📊 Epic 1: Teacher Quality Dashboard (E16-TCH-QUAL)

### User Story: US16-1-TCH-KPI
**En tant que** direction
**Je veux** visualiser la performance pédagogique d'un enseignant
**Afin de** piloter la qualité de l'établissement

### Critères d'acceptation
- ✅ KPIs: engagement élèves, taux de complétion missions, cohérence thèmes, notes moyennes
- ✅ Comparatif enseignant vs moyenne établissement
- ✅ Export PDF

### Endpoints

#### GET /api/analytics/teacher-kpi

**Query Parameters:**
- `teacher_id` (optional) - If not provided, returns all teachers summary
- `period_start` (optional) - Default: 30 days ago
- `period_end` (optional) - Default: today
- `export` (optional) - Set to "pdf" for PDF export

**Response:**
```json
{
  "tenant_id": "school-123",
  "teacher_id": "teacher-456",
  "period": {
    "start": "2025-10-15",
    "end": "2025-11-14"
  },
  "kpi": {
    "teacher": {
      "id": "teacher-456",
      "name": "Jean Dupont",
      "email": "jean.dupont@school.fr"
    },
    "engagement": {
      "total_students": 120,
      "active_students": 95,
      "engagement_rate": 79.2,
      "vs_tenant_avg": +5.3
    },
    "missions": {
      "total_created": 45,
      "total_pushed": 42,
      "completion_rate": 93.3
    },
    "themes": {
      "created_count": 12,
      "avg_quality": 85.5,
      "ai_issues_count": 3
    },
    "student_performance": {
      "avg_score": 72.4,
      "avg_mastery": 68.2,
      "vs_tenant_avg": +3.1
    },
    "overall_score": 78.5
  }
}
```

**KPI Calculation:**
- **Engagement Rate:** Active students (last 7 days) / Total students
- **Completion Rate:** Pushed assignments / Total assignments
- **Quality Score:** Based on theme structure, content richness, AI validation
- **Overall Score:** Weighted average (Engagement 30% + Completion 25% + Quality 25% + Performance 20%)

## ⚠️ Epic 2: Student Risk Analytics (E16-RISK)

### User Story: US16-2-RISK-STUDENT
**En tant que** référent pédagogique
**Je veux** identifier les élèves à risque
**Afin de** planifier la remédiation

### Critères d'acceptation
- ✅ Score risque basé sur: retards, abandons, scores bas, temps élevé
- ✅ Heatmap par classe
- ✅ Recommandations IA de remédiation

### Endpoints

#### GET /api/analytics/risk

**Query Parameters:**
- `class_id` (optional) - Filter by class
- `risk_level` (optional) - low, medium, high, critical
- `status` (optional) - detected, in_review, remediation_planned, resolved
- `recalculate` (optional) - Force recalculation of risk scores

**Response:**
```json
{
  "tenant_id": "school-123",
  "students_at_risk": [
    {
      "id": "risk-789",
      "student": {
        "id": "student-123",
        "uuid": "uuid-scolaire-456",
        "name": "Marie Martin",
        "class_id": "class-1",
        "class_name": "Terminale A"
      },
      "risk": {
        "score": 75.5,
        "level": "high",
        "factors": {
          "delay": 60.0,
          "abandonment": 40.0,
          "low_performance": 70.0,
          "time_inefficiency": 20.0,
          "engagement_drop": 80.0
        }
      },
      "metrics": {
        "missions_late": 3,
        "missions_abandoned": 2,
        "avg_score": 45.2,
        "avg_time_minutes": 15,
        "last_activity_days_ago": 12
      },
      "recommendations": [
        {
          "type": "engagement_boost",
          "title": "Réengagement",
          "description": "L'élève montre des signes de désengagement.",
          "actions": [
            "Contacter l'élève rapidement",
            "Identifier les blocages ou difficultés",
            "Proposer des contenus plus ludiques et variés"
          ]
        }
      ],
      "priority": 7,
      "status": "detected",
      "detected_at": "2025-11-10T14:30:00Z"
    }
  ],
  "heatmap": [
    {
      "class_id": "class-1",
      "class_name": "Terminale A",
      "total_students": 30,
      "students_at_risk": 8,
      "risk_rate": 26.7,
      "avg_risk_score": 42.3,
      "breakdown": {
        "critical": 1,
        "high": 3,
        "medium": 4,
        "low": 0
      }
    }
  ],
  "summary": {
    "total_at_risk": 45,
    "critical": 5,
    "high": 15,
    "medium": 20,
    "low": 5
  }
}
```

#### POST /api/analytics/risk

**Body (application/x-www-form-urlencoded):**
```
risk_id=risk-789
status=in_review
notes=Entretien prévu le 15/11
```

**Risk Score Calculation:**
- **Delay Score:** Late assignments × 20 (max 100)
- **Low Performance Score:** 100 - avg_score
- **Engagement Drop Score:** Days since activity × 5 (max 100)
- **Overall Risk Score:** Weighted average (Delay 25% + Abandonment 20% + Performance 30% + Time 10% + Engagement 15%)

**Risk Levels:**
- **Critical:** score ≥ 75 (Priority 10)
- **High:** score ≥ 50 (Priority 7)
- **Medium:** score ≥ 25 (Priority 4)
- **Low:** score < 25 (Priority 1)

## 🔍 Epic 3: Quality Feed (E16-FEED)

### User Story: US16-4-FEED-QUALITY
**En tant que** référent pédagogique
**Je veux** voir les problèmes détectés par IA et les retours élèves
**Afin de** améliorer la qualité des contenus

### Critères d'acceptation
- ✅ Feed listant: incohérences IA, retours élèves, problèmes de structure
- ✅ Lien direct vers thème concerné
- ✅ Statut: à traiter / résolu

### Endpoints

#### GET /api/feed/quality

**Query Parameters:**
- `theme_id` (optional)
- `teacher_id` (optional)
- `status` (optional) - open, in_progress, resolved, ignored, wont_fix
- `severity` (optional) - info, warning, error, critical
- `issue_type` (optional) - ai_incoherence, student_feedback, structure_problem, content_error, other
- `limit` (optional) - Max 100, default 50
- `offset` (optional) - Default 0

**Response:**
```json
{
  "tenant_id": "school-123",
  "issues": [
    {
      "id": "qfeed-123",
      "theme": {
        "id": "theme-456",
        "title": "Les fractions"
      },
      "teacher": {
        "id": "teacher-789",
        "name": "Jean Dupont"
      },
      "issue": {
        "type": "ai_incoherence",
        "severity": "warning",
        "title": "Incohérence dans les explications",
        "description": "L'explication de la question 3 contredit celle de la question 1.",
        "source": "ai_analysis"
      },
      "status": "open",
      "affected_students_count": 25,
      "detected_by": {
        "id": "system",
        "name": "AI Quality System"
      },
      "created_at": "2025-11-10T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  },
  "summary": {
    "total": 150,
    "open": 45,
    "in_progress": 30,
    "resolved": 75,
    "by_severity": {
      "critical": 5,
      "error": 20,
      "warning": 100
    }
  }
}
```

#### POST /api/feed/quality

**Body (application/x-www-form-urlencoded):**
```
theme_id=theme-456
issue_type=structure_problem
severity=warning
title=Questions mal ordonnées
description=L'ordre des questions ne suit pas une progression logique
source=manual
```

#### PATCH /api/feed/quality

**Body (application/x-www-form-urlencoded):**
```
issue_id=qfeed-123
status=resolved
resolution_notes=Questions réorganisées et thème mis à jour
```

## 👁️ Epic 4: Inspector View (E16-INSPECTOR)

### User Story: US16-3-INSPECT-ROLE
**En tant que** inspecteur académique
**Je veux** accéder aux statistiques sans modifier les données
**Afin de** évaluer objectivement un établissement

### Critères d'acceptation
- ✅ RBAC dédié inspecteur = lecture seule
- ✅ Accès à: teacher KPI, risk map, analytics
- ✅ Aucune donnée élève nominative visible

### RBAC Permissions

```php
'teacher_kpi' => [
    'read' => ['admin', 'direction', 'inspector'],
    'export' => ['admin', 'direction', 'inspector'],
],

'risk' => [
    'read' => ['admin', 'teacher', 'direction', 'inspector', 'referent'],
    'update' => ['admin', 'direction', 'referent'],
    'export' => ['admin', 'direction', 'referent'],
],

'quality_feed' => [
    'read' => ['admin', 'teacher', 'direction', 'inspector', 'referent'],
    'create' => ['admin', 'teacher', 'direction', 'referent'],
    'update' => ['admin', 'direction', 'referent'],
    'assign' => ['admin', 'direction', 'referent'],
],
```

**Note:** Inspector role has READ-ONLY access to all analytics but CANNOT modify data.

## 🔒 Sécurité & RGPD

### Tenant Isolation
- ✅ Toutes les requêtes filtrent par `tenant_id`
- ✅ Middleware `enforceTenantIsolation()` appliqué

### RBAC
- ✅ Permissions granulaires par rôle (admin, direction, teacher, inspector, referent)
- ✅ Teachers can only see their own classes
- ✅ Inspectors have read-only access

### Anonymisation
- ✅ Inspector view: Students identified by UUID only (no personal names)
- ✅ RGPD-compliant data handling

### Observability
- ✅ All API calls logged in `sync_logs` table
- ✅ Telemetry middleware tracks performance
- ✅ Audit trail for risk status changes and quality issue resolution

## 📦 Files Created/Modified

### New Files
```
orchestrator/sql/migrations/SPRINT16_teacher_quality_analytics.sql
orchestrator/api/analytics/teacher_kpi.php
orchestrator/api/analytics/risk.php
orchestrator/api/feed/quality.php
orchestrator/docs/openapi-sprint16-analytics.yaml
SPRINT_16_README.md
```

### Modified Files
```
orchestrator/api/_middleware_rbac.php  - Added Sprint 16 permissions
```

## 🧪 Testing

### Manual Testing

```bash
# 1. Teacher KPI - Get all teachers
curl -X GET "http://localhost:8000/api/analytics/teacher-kpi" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Teacher KPI - Specific teacher
curl -X GET "http://localhost:8000/api/analytics/teacher-kpi?teacher_id=teacher-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Risk Analytics - Get all students at risk
curl -X GET "http://localhost:8000/api/analytics/risk?risk_level=high" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Risk Analytics - Recalculate
curl -X GET "http://localhost:8000/api/analytics/risk?recalculate=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 5. Risk Analytics - Update status
curl -X POST "http://localhost:8000/api/analytics/risk" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "risk_id=risk-123&status=in_review&notes=Entretien planifié"

# 6. Quality Feed - Get open issues
curl -X GET "http://localhost:8000/api/feed/quality?status=open&severity=critical" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 7. Quality Feed - Create issue
curl -X POST "http://localhost:8000/api/feed/quality" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "theme_id=theme-123&issue_type=ai_incoherence&severity=warning&title=Problem&description=Details"

# 8. Quality Feed - Resolve issue
curl -X PATCH "http://localhost:8000/api/feed/quality" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "issue_id=qfeed-123&status=resolved&resolution_notes=Fixed"
```

## 🚀 Deployment

### Database Migration

```bash
# Run Sprint 16 migration
mysql -u root -p studymate_orchestrator < orchestrator/sql/migrations/SPRINT16_teacher_quality_analytics.sql
```

### Configuration

No additional configuration required. All endpoints use existing JWT authentication and tenant isolation.

## 📊 Performance

### Caching
- Teacher KPI queries can be cached (recommended 5-15 minutes)
- Risk calculations should be triggered periodically (e.g., daily cron job)
- Quality feed queries are real-time

### Optimization
- Indexes on `teacher_kpi.overall_score`, `risk_student.risk_score`, `quality_feed.severity`
- Pagination for quality feed (max 100 results per page)
- Tenant-scoped queries prevent cross-tenant data leaks

## 🎓 Best Practices

### For Direction
1. Review teacher KPIs weekly
2. Export PDF reports for meetings
3. Compare individual teachers vs tenant average
4. Track improvement over time

### For Référents
1. Check risk dashboard daily
2. Prioritize critical/high risk students
3. Follow up on AI recommendations
4. Update risk status after interventions
5. Monitor quality feed for recurring issues

### For Teachers
1. Review personal KPIs regularly
2. Address quality issues promptly
3. Monitor at-risk students in own classes
4. Improve content based on AI feedback

### For Inspectors
1. Use read-only access for evaluation
2. Export reports for documentation
3. Compare across multiple schools (if multi-tenant inspector)
4. Focus on aggregated metrics, not individual student data

## 🔗 Related Documentation

- [OpenAPI Specification](orchestrator/docs/openapi-sprint16-analytics.yaml)
- [RBAC Security Guide](orchestrator/docs/RBAC_SECURITY_GUIDE.md)
- [Sprint 14: Admin & Tenant Management](SPRINT_14_README.md)
- [Sprint 15: IA Governance & RGPD](SPRINT_15_README.md)

## 📝 Changelog

### v1.0.0 (2025-11-14)
- ✅ Initial implementation of Sprint 16
- ✅ Teacher KPI dashboard
- ✅ Student risk detection & remediation
- ✅ Quality feed for pedagogical issues
- ✅ Inspector read-only view
- ✅ RBAC permissions updated
- ✅ OpenAPI documentation

## 🤝 Support

For questions or issues:
- Technical: support@studymate.com
- Documentation: docs@studymate.com
- GitHub Issues: [StudyMate-SchoolOrchestrator/issues](https://github.com/MehdyDriouech/StudyMate-SchoolOrchestrator/issues)

---

**Sprint completed by:** Claude AI
**Review date:** 2025-11-14
**Status:** ✅ Ready for Testing
