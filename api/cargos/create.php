<?php
// api/cargos/create.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
// Permiso genérico de contratación
JWT::requirePermission($user, 'contratacion', 'evaluar');

$nombre = trim($_POST['nombre'] ?? '');
$descripcion = trim($_POST['descripcion'] ?? '');
$perfil_requerido = trim($_POST['perfil_requerido'] ?? '');
$activo = isset($_POST['activo']) && $_POST['activo'] == '1' ? 1 : 0;

if (empty($nombre)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El nombre del cargo es obligatorio.']);
    exit;
}

$pdo = Database::getConnection();

try {
    $stmt = $pdo->prepare("
        INSERT INTO cargos (nombre, descripcion, perfil_requerido, activo)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$nombre, $descripcion, $perfil_requerido, $activo]);
    $id = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Cargo creado exitosamente.',
        'data' => [
            'id' => $id,
            'nombre' => $nombre,
            'activo' => $activo
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al crear el cargo.',
        'error' => APP_ENV === 'development' ? $e->getMessage() : null
    ]);
}
