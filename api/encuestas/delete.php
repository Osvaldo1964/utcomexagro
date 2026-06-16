<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$input = json_decode(file_get_contents('php://input'), true);
$id = $input['id'] ?? null;

if (!$id) {
    echo json_encode(['success' => false, 'message' => 'ID no proporcionado']);
    exit;
}

try {
    // Check if there are already answers
    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM encuesta_respuestas WHERE encuesta_id = ?");
    $stmtCheck->execute([$id]);
    $count = $stmtCheck->fetchColumn();

    if ($count > 0) {
        echo json_encode(['success' => false, 'message' => 'No se puede eliminar la encuesta porque ya tiene respuestas registradas. Puedes desactivarla en su lugar.']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM encuestas WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true, 'message' => 'Encuesta eliminada correctamente']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error al eliminar: ' . $e->getMessage()]);
}
