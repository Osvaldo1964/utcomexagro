<?php
// api/postulados/cargos.php
// GET ?programa_id=X : Listar cargos por programa
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

requireMethod('GET');

$programaId = (int)($_GET['programa_id'] ?? 0);
if (!$programaId) {
    jsonResponse(false, 'Debe indicar un programa_id.', [], 422);
}

try {
    $pdo  = Database::getConnection();
    $stmt = $pdo->prepare("SELECT id, nombre, descripcion FROM cargos WHERE programa_id = ? AND activo = 1 ORDER BY nombre");
    $stmt->execute([$programaId]);
    $data = $stmt->fetchAll();
    jsonResponse(true, 'OK', $data);
} catch (PDOException $e) {
    jsonResponse(false, 'Error al cargar cargos.', [], 500);
}
