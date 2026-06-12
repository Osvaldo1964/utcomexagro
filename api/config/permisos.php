<?php
// ============================================================
// api/config/permisos.php
// GET: Listar todos los permisos del sistema
// ============================================================
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

$auth = JWT::requireAuth();
JWT::requirePermission($auth, 'configuracion', 'usuarios');

requireMethod('GET');

$pdo  = Database::getConnection();
$stmt = $pdo->query("SELECT id, modulo, accion, descripcion FROM permisos ORDER BY modulo ASC, accion ASC");
$permisos = $stmt->fetchAll();

jsonResponse(true, 'Permisos cargados.', $permisos);
