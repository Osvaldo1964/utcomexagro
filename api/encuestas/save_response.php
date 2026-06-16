<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$input = getJsonInput();

$encuesta_id = $input['encuesta_id'] ?? null;
$identificacion = trim($input['identificacion'] ?? '');
$nombres = trim($input['nombres'] ?? '');
$departamento = trim($input['departamento'] ?? '');
$municipio = trim($input['municipio'] ?? '');
$respuestas = $input['respuestas'] ?? [];

if (!$encuesta_id || empty($identificacion) || empty($nombres)) {
    jsonResponse(false, 'Faltan datos obligatorios de identificación.');
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO encuesta_respuestas (
            encuesta_id, respondente_id, identificacion, nombres, 
            departamento, municipio, respuestas, ip_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $respuestasJson = json_encode($respuestas, JSON_UNESCAPED_UNICODE);
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;

    $stmt->execute([
        $encuesta_id,
        $user['sub'], // El id de quien está registrando (el admin/operador)
        $identificacion,
        $nombres,
        $departamento,
        $municipio,
        $respuestasJson,
        $ip
    ]);

    jsonResponse(true, 'Respuestas guardadas exitosamente.');

} catch (PDOException $e) {
    jsonResponse(false, 'Error al guardar respuesta: ' . $e->getMessage());
}
