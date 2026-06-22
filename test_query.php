<?php
require_once __DIR__ . '/api/config/db.php';

try {
    $pdo = Database::getConnection();
    
    $sql = "SELECT c.*, 
            (SELECT GROUP_CONCAT(o.nombre SEPARATOR ', ') 
             FROM capacitacion_organizaciones co 
             JOIN organizaciones o ON co.organizacion_id = o.id 
             WHERE co.capacitacion_id = c.id) as organizaciones_nombres,
            (SELECT GROUP_CONCAT(co.organizacion_id) 
             FROM capacitacion_organizaciones co 
             WHERE co.capacitacion_id = c.id) as organizaciones_ids
            FROM capacitaciones c 
            ORDER BY c.fecha_hora DESC";
    $stmt = $pdo->query($sql);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "Query OK";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
