<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$user = JWT::requireAuth();
$pdo = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Method not allowed', [], 405);
}

try {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : null;
    $estado = $_POST['estado'] ?? '';
    $grabacion_url = $_POST['grabacion_url'] ?? null;

    if (!$id || !in_array($estado, ['programada', 'en_curso', 'finalizada'])) {
        jsonResponse(false, 'ID o estado inválido', [], 400);
    }

    if ($estado === 'finalizada' && $grabacion_url !== null) {
        $sql = "UPDATE capacitaciones SET estado=?, grabacion_url=? WHERE id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$estado, $grabacion_url, $id]);
    } else {
        $sql = "UPDATE capacitaciones SET estado=? WHERE id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$estado, $id]);
    }

    jsonResponse(true, 'Estado actualizado correctamente.');
} catch (Exception $e) {
    jsonResponse(false, 'Error al actualizar estado: ' . $e->getMessage(), [], 500);
}
