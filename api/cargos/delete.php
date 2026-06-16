<?php
// api/cargos/delete.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
JWT::requirePermission($user, 'contratacion', 'evaluar');

$id = $_POST['id'] ?? null;

if (empty($id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El ID del cargo es obligatorio.']);
    exit;
}

$pdo = Database::getConnection();

try {
    // Comprobamos si está en uso en postulados o contratos
    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM postulados WHERE cargo_id = ?");
    $stmtCheck->execute([$id]);
    if ($stmtCheck->fetchColumn() > 0) {
        throw new Exception("No se puede eliminar el cargo porque hay postulados asociados a él.");
    }

    $stmt = $pdo->prepare("DELETE FROM cargos WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode([
        'success' => true,
        'message' => 'Cargo eliminado exitosamente.'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al eliminar: ' . $e->getMessage()
    ]);
}
