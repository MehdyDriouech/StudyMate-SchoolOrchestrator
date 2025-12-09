<?php
/**
 * Script de test pour vérifier l'authentification
 * Usage: php test_auth.php
 */

// Charger la configuration
$config = require __DIR__ . '/../src/Config/config.php';

// Charger les classes nécessaires
require_once __DIR__ . '/../src/Config/Database.php';
require_once __DIR__ . '/../src/Repositories/UserRepository.php';
require_once __DIR__ . '/../src/Services/AuthService.php';

// Initialiser la base de données
\Config\Database::init($config['database']);

// Créer les instances
$userRepository = new \Repositories\UserRepository();
$authService = new \Services\AuthService($userRepository, $config['auth']);

echo "=== Test d'authentification ===\n\n";

// Test 1 : Vérifier qu'un utilisateur existe
echo "1. Vérification de l'utilisateur directeur@ecole.fr...\n";
$user = $userRepository->findByEmail('directeur@ecole.fr');
if ($user === null) {
    echo "   ❌ Utilisateur non trouvé\n";
    exit(1);
}
echo "   ✅ Utilisateur trouvé (ID: {$user['id']}, Role: {$user['role']})\n\n";

// Test 2 : Tester le login avec le bon mot de passe
echo "2. Test de login avec le mot de passe 'Demo123!'...\n";
$result = $authService->login('directeur@ecole.fr', 'Demo123!');
if ($result === null) {
    echo "   ❌ Échec de l'authentification\n";
    exit(1);
}
echo "   ✅ Authentification réussie !\n";
echo "   Token généré: " . substr($result['token'], 0, 50) . "...\n";
echo "   Expires in: {$result['expires_in']} secondes\n";
echo "   User ID: {$result['user']['id']}\n";
echo "   User Role: {$result['user']['role']}\n\n";

// Test 3 : Tester le login avec un mauvais mot de passe
echo "3. Test de login avec un mauvais mot de passe...\n";
$result = $authService->login('directeur@ecole.fr', 'WrongPassword');
if ($result !== null) {
    echo "   ❌ L'authentification devrait échouer avec un mauvais mot de passe\n";
    exit(1);
}
echo "   ✅ Authentification correctement refusée\n\n";

// Test 4 : Valider le token généré
echo "4. Validation du token généré...\n";
$token = $authService->login('directeur@ecole.fr', 'Demo123!')['token'];
$payload = $authService->validateToken($token);
if ($payload === null) {
    echo "   ❌ Le token n'est pas valide\n";
    exit(1);
}
echo "   ✅ Token valide\n";
echo "   User ID (sub): {$payload['sub']}\n";
echo "   Role: {$payload['role']}\n";
echo "   School ID: " . ($payload['school_id'] ?? 'NULL') . "\n";
echo "   Expires at: " . date('Y-m-d H:i:s', $payload['exp']) . "\n\n";

// Test 5 : Tester avec un autre utilisateur
echo "5. Test avec un élève (nathan@eleve.fr)...\n";
$result = $authService->login('nathan@eleve.fr', 'Demo123!');
if ($result === null) {
    echo "   ❌ Échec de l'authentification pour l'élève\n";
    exit(1);
}
echo "   ✅ Authentification réussie pour l'élève\n";
echo "   User ID: {$result['user']['id']}\n";
echo "   User Role: {$result['user']['role']}\n\n";

echo "=== Tous les tests sont passés avec succès ! ===\n";
echo "✅ L'authentification est fonctionnelle.\n";
echo "✅ Vous pouvez maintenant tester via l'interface web.\n";

