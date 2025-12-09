# StudyMate School Orchestrator - Backend API

Backend PHP 8 minimaliste pour la feature **Assignments** (CRUD complet).

## 📁 Structure du projet

```
backend/
├── public/
│   ├── index.php          # Point d'entrée de l'API
│   └── .htaccess          # Configuration Apache
├── src/
│   ├── Config/            # Configuration (DB, app)
│   ├── Http/              # Request/Response
│   ├── Router/            # Routeur REST
│   ├── Controllers/       # Contrôleurs
│   ├── Services/          # Logique métier
│   ├── Repositories/      # Accès aux données
│   └── Models/            # Modèles de données
├── docs/
│   └── openapi.yaml       # Documentation OpenAPI 3.0
└── ui/
    └── assignments.html   # Interface de test
```

## 🚀 Installation

### Prérequis

- PHP 8.0+
- MySQL 8.0+
- Apache avec mod_rewrite activé
- Extension PDO MySQL activée

### Configuration

1. **Base de données**

   Créer la base de données et importer le schéma :
   ```bash
   mysql -u root -p < ../db/db.sql
   mysql -u root -p < ../db/seeds.sql
   ```

2. **Configuration PHP**

   Modifier `src/Config/config.php` ou définir les variables d'environnement :
   ```php
   $_ENV['DB_HOST'] = 'localhost';
   $_ENV['DB_NAME'] = 'smso';
   $_ENV['DB_USER'] = 'root';
   $_ENV['DB_PASSWORD'] = '';
   ```

3. **Point d'entrée**

   Configurer Apache pour pointer vers `backend/public/` :
   - **Développement local** : `http://localhost/backend/public/`
   - **cPanel** : Configurer le Document Root vers `backend/public/`

## 📡 Endpoints API

### GET `/api/assignments`
Liste tous les assignments.

**Réponse 200 :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "class_id": 10,
      "theme_id": 5,
      "assigned_by": 3,
      "start_at": "2025-09-01T08:00:00",
      "end_at": "2025-09-30T23:59:59",
      "due_at": "2025-09-15T23:59:59",
      "created_at": "2025-08-25T10:30:00"
    }
  ]
}
```

### GET `/api/assignments/{id}`
Récupère un assignment par ID.

**Réponse 200 :** Même structure qu'un item de la liste.

**Réponse 404 :**
```json
{
  "success": false,
  "error": "Assignment not found"
}
```

### POST `/api/assignments`
Crée un nouvel assignment.

**Body :**
```json
{
  "class_id": 10,
  "theme_id": 5,
  "assigned_by": 3,
  "start_at": "2025-09-01T08:00:00",
  "end_at": "2025-09-30T23:59:59",
  "due_at": "2025-09-15T23:59:59"
}
```

**Réponse 201 :** Assignment créé avec `id` et `created_at`.

### PUT `/api/assignments/{id}`
Met à jour un assignment existant. Tous les champs sont optionnels.

**Body :** Même structure que POST (tous les champs optionnels).

**Réponse 200 :** Assignment mis à jour.

### DELETE `/api/assignments/{id}`
Supprime un assignment.

**Réponse 200 :**
```json
{
  "success": true,
  "data": null
}
```

## 🧪 Interface de test

Ouvrir `ui/assignments.html` dans un navigateur pour tester tous les endpoints.

**Note :** Ajuster `API_BASE_URL` dans le fichier HTML selon votre configuration.

## 📚 Documentation OpenAPI

La spécification OpenAPI est disponible dans `docs/openapi.yaml`.

Pour visualiser avec Swagger UI :

1. Télécharger [Swagger UI](https://swagger.io/tools/swagger-ui/)
2. Placer les fichiers dans `public/docs/`
3. Configurer pour charger `../docs/openapi.yaml`

## 🔧 Architecture

### Pattern MVC + Repository

- **Models** : Représentation des données
- **Repositories** : Accès à la base de données (PDO)
- **Services** : Logique métier et validation
- **Controllers** : Gestion des requêtes HTTP
- **Router** : Routage REST simple

### Format de réponse uniforme

Toutes les réponses suivent ce format :
```json
{
  "success": true|false,
  "data": ...,
  "error": "..." // uniquement si success = false
}
```

## 🐛 Gestion des erreurs

- **400** : Données invalides (validation)
- **404** : Ressource non trouvée
- **500** : Erreur serveur (logs dans error_log PHP)

## 📝 Notes

- Pas d'autoloader : les classes sont chargées manuellement dans `index.php`
- Compatible cPanel/Apache avec `.htaccess`
- Pas de dépendances externes (PHP natif + PDO)
- Format de dates : ISO 8601 (`2025-09-01T08:00:00`)

## 🔄 Extension future

Pour ajouter d'autres features (ex: `themes`, `classes`) :

1. Créer Model, Repository, Service, Controller
2. Enregistrer les routes dans `index.php`
3. Ajouter les schémas dans `openapi.yaml`

