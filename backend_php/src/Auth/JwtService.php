<?php
namespace App\Auth;

class JwtService {
    private static function getSecret(): string {
        return getenv('JWT_SECRET') ?: getenv('DJANGO_SECRET_KEY') ?: 'django-insecure-test-key-please-change';
    }

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Generates a pair of SimpleJWT-compatible tokens (access & refresh).
     */
    public static function createTokens(array $user): array {
        $secret = self::getSecret();
        $now = time();

        // 1 Day Access Token
        $accessPayload = [
            'token_type' => 'access',
            'exp'        => $now + (60 * 60 * 24),
            'iat'        => $now,
            'jti'        => bin2hex(random_bytes(16)),
            'user_id'    => (int)$user['id'],
            'username'   => $user['username'],
            'role'       => $user['role'],
        ];

        // 7 Days Refresh Token
        $refreshPayload = [
            'token_type' => 'refresh',
            'exp'        => $now + (60 * 60 * 24 * 7),
            'iat'        => $now,
            'jti'        => bin2hex(random_bytes(16)),
            'user_id'    => (int)$user['id'],
        ];

        return [
            'access'  => self::encode($accessPayload, $secret),
            'refresh' => self::encode($refreshPayload, $secret),
        ];
    }

    public static function encode(array $payload, string $secret): string {
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', "{$headerEncoded}.{$payloadEncoded}", $secret, true);
        $signatureEncoded = self::base64UrlEncode($signature);

        return "{$headerEncoded}.{$payloadEncoded}.{$signatureEncoded}";
    }

    public static function decode(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$headerB64, $payloadB64, $sigB64] = $parts;
        $secret = self::getSecret();

        $validSig = hash_hmac('sha256', "{$headerB64}.{$payloadB64}", $secret, true);
        if (!hash_equals($validSig, self::base64UrlDecode($sigB64))) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($payloadB64), true);
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }
}
