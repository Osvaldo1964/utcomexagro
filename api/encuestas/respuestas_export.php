<?php
// ============================================================
// api/encuestas/respuestas_export.php
// GET: Obtener las preguntas y todas las respuestas de una encuesta
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$auth = JWT::requireAuth();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    JWT::requirePermission($auth, 'encuestas', 'leer');
    
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id) {
        jsonResponse(false, 'ID de encuesta inválido.', [], 400);
    }

    $pdo = Database::getConnection();

    // 1. Fetch survey details
    $stmt = $pdo->prepare("SELECT * FROM encuestas WHERE id = ?");
    $stmt->execute([$id]);
    $encuesta = $stmt->fetch();

    if (!$encuesta) {
        jsonResponse(false, 'Encuesta no encontrada.', [], 404);
    }

    // Parse preguntas JSON
    $preguntas = json_decode($encuesta['preguntas'], true) ?? [];
    $encuesta['preguntas'] = $preguntas;

    // 2. Fetch all responses
    $stmtResp = $pdo->prepare("SELECT * FROM encuesta_respuestas WHERE encuesta_id = ? ORDER BY created_at ASC");
    $stmtResp->execute([$id]);
    $respuestasRow = $stmtResp->fetchAll();

    $respuestas_parsed = [];
    foreach ($respuestasRow as $row) {
        $row['respuestas'] = json_decode($row['respuestas'], true) ?? [];
        $respuestas_parsed[] = $row;
    }

    jsonResponse(true, 'Datos de la encuesta cargados.', [
        'encuesta' => $encuesta,
        'respuestas' => $respuestas_parsed
    ]);
} else {
    jsonResponse(false, 'Método no permitido', [], 405);
}
