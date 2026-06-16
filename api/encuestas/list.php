<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('GET');
$user = JWT::requireAuth();
$pdo = Database::getConnection();
// JWT::requirePermission($user, 'encuestas', 'leer');

try {
    $stmt = $pdo->query("SELECT * FROM encuestas ORDER BY created_at DESC");
    $encuestas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Decode preguntas JSON for each
    foreach ($encuestas as &$encuesta) {
        $encuesta['preguntas'] = json_decode($encuesta['preguntas'], true) ?? [];
    }

    echo json_encode([
        'success' => true,
        'data' => $encuestas
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
}
