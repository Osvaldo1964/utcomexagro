<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

requireMethod('POST');
$user = JWT::requireAuth();
$pdo = Database::getConnection();

$input = getJsonInput();
$id = $input['id'] ?? null;
$nombre = trim($input['nombre'] ?? '');
$descripcion = trim($input['descripcion'] ?? '');
$parent_id = $input['parent_id'] ?? null;
$organizacion_id = $input['organizacion_id'] ?? null;
$valor_total = isset($input['valor_total']) ? (float)$input['valor_total'] : 0;
$activo = isset($input['activo']) ? (int)$input['activo'] : 1;

if (empty($nombre)) {
    jsonResponse(false, 'El nombre del rubro es obligatorio.');
}

try {
    if ($id) {
        // Edit
        $stmt = $pdo->prepare("SELECT nivel FROM presupuesto_rubros WHERE id = ?");
        $stmt->execute([$id]);
        $curr = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$curr) jsonResponse(false, 'Rubro no encontrado.');
        
        $nivel = (int)$curr['nivel'];
        if ($nivel < 4) {
            $valor_total = 0; // Agrupadores no tienen valor asignado directo
            $organizacion_id = null;
        }

        $stmt = $pdo->prepare("
            UPDATE presupuesto_rubros 
            SET nombre = ?, descripcion = ?, valor_total = ?, organizacion_id = ?, activo = ?
            WHERE id = ?
        ");
        $stmt->execute([$nombre, $descripcion, $valor_total, $organizacion_id, $activo, $id]);

        jsonResponse(true, 'Rubro actualizado exitosamente.');
    } else {
        // Create
        $nivel = 1;
        $parent_code = '';
        if ($parent_id) {
            $stmt = $pdo->prepare("SELECT nivel, codigo FROM presupuesto_rubros WHERE id = ?");
            $stmt->execute([$parent_id]);
            $parent = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$parent) jsonResponse(false, 'Rubro padre no encontrado.');
            
            $nivel = (int)$parent['nivel'] + 1;
            $parent_code = $parent['codigo'];
            if ($nivel > 4) {
                jsonResponse(false, 'No se permite exceder el cuarto nivel de profundidad.');
            }
        }

        if ($nivel < 4) {
            $valor_total = 0;
            $organizacion_id = null;
        }

        // Generar Código Automático
        if ($parent_id) {
            $stmt = $pdo->prepare("SELECT codigo FROM presupuesto_rubros WHERE parent_id = ?");
            $stmt->execute([$parent_id]);
        } else {
            $stmt = $pdo->prepare("SELECT codigo FROM presupuesto_rubros WHERE parent_id IS NULL");
            $stmt->execute();
        }
        $siblings = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $max_suffix = 0;
        foreach ($siblings as $code) {
            $parts = explode('.', $code);
            $last = (int)end($parts);
            if ($last > $max_suffix) {
                $max_suffix = $last;
            }
        }
        $next_suffix = $max_suffix + 1;

        if ($nivel === 1) {
            $new_code = (string)$next_suffix;
        } else if ($nivel === 4) {
            $new_code = $parent_code . '.' . sprintf('%02d', $next_suffix); // e.g. 1.1.1.01
        } else {
            $new_code = $parent_code . '.' . $next_suffix; // e.g. 1.1
        }

        $stmt = $pdo->prepare("
            INSERT INTO presupuesto_rubros (codigo, nombre, descripcion, valor_total, parent_id, nivel, organizacion_id, activo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$new_code, $nombre, $descripcion, $valor_total, $parent_id, $nivel, $organizacion_id, $activo]);

        jsonResponse(true, 'Rubro creado exitosamente.', ['id' => $pdo->lastInsertId(), 'codigo' => $new_code]);
    }
} catch (PDOException $e) {
    jsonResponse(false, 'Error al guardar el rubro: ' . $e->getMessage());
}
