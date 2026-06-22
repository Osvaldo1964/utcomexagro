<?php
$js = file_get_contents('c:/xampp/htdocs/utcomexagro/admin/js/app.js');
preg_match_all("/permiso:\s*'([^']+)'/", $js, $matches);
$app_perms = array_unique($matches[1]);
sort($app_perms);
echo "Permisos en app.js:\n";
print_r($app_perms);

require_once __DIR__ . '/api/config/db.php';
try {
    $pdo = Database::getConnection();
    $stmt = $pdo->query("SELECT DISTINCT modulo FROM permisos ORDER BY modulo");
    $db_modules = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "\nModulos en DB:\n";
    print_r($db_modules);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
