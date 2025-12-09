# Guide de dépannage - Backend API

## Problème : "Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"

Cette erreur signifie que l'API renvoie du HTML au lieu de JSON. Voici les étapes pour résoudre le problème :

### 1. Vérifier l'URL de l'API

L'URL de base dans `ui/assignments.html` doit correspondre à votre configuration locale.

**Pour AMPPS en localhost :**
```javascript
const API_BASE_URL = '/backend/public/api';
```

**Si votre DocumentRoot pointe vers `backend/public` :**
```javascript
const API_BASE_URL = '/api';
```

**Pour tester l'URL manuellement :**
Ouvrez dans votre navigateur :
- `http://localhost/backend/public/test.php` (doit afficher du JSON)
- `http://localhost/backend/public/api/assignments` (doit afficher la liste des assignments)

### 2. Vérifier la configuration de la base de données

Modifiez `src/Config/config.php` ou définissez les variables d'environnement :

```php
$_ENV['DB_HOST'] = 'localhost';
$_ENV['DB_NAME'] = 'smso';  // Nom de votre base de données
$_ENV['DB_USER'] = 'root';  // Votre utilisateur MySQL
$_ENV['DB_PASSWORD'] = '';  // Votre mot de passe MySQL
```

### 3. Vérifier que mod_rewrite est activé

Le fichier `.htaccess` nécessite `mod_rewrite`. Vérifiez dans votre configuration Apache.

### 4. Vérifier les logs d'erreur PHP

Les erreurs sont maintenant loggées. Consultez :
- Les logs Apache (varie selon la configuration)
- Le fichier de log PHP défini dans `php.ini`

### 5. Tester directement l'API

Utilisez `curl` ou Postman pour tester directement :

```bash
# GET tous les assignments
curl http://localhost/backend/public/api/assignments

# POST un nouvel assignment
curl -X POST http://localhost/backend/public/api/assignments \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": 1,
    "theme_id": 1,
    "assigned_by": 3,
    "start_at": "2025-09-01T08:00:00"
  }'
```

### 6. Vérifier la structure des dossiers

Assurez-vous que la structure est correcte :
```
backend/
├── public/
│   ├── index.php
│   └── .htaccess
├── src/
│   └── ...
```

### 7. Mode debug

Le mode debug est activé par défaut. Les erreurs PHP sont maintenant affichées. Si vous voyez toujours du HTML, cela signifie qu'une erreur PHP se produit avant que le JSON ne soit envoyé.

**Vérifiez :**
- Que toutes les classes sont chargées correctement
- Que la connexion à la base de données fonctionne
- Que les chemins des fichiers sont corrects

### 8. Solution rapide : Ajuster l'URL dans le navigateur

Si vous testez via le fichier HTML, ouvrez la console du navigateur (F12) et modifiez directement :

```javascript
// Dans la console du navigateur
API_BASE_URL = '/backend/public/api';  // Ajustez selon votre config
```

Puis réessayez la requête.

