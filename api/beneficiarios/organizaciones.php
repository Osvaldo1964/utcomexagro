<?php
// ============================================================
// api/beneficiarios/organizaciones.php
// GET: Listar organizaciones | POST: Crear organización
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$auth = JWT::requireAuth();

$pdo = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    JWT::requirePermission($auth, 'beneficiarios', 'leer');
    
    // Listar
    // También calculamos cuántos beneficiarios activos tiene asociados actualmente e incluimos el tipo de organización
    $stmt = $pdo->query("
        SELECT o.*, t.nombre AS tipo_nombre, COUNT(b.id) AS total_beneficiarios_actual
        FROM organizaciones o
        LEFT JOIN tipos_organizacion t ON o.tipo_id = t.id
        LEFT JOIN beneficiarios b ON o.id = b.organizacion_id AND b.estado = 'activo'
        GROUP BY o.id, t.id
        ORDER BY o.nombre ASC
    ");
    $orgs = $stmt->fetchAll();
    jsonResponse(true, 'Organizaciones cargadas.', $orgs);
} 
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    JWT::requirePermission($auth, 'beneficiarios', 'crear');
    
    $nit               = trim($_POST['nit'] ?? '');
    $nombre            = trim($_POST['nombre'] ?? '');
    $tipo_id           = filter_var($_POST['tipo_id'] ?? null, FILTER_VALIDATE_INT);
    $rep_legal         = trim($_POST['rep_legal'] ?? '');
    $direccion         = trim($_POST['direccion'] ?? '');
    $telefono          = trim($_POST['telefono'] ?? '');
    $email             = trim($_POST['email'] ?? '');
    $departamento      = trim($_POST['departamento'] ?? '');
    $municipio         = trim($_POST['municipio'] ?? '');
    $max_beneficiarios = filter_var($_POST['max_beneficiarios'] ?? 0, FILTER_VALIDATE_INT);

    if (!$nit || !$nombre || !$tipo_id) {
        jsonResponse(false, 'El NIT, Nombre y Tipo de Organización son obligatorios.', [], 422);
    }

    // Verificar si el tipo de organización existe
    $checkTipo = $pdo->prepare("SELECT id FROM tipos_organizacion WHERE id = ? LIMIT 1");
    $checkTipo->execute([$tipo_id]);
    if (!$checkTipo->fetch()) {
        jsonResponse(false, 'El tipo de organización seleccionado no es válido.', [], 422);
    }

    // Verificar si el NIT ya existe
    $check = $pdo->prepare("SELECT id FROM organizaciones WHERE nit = ? LIMIT 1");
    $check->execute([$nit]);
    if ($check->fetch()) {
        jsonResponse(false, 'El NIT ya se encuentra registrado.', [], 409);
    }

    $stmt = $pdo->prepare("
        INSERT INTO organizaciones (nit, nombre, tipo_id, rep_legal, direccion, telefono, email, departamento, municipio, max_beneficiarios)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$nit, $nombre, $tipo_id, $rep_legal, $direccion, $telefono, $email, $departamento, $municipio, $max_beneficiarios]);
    $newId = $pdo->lastInsertId();

    // Log
    $log = $pdo->prepare("INSERT INTO log_accesos (usuario_id, accion, modulo, ip_address, detalle) VALUES (?, 'crear_organizacion', 'beneficiarios', ?, ?)");
    $log->execute([$auth['sub'], $_SERVER['REMOTE_ADDR'] ?? null, "Organización creada: $nombre (NIT: $nit, ID: $newId, Tipo ID: $tipo_id)"]);

    jsonResponse(true, 'Organización creada con éxito.', ['id' => $newId]);
} 
else {
    jsonResponse(false, 'Método no permitido.', [], 405);
}
