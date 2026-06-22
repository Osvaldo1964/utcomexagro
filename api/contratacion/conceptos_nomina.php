<?php
// ============================================================
// api/contratacion/conceptos_nomina.php
// CRUD de Conceptos de Nómina (Devengados y Deducciones)
// ============================================================

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

$user = JWT::requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$pdo = Database::getConnection();

if ($method === 'GET') {
    try {
        $sql = "SELECT id, nombre, tipo, estado FROM conceptos_nomina WHERE deleted = 0 ORDER BY tipo DESC, nombre ASC";
        $stmt = $pdo->query($sql);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse(true, 'OK', $data);
    } catch (Exception $e) {
        jsonResponse(false, 'Error al obtener conceptos de nómina: ' . $e->getMessage(), [], 500);
    }
} elseif ($method === 'POST') {
    try {
        // Podría ser creación, edición o borrado lógico (enviando 'action'='delete')
        $action = isset($_POST['action']) ? $_POST['action'] : 'save';
        $id = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;

        if ($action === 'delete') {
            if (!$id) jsonResponse(false, 'ID no proporcionado para eliminar.', [], 400);
            
            $sql = "UPDATE conceptos_nomina SET deleted = 1 WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$id]);
            jsonResponse(true, 'Concepto eliminado correctamente.');
        } else {
            // Guardar o Actualizar
            $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
            $tipo = isset($_POST['tipo']) ? trim($_POST['tipo']) : '';
            $estado = isset($_POST['estado']) ? (int)$_POST['estado'] : 1;

            if (empty($nombre) || !in_array($tipo, ['DEVENGADO', 'DEDUCCION'])) {
                jsonResponse(false, 'El nombre y el tipo (Devengado/Deducción) son obligatorios.', [], 400);
            }

            if ($id) {
                // Actualizar
                $sql = "UPDATE conceptos_nomina SET nombre = ?, tipo = ?, estado = ? WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$nombre, $tipo, $estado, $id]);
                jsonResponse(true, 'Concepto actualizado correctamente.');
            } else {
                // Insertar
                $sql = "INSERT INTO conceptos_nomina (nombre, tipo, estado) VALUES (?, ?, ?)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$nombre, $tipo, $estado]);
                jsonResponse(true, 'Concepto creado correctamente.');
            }
        }
    } catch (Exception $e) {
        jsonResponse(false, 'Error al guardar el concepto: ' . $e->getMessage(), [], 500);
    }
} else {
    jsonResponse(false, 'Método no permitido.', [], 405);
}
