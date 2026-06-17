<?php
// ============================================================
// api/organizaciones/create.php
// POST: Crear nueva organización
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$auth = JWT::requireAuth();
$pdo = Database::getConnection();

requireMethod('POST');

$nit               = trim($_POST['nit'] ?? '');
$nombre            = trim($_POST['nombre'] ?? '');
$tipo_id           = filter_var($_POST['tipo_id'] ?? null, FILTER_VALIDATE_INT) ?: null;
$poblacion_tipo_id = filter_var($_POST['poblacion_tipo_id'] ?? null, FILTER_VALIDATE_INT) ?: null;
$rep_legal         = trim($_POST['rep_legal'] ?? '');
$direccion         = trim($_POST['direccion'] ?? '');
$telefono          = trim($_POST['telefono'] ?? '');
$email             = trim($_POST['email'] ?? '');
$departamento      = trim($_POST['departamento'] ?? '');
$municipio         = trim($_POST['municipio'] ?? '');
$max_beneficiarios = filter_var($_POST['max_beneficiarios'] ?? 0, FILTER_VALIDATE_INT) ?: 0;
$estado            = trim($_POST['estado'] ?? 'activo');

if (!$nit || !$nombre) {
    jsonResponse(false, 'El NIT y Nombre son obligatorios.', [], 422);
}

// Verificar si el NIT ya existe
$check = $pdo->prepare("SELECT id FROM organizaciones WHERE nit = ? LIMIT 1");
$check->execute([$nit]);
if ($check->fetch()) {
    jsonResponse(false, 'El NIT ya se encuentra registrado.', [], 409);
}

$stmt = $pdo->prepare("
    INSERT INTO organizaciones (nit, nombre, tipo_id, poblacion_tipo_id, rep_legal, direccion, telefono, email, departamento, municipio, max_beneficiarios, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([$nit, $nombre, $tipo_id, $poblacion_tipo_id, $rep_legal, $direccion, $telefono, $email, $departamento, $municipio, $max_beneficiarios, $estado]);
$newId = $pdo->lastInsertId();

jsonResponse(true, 'Organización creada con éxito.', ['id' => $newId]);
