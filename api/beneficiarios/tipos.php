<?php
// ============================================================
// api/beneficiarios/tipos.php
// CRUD de Tipos de Organización (Acuícola, Avícola, Bovinos, etc.)
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$auth = JWT::requireAuth();
$pdo = Database::getConnection();

$method = $_SERVER['REQUEST_METHOD'];

// Soporte para emular DELETE mediante POST con parámetro o cabecera (por si acaso)
if ($method === 'POST' && (isset($_GET['_method']) && $_GET['_method'] === 'DELETE')) {
    $method = 'DELETE';
}

if ($method === 'GET') {
    JWT::requirePermission($auth, 'beneficiarios', 'leer');
    
    // Obtener los tipos con el conteo de organizaciones asociadas
    $stmt = $pdo->query("
        SELECT t.*, 
               COUNT(DISTINCT o.id) AS total_organizaciones,
               COUNT(DISTINCT b.id) AS total_beneficiarios
        FROM tipos_organizacion t
        LEFT JOIN organizaciones o ON t.id = o.tipo_id
        LEFT JOIN beneficiarios b ON o.id = b.organizacion_id AND b.estado = 'activo'
        GROUP BY t.id
        ORDER BY t.nombre ASC
    ");
    $tipos = $stmt->fetchAll();
    jsonResponse(true, 'Tipos de organización cargados.', $tipos);
} 
elseif ($method === 'POST') {
    // Determinar si es creación o actualización
    $id = filter_var($_GET['id'] ?? $_POST['id'] ?? null, FILTER_VALIDATE_INT);
    
    $nombre = trim($_POST['nombre'] ?? '');
    $descripcion = trim($_POST['descripcion'] ?? '');

    if (!$nombre) {
        jsonResponse(false, 'El nombre es obligatorio.', [], 422);
    }

    if ($id) {
        // ACTUALIZAR
        JWT::requirePermission($auth, 'beneficiarios', 'editar');

        // Verificar existencia del tipo
        $stmtExist = $pdo->prepare("SELECT id FROM tipos_organizacion WHERE id = ?");
        $stmtExist->execute([$id]);
        if (!$stmtExist->fetch()) {
            jsonResponse(false, 'El tipo de organización especificado no existe.', [], 444);
        }

        // Verificar duplicados de nombre
        $stmtCheck = $pdo->prepare("SELECT id FROM tipos_organizacion WHERE nombre = ? AND id != ? LIMIT 1");
        $stmtCheck->execute([$nombre, $id]);
        if ($stmtCheck->fetch()) {
            jsonResponse(false, 'Ya existe otro tipo de organización con este nombre.', [], 409);
        }

        $stmt = $pdo->prepare("UPDATE tipos_organizacion SET nombre = ?, descripcion = ? WHERE id = ?");
        $stmt->execute([$nombre, $descripcion, $id]);

        // Log
        $log = $pdo->prepare("INSERT INTO log_accesos (usuario_id, accion, modulo, ip_address, detalle) VALUES (?, 'editar_tipo_organizacion', 'beneficiarios', ?, ?)");
        $log->execute([$auth['sub'], $_SERVER['REMOTE_ADDR'] ?? null, "Tipo de organización editado: $nombre (ID: $id)"]);

        jsonResponse(true, 'Tipo de organización actualizado con éxito.');
    } else {
        // CREAR
        JWT::requirePermission($auth, 'beneficiarios', 'crear');

        // Verificar duplicados de nombre
        $stmtCheck = $pdo->prepare("SELECT id FROM tipos_organizacion WHERE nombre = ? LIMIT 1");
        $stmtCheck->execute([$nombre]);
        if ($stmtCheck->fetch()) {
            jsonResponse(false, 'Ya existe un tipo de organización con este nombre.', [], 409);
        }

        $stmt = $pdo->prepare("INSERT INTO tipos_organizacion (nombre, descripcion) VALUES (?, ?)");
        $stmt->execute([$nombre, $descripcion]);
        $newId = $pdo->lastInsertId();

        // Log
        $log = $pdo->prepare("INSERT INTO log_accesos (usuario_id, accion, modulo, ip_address, detalle) VALUES (?, 'crear_tipo_organizacion', 'beneficiarios', ?, ?)");
        $log->execute([$auth['sub'], $_SERVER['REMOTE_ADDR'] ?? null, "Tipo de organización creado: $nombre (ID: $newId)"]);

        jsonResponse(true, 'Tipo de organización creado con éxito.', ['id' => $newId]);
    }
} 
elseif ($method === 'DELETE') {
    JWT::requirePermission($auth, 'beneficiarios', 'eliminar');

    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id) {
        jsonResponse(false, 'ID de tipo no válido.', [], 422);
    }

    // Obtener información del tipo para el registro de auditoría
    $stmtInfo = $pdo->prepare("SELECT nombre FROM tipos_organizacion WHERE id = ?");
    $stmtInfo->execute([$id]);
    $tipo = $stmtInfo->fetch();

    if (!$tipo) {
        jsonResponse(false, 'El tipo de organización no existe.', [], 444);
    }

    // Ejecutar eliminación (la base de datos se encargará de cascada por ON DELETE CASCADE en tipo_id)
    $stmt = $pdo->prepare("DELETE FROM tipos_organizacion WHERE id = ?");
    $stmt->execute([$id]);

    // Log
    $log = $pdo->prepare("INSERT INTO log_accesos (usuario_id, accion, modulo, ip_address, detalle) VALUES (?, 'eliminar_tipo_organizacion', 'beneficiarios', ?, ?)");
    $log->execute([$auth['sub'], $_SERVER['REMOTE_ADDR'] ?? null, "Tipo de organización eliminado en cascada: " . $tipo['nombre'] . " (ID: $id)"]);

    jsonResponse(true, 'Tipo de organización eliminado con éxito (y todas las organizaciones asociadas en cascada).');
} 
else {
    jsonResponse(false, 'Método no permitido.', [], 405);
}
