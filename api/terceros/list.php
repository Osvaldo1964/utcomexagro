<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('GET');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

try {
    $stmt = $pdo->query("SELECT id, tipo_documento, numero_documento, nombre_razon_social, tipo_tercero, email, telefono, direccion, estado, created_at FROM terceros ORDER BY nombre_razon_social ASC");
    $terceros = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(true, 'Lista de terceros', $terceros);

} catch (PDOException $e) {
    jsonResponse(false, 'Error al obtener terceros: ' . $e->getMessage());
}
