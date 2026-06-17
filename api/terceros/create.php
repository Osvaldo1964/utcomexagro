<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$input = getJsonInput();

$tipo_documento = trim($input['tipo_documento'] ?? '');
$numero_documento = trim($input['numero_documento'] ?? '');
$nombre_razon_social = mb_strtoupper(trim($input['nombre_razon_social'] ?? ''), 'UTF-8');
$tipo_tercero = trim($input['tipo_tercero'] ?? 'Proveedor');
$email = mb_strtolower(trim($input['email'] ?? ''), 'UTF-8');
$telefono = trim($input['telefono'] ?? '');
$direccion = mb_convert_case(trim($input['direccion'] ?? ''), MB_CASE_TITLE, 'UTF-8');
$estado = trim($input['estado'] ?? 'Activo');

if (empty($tipo_documento) || empty($numero_documento) || empty($nombre_razon_social)) {
    jsonResponse(false, 'Faltan datos obligatorios (Tipo, Número de Documento y Nombre/Razón Social).');
}

try {
    // Check if unique
    $stmtCheck = $pdo->prepare("SELECT id FROM terceros WHERE numero_documento = ?");
    $stmtCheck->execute([$numero_documento]);
    if ($stmtCheck->fetch()) {
        jsonResponse(false, 'Ya existe un tercero registrado con este número de documento.');
    }

    $stmt = $pdo->prepare("
        INSERT INTO terceros (tipo_documento, numero_documento, nombre_razon_social, tipo_tercero, email, telefono, direccion, estado, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        $user['sub'] ?? null
    ]);

    jsonResponse(true, 'Tercero registrado exitosamente.', ['id' => $pdo->lastInsertId()]);

} catch (PDOException $e) {
    jsonResponse(false, 'Error al guardar el tercero: ' . $e->getMessage());
}
