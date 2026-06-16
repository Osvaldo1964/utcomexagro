<?php
// ============================================================
// api/beneficiarios/beneficiarios.php
// GET: Listar beneficiarios | POST: Crear beneficiario
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$auth = JWT::requireAuth();

$pdo = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    JWT::requirePermission($auth, 'beneficiarios', 'leer');

    $stmt = $pdo->query("
        SELECT b.*,
               o.nombre AS organizacion_nombre, o.nit AS organizacion_nit,
               pr.nombre AS programa_nombre
        FROM beneficiarios b
        LEFT JOIN organizaciones o ON b.organizacion_id = o.id
        LEFT JOIN programas pr ON b.programa_id = pr.id
        ORDER BY b.id DESC
    ");
    $beneficiarios = $stmt->fetchAll();
    jsonResponse(true, 'Beneficiarios cargados.', $beneficiarios);
} 
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    JWT::requirePermission($auth, 'beneficiarios', 'crear');

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

    if (!$organizacion_id || !$tipo_doc || !$num_doc || !$p_apellido || !$p_nombre) {
        jsonResponse(false, 'Organización, tipo y número de documento, primer apellido y primer nombre son obligatorios.', [], 422);
    }

    // 1. Validar que la organización existe y verificar límite de beneficiarios
    $orgStmt = $pdo->prepare("
        SELECT o.nombre, o.max_beneficiarios, COUNT(b.id) AS actuales
        FROM organizaciones o
        LEFT JOIN beneficiarios b ON o.id = b.organizacion_id AND b.estado = 'activo'
        WHERE o.id = ?
        GROUP BY o.id
        LIMIT 1
    ");
    $orgStmt->execute([$organizacion_id]);
    $org = $orgStmt->fetch();

    if (!$org) {
        jsonResponse(false, 'La organización seleccionada no existe.', [], 422);
    }

    if ($org['max_beneficiarios'] > 0 && $org['actuales'] >= $org['max_beneficiarios']) {
        jsonResponse(false, "La organización '{$org['nombre']}' ya alcanzó su cupo máximo de beneficiarios ({$org['max_beneficiarios']}).", [], 409);
    }

    // 2. Verificar si el documento del beneficiario ya existe
    $checkDoc = $pdo->prepare("SELECT id FROM beneficiarios WHERE num_doc = ? LIMIT 1");
    $checkDoc->execute([$num_doc]);
    if ($checkDoc->fetch()) {
        jsonResponse(false, 'El número de documento ya se encuentra registrado.', [], 409);
    }

    // Procesar Archivos
    $uploadDir = __DIR__ . '/../../uploads/beneficiarios/';
    $doc_identidad_filename = null;
    $rut_filename = null;

    if (!empty($_FILES['doc_identidad_file']['name'])) {
        $ext = pathinfo($_FILES['doc_identidad_file']['name'], PATHINFO_EXTENSION);
        $doc_identidad_filename = uniqid('doc_') . '.' . $ext;
        move_uploaded_file($_FILES['doc_identidad_file']['tmp_name'], $uploadDir . $doc_identidad_filename);
    }

    if (!empty($_FILES['rut_file']['name'])) {
        $ext = pathinfo($_FILES['rut_file']['name'], PATHINFO_EXTENSION);
        $rut_filename = uniqid('rut_') . '.' . $ext;
        move_uploaded_file($_FILES['rut_file']['tmp_name'], $uploadDir . $rut_filename);
    }

    // 3. Insertar
    $stmt = $pdo->prepare("
        INSERT INTO beneficiarios (organizacion_id, tipo_doc, num_doc, p_apellido, s_apellido, p_nombre, s_nombre, email, telefono, departamento, municipio, programa_id, estado, tratamiento_datos, doc_identidad_file, rut_file)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $organizacion_id, $tipo_doc, $num_doc,
        $p_apellido, $s_apellido, $p_nombre, $s_nombre,
        $email, $telefono, $departamento, $municipio,
        $programa_id ?: null, $estado, $tratamiento_datos, $doc_identidad_filename, $rut_filename
    ]);
    $newId = $pdo->lastInsertId();

    // Log
    $log = $pdo->prepare("INSERT INTO log_accesos (usuario_id, accion, modulo, ip_address, detalle) VALUES (?, 'crear_beneficiario', 'beneficiarios', ?, ?)");
    $log->execute([$auth['sub'], $_SERVER['REMOTE_ADDR'] ?? null, "Beneficiario creado: $p_nombre $p_apellido (C.C. $num_doc, Org: {$org['nombre']}, ID: $newId)"]);

    jsonResponse(true, 'Beneficiario creado con éxito.', ['id' => $newId]);
} 
else {
    jsonResponse(false, 'Método no permitido.', [], 405);
}
