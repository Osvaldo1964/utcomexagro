<?php
// ============================================================
// api/config/roles_update_permisos.php
// POST: Actualizar los permisos asociados a un rol
// ============================================================
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

$auth = JWT::requireAuth();
JWT::requirePermission($auth, 'configuracion', 'permisos');

requireMethod('POST');

$rol_id      = filter_var($_POST['rol_id'] ?? null, FILTER_VALIDATE_INT);
$permiso_ids = $_POST['permiso_ids'] ?? []; // Array de IDs de permisos

if (!$rol_id) {
    jsonResponse(false, 'ID de rol inválido.', [], 422);
}

// Convertir a array si viene como JSON o string separado por comas, o asegurarse de que es array
if (is_string($permiso_ids)) {
    $decoded = json_decode($permiso_ids, true);
    $permiso_ids = is_array($decoded) ? $decoded : explode(',', $permiso_ids);
}
$permiso_ids = array_filter(array_map('intval', $permiso_ids));

$pdo = Database::getConnection();

// Verificar que el rol existe
$stmt = $pdo->prepare("SELECT nombre FROM roles WHERE id = ? LIMIT 1");
$stmt->execute([$rol_id]);
$rol = $stmt->fetch();
if (!$rol) {
    jsonResponse(false, 'El rol seleccionado no existe.', [], 404);
}

// No permitir modificar el rol Superadmin (ID = 1) para evitar quedar bloqueados
if ($rol_id === 1) {
    jsonResponse(false, 'No se pueden modificar los permisos del rol Superadmin.', [], 403);
}

try {
    $pdo->beginTransaction();

    // Eliminar permisos actuales del rol
    $delete = $pdo->prepare("DELETE FROM rol_permisos WHERE rol_id = ?");
    $delete->execute([$rol_id]);

    // Insertar nuevos permisos
    if (!empty($permiso_ids)) {
        // Validar que los permisos existan
        $placeholders = implode(',', array_fill(0, count($permiso_ids), '?'));
        $checkPerms = $pdo->prepare("SELECT id FROM permisos WHERE id IN ($placeholders)");
        $checkPerms->execute($permiso_ids);
        $validPerms = array_column($checkPerms->fetchAll(), 'id');

        if (!empty($validPerms)) {
            $insert = $pdo->prepare("INSERT INTO rol_permisos (rol_id, permiso_id) VALUES (?, ?)");
            foreach ($validPerms as $permId) {
                $insert->execute([$rol_id, $permId]);
            }
        }
    }

    // Log de accesos
    $log = $pdo->prepare("INSERT INTO log_accesos (usuario_id, accion, modulo, ip_address, detalle) VALUES (?, 'actualizar_permisos_rol', 'configuracion', ?, ?)");
    $log->execute([$auth['sub'], $_SERVER['REMOTE_ADDR'] ?? null, "Permisos actualizados para el rol " . $rol['nombre'] . " (ID: $rol_id)"]);

    $pdo->commit();
    jsonResponse(true, 'Permisos del rol actualizados con éxito.');

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, 'Error al actualizar permisos.', ['error' => $e->getMessage()], 500);
}
