<?php
// ============================================================
// api/organizaciones/update.php
// POST: Actualizar organización
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$auth = JWT::requireAuth();
$pdo = Database::getConnection();

requireMethod('POST');

$id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
if (!$id) jsonResponse(false, 'ID de organización inválido.', [], 422);

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

// Verificar si el NIT ya existe en otra organización
$check = $pdo->prepare("SELECT id FROM organizaciones WHERE nit = ? AND id != ? LIMIT 1");
$check->execute([$nit, $id]);
if ($check->fetch()) {
    jsonResponse(false, 'El NIT ya se encuentra registrado en otra organización.', [], 409);
}

$stmt = $pdo->prepare("
    UPDATE organizaciones 
    SET nit=?, nombre=?, tipo_id=?, poblacion_tipo_id=?, rep_legal=?, direccion=?, telefono=?, email=?, departamento=?, municipio=?, max_beneficiarios=?, estado=?
    WHERE id=?
");
$stmt->execute([$nit, $nombre, $tipo_id, $poblacion_tipo_id, $rep_legal, $direccion, $telefono, $email, $departamento, $municipio, $max_beneficiarios, $estado, $id]);

jsonResponse(true, 'Organización actualizada con éxito.');
