<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST'); // Can be PUT, but we stick to POST with JSON payload for simplicity
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$input = getJsonInput();

$id = $input['id'] ?? null;
$tipo_documento = trim($input['tipo_documento'] ?? '');
$numero_documento = trim($input['numero_documento'] ?? '');
$nombre_razon_social = mb_strtoupper(trim($input['nombre_razon_social'] ?? ''), 'UTF-8');
$tipo_tercero = trim($input['tipo_tercero'] ?? 'Proveedor');
$email = mb_strtolower(trim($input['email'] ?? ''), 'UTF-8');
$telefono = trim($input['telefono'] ?? '');
$direccion = mb_convert_case(trim($input['direccion'] ?? ''), MB_CASE_TITLE, 'UTF-8');
$estado = trim($input['estado'] ?? 'Activo');

if (!$id || empty($tipo_documento) || empty($numero_documento) || empty($nombre_razon_social)) {
    jsonResponse(false, 'El ID y los datos obligatorios son requeridos.');
}

try {
    // Check if unique ignoring self
    $stmtCheck = $pdo->prepare("SELECT id FROM terceros WHERE numero_documento = ? AND id != ?");
    $stmtCheck->execute([$numero_documento, $id]);
    if ($stmtCheck->fetch()) {
        jsonResponse(false, 'Ya existe otro tercero registrado con este número de documento.');
    }

    $stmt = $pdo->prepare("
        UPDATE terceros SET 
            tipo_documento = ?, 
            numero_documento = ?, 
            nombre_razon_social = ?, 
            tipo_tercero = ?, 
            email = ?, 
            telefono = ?, 
            direccion = ?, 
            estado = ?
        WHERE id = ?
    ");

    $stmt->execute([
        $tipo_documento,
        $numero_documento,
        $nombre_razon_social,
        $tipo_tercero,
        $email,
        $telefono,
        $direccion,
        $estado,
        $id
    ]);

    jsonResponse(true, 'Tercero actualizado exitosamente.');

} catch (PDOException $e) {
    jsonResponse(false, 'Error al actualizar el tercero: ' . $e->getMessage());
}
