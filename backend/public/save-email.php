<?php
/**
 * Endpoint simple pour enregistrer les emails dans mails.json
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier que c'est une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

// Récupérer l'email depuis le body JSON ou POST
$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? $_POST['email'] ?? null;

// Valider l'email
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email invalide']);
    exit;
}

// Chemin vers le fichier mails.json (dans le même dossier)
$filePath = __DIR__ . '/mails.json';

// Lire le contenu existant ou créer un tableau vide
$emails = [];
if (file_exists($filePath)) {
    $content = file_get_contents($filePath);
    // Si le fichier contient du JSON valide, le parser
    $decoded = json_decode($content, true);
    if (is_array($decoded)) {
        $emails = $decoded;
    } else {
        // Sinon, lire ligne par ligne (format texte)
        $lines = explode("\n", trim($content));
        $emails = array_filter($lines, function($line) {
            return !empty(trim($line)) && filter_var(trim($line), FILTER_VALIDATE_EMAIL);
        });
        $emails = array_values($emails);
    }
}

// Vérifier si l'email existe déjà
if (in_array($email, $emails)) {
    http_response_code(200);
    echo json_encode(['message' => 'Email déjà enregistré', 'email' => $email]);
    exit;
}

// Ajouter l'email
$emails[] = $email;

// Sauvegarder dans le fichier (format ligne par ligne comme demandé)
$content = implode("\n", $emails) . "\n";
file_put_contents($filePath, $content, LOCK_EX);

// Réponse de succès
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Email enregistré avec succès',
    'email' => $email
]);

