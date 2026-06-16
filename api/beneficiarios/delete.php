<?php
// api/beneficiarios/delete.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$auth = JWT::requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Método no permitido.', [], 405);
}

JWT::requirePermission($auth, 'beneficiarios', 'eliminar');

$pdo = Database::getConnection();

$data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);

if (!$id) {
    jsonResponse(false, 'ID de beneficiario requerido.', [], 400);
}

// Podríamos eliminarlo físicamente o inactivarlo. Vamos a inactivarlo por seguridad.
$stmt = $pdo->prepare("UPDATE beneficiarios SET estado = 'inactivo' WHERE id = ?");
$stmt->execute([$id]);

// Log
$log = $pdo->prepare("INSERT INTO log_accesos (usuario_id, accion, modulo, ip_address, detalle) VALUES (?, 'eliminar_beneficiario', 'beneficiarios', ?, ?)");
$log->execute([$auth['sub'], $_SERVER['REMOTE_ADDR'] ?? null, "Beneficiario inhabilitado: ID $id"]);

jsonResponse(true, 'Beneficiario eliminado (inactivado) con éxito.', []);
