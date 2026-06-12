<?php
// ============================================================
// scratch/migrate_tipos.php
// Migración de base de datos para Tipos de Organización
// ============================================================
require_once __DIR__ . '/../api/config/db.php';

try {
    $pdo = Database::getConnection();
    echo "Conexión a la base de datos establecida correctamente.\n";

    // 1. Crear tabla tipos_organizacion
    $sqlTable = "
        CREATE TABLE IF NOT EXISTS tipos_organizacion (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL UNIQUE,
            descripcion VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    $pdo->exec($sqlTable);
    echo "1. Tabla 'tipos_organizacion' creada o ya existía.\n";

    // 2. Insertar valores por defecto
    $defaultTypes = [
        ['nombre' => 'Acuícola', 'descripcion' => 'Organizaciones relacionadas con la acuicultura y cría de peces'],
        ['nombre' => 'Avícola', 'descripcion' => 'Organizaciones relacionadas con el sector avícola y aves de corral'],
        ['nombre' => 'Bovinos', 'descripcion' => 'Organizaciones relacionadas con la ganadería bovina y lechera'],
    ];

    $stmtInsert = $pdo->prepare("INSERT IGNORE INTO tipos_organizacion (nombre, descripcion) VALUES (:nombre, :descripcion)");
    foreach ($defaultTypes as $type) {
        $stmtInsert->execute($type);
    }
    echo "2. Valores iniciales insertados o ya existían.\n";

    // 3. Agregar columna tipo_id a la tabla organizaciones si no existe
    $checkCol = $pdo->query("
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'organizaciones' 
          AND COLUMN_NAME = 'tipo_id'
    ");
    
    if (!$checkCol->fetch()) {
        $pdo->exec("ALTER TABLE organizaciones ADD COLUMN tipo_id INT UNSIGNED AFTER id");
        echo "3. Columna 'tipo_id' agregada a la tabla 'organizaciones'.\n";
    } else {
        echo "3. Columna 'tipo_id' ya existe en la tabla 'organizaciones'.\n";
    }

    // 4. Agregar constraint de llave foránea fk_organizaciones_tipo_id si no existe
    $checkConstraint = $pdo->query("
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'organizaciones' 
          AND CONSTRAINT_NAME = 'fk_organizaciones_tipo_id'
    ");

    if (!$checkConstraint->fetch()) {
        // Enlazar organizaciones existentes al primer tipo creado para que no tengan tipo_id NULL si no es deseado,
        // o dejar en NULL si es aceptable. Como el usuario indicó que cada organización debe pertenecer a un tipo,
        // asignaremos el primer tipo de organización (id=1) a cualquier organización que actualmente tenga tipo_id en NULL.
        $stmtFirstType = $pdo->query("SELECT id FROM tipos_organizacion ORDER BY id ASC LIMIT 1");
        $firstTypeId = $stmtFirstType->fetchColumn();
        if ($firstTypeId) {
            $pdo->exec("UPDATE organizaciones SET tipo_id = $firstTypeId WHERE tipo_id IS NULL");
            echo "   - Organizaciones existentes asignadas por defecto al tipo ID: $firstTypeId\n";
        }

        // Agregar constraint con ON DELETE CASCADE
        $pdo->exec("
            ALTER TABLE organizaciones 
            ADD CONSTRAINT fk_organizaciones_tipo_id 
            FOREIGN KEY (tipo_id) REFERENCES tipos_organizacion(id) ON DELETE CASCADE
        ");
        echo "4. Restricción de llave foránea 'fk_organizaciones_tipo_id' con ON DELETE CASCADE añadida.\n";
    } else {
        echo "4. Restricción de llave foránea 'fk_organizaciones_tipo_id' ya existe.\n";
    }

    echo "\nMigración completada con éxito!\n";

} catch (Exception $e) {
    echo "\nERROR al ejecutar la migración: " . $e->getMessage() . "\n";
    exit(1);
}
