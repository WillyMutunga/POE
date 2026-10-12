<?php
namespace App\Auth;

class DjangoPasswordHasher {
    /**
     * Verifies a plain text password against Django's pbkdf2_sha256 hash format.
     * Format: pbkdf2_sha256$iterations$salt$hash
     */
    public static function checkPassword(string $password, string $encoded): bool {
        $parts = explode('$', $encoded);
        if (count($parts) !== 4) {
            return false;
        }

        [$algorithm, $iterations, $salt, $hash] = $parts;

        if ($algorithm !== 'pbkdf2_sha256') {
            return false;
        }

        $calculated = hash_pbkdf2('sha256', $password, $salt, (int)$iterations, 32, true);
        return hash_equals($hash, base64_encode($calculated));
    }

    /**
     * Generates a Django-compatible pbkdf2_sha256 hash.
     */
    public static function makePassword(string $password, int $iterations = 260000): string {
        $salt = bin2hex(random_bytes(6));
        $hash = hash_pbkdf2('sha256', $password, $salt, $iterations, 32, true);
        return "pbkdf2_sha256\${$iterations}\${$salt}\$" . base64_encode($hash);
    }
}
