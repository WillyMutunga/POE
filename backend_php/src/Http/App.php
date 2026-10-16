<?php
namespace App\Http;

use App\Auth\JwtService;
use App\Utils\Database;
use PDO;

class App {
    public static function cors(): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        header("Access-Control-Allow-Origin: {$origin}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Expose-Headers: Content-Disposition');
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
    }

    public static function json($data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function error(string $detail, int $status = 400, array $extra = []): void {
        self::json(array_merge(['detail' => $detail], $extra), $status);
    }

    public static function body(): array {
        if (!empty($_POST) && empty(file_get_contents('php://input'))) {
            return $_POST;
        }
        $raw = file_get_contents('php://input') ?: '';
        $json = json_decode($raw, true);
        if (is_array($json)) {
            return $json;
        }
        return $_POST ?: [];
    }

    public static function method(): string {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $override = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? ($_POST['_method'] ?? '');
        if ($override) {
            return strtoupper($override);
        }
        return $method;
    }

    public static function path(): string {
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $uri = preg_replace('#^/(poe/backend_php/public/|poe/backend_php/|poe_backend/api/|poe_backend/|api/)#', '/', $uri);
        return rtrim($uri, '/') ?: '/';
    }

    public static function db(): PDO {
        return Database::getConnection();
    }

    public static function bearer(): ?string {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s(\S+)/', $header, $m)) {
            return $m[1];
        }
        $token = $_GET['token'] ?? '';
        return $token !== '' ? $token : null;
    }

    public static function authUser(bool $required = true): ?array {
        $token = self::bearer();
        if (!$token) {
            if ($required) {
                self::error('Authentication credentials were not provided.', 401);
            }
            return null;
        }
        $payload = JwtService::decode($token);
        if (!$payload) {
            if ($required) {
                self::error('Given token not valid for any token type', 401);
            }
            return null;
        }
        $stmt = self::db()->prepare('SELECT * FROM users_user WHERE id = ? LIMIT 1');
        $stmt->execute([(int)($payload['user_id'] ?? 0)]);
        $user = $stmt->fetch();
        if (!$user || !$user['is_active']) {
            if ($required) {
                self::error('User not found or inactive.', 401);
            }
            return null;
        }
        return $user;
    }

    public static function requireRoles(array $user, array $roles): void {
        if (!in_array($user['role'], $roles, true)) {
            self::error('You do not have permission to perform this action.', 403);
        }
    }

    public static function isStaff(array $user): bool {
        return in_array($user['role'], ['ADMIN', 'MANAGER', 'DIRECTOR'], true) || !empty($user['is_staff']);
    }

    public static function isAdmin(array $user): bool {
        return $user['role'] === 'ADMIN' || !empty($user['is_superuser']);
    }

    public static function now(): string {
        return gmdate('Y-m-d H:i:s');
    }

    public static function uploadDir(): string {
        $dir = dirname(__DIR__, 2) . '/public/media';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        return $dir;
    }

    public static function saveUpload(array $file, string $subdir): string {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            self::error('File upload failed.', 400);
        }
        $targetDir = self::uploadDir() . '/' . trim($subdir, '/');
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }
        $ext = pathinfo($file['name'] ?? 'file', PATHINFO_EXTENSION);
        $name = $subdir . '_' . time() . '_' . bin2hex(random_bytes(4)) . ($ext ? '.' . $ext : '');
        $path = $targetDir . '/' . $name;
        if (!move_uploaded_file($file['tmp_name'], $path)) {
            self::error('Failed to save uploaded file.', 500);
        }
        return trim($subdir, '/') . '/' . $name;
    }

    public static function mediaUrl(?string $path): ?string {
        if (!$path) {
            return null;
        }
        if (str_starts_with($path, 'http') || str_starts_with($path, '/')) {
            return $path;
        }
        return '/media/' . ltrim($path, '/');
    }

    public static function sendFile(string $bytes, string $filename, string $mime, bool $inline = false): void {
        http_response_code(200);
        header('Content-Type: ' . $mime);
        $disp = $inline ? 'inline' : 'attachment';
        header('Content-Disposition: ' . $disp . '; filename="' . str_replace('"', '', $filename) . '"');
        echo $bytes;
        exit;
    }

    public static function sendDiskFile(string $relative, string $downloadName = null): void {
        $full = self::uploadDir() . '/' . ltrim($relative, '/');
        $djangoMedia = getenv('DJANGO_MEDIA_ROOT') ?: (dirname(__DIR__, 3) . '/backend/media');
        if (!is_file($full) && is_file($djangoMedia . '/' . ltrim($relative, '/'))) {
            $full = $djangoMedia . '/' . ltrim($relative, '/');
        }
        if (!is_file($full)) {
            self::error('File not found.', 404);
        }
        $mime = mime_content_type($full) ?: 'application/octet-stream';
        header('Content-Type: ' . $mime);
        header('Content-Disposition: inline; filename="' . ($downloadName ?: basename($full)) . '"');
        readfile($full);
        exit;
    }
}
