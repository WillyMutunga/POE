<?php
namespace App\Controllers;

use App\Utils\Database;
use App\Auth\DjangoPasswordHasher;
use App\Auth\JwtService;
use PDO;

class AuthController {
    public static function login(): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $username = trim($input['username'] ?? '');
            $password = $input['password'] ?? '';

            if (!$username || !$password) {
                http_response_code(400);
                echo json_encode(['detail' => 'Username and password are required.']);
                return;
            }

            $db = Database::getConnection();
            // Support login by username or registration_number
            $stmt = $db->prepare('SELECT * FROM users_user WHERE LOWER(username) = LOWER(:u1) OR LOWER(registration_number) = LOWER(:u2) LIMIT 1');
            $stmt->execute([':u1' => $username, ':u2' => $username]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(401);
                echo json_encode(['detail' => 'No active account found with the given credentials']);
                return;
            }

            if (!$user['is_active']) {
                http_response_code(401);
                echo json_encode(['detail' => 'User account is disabled.']);
                return;
            }

            if (!DjangoPasswordHasher::checkPassword($password, $user['password'])) {
                http_response_code(401);
                echo json_encode(['detail' => 'No active account found with the given credentials']);
                return;
            }

            $tokens = JwtService::createTokens($user);

            // Fetch course and semester if student
            $courseData = null;
            if (!empty($user['course_id'])) {
                $cStmt = $db->prepare('SELECT id, name, level, school_id FROM academic_course WHERE id = ?');
                $cStmt->execute([$user['course_id']]);
                $courseData = $cStmt->fetch() ?: null;
            }

            // Return exact JSON schema that AuthContext.jsx expects
            echo json_encode([
                'access' => $tokens['access'],
                'refresh' => $tokens['refresh'],
                'user' => [
                    'id' => (int)$user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'role' => $user['role'],
                    'registration_number' => $user['registration_number'],
                    'cdacc_registration_number' => $user['cdacc_registration_number'],
                    'phone_number' => $user['phone_number'],
                    'course' => $user['course_id'] ? (int)$user['course_id'] : null,
                    'course_name' => $courseData['name'] ?? null,
                    'course_display' => $courseData['name'] ?? null,
                    'course_level_display' => $courseData['level'] ?? null,
                    'course_data' => $courseData,
                    'intake' => $user['intake'],
                    'is_staff' => (bool)$user['is_staff'],
                    'is_superuser' => (bool)$user['is_superuser'],
                ]
            ]);
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['detail' => 'Login error: ' . $e->getMessage()]);
        }
    }

    public static function profile(): void {
        try {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                http_response_code(401);
                echo json_encode(['detail' => 'Authentication credentials were not provided.']);
                return;
            }

            $payload = JwtService::decode($matches[1]);
            if (!$payload) {
                http_response_code(401);
                echo json_encode(['detail' => 'Given token not valid for any token type']);
                return;
            }

            $db = Database::getConnection();
            $stmt = $db->prepare('SELECT * FROM users_user WHERE id = ?');
            $stmt->execute([$payload['user_id']]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(404);
                echo json_encode(['detail' => 'User not found.']);
                return;
            }

            $courseData = null;
            if (!empty($user['course_id'])) {
                $cStmt = $db->prepare('SELECT id, name, level, school_id FROM academic_course WHERE id = ?');
                $cStmt->execute([$user['course_id']]);
                $courseData = $cStmt->fetch() ?: null;
            }

            echo json_encode([
                'id' => (int)$user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'role' => $user['role'],
                'registration_number' => $user['registration_number'],
                'cdacc_registration_number' => $user['cdacc_registration_number'],
                'phone_number' => $user['phone_number'],
                'course' => $user['course_id'] ? (int)$user['course_id'] : null,
                'course_name' => $courseData['name'] ?? null,
                'course_display' => $courseData['name'] ?? null,
                'course_level_display' => $courseData['level'] ?? null,
                'course_data' => $courseData,
                'intake' => $user['intake']
            ]);
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['detail' => 'Profile error: ' . $e->getMessage()]);
        }
    }

    public static function refreshToken(): void {
        $input = json_decode(file_get_contents('php://input'), true);
        $refresh = $input['refresh'] ?? '';

        $payload = JwtService::decode($refresh);
        if (!$payload || ($payload['token_type'] ?? '') !== 'refresh') {
            http_response_code(401);
            echo json_encode(['detail' => 'Token is invalid or expired']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM users_user WHERE id = ?');
        $stmt->execute([$payload['user_id']]);
        $user = $stmt->fetch();

        if (!$user || !$user['is_active']) {
            http_response_code(401);
            echo json_encode(['detail' => 'User not found or inactive.']);
            return;
        }

        $tokens = JwtService::createTokens($user);
        echo json_encode(['access' => $tokens['access']]);
    }
}
