<?php
namespace App\Utils;

use App\Http\App;

class Notify {
    public static function create(int $userId, string $title, string $message, string $type = 'SYSTEM_ALERT', ?string $url = null, ?string $action = null): void {
        $stmt = App::db()->prepare(
            'INSERT INTO notifications_notification (user_id, title, message, notification_type, is_read, target_url, action_text, created_at)
             VALUES (?, ?, ?, ?, 0, ?, ?, NOW())'
        );
        $stmt->execute([$userId, $title, $message, $type, $url, $action]);
    }
}
