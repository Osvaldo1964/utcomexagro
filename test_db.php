<?php
require 'api/config/db.php';
$pdo = Database::getConnection();
try {
    print_r($pdo->query("SHOW COLUMNS FROM postulados WHERE Field IN ('programa_id', 'cargo_id')")->fetchAll());
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
