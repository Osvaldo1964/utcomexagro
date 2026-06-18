<?php
require 'api/config/db.php';
$pdo = Database::getConnection();
$stmt = $pdo->query('DESCRIBE cargos');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
$stmt2 = $pdo->query('DESCRIBE postulados');
print_r($stmt2->fetchAll(PDO::FETCH_ASSOC));
?>
