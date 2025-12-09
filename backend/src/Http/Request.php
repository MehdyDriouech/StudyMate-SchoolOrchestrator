<?php
/**
 * Classe Request - Gestion des requêtes HTTP
 * Extrait les données de la requête (méthode, URI, body, headers)
 */

namespace Http;

class Request
{
    private string $method;
    private string $uri;
    private string $path;
    private array $queryParams;
    private array $body;
    private array $headers;
    private array $routeParams = [];

    public function __construct()
    {
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $this->uri = $_SERVER['REQUEST_URI'] ?? '/';
        
        // Extraire le path sans query string
        $parsedUri = parse_url($this->uri);
        $this->path = $parsedUri['path'] ?? '/';
        
        // Si on utilise api.php, extraire le chemin après api.php
        if (strpos($this->path, '/api.php') !== false) {
            $this->path = substr($this->path, strpos($this->path, '/api.php') + strlen('/api.php'));
            if ($this->path === '') {
                $this->path = '/';
            }
        }
        
        // Extraire les query parameters
        $this->queryParams = [];
        if (isset($parsedUri['query'])) {
            parse_str($parsedUri['query'], $this->queryParams);
        }

        // Extraire les headers
        $this->headers = getallheaders() ?: [];

        // Extraire le body (JSON ou form-urlencoded)
        $this->body = [];
        $contentType = $this->getHeader('content-type', '');
        
        // Si c'est du form-urlencoded, utiliser $_POST
        if (strpos(strtolower($contentType), 'application/x-www-form-urlencoded') !== false) {
            $this->body = $_POST;
        } else {
            // Sinon, essayer de parser le JSON
            $rawBody = file_get_contents('php://input');
            if (!empty($rawBody)) {
                $decoded = json_decode($rawBody, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $this->body = $decoded;
                } else {
                    // Si ce n'est pas du JSON valide, essayer de parser comme form-urlencoded
                    parse_str($rawBody, $parsed);
                    if (!empty($parsed)) {
                        $this->body = $parsed;
                    }
                }
            }
        }
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function getUri(): string
    {
        return $this->uri;
    }

    public function getPath(): string
    {
        return $this->path;
    }

    public function getQueryParams(): array
    {
        return $this->queryParams;
    }

    public function getQueryParam(string $key, $default = null)
    {
        return $this->queryParams[$key] ?? $default;
    }

    public function getBody(): array
    {
        return $this->body;
    }

    public function getBodyParam(string $key, $default = null)
    {
        return $this->body[$key] ?? $default;
    }

    public function getHeaders(): array
    {
        return $this->headers;
    }

    public function getHeader(string $key, $default = null): ?string
    {
        $key = strtolower($key);
        foreach ($this->headers as $headerKey => $value) {
            if (strtolower($headerKey) === $key) {
                return $value;
            }
        }
        return $default;
    }

    public function setRouteParams(array $params): void
    {
        $this->routeParams = $params;
    }

    public function getRouteParams(): array
    {
        return $this->routeParams;
    }

    public function getRouteParam(string $key, $default = null)
    {
        return $this->routeParams[$key] ?? $default;
    }

    /**
     * Récupère le body parsé (JSON ou form-urlencoded fusionné)
     * Retourne un tableau associatif avec toutes les données du body
     */
    public function getParsedBody(): array
    {
        return $this->body;
    }
}

