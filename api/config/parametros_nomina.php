<?php
// ============================================================
// api/config/parametros_nomina.php
// CRUD de Parámetros de Nómina (Configuración Anual)
// ============================================================

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/jwt.php';

$user = JWT::requireAuth();
// Solo superadministradores o roles con permisos de configuración deberían poder ver/editar esto.
// Asumimos que si llega aquí, tiene acceso al módulo de configuración.
// JWT::requirePermission($user, 'configuracion', 'leer');

$method = $_SERVER['REQUEST_METHOD'];
$pdo = Database::getConnection();

if ($method === 'GET') {
    try {
        $sql = "SELECT * FROM parametros_nomina ORDER BY anio DESC";
        $stmt = $pdo->query($sql);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse(true, 'OK', $data);
    } catch (Exception $e) {
        jsonResponse(false, 'Error al obtener parámetros de nómina: ' . $e->getMessage(), [], 500);
    }
} elseif ($method === 'POST') {
    try {
        $id = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;
        $anio = isset($_POST['anio']) ? (int)$_POST['anio'] : null;
        $salario_minimo = isset($_POST['salario_minimo']) ? (float)$_POST['salario_minimo'] : 0;
        $auxilio_transporte = isset($_POST['auxilio_transporte']) ? (float)$_POST['auxilio_transporte'] : 0;
        $aplica_exoneracion = isset($_POST['aplica_exoneracion']) ? (int)$_POST['aplica_exoneracion'] : 0;
        $estado = isset($_POST['estado']) ? (int)$_POST['estado'] : 1;

        if (!$anio || $salario_minimo <= 0) {
            jsonResponse(false, 'El año y el salario mínimo son obligatorios y deben ser válidos.', [], 400);
        }

        if ($id) {
            // Actualizar
            $sql = "UPDATE parametros_nomina 
                    SET anio = ?, salario_minimo = ?, auxilio_transporte = ?, aplica_exoneracion = ?, estado = ? 
                    WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$anio, $salario_minimo, $auxilio_transporte, $aplica_exoneracion, $estado, $id]);
            jsonResponse(true, 'Parámetro actualizado correctamente.');
        } else {
            // Insertar
            // Validar si el año ya existe
            $check = $pdo->prepare("SELECT id FROM parametros_nomina WHERE anio = ?");
            $check->execute([$anio]);
            if ($check->fetchColumn()) {
                jsonResponse(false, 'Ya existe una configuración para el año ' . $anio, [], 400);
            }

            $sql = "INSERT INTO parametros_nomina (anio, salario_minimo, auxilio_transporte, aplica_exoneracion, estado) 
                    VALUES (?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$anio, $salario_minimo, $auxilio_transporte, $aplica_exoneracion, $estado]);
            jsonResponse(true, 'Parámetro creado correctamente.');
        }
    } catch (Exception $e) {
        // Handle duplicate key error manually just in case
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            jsonResponse(false, 'El año ingresado ya se encuentra registrado.', [], 400);
        }
        jsonResponse(false, 'Error al guardar el parámetro: ' . $e->getMessage(), [], 500);
    }
} else {
    jsonResponse(false, 'Método no permitido.', [], 405);
}
