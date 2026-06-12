<?php
// api/postulados/programas.php
// GET: Listar programas activos para el dropdown público
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

requireMethod('GET');

try {
    $pdo  = Database::getConnection();
    $stmt = $pdo->query("SELECT id, nombre, descripcion, cupos FROM programas WHERE activo = 1 ORDER BY nombre");
    $data = $stmt->fetchAll();
    jsonResponse(true, 'OK', $data);
} catch (PDOException $e) {
    jsonResponse(false, 'Error al cargar programas.', [], 500);
}
