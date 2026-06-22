<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$user = JWT::requireAuth();
$pdo = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    jsonResponse(false, 'Method not allowed', [], 405);
}

try {
    $id = isset($_POST['id']) ? (int)$_POST['id'] : null;
    if (!$id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = isset($data['id']) ? (int)$data['id'] : null;
    }

    if (!$id) {
        jsonResponse(false, 'ID inválido', [], 400);
    }

    $sql = "DELETE FROM capacitaciones WHERE id=?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);

    jsonResponse(true, 'Capacitación eliminada.');
} catch (Exception $e) {
    jsonResponse(false, 'Error al eliminar: ' . $e->getMessage(), [], 500);
}
