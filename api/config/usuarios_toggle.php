<?php
// ============================================================
// api/config/usuarios_toggle.php
// POST: Activar / Inactivar un usuario del sistema
// ============================================================
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

$auth = JWT::requireAuth();
JWT::requirePermission($auth, 'configuracion', 'usuarios');

requireMethod('POST');

$id = filter_var($_POST['id'] ?? null, FILTER_VALIDATE_INT);
if (!$id) {
    jsonResponse(false, 'ID de usuario inválido.', [], 422);
}

// No permitirse inactivar a uno mismo
if ($id === (int)$auth['sub']) {
    jsonResponse(false, 'No puedes cambiar tu propio estado.', [], 400);
}

$pdo = Database::getConnection();

// Buscar usuario actual
$stmt = $pdo->prepare("SELECT activo, email FROM usuarios WHERE id = ? LIMIT 1");
$stmt->execute([$id]);
$user = $stmt->fetch();

if (!$user) {
    jsonResponse(false, 'El usuario no existe.', [], 404);
}

$nuevoEstado = $user['activo'] ? 0 : 1;

// Actualizar
$update = $pdo->prepare("UPDATE usuarios SET activo = ? WHERE id = ?");
$update->execute([$nuevoEstado, $id]);

// Log de acceso
$log = $pdo->prepare("INSERT INTO log_accesos (usuario_id, accion, modulo, ip_address, detalle) VALUES (?, 'toggle_usuario', 'configuracion', ?, ?)");
$logText = $nuevoEstado ? "Usuario activado: " : "Usuario desactivado: ";
$log->execute([$auth['sub'], $_SERVER['REMOTE_ADDR'] ?? null, $logText . $user['email']]);

jsonResponse(true, 'Estado de usuario actualizado.', [
    'id' => $id,
    'activo' => $nuevoEstado
]);
