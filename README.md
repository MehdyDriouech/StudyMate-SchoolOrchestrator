# 🎓 Study-mate School Orchestrator

**Version** : 1.0.0  
**Date** : 2025-11-13  
**Auteur** : Mehdy Driouech

---

## 📋 Vue d'ensemble

**StudyMate School Orchestrator** est la plateforme institutionnelle connectée à **ErgoMate**, conçue pour que les écoles et enseignants puissent :

- 📊 **Superviser** la progression des étudiants
- 📅 **Planifier** des activités pédagogiques (quiz, flashcards, fiches)
- 📚 **Créer et partager** des contenus avec Mistral AI
- 🔄 **Synchroniser** les données d'apprentissage avec ErgoMate
- 📈 **Générer** des rapports et statistiques

---

## ✨ Fonctionnalités 

- **Orchestrator** : backend multi-tenant, API pédagogique, UI prof/direction/admin, intégration IA.
- **Suite de création & Catalogue interne** : création/édition de thèmes, validation par référent, publication.
- **Analytics & IA** : KPIs, heatmaps, alertes, copilote IA enseignant, rapports.
- **Social & collaboratif** : leaderboards, sessions de révision synchronisées.
- **Ops & institutionnel** : backups, diagnostic système, API académique, export QTI/ENT/LMS.

---

## 🏗️ Architecture

  orchestrator/
    core/
      config.php
      config.local.php (optionnel, non versionné)
      constants.php
      bootstrap.php
    api/
      health.php
      students.php
      assignments.php
      analytics.php
      ai.php
      themes.php
      catalog.php
      social.php
      academic.php
      system_diagnostic.php
      _inc/
        db.php
        auth.php
        tenant.php
        rbac.php
        log.php
        telemetry.php
        rate_limit.php
    services/
      mailer.php
      notify.php
      ai_client.php
      ai_postprocess.php
      schema_validator.php
      theme_service.php
      catalog_service.php
      analytics_service.php
      backup_service.php
      export_qti.php
      converters/
        quizlet_import.php
        kahoot_import.php
        qti_import.php
        qti_export.php
    jobs/
      export_telemetry.php
      backup_weekly.php
    ui/
      public/
        index.html
        css/
          main.css
        js/
          app.js
          services/
            api.js
          view/
            view-dashboard-prof.js
            view-dashboard-dir.js
            view-assignments.js
            view-theme-editor.js
            view-catalog.js
            view-analytics.js
            view-admin.js
            view-social.js
          features/
            feature-auth.js
            feature-assignments.js
            feature-analytics.js
            feature-theme-editor.js
            feature-catalog.js
            feature-social.js
            feature-system-diagnostic.js


  db/
    migrations/
      001_init.sql
      002_themes.sql
      003_assignments.sql
      004_stats.sql
      005_catalog_ai.sql
      006_telemetry.sql
      007_backups.sql
    migrate.php

  docs/
    openapi-orchestrator.yaml
    schema/
      ergomate_theme.schema.json
    architecture/
      context-diagram.md
      sequence-diagrams.md

  logs/
    app.log          (runtime)
    telemetry.log    (runtime)
    backups.log      (runtime)

  templates/
    spec-template.md
    plan-template.md
    tasks-template.md
```

```

---

## 🚀 Installation

### Prérequis

- **Serveur** : Apache 2.4+ avec mod_rewrite
- **PHP** : 8.0+ avec extensions PDO, JSON, mbstring
- **MySQL** : 5.7+ ou MariaDB 10.3+
- **Hébergement** : Mutualisé compatible (OVH, Hostinger, etc.)

### Étape 1 : Base de données

1. Créer une base MySQL via votre panel d'hébergement
2. Noter les identifiants (host, nom, user, password)
3. Importer le schéma :

```bash
mysql -u username -p database_name < orchestrator/sql/schema.sql
```

4. Importer les seeds de test (optionnel) :

```bash
mysql -u username -p database_name < orchestrator/sql/seeds.sql
```

### Étape 2 : Configuration

1. Copier le fichier de configuration :

```bash
cp orchestrator/.env.php.example orchestrator/.env.php
```

2. Éditer `orchestrator/.env.php` :

```php
// Base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'votre_base');
define('DB_USER', 'votre_user');
define('DB_PASS', 'votre_password');

// IMPORTANT : Changer la clé JWT en production !
define('JWT_SECRET', 'NOUVELLE_CLE_ALEATOIRE_256_BITS');

// Clé admin pour diagnostics
define('ADMIN_KEY', 'NOUVELLE_CLE_ADMIN');
```

3. Générer des clés sécurisées :

```bash
# Clé JWT (256 bits)
php -r "echo bin2hex(random_bytes(32));"

# Clé Admin
php -r "echo bin2hex(random_bytes(16));"
```

4. Vérifier les permissions :

```bash
chmod 755 orchestrator/api/
chmod 755 orchestrator/logs/
chmod 755 public/
```

### Étape 3 : Déploiement

**Via FTP/SFTP** (serveur mutualisé) :

1. Connectez-vous à votre hébergeur
2. Uploadez TOUS les fichiers dans `public_html/` ou `www/`
3. Vérifiez que `.htaccess` est bien présent à la racine
4. **IMPORTANT** : Ne PAS uploader `orchestrator/.env.php.example` en tant que `.env.php` - créez `.env.php` directement sur le serveur ou uploadez après configuration

**Structure attendue sur le serveur** :

```
public_html/
├── orchestrator/
│   ├── .env.php       (à créer - NE PAS COMMIT)
│   ├── api/
│   ├── lib/
│   ├── docs/
│   ├── sql/
│   └── logs/
├── public/
│   ├── index.html
│   ├── js/
│   └── assets/
├── .htaccess
└── README.md
```

### Étape 4 : Tests

1. **Health check** :

```bash
curl https://smso.mehdydriouech.fr/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-11-12T..."
}
```

2. **Test connexion DB** :

```bash
curl https://smso.mehdydriouech.fr/api/health?check=db
```

3. **Login avec compte de test** :

```bash
curl -X POST https://smso.mehdydriouech.fr/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "claire.dubois@ife-paris.fr",
    "password": "Ergo2025!"
  }'
```

4. **Diagnostics système** :

```
https://smso.mehdydriouech.fr/diag?api_key=VOTRE_ADMIN_KEY
```

---

## 👤 Comptes de test (seeds)

Mot de passe pour tous : **Ergo2025!**

### École Paris (TENANT_INST_PARIS)

| Rôle | Email | Scope |
|------|-------|-------|
| Direction | direction@ife-paris.fr | director |
| Prof 1 | claire.dubois@ife-paris.fr | teacher |
| Prof 2 | marc.bernard@ife-paris.fr | teacher |

### École Lyon (TENANT_UNIV_LYON)

| Rôle | Email | Scope |
|------|-------|-------|
| Direction | direction.ergo@univ-lyon.fr | director |
| Prof 1 | marie.laurent@univ-lyon.fr | teacher |
| Prof 2 | thomas.petit@univ-lyon.fr | teacher |

---

## 🔌 API - Endpoints principaux

Documentation complète : `orchestrator/docs/openapi-orchestrator.yaml`

### Authentification

- `POST /api/auth/login` - Login et génération JWT
- `GET /api/auth/me` - Profil utilisateur connecté

### Élèves & Classes

- `GET /api/students?classId=...` - Liste élèves
- `GET /api/students/{id}` - Détails élève
- `GET /api/classes` - Liste classes
- `GET /api/classes/{id}` - Détails classe

### Thèmes

- `GET /api/themes` - Liste thèmes
- `POST /api/themes` - Créer un thème

### Affectations

- `GET /api/assignments` - Liste affectations
- `POST /api/assignments` - Créer une affectation
- `GET /api/assignments/{id}` - Détails affectation

### Statistiques & Sync

- `GET /api/stats?studentId=...&classId=...` - Stats consolidées
- `POST /api/sync/pull-stats` - Pull depuis ErgoMate

### Dashboard

- `GET /api/dashboard/summary` - Résumé enseignant

### Webhooks (ErgoMate → Orchestrator)

- `POST /api/webhooks/ergo/session-ended` - Fin de session
- `POST /api/webhooks/ergo/assignment-ack` - Accusé d'affectation
- `POST /api/webhooks/ergo/error` - Erreur remontée

---

## 🔐 Authentification

L'Orchestrator supporte **deux modes** d'authentification :

### 1. UrlEncoded (prioritaire - compatible hébergement mutualisé)

```bash
curl -X POST https://smso.mehdydriouech.fr/api/assignments \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=secret_teacher_key" \
  -d "tenant_id=TENANT_INST_PARIS" \
  -d "scope=teacher" \
  -d "type=quiz" \
  -d "themeId=THEME_PARIS_001"
```

### 2. JWT Bearer (optionnel)

```bash
# 1. Login
TOKEN=$(curl -X POST https://smso.mehdydriouech.fr/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"claire.dubois@ife-paris.fr","password":"Ergo2025!"}' \
  | jq -r '.token')

# 2. Utiliser le token
curl https://smso.mehdydriouech.fr/api/students?classId=CLASS_PARIS_L1_A \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Orchestrator-Id: TENANT_INST_PARIS"
```

### Mode MIXED (par défaut)

Le mode MIXED accepte **les deux** méthodes. La priorité est donnée à UrlEncoded si les credentials sont présentes.

---

## 🔧 Dépannage

### Erreur 500 "Internal Server Error"

1. Vérifier les logs : `orchestrator/logs/app.log`
2. Vérifier la connexion DB dans `.env.php`
3. Vérifier les permissions des dossiers (755)
4. Activer le mode debug : `define('APP_DEBUG', true);`

### Routes non trouvées (404)

1. Vérifier que mod_rewrite est activé
2. Vérifier que `.htaccess` est bien présent à la racine
3. Tester : `https://smso.mehdydriouech.fr/api/health`
4. Vérifier les logs Apache

### Erreurs de base de données

1. Vérifier les credentials dans `.env.php`
2. Vérifier que le schéma est importé : `SHOW TABLES;`
3. Tester la connexion : 
```bash
php -r "new PDO('mysql:host=localhost;dbname=...', 'user', 'pass');"
```

### Authentification échoue

1. Vérifier `AUTH_MODE` dans `.env.php` (doit être MIXED)
2. Vérifier `JWT_SECRET` (min 32 caractères)
3. Vérifier `API_KEYS` dans `.env.php`
4. Tester le login : voir section tests ci-dessus

### Uploads ne fonctionnent pas

1. Vérifier `upload_max_filesize` dans php.ini
2. Vérifier permissions du dossier `orchestrator/var/uploads/`
3. Créer le dossier si nécessaire : `mkdir -p orchestrator/var/uploads && chmod 755 orchestrator/var/uploads`

---

## 📊 Base de données

### Tables principales

- **tenants** : Écoles/établissements
- **users** : Utilisateurs (profs, direction, admin)
- **students** : Élèves avec UUID ErgoMate
- **classes** : Classes/groupes
- **promotions** : Années scolaires
- **themes** : Contenus pédagogiques
- **assignments** : Affectations d'activités
- **assignment_targets** : Cibles des affectations
- **stats** : Statistiques élèves
- **sync_logs** : Logs de synchronisation
- **mistral_queue** : File d'attente IA
- **api_keys** : Clés Mistral BYOK

### Schéma complet

Voir `orchestrator/sql/schema.sql`

---

## 🔄 Synchronisation avec ErgoMate

### Mode MVP (Mocks)

Pour le MVP, l'Orchestrator utilise des **mocks** :
- Les appels API sont simulés (voir `/public/mock/`)
- Les webhooks peuvent être testés manuellement
- Les stats sont générées de façon aléatoire

### Mode Production (À implémenter)

1. Modifier `ERGOMATE_MOCK_MODE` à `false` dans `.env.php`
2. Implémenter les vraies API côté ErgoMate
3. Configurer les webhooks avec signature HMAC
4. Activer la sync automatique

---

## 🔒 Sécurité

### Checklist Production

- [ ] Changer `JWT_SECRET` (256 bits minimum)
- [ ] Changer `ADMIN_KEY`
- [ ] Changer toutes les `API_KEYS`
- [ ] Activer HTTPS (Let's Encrypt gratuit)
- [ ] Désactiver `APP_DEBUG` (`false`)
- [ ] Protéger `.env.php` (ne jamais commiter)
- [ ] Configurer CORS pour votre domaine uniquement
- [ ] Limiter les permissions des dossiers (755 max)
- [ ] Activer rate limiting
- [ ] Configurer les backups DB

### Rotation des clés

```bash
# Générer une nouvelle clé JWT
php -r "echo bin2hex(random_bytes(32));"

# Générer une nouvelle clé Admin
php -r "echo bin2hex(random_bytes(16));"
```

---

## 📝 TODO / Roadmap

### Sprint 2 - Collaboration & IA pédagogique
- [ ] Notifications temps réel
- [ ] Génération IA avancée (Mistral)
- [ ] Partage de thèmes entre écoles
- [ ] API publique partenaires

### Sprint 3 - Multi-tenant & RBAC
- [ ] Isolation stricte des tenants
- [ ] Rôles hiérarchiques avancés
- [ ] Reporting anonymisé

### Sprint 4-10 - Features avancées
- [ ] Learning analytics approfondis
- [ ] Adaptive learning
- [ ] Social & collaborative learning
- [ ] Dashboard direction

---

## 🤝 Support

**Développeur** : Mehdy Driouech  
**Email** : contact@mehdydriouech.fr  
**Site** : [www.mehdydriouech.fr](https://www.mehdydriouech.fr)

---

## 📄 Licence

Code propriétaire - Tous droits réservés  
© 2025 Mehdy Driouech

---

**Version MVP** : Sprint 0 + Sprint 1 complétés ✅  
**Prochaine version** : Sprint 2 (Collaboration & IA)
