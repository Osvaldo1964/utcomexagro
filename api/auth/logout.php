<?php
// api/auth/logout.php – Revocar refresh token (cerrar sesión)
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';
requireMethod('POST');

$refreshToken = trim($_POST['refresh_token'] ?? '');
if ($refreshToken) {
    $hash = hash('sha256', $refreshToken);
    $pdo  = Database::getConnection();
    $pdo->prepare("UPDATE refresh_tokens SET revocado = 1 WHERE token_hash = ?")->execute([$hash]);

    // Log
    $auth = JWT::extractFromHeader();
    if ($auth) {
        $payload = JWT::validate($auth);
        if ($payload) {
            $pdo->prepare("INSERT INTO log_accesos (usuario_id,accion,modulo,ip_address) VALUES (?,'logout','auth',?)")
                ->execute([$payload['sub'], $_SERVER['REMOTE_ADDR'] ?? null]);
        }
    }
}
jsonResponse(true, 'Sesión cerrada correctamente.');
