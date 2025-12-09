<?php
/**
 * Fichier de test simple pour vérifier la configuration
 * Accéder via : http://localhost/backend/public/test.php
 */

header('Content-Type: application/json');

echo json_encode([
    'success' => true,
    'message' => 'Configuration PHP OK',
    'php_version' => PHP_VERSION,
    'pdo_mysql' => extension_loaded('pdo_mysql') ? 'OK' : 'MANQUANT',
    'mod_rewrite' => function_exists('apache_get_modules') && in_array('mod_rewrite', apache_get_modules()) ? 'OK' : 'INCONNU',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'N/A',
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'N/A',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'N/A',
], JSON_PRETTY_PRINT);

