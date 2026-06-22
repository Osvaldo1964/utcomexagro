<?php
require_once __DIR__ . '/api/config/db.php';

try {
    $pdo = Database::getConnection();
    
    $sql = "INSERT IGNORE INTO permisos (modulo, accion, descripcion) VALUES 
        ('capacitaciones', 'leer', 'Ver listado de capacitaciones y charlas'),
        ('capacitaciones', 'crear', 'Crear nuevas capacitaciones y programar salas'),
        ('capacitaciones', 'editar', 'Editar capacitaciones existentes y actualizar estados'),
        ('capacitaciones', 'eliminar', 'Eliminar capacitaciones del sistema')
    ";
    
    $pdo->exec($sql);
    echo "Permisos de capacitaciones insertados correctamente.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
