<?php
// ============================================================
// api/config/jwt.php
// Implementación JWT HS256 sin dependencias externas
// ============================================================
require_once __DIR__ . '/config.php';

class JWT {

    // ---- Codificación base64url ----
    private static function b64Encode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function b64Decode(string $data): string {
        $pad = strlen($data) % 4;
        if ($pad) $data .= str_repeat('=', 4 - $pad);
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Genera un Access Token JWT.
     * @param array $payload Datos a incluir (no sensibles).
     * @return string Token JWT firmado.
     */
    public static function generate(array $payload): string {
        $header  = self::b64Encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $now     = time();
        $payload['iat']           = $now;
        $payload['exp']           = $now + JWT_ACCESS_EXPIRY;
        $payload['last_activity'] = $now;

        $body      = self::b64Encode(json_encode($payload));
        $signature = self::b64Encode(
            hash_hmac('sha256', "$header.$body", JWT_SECRET, true)
        );
        return "$header.$body.$signature";
    }

    /**
     * Valida y decodifica un JWT.
     * @param string $token Token a validar.
     * @return array|false Payload decodificado o false si inválido/expirado.
     */
    public static function validate(string $token): array|false {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;

        [$header, $body, $signature] = $parts;

        // Verificar firma
        $expectedSig = self::b64Encode(
            hash_hmac('sha256', "$header.$body", JWT_SECRET, true)
        );
        if (!hash_equals($expectedSig, $signature)) return false;

        $payload = json_decode(self::b64Decode($body), true);
        if (!$payload) return false;

        // Verificar expiración
        if (($payload['exp'] ?? 0) < time()) return false;

        // Verificar inactividad
        $lastActivity = $payload['last_activity'] ?? 0;
        if ((time() - $lastActivity) > JWT_INACTIVITY_LIMIT) return false;

        return $payload;
    }

    /**
     * Refresca el last_activity de un token válido.
     * @param string $token Token actual.
     * @return string|false Nuevo token con last_activity actualizado, o false.
     */
    public static function refresh(string $token): string|false {
        $payload = self::validate($token);
        if (!$payload) return false;

        unset($payload['iat'], $payload['exp'], $payload['last_activity']);
        return self::generate($payload);
    }

    /**
     * Extrae el token Bearer del header Authorization.
     */
    public static function extractFromHeader(): ?string {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? apache_request_headers()['Authorization']
            ?? null;

        if ($authHeader && preg_match('/Bearer\s+(.+)$/i', $authHeader, $m)) {
            return $m[1];
        }
        return null;
    }

    /**
     * Middleware: valida el JWT del request actual.
     * Si falla, envía 401 y termina ejecución.
     * @return array Payload del token.
     */
    public static function requireAuth(): array {
        $token = self::extractFromHeader();
        if (!$token) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Token no proporcionado.']);
            exit;
        }
        $payload = self::validate($token);
        if (!$payload) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Token inválido o sesión expirada.']);
            exit;
        }
        return $payload;
    }

    /**
     * Verifica si el usuario autenticado tiene un permiso específico.
     * @param array  $authPayload Payload del JWT.
     * @param string $modulo      Módulo requerido.
     * @param string $accion      Acción requerida.
     */
    public static function requirePermission(array $authPayload, string $modulo, string $accion): void {
        $permisos = $authPayload['permisos'] ?? [];
        $key = "$modulo.$accion";
        if (!in_array($key, $permisos, true)) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => "No tiene permiso para: $key"
            ]);
            exit;
        }
    }

    /**
     * Genera un Refresh Token aleatorio y seguro.
     */
    public static function generateRefreshToken(): string {
        return bin2hex(random_bytes(64));
    }
}
