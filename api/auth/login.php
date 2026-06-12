<?php
// ============================================================
// api/auth/login.php
// POST: Login – genera JWT access + refresh token
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');

$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    jsonResponse(false, 'Email y contraseña son requeridos.', [], 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(false, 'Email inválido.', [], 422);
}

$pdo = Database::getConnection();

// Buscar usuario activo
$stmt = $pdo->prepare("
    SELECT u.id, u.nombre, u.apellidos, u.email, u.password_hash,
           u.activo, u.avatar,
           r.id AS rol_id, r.nombre AS rol_nombre
    FROM usuarios u
    LEFT JOIN roles r ON u.rol_id = r.id
    WHERE u.email = ?
    LIMIT 1
");
$stmt->execute([$email]);
$user = $stmt->fetch();

// Verificar existencia y contraseña
if (!$user || !password_verify($password, $user['password_hash'])) {
    // Log intento fallido
    $logStmt = $pdo->prepare("INSERT INTO log_accesos (accion, modulo, ip_address, detalle) VALUES ('login_fallido','auth',?,?)");
    $logStmt->execute([$_SERVER['REMOTE_ADDR'] ?? null, "Email: $email"]);
    jsonResponse(false, 'Credenciales incorrectas.', [], 401);
}

if (!$user['activo']) {
    jsonResponse(false, 'Tu cuenta está inactiva. Contacta al administrador.', [], 403);
}

// Cargar permisos del rol
$permStmt = $pdo->prepare("
    SELECT CONCAT(p.modulo, '.', p.accion) AS permiso
    FROM rol_permisos rp
    JOIN permisos p ON rp.permiso_id = p.id
    WHERE rp.rol_id = ?
");
$permStmt->execute([$user['rol_id']]);
$permisos = array_column($permStmt->fetchAll(), 'permiso');

// Generar Access Token JWT
$payload = [
    'sub'    => $user['id'],
    'nombre' => $user['nombre'] . ($user['apellidos'] ? ' ' . $user['apellidos'] : ''),
    'email'  => $user['email'],
    'rol'    => $user['rol_nombre'],
    'rol_id' => $user['rol_id'],
    'permisos' => $permisos,
];
$accessToken = JWT::generate($payload);

// Generar Refresh Token
$refreshToken = JWT::generateRefreshToken();
$refreshHash  = hash('sha256', $refreshToken);
$expiresAt    = date('Y-m-d H:i:s', time() + JWT_REFRESH_EXPIRY);

// Limpiar refresh tokens viejos del usuario
$pdo->prepare("DELETE FROM refresh_tokens WHERE usuario_id = ? AND expires_at < NOW()")->execute([$user['id']]);

// Guardar refresh token
$rtStmt = $pdo->prepare("
    INSERT INTO refresh_tokens (usuario_id, token_hash, expires_at, user_agent, ip_address)
    VALUES (?, ?, ?, ?, ?)
");
$rtStmt->execute([
    $user['id'], $refreshHash, $expiresAt,
    substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 300),
    $_SERVER['REMOTE_ADDR'] ?? null,
]);

// Actualizar último acceso
$pdo->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?")->execute([$user['id']]);

// Log acceso exitoso
$logStmt = $pdo->prepare("INSERT INTO log_accesos (usuario_id, accion, modulo, ip_address) VALUES (?,'login','auth',?)");
$logStmt->execute([$user['id'], $_SERVER['REMOTE_ADDR'] ?? null]);

jsonResponse(true, 'Acceso concedido.', [
    'access_token'  => $accessToken,
    'refresh_token' => $refreshToken,
    'expires_in'    => JWT_ACCESS_EXPIRY,
    'user' => [
        'id'      => $user['id'],
        'nombre'  => $user['nombre'] . ($user['apellidos'] ? ' ' . $user['apellidos'] : ''),
        'email'   => $user['email'],
        'rol'     => $user['rol_nombre'],
        'avatar'  => $user['avatar'],
        'permisos'=> $permisos,
    ],
]);
