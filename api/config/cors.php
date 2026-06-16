<?php
// ============================================================
// api/config/cors.php
// Headers CORS y respuesta JSON
// ============================================================
require_once __DIR__ . '/config.php';

// Orígenes permitidos
$allowedOrigins = [
    'http://localhost',
    'http://localhost/utcomexagro',
    'http://127.0.0.1',
    APP_URL,
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: ' . APP_URL);
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=UTF-8');

// Preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * Enviar respuesta JSON estandarizada y terminar ejecución.
 */
function jsonResponse(bool $success, string $message, array $data = [], int $httpCode = 200): void {
    http_response_code($httpCode);
    echo json_encode([
        'success'   => $success,
        'message'   => $message,
        'data'      => $data,
        'timestamp' => date('c'),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Leer y decodificar entrada JSON cruda (php://input).
 * @return array
 */
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

/**
 * Solo aceptar método HTTP específico.
 */
function requireMethod(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
        jsonResponse(false, 'Método no permitido.', [], 405);
    }
}
