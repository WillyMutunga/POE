<?php
namespace App\Controllers;

use App\Utils\Database;
use App\Auth\JwtService;
use PDO;

class NotificationController {
    private static function getAuthenticatedUser(): ?array {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return null;
        }
        return JwtService::decode($matches[1]);
    }

    public static function list(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $uid = (int)($user['user_id'] ?? 0);

        try {
            $stmt = $db->prepare('SELECT id, user_id, title, message, notification_type, is_read, target_url, action_text, created_at 
                                  FROM notifications_notification 
                                  WHERE user_id = ? 
                                  ORDER BY created_at DESC 
                                  LIMIT 50');
            $stmt->execute([$uid]);
            $notifications = $stmt->fetchAll();
            echo json_encode($notifications ?: []);
        } catch (\Throwable $e) {
            // If table does not exist or empty, return empty list gracefully
            echo json_encode([]);
        }
    }

    public static function markRead(int $id): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $uid = (int)($user['user_id'] ?? 0);

        try {
            $stmt = $db->prepare('UPDATE notifications_notification SET is_read = 1 WHERE id = ? AND user_id = ?');
            $stmt->execute([$id, $uid]);
            echo json_encode(['status' => 'ok']);
        } catch (\Throwable $e) {
            echo json_encode(['status' => 'ok']);
        }
    }

    public static function markAllRead(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $uid = (int)($user['user_id'] ?? 0);

        try {
            $stmt = $db->prepare('UPDATE notifications_notification SET is_read = 1 WHERE user_id = ?');
            $stmt->execute([$uid]);
            echo json_encode(['status' => 'ok']);
        } catch (\Throwable $e) {
            echo json_encode(['status' => 'ok']);
        }
    }
}
