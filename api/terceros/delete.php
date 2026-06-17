<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST'); // Can be DELETE, using POST for simplicity
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$input = getJsonInput();
$id = $input['id'] ?? null;

if (!$id) {
    jsonResponse(false, 'ID de tercero no proporcionado.');
}

try {
    // Verificar si el tercero tiene movimientos o relaciones (a futuro)
    // Por ahora, borrado físico (o podríamos hacer lógico)
    
    $stmt = $pdo->prepare("DELETE FROM terceros WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(true, 'Tercero eliminado exitosamente.');

} catch (PDOException $e) {
    // 1451 is the SQLSTATE for foreign key constraint violation
    if ($e->getCode() == '23000' || $e->errorInfo[1] == 1451) {
        jsonResponse(false, 'No se puede eliminar el tercero porque tiene movimientos asociados.');
    }
    jsonResponse(false, 'Error al eliminar: ' . $e->getMessage());
}
