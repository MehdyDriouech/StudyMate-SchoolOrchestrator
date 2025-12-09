<?php
/**
 * Script utilitaire pour générer et mettre à jour les hash de mots de passe
 * Usage: php update_passwords.php
 */

// Charger la configuration
$config = require __DIR__ . '/../src/Config/config.php';

// Charger les classes nécessaires
require_once __DIR__ . '/../src/Config/Database.php';

// Initialiser la base de données
\Config\Database::init($config['database']);
$db = \Config\Database::getInstance();

// Liste des utilisateurs avec leurs nouveaux mots de passe
$users = [
    ['email' => 'directeur@ecole.fr', 'password' => 'Demo123!'],
    ['email' => 'pedago@ecole.fr', 'password' => 'Demo123!'],
    ['email' => 'enseignant@ecole.fr', 'password' => 'Demo123!'],
    ['email' => 'prof2@ecole.fr', 'password' => 'Demo123!'],
    // Tous les élèves avec le même mot de passe pour la démo
    ['email' => 'nathan@eleve.fr', 'password' => 'Demo123!'],
    ['email' => 'sarah@eleve.fr', 'password' => 'Demo123!'],
    ['email' => 'julien@eleve.fr', 'password' => 'Demo123!'],
    ['email' => 'amina@eleve.fr', 'password' => 'Demo123!'],
    ['email' => 'hugo@eleve.fr', 'password' => 'Demo123!'],
    ['email' => 'lina@eleve.fr', 'password' => 'Demo123!'],
    ['email' => 'sofiane@eleve.fr', 'password' => 'Demo123!'],
    ['email' => 'clara@eleve.fr', 'password' => 'Demo123!'],
    ['email' => 'leo@eleve.fr', 'password' => 'Demo123!'],
    ['email' => 'selma@eleve.fr', 'password' => 'Demo123!'],
];

echo "=== Mise à jour des mots de passe ===\n\n";

$updated = 0;
$errors = 0;

foreach ($users as $userData) {
    $email = $userData['email'];
    $password = $userData['password'];
    
    // Générer le hash
    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    if ($hash === false) {
        echo "❌ Erreur lors de la génération du hash pour $email\n";
        $errors++;
        continue;
    }
    
    // Mettre à jour dans la base de données
    try {
        $stmt = $db->prepare('UPDATE users SET password_hash = :hash WHERE email = :email');
        $result = $stmt->execute([
            'hash' => $hash,
            'email' => $email
        ]);
        
        if ($stmt->rowCount() > 0) {
            echo "✅ $email : mot de passe mis à jour\n";
            echo "   Hash: $hash\n";
            $updated++;
        } else {
            echo "⚠️  $email : utilisateur non trouvé dans la base\n";
        }
    } catch (\Exception $e) {
        echo "❌ Erreur pour $email : " . $e->getMessage() . "\n";
        $errors++;
    }
}

echo "\n=== Résumé ===\n";
echo "Mis à jour: $updated\n";
echo "Erreurs: $errors\n";
echo "\n✅ Script terminé. Vous pouvez maintenant tester l'authentification.\n";

