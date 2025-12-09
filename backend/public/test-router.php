<?php
/**
 * Script de test pour le router
 * Teste les patterns de routes
 */

// Simuler le patternToRegex
function patternToRegex(string $pattern): string
{
    // Échapper tous les caractères spéciaux
    $escaped = preg_quote($pattern, '/');
    
    // Remplacer les paramètres {param} par des groupes nommés
    // preg_quote échappe les accolades, donc on doit les déséchapper d'abord
    $escaped = str_replace('\\{', '{', $escaped);
    $escaped = str_replace('\\}', '}', $escaped);
    
    // Remplacer {param} par (?P<param>[^/]+)
    $regex = preg_replace('/\{(\w+)\}/', '(?P<$1>[^/]+)', $escaped);
    
    return '/^' . $regex . '$/';
}

// Tests
$patterns = [
    '/assignments',
    '/assignments/{id}',
];

$testPaths = [
    '/assignments',
    '/assignments/2',
    '/assignments/123',
];

echo "<h2>Test des patterns de routes</h2>";

foreach ($patterns as $pattern) {
    $regex = patternToRegex($pattern);
    echo "<h3>Pattern: $pattern</h3>";
    echo "<p>Regex: <code>$regex</code></p>";
    
    foreach ($testPaths as $path) {
        $matches = [];
        if (preg_match($regex, $path, $matches)) {
            echo "<p style='color: green;'>✓ Match: $path</p>";
            if (!empty($matches)) {
                echo "<pre>" . print_r($matches, true) . "</pre>";
            }
        } else {
            echo "<p style='color: red;'>✗ No match: $path</p>";
        }
    }
    echo "<hr>";
}

