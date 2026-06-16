<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$input = json_decode(file_get_contents('php://input'), true);

$id = $input['id'] ?? null;
$titulo = trim($input['titulo'] ?? '');
$fecha_inicio = trim($input['fecha_inicio'] ?? '');
$fecha_fin = trim($input['fecha_fin'] ?? '');
$preguntas = $input['preguntas'] ?? null; // Optional update
$activa = isset($input['activa']) ? (int)$input['activa'] : null;

if (!$id) {
    echo json_encode(['success' => false, 'message' => 'ID de encuesta no proporcionado.']);
    exit;
}

try {
    // If only toggling active status
    if ($activa !== null && empty($titulo) && $preguntas === null) {
        $stmt = $pdo->prepare("UPDATE encuestas SET activa = ? WHERE id = ?");
        $stmt->execute([$activa, $id]);
        echo json_encode(['success' => true, 'message' => 'Estado actualizado.']);
        exit;
    }

    if (empty($titulo)) {
        echo json_encode(['success' => false, 'message' => 'El título de la encuesta es obligatorio.']);
        exit;
    }

    if (is_array($preguntas) && count($preguntas) > 10) {
        echo json_encode(['success' => false, 'message' => 'El máximo permitido es de 10 preguntas por encuesta.']);
        exit;
    }

    $fechaInicioVal = empty($fecha_inicio) ? null : $fecha_inicio;
    $fechaFinVal = empty($fecha_fin) ? null : $fecha_fin;

    if ($preguntas !== null) {
        $stmt = $pdo->prepare("UPDATE encuestas SET titulo = ?, fecha_inicio = ?, fecha_fin = ?, preguntas = ? WHERE id = ?");
        $stmt->execute([
            $titulo,
            $fechaInicioVal,
            $fechaFinVal,
            json_encode($preguntas, JSON_UNESCAPED_UNICODE),
            $id
        ]);
    } else {
        $stmt = $pdo->prepare("UPDATE encuestas SET titulo = ?, fecha_inicio = ?, fecha_fin = ? WHERE id = ?");
        $stmt->execute([
            $titulo,
            $fechaInicioVal,
            $fechaFinVal,
            $id
        ]);
    }

    echo json_encode(['success' => true, 'message' => 'Encuesta actualizada correctamente.']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error al actualizar: ' . $e->getMessage()]);
}
