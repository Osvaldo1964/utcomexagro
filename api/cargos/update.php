<?php
// api/cargos/update.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
JWT::requirePermission($user, 'contratacion', 'evaluar');

$id = $_POST['id'] ?? null;
$nombre = trim($_POST['nombre'] ?? '');
$descripcion = trim($_POST['descripcion'] ?? '');
$perfil_requerido = trim($_POST['perfil_requerido'] ?? '');
$activo = isset($_POST['activo']) && $_POST['activo'] == '1' ? 1 : 0;

if (empty($id) || empty($nombre)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El ID y el nombre son obligatorios.']);
    exit;
}

$pdo = Database::getConnection();

try {
    $stmt = $pdo->prepare("
        UPDATE cargos 
        SET nombre = ?, descripcion = ?, perfil_requerido = ?, activo = ?
        WHERE id = ?
    ");
    $stmt->execute([$nombre, $descripcion, $perfil_requerido, $activo, $id]);

    echo json_encode([
        'success' => true,
        'message' => 'Cargo actualizado exitosamente.'
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar el cargo.',
        'error' => APP_ENV === 'development' ? $e->getMessage() : null
    ]);
}
