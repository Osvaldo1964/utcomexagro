<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$input = getJsonInput();
$id = $input['id'] ?? null;

if (!$id) {
    jsonResponse(false, 'ID del rubro no proporcionado.');
}

try {
    // Validar si tiene hijos
    $stmt = $pdo->prepare("SELECT id FROM presupuesto_rubros WHERE parent_id = ? LIMIT 1");
    $stmt->execute([$id]);
    if ($stmt->fetch()) {
        jsonResponse(false, 'No se puede eliminar porque tiene sub-rubros asociados.');
    }

    $stmt = $pdo->prepare("DELETE FROM presupuesto_rubros WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(true, 'Rubro eliminado exitosamente.');
} catch (PDOException $e) {
    // 1451 is the SQLSTATE for foreign key constraint violation
    if ($e->getCode() == '23000' || $e->errorInfo[1] == 1451) {
        jsonResponse(false, 'No se puede eliminar el rubro porque tiene movimientos u operaciones asociadas.');
    }
    jsonResponse(false, 'Error al eliminar: ' . $e->getMessage());
}
