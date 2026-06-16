<?php
// api/beneficiarios/update.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$auth = JWT::requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Método no permitido.', [], 405);
}

JWT::requirePermission($auth, 'beneficiarios', 'editar');

$pdo = Database::getConnection();

$id              = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
$organizacion_id = filter_var($_POST['organizacion_id'] ?? null, FILTER_VALIDATE_INT);
$tipo_doc        = trim($_POST['tipo_doc'] ?? '');
$num_doc         = trim($_POST['num_doc'] ?? '');
$p_apellido      = trim($_POST['p_apellido'] ?? '');
$s_apellido      = trim($_POST['s_apellido'] ?? '');
$p_nombre        = trim($_POST['p_nombre'] ?? '');
$s_nombre        = trim($_POST['s_nombre'] ?? '');
$email           = trim($_POST['email'] ?? '');
$telefono        = trim($_POST['telefono'] ?? '');
$departamento    = trim($_POST['departamento'] ?? '');
$municipio       = trim($_POST['municipio'] ?? '');
$programa_id     = filter_var($_POST['programa_id'] ?? null, FILTER_VALIDATE_INT);
$estado          = $_POST['estado'] ?? 'activo';
$tratamiento_datos = (isset($_POST['tratamiento_datos']) && $_POST['tratamiento_datos'] === '1') ? 1 : 0;

if (!$id || !$organizacion_id || !$tipo_doc || !$num_doc || !$p_apellido || !$p_nombre) {
    jsonResponse(false, 'Faltan campos obligatorios.', [], 422);
}

// Verificar que el ID existe
$checkDoc = $pdo->prepare("SELECT * FROM beneficiarios WHERE id = ? LIMIT 1");
$checkDoc->execute([$id]);
$current = $checkDoc->fetch();

if (!$current) {
    jsonResponse(false, 'Beneficiario no encontrado.', [], 404);
}

// Verificar que el documento no pertenezca a otro
if ($current['num_doc'] !== $num_doc) {
    $checkDocOther = $pdo->prepare("SELECT id FROM beneficiarios WHERE num_doc = ? LIMIT 1");
    $checkDocOther->execute([$num_doc]);
    if ($checkDocOther->fetch()) {
        jsonResponse(false, 'El número de documento ya está registrado en otro beneficiario.', [], 409);
    }
}

// Procesar Archivos
$uploadDir = __DIR__ . '/../../uploads/beneficiarios/';
$doc_identidad_filename = $current['doc_identidad_file'];
$rut_filename = $current['rut_file'];

if (!empty($_FILES['doc_identidad_file']['name'])) {
    $ext = pathinfo($_FILES['doc_identidad_file']['name'], PATHINFO_EXTENSION);
    $doc_identidad_filename = uniqid('doc_') . '.' . $ext;
    move_uploaded_file($_FILES['doc_identidad_file']['tmp_name'], $uploadDir . $doc_identidad_filename);
    // Podríamos eliminar el archivo anterior si quisiéramos aquí
}

if (!empty($_FILES['rut_file']['name'])) {
    $ext = pathinfo($_FILES['rut_file']['name'], PATHINFO_EXTENSION);
    $rut_filename = uniqid('rut_') . '.' . $ext;
    move_uploaded_file($_FILES['rut_file']['tmp_name'], $uploadDir . $rut_filename);
}

// Update
$stmt = $pdo->prepare("
    UPDATE beneficiarios SET 
        organizacion_id = ?, tipo_doc = ?, num_doc = ?, p_apellido = ?, s_apellido = ?, 
        p_nombre = ?, s_nombre = ?, email = ?, telefono = ?, departamento = ?, 
        municipio = ?, programa_id = ?, estado = ?, tratamiento_datos = ?, 
        doc_identidad_file = ?, rut_file = ?
    WHERE id = ?
");

$stmt->execute([
    $organizacion_id, $tipo_doc, $num_doc, $p_apellido, $s_apellido, 
    $p_nombre, $s_nombre, $email, $telefono, $departamento, 
    $municipio, $programa_id ?: null, $estado, $tratamiento_datos, 
    $doc_identidad_filename, $rut_filename, $id
]);

// Log
$log = $pdo->prepare("INSERT INTO log_accesos (usuario_id, accion, modulo, ip_address, detalle) VALUES (?, 'editar_beneficiario', 'beneficiarios', ?, ?)");
$log->execute([$auth['sub'], $_SERVER['REMOTE_ADDR'] ?? null, "Beneficiario actualizado: ID $id"]);

jsonResponse(true, 'Beneficiario actualizado con éxito.', []);
