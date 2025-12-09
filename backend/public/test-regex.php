<?php
/**
 * Test de génération de regex pour les routes
 */

function patternToRegex(string $pattern): string
{
    // Diviser le pattern en segments séparés par les paramètres
    $parts = preg_split('/\{(\w+)\}/', $pattern, -1, PREG_SPLIT_DELIM_CAPTURE);
    
    $regex = '';
    $isParam = false;
    
    foreach ($parts as $part) {
        if ($isParam) {
            // C'est un paramètre, ajouter le groupe nommé
            $regex .= '(?P<' . $part . '>[^/]+)';
            $isParam = false;
        } else {
            // C'est un segment normal, l'échapper
            $regex .= preg_quote($part, '/');
            $isParam = true;
        }
    }
    
    return '/^' . $regex . '$/';
}

// Tests
$patterns = [
    '/assignments',
    '/assignments/{id}',
];

echo "<h2>Test de génération de regex</h2>";

foreach ($patterns as $pattern) {
    $regex = patternToRegex($pattern);
    echo "<h3>Pattern: $pattern</h3>";
    echo "<p>Regex généré: <code>" . htmlspecialchars($regex) . "</code></p>";
    
    // Tester si le regex est valide
    $test = @preg_match($regex, '/assignments/2', $matches);
    if ($test === false) {
        $error = preg_last_error();
        echo "<p style='color: red;'>✗ Regex invalide! Erreur: $error</p>";
    } else {
        echo "<p style='color: green;'>✓ Regex valide</p>";
        if ($test) {
            echo "<p>Match trouvé: " . print_r($matches, true) . "</p>";
        }
    }
    echo "<hr>";
}

