<?php
// ============================================================
// api/postulados/organizaciones_publicas.php
// GET público: Listar organizaciones activas para el form de postulación
// ============================================================
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

requireMethod('GET');

$pdo = Database::getConnection();

// Verificar que la tabla organizaciones exista
$pdo->exec("CREATE TABLE IF NOT EXISTS organizaciones (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nit              VARCHAR(30)   NOT NULL UNIQUE,
    nombre           VARCHAR(200)  NOT NULL,
    tipo_id          INT UNSIGNED  DEFAULT NULL,
    rep_legal        VARCHAR(200)  DEFAULT NULL,
    direccion        VARCHAR(300)  DEFAULT NULL,
    telefono         VARCHAR(30)   DEFAULT NULL,
    email            VARCHAR(150)  DEFAULT NULL,
    departamento     VARCHAR(100)  DEFAULT NULL,
    municipio        VARCHAR(100)  DEFAULT NULL,
    max_beneficiarios INT UNSIGNED DEFAULT 0,
    estado           ENUM('activo','inactivo') DEFAULT 'activo',
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$stmt = $pdo->query("
    SELECT id, nombre, nit
    FROM organizaciones
    WHERE estado = 'activo'
    ORDER BY nombre ASC
");

$orgs = $stmt->fetchAll();
jsonResponse(true, 'Organizaciones cargadas.', $orgs);
