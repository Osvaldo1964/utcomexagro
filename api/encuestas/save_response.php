<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$input = json_decode(file_get_contents('php://input'), true);

$encuesta_id = $input['encuesta_id'] ?? null;
$identificacion = trim($input['identificacion'] ?? '');
$nombres = trim($input['nombres'] ?? '');
$departamento = trim($input['departamento'] ?? '');
$municipio = trim($input['municipio'] ?? '');
$respuestas = $input['respuestas'] ?? [];

if (!$encuesta_id || empty($identificacion) || empty($nombres)) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios de identificación.']);
    exit;
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

    echo json_encode(['success' => true, 'message' => 'Respuestas guardadas exitosamente.']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error al guardar respuesta: ' . $e->getMessage()]);
}
