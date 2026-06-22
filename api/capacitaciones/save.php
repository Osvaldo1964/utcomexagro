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
    $id = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;
    $titulo = $_POST['titulo'] ?? '';
    $descripcion = $_POST['descripcion'] ?? '';
    $fecha_hora = $_POST['fecha_hora'] ?? '';
    $organizaciones = isset($_POST['organizaciones']) ? json_decode($_POST['organizaciones'], true) : [];
    
    // Generar sala_url si es nuevo
    $sala_url = isset($_POST['sala_url']) && $_POST['sala_url'] ? $_POST['sala_url'] : 'UTComex_Charla_' . time() . rand(100,999);

    if (empty($titulo) || empty($fecha_hora)) {
        jsonResponse(false, 'El título y la fecha son obligatorios', [], 400);
    }

    $pdo->beginTransaction();

    if ($id) {
        $sql = "UPDATE capacitaciones SET titulo=?, descripcion=?, fecha_inicio=? WHERE id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$titulo, $descripcion, $fecha_hora, $id]);
    } else {
        $sql = "INSERT INTO capacitaciones (titulo, descripcion, fecha_inicio, enlace_reunion, estado) VALUES (?, ?, ?, ?, 'programada')";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$titulo, $descripcion, $fecha_hora, $sala_url]);
        $id = $pdo->lastInsertId();
    }

    // Actualizar organizaciones
    $pdo->prepare("DELETE FROM capacitacion_organizaciones WHERE capacitacion_id = ?")->execute([$id]);
    
    if (!empty($organizaciones) && is_array($organizaciones)) {
        $stmtOrg = $pdo->prepare("INSERT INTO capacitacion_organizaciones (capacitacion_id, organizacion_id) VALUES (?, ?)");
        foreach ($organizaciones as $orgId) {
            $stmtOrg->execute([$id, (int)$orgId]);
        }
    }

    $pdo->commit();
    jsonResponse(true, 'Capacitación guardada exitosamente.');
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    jsonResponse(false, 'Error al guardar: ' . $e->getMessage(), [], 500);
}
