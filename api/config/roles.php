<?php
// ============================================================
// api/config/roles.php
// GET: Listar los roles del sistema
// ============================================================
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

$auth = JWT::requireAuth();
JWT::requirePermission($auth, 'configuracion', 'usuarios');

requireMethod('GET');

$pdo  = Database::getConnection();
$stmt = $pdo->query("
    SELECT r.id, r.nombre, r.descripcion, r.activo, r.created_at,
           GROUP_CONCAT(rp.permiso_id) AS permiso_ids
    FROM roles r
    LEFT JOIN rol_permisos rp ON r.id = rp.rol_id
    GROUP BY r.id
    ORDER BY r.id ASC
");
$roles = $stmt->fetchAll();

foreach ($roles as &$r) {
    $r['permiso_ids'] = $r['permiso_ids'] ? array_map('intval', explode(',', $r['permiso_ids'])) : [];
}
unset($r);

jsonResponse(true, 'Roles cargados.', $roles);
