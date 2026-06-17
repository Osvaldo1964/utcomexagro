<?php
// ============================================================
// api/beneficiarios/poblacion_tipos.php
// GET: Listar | POST: Crear | DELETE: Eliminar (mediante JSON con action='delete')
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$auth = JWT::requireAuth();
$pdo = Database::getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    JWT::requirePermission($auth, 'beneficiarios', 'leer');
    
    // Listar tipos de población contando cuántas organizaciones lo usan
    $stmt = $pdo->query("
        SELECT pt.*, COUNT(o.id) as total_organizaciones 
        FROM poblacion_tipos pt 
        LEFT JOIN organizaciones o ON pt.id = o.poblacion_tipo_id 
        GROUP BY pt.id 
        ORDER BY pt.nombre ASC
    ");
    $tipos = $stmt->fetchAll();
    jsonResponse(true, 'Tipos de población cargados.', $tipos);
} 
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getJsonInput();

    if (isset($input['action']) && $input['action'] === 'delete') {
        JWT::requirePermission($auth, 'beneficiarios', 'eliminar');
        $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id) {
            jsonResponse(false, 'ID inválido.');
        }

        // Verificar si tiene organizaciones
        $check = $pdo->prepare("SELECT id FROM organizaciones WHERE poblacion_tipo_id = ? LIMIT 1");
        $check->execute([$id]);
        if ($check->fetch()) {
            jsonResponse(false, 'No se puede eliminar porque hay organizaciones usando este tipo de población.');
        }

        $stmt = $pdo->prepare("DELETE FROM poblacion_tipos WHERE id = ?");
        if ($stmt->execute([$id])) {
            jsonResponse(true, 'Tipo de población eliminado.');
        } else {
            jsonResponse(false, 'Error al eliminar el tipo de población.');
        }
    } else {
        // CREAR TIPO
        JWT::requirePermission($auth, 'beneficiarios', 'crear');
        $nombre = trim($input['nombre'] ?? '');
        if (!$nombre) {
            jsonResponse(false, 'El nombre es obligatorio.');
        }

        try {
            $stmt = $pdo->prepare("INSERT INTO poblacion_tipos (nombre) VALUES (?)");
            $stmt->execute([$nombre]);
            jsonResponse(true, 'Tipo de población creado exitosamente.', ['id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                jsonResponse(false, 'Este tipo de población ya existe.');
            }
            jsonResponse(false, 'Error en la base de datos: ' . $e->getMessage());
        }
    }
} else {
    jsonResponse(false, 'Método no permitido.', [], 405);
}
