<?php
// ============================================================
// api/config/config.example.php
// PLANTILLA de configuración – NO contiene credenciales reales
//
// INSTRUCCIONES:
// 1. Copiar este archivo: cp config.example.php config.php
// 2. Editar config.php con tus datos reales
// 3. NUNCA subir config.php a GitHub
// ============================================================

// ---- Base de Datos ----
define('DB_HOST',    'localhost');
define('DB_NAME',    'utcomexagro');
define('DB_USER',    'root');          // ← cambiar en producción
define('DB_PASS',    '');              // ← cambiar en producción
define('DB_CHARSET', 'utf8mb4');

// ---- JWT ----
define('JWT_SECRET',           'CAMBIAR_POR_CLAVE_SEGURA_MIN_32_CHARS');
define('JWT_ACCESS_EXPIRY',    900);   // 15 minutos
define('JWT_REFRESH_EXPIRY',   86400); // 24 horas
define('JWT_INACTIVITY_LIMIT', 1800);  // 30 minutos de inactividad

// ---- Archivos / Uploads ----
define('UPLOAD_BASE_PATH', dirname(__DIR__, 2) . '/uploads/');
define('MAX_FILE_SIZE',    3 * 1024 * 1024); // 3 MB
define('ALLOWED_MIME_TYPES', serialize([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
]));

// ---- App ----
define('APP_NAME',  'UT COMEXAGRO');
define('APP_URL',   'http://localhost/utcomexagro'); // ← ajustar según entorno
define('APP_ENV',   'development');                  // development | production

// ---- Errores ----
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
