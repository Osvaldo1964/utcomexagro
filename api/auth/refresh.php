<?php
// api/auth/refresh.php – Renovar access token usando refresh token
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';
requireMethod('POST');

$refreshToken = trim($_POST['refresh_token'] ?? '');
if (!$refreshToken) jsonResponse(false, 'Refresh token requerido.', [], 422);

$tokenHash = hash('sha256', $refreshToken);
$pdo = Database::getConnection();

$stmt = $pdo->prepare("
    SELECT rt.*, u.id AS uid, u.nombre, u.apellidos, u.email, u.activo,
           r.id AS rol_id, r.nombre AS rol_nombre
    FROM refresh_tokens rt
    JOIN usuarios u ON rt.usuario_id = u.id
    LEFT JOIN roles r ON u.rol_id = r.id
    WHERE rt.token_hash = ? AND rt.revocado = 0 AND rt.expires_at > NOW()
");
$stmt->execute([$tokenHash]);
$rt = $stmt->fetch();

if (!$rt) jsonResponse(false, 'Refresh token inválido o expirado.', [], 401);
if (!$rt['activo']) jsonResponse(false, 'Cuenta inactiva.', [], 403);

// Cargar permisos
$permStmt = $pdo->prepare("
    SELECT CONCAT(p.modulo,'.',p.accion) AS permiso
    FROM rol_permisos rp JOIN permisos p ON rp.permiso_id = p.id
    WHERE rp.rol_id = ?
");
$permStmt->execute([$rt['rol_id']]);
$permisos = array_column($permStmt->fetchAll(), 'permiso');

$accessToken = JWT::generate([
    'sub'     => $rt['uid'],
    'nombre'  => $rt['nombre'] . ($rt['apellidos'] ? ' '.$rt['apellidos'] : ''),
    'email'   => $rt['email'],
    'rol'     => $rt['rol_nombre'],
    'rol_id'  => $rt['rol_id'],
    'permisos'=> $permisos,
]);

jsonResponse(true, 'Token renovado.', [
    'access_token' => $accessToken,
    'expires_in'   => JWT_ACCESS_EXPIRY,
]);
