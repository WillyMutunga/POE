<?php
namespace App\Utils;

class Mailer {
    public static function send(string $to, string $subject, string $message): bool {
        $from = getenv('DEFAULT_FROM_EMAIL') ?: 'noreply@headwaycollege.ac.ke';
        $headers = "From: {$from}\r\nReply-To: {$from}\r\nContent-Type: text/plain; charset=UTF-8";
        try {
            return @mail($to, $subject, $message, $headers);
        } catch (\Throwable $e) {
            return false;
        }
    }
}
