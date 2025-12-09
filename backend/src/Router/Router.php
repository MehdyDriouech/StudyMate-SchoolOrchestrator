<?php
/**
 * Routeur simple pour gérer les routes REST
 * Compatible Apache/cPanel avec .htaccess
 */

namespace Router;

use Http\Request;
use Http\Response;

class Router
{
    private array $routes = [];
    private string $basePath;

    public function __construct(string $basePath = '/api')
    {
        $this->basePath = $basePath;
    }

    /**
     * Enregistre une route
     */
    public function addRoute(string $method, string $pattern, callable $handler): void
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    /**
     * Enregistre une route GET
     */
    public function get(string $pattern, callable $handler): void
    {
        $this->addRoute('GET', $pattern, $handler);
    }

    /**
     * Enregistre une route POST
     */
    public function post(string $pattern, callable $handler): void
    {
        $this->addRoute('POST', $pattern, $handler);
    }

    /**
     * Enregistre une route PUT
     */
    public function put(string $pattern, callable $handler): void
    {
        $this->addRoute('PUT', $pattern, $handler);
    }

    /**
     * Enregistre une route DELETE
     */
    public function delete(string $pattern, callable $handler): void
    {
        $this->addRoute('DELETE', $pattern, $handler);
    }

    /**
     * Convertit un pattern de route en regex
     * Ex: /api/assignments/{id} -> /api/assignments/(?P<id>[^/]+)
     */
    private function patternToRegex(string $pattern): string
    {
        // Convertir le pattern en regex
        // Ex: /assignments/{id} -> /^\/assignments\/(?P<id>[^/]+)$/
        
        // Utiliser une approche simple : remplacer {param} directement
        // Échapper d'abord tout le pattern
        $escaped = preg_quote($pattern, '/');
        
        // Déséchapper les accolades pour pouvoir les remplacer
        $escaped = str_replace('\\{', '{', $escaped);
        $escaped = str_replace('\\}', '}', $escaped);
        
        // Remplacer {param} par le groupe nommé regex
        // Utiliser un délimiteur différent pour éviter les conflits
        $regex = preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $escaped);
        
        return '#^' . $regex . '$#';
    }

    /**
     * Trouve la route correspondante et exécute le handler
     */
    public function dispatch(Request $request, Response $response): void
    {
        $requestPath = $request->getPath();
        
        // Décoder les URLs encodées (pour gérer les espaces dans les noms de dossiers)
        $requestPath = urldecode($requestPath);

        // Retirer le basePath si présent (peut être au début ou après le dossier)
        // Ex: /SMSO%20Iterative%20back/backend/public/api/assignments
        // ou: /api/assignments
        if ($this->basePath !== '') {
            // Chercher le basePath dans le chemin
            $basePathPos = strpos($requestPath, $this->basePath);
            if ($basePathPos !== false) {
                // Retirer tout ce qui précède et inclut le basePath
                $requestPath = substr($requestPath, $basePathPos + strlen($this->basePath));
            } else {
                // Si le basePath n'est pas trouvé, vérifier si on accède directement à backend/public
                // Dans ce cas, considérer que c'est une requête vers la racine de l'API
                if (strpos($requestPath, '/backend/public') !== false || 
                    $requestPath === '/' || 
                    $requestPath === '' ||
                    preg_match('#/backend/public/?$#', $requestPath)) {
                    // Extraire seulement la partie après /backend/public
                    $publicPos = strpos($requestPath, '/backend/public');
                    if ($publicPos !== false) {
                        $requestPath = substr($requestPath, $publicPos + strlen('/backend/public'));
                        if ($requestPath === '') {
                            $requestPath = '/';
                        }
                    }
                }
            }
        }

        // Normaliser le path
        if ($requestPath === '') {
            $requestPath = '/';
        }
        
        // S'assurer que le path commence par /
        if ($requestPath !== '/' && $requestPath[0] !== '/') {
            $requestPath = '/' . $requestPath;
        }
        
        // Debug: afficher le chemin final
        if (defined('DEBUG_ROUTING') && DEBUG_ROUTING) {
            error_log('Router: Final normalized path: ' . $requestPath);
        }

        $requestMethod = $request->getMethod();
        
        // Debug: logger le chemin final
        if (defined('DEBUG_ROUTING') && DEBUG_ROUTING) {
            error_log('Router: Final path after processing: ' . $requestPath);
            error_log('Router: Looking for method: ' . $requestMethod);
            error_log('Router: Registered routes: ' . count($this->routes));
        }

        // Chercher une route correspondante
        foreach ($this->routes as $route) {
            if ($route['method'] !== $requestMethod) {
                continue;
            }

            $regex = $this->patternToRegex($route['pattern']);
            
            if (defined('DEBUG_ROUTING') && DEBUG_ROUTING) {
                error_log('Router: Testing pattern "' . $route['pattern'] . '" with regex: ' . $regex);
                error_log('Router: Against path: ' . $requestPath);
            }
            
            $matches = [];
            if (preg_match($regex, $requestPath, $matches)) {
                if (defined('DEBUG_ROUTING') && DEBUG_ROUTING) {
                    error_log('Router: MATCH FOUND! Pattern: ' . $route['pattern']);
                    error_log('Router: Matches: ' . print_r($matches, true));
                }
                
                // Extraire les paramètres de route
                $params = [];
                foreach ($matches as $key => $value) {
                    if (is_string($key)) {
                        $params[$key] = $value;
                    }
                }
                
                if (defined('DEBUG_ROUTING') && DEBUG_ROUTING) {
                    error_log('Router: Extracted params: ' . print_r($params, true));
                }
                
                $request->setRouteParams($params);

                // Exécuter le handler
                try {
                    $route['handler']($request, $response);
                    return;
                } catch (\Exception $e) {
                    error_log('Route handler error: ' . $e->getMessage());
                    $response->serverError('An error occurred while processing the request')->send();
                    return;
                }
            }
        }

        // Aucune route trouvée - debug
        if (defined('DEBUG_ROUTING') && DEBUG_ROUTING) {
            error_log('Router: NO MATCH FOUND for path: ' . $requestPath . ' method: ' . $requestMethod);
            error_log('Router: Available routes:');
            foreach ($this->routes as $route) {
                error_log('  - ' . $route['method'] . ' ' . $route['pattern']);
            }
        }
        
        $response->notFound('Route not found')->send();
    }
}

