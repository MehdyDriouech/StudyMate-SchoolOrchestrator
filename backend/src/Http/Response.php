<?php
/**
 * Classe Response - Gestion des réponses HTTP
 * Format uniforme JSON avec structure { success, data, error }
 */

namespace Http;

class Response
{
    private int $statusCode = 200;
    private array $headers = [];
    private $data = null;
    private ?string $error = null;

    public function __construct()
    {
        $this->headers['Content-Type'] = 'application/json; charset=utf-8';
    }

    /**
     * Définit le code de statut HTTP
     */
    public function setStatusCode(int $code): self
    {
        $this->statusCode = $code;
        return $this;
    }

    /**
     * Ajoute un header
     */
    public function setHeader(string $key, string $value): self
    {
        $this->headers[$key] = $value;
        return $this;
    }

    /**
     * Définit les données de succès
     */
    public function setData($data): self
    {
        $this->data = $data;
        $this->error = null;
        return $this;
    }

    /**
     * Définit une erreur
     */
    public function setError(string $error, int $statusCode = 400): self
    {
        $this->error = $error;
        $this->data = null;
        $this->statusCode = $statusCode;
        return $this;
    }

    /**
     * Réponse de succès avec données
     */
    public function success($data, int $statusCode = 200): self
    {
        return $this->setData($data)->setStatusCode($statusCode);
    }

    /**
     * Réponse d'erreur
     */
    public function error(string $message, int $statusCode = 400): self
    {
        return $this->setError($message, $statusCode);
    }

    /**
     * Réponse 404 Not Found
     */
    public function notFound(string $message = 'Resource not found'): self
    {
        return $this->setError($message, 404);
    }

    /**
     * Réponse 500 Internal Server Error
     */
    public function serverError(string $message = 'Internal server error'): self
    {
        return $this->setError($message, 500);
    }

    /**
     * Envoie la réponse au client
     */
    public function send(): void
    {
        // Envoyer les headers
        http_response_code($this->statusCode);
        foreach ($this->headers as $key => $value) {
            header("$key: $value");
        }

        // Construire le payload JSON
        $payload = ['success' => $this->error === null];
        
        if ($this->error !== null) {
            $payload['error'] = $this->error;
        } else {
            $payload['data'] = $this->data;
        }

        // Envoyer le JSON
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        exit;
    }
}

