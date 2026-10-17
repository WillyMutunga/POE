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
            // Support login by username, registration_number, or email (case-insensitive)
            $stmt = $db->prepare('SELECT * FROM users_user WHERE LOWER(username) = LOWER(:u1) OR LOWER(registration_number) = LOWER(:u2) OR LOWER(email) = LOWER(:u3) LIMIT 1');
            $stmt->execute([':u1' => $username, ':u2' => $username, ':u3' => $username]);
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

            // Fetch course if assigned
            $courseData = null;
            if (!empty($user['course_id'])) {
                $cStmt = $db->prepare('SELECT id, name, level, school_id FROM academic_course WHERE id = ?');
                $cStmt->execute([$user['course_id']]);
                $courseData = $cStmt->fetch() ?: null;
            }

            // Fetch semester if assigned
            $semesterData = null;
            if (!empty($user['semester_id'])) {
                $sStmt = $db->prepare('SELECT id, name FROM academic_semester WHERE id = ?');
                $sStmt->execute([$user['semester_id']]);
                $semesterData = $sStmt->fetch() ?: null;
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
                    'semester' => $user['semester_id'] ? (int)$user['semester_id'] : null,
                    'semester_name' => $semesterData['name'] ?? null,
                    'semester_display' => $semesterData['name'] ?? null,
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

            $semesterData = null;
            if (!empty($user['semester_id'])) {
                $sStmt = $db->prepare('SELECT id, name FROM academic_semester WHERE id = ?');
                $sStmt->execute([$user['semester_id']]);
                $semesterData = $sStmt->fetch() ?: null;
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
                'semester' => $user['semester_id'] ? (int)$user['semester_id'] : null,
                'semester_name' => $semesterData['name'] ?? null,
                'semester_display' => $semesterData['name'] ?? null,
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

    public static function listAll(): void {
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
            $stmt = $db->query('SELECT * FROM users_user ORDER BY first_name, last_name, username');
            $users = $stmt->fetchAll();

            $results = [];
            foreach ($users as $u) {
                $c = null;
                if (!empty($u['course_id'])) {
                    $cStmt = $db->prepare('SELECT id, name, level, school_id FROM academic_course WHERE id = ?');
                    $cStmt->execute([$u['course_id']]);
                    $c = $cStmt->fetch() ?: null;
                }
                $s = null;
                if (!empty($u['semester_id'])) {
                    $sStmt = $db->prepare('SELECT id, name FROM academic_semester WHERE id = ?');
                    $sStmt->execute([$u['semester_id']]);
                    $s = $sStmt->fetch() ?: null;
                }
                $results[] = [
                    'id' => (int)$u['id'],
                    'registration_number' => $u['registration_number'],
                    'cdacc_registration_number' => $u['cdacc_registration_number'] ?? null,
                    'username' => $u['username'],
                    'email' => $u['email'],
                    'role' => $u['role'],
                    'first_name' => $u['first_name'],
                    'last_name' => $u['last_name'],
                    'phone_number' => $u['phone_number'] ?? null,
                    'course' => $u['course_id'] ? (int)$u['course_id'] : null,
                    'semester' => $u['semester_id'] ? (int)$u['semester_id'] : null,
                    'intake' => $u['intake'],
                    'course_display' => $c['name'] ?? null,
                    'semester_display' => $s['name'] ?? null,
                    'course_name' => $c['name'] ?? null,
                    'course_level' => $c['level'] ?? null,
                    'is_active' => (bool)$u['is_active'],
                    'is_staff' => (bool)$u['is_staff'],
                    'is_superuser' => (bool)$u['is_superuser'],
                ];
            }

            echo json_encode($results);
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['detail' => 'Error listing users: ' . $e->getMessage()]);
        }
    }

    public static function myStudents(): void {
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
            $uid = (int)($payload['user_id'] ?? 0);
            $uStmt = $db->prepare('SELECT * FROM users_user WHERE id = ?');
            $uStmt->execute([$uid]);
            $currentUser = $uStmt->fetch();
            $courseId = $currentUser['course_id'] ?? null;
            $role = $currentUser['role'] ?? 'INSTRUCTOR';

            $sql = "SELECT u.*, c.name as course_name, s.name as semester_name 
                    FROM users_user u 
                    LEFT JOIN academic_course c ON u.course_id = c.id 
                    LEFT JOIN academic_semester s ON u.semester_id = s.id 
                    WHERE u.role = 'STUDENT'";
            $params = [];

            if ($role === 'INSTRUCTOR' && $courseId) {
                $sql .= " AND (u.course_id = ? OR u.id IN (
                    SELECT DISTINCT r.student_id FROM academic_unitregistration r 
                    JOIN academic_unit un ON r.unit_id = un.id 
                    WHERE un.course_id = ? OR un.id IN (SELECT unit_id FROM academic_unit_instructors WHERE user_id = ?)
                ))";
                $params[] = $courseId;
                $params[] = $courseId;
                $params[] = $uid;
            }

            $sql .= " ORDER BY u.first_name, u.last_name, u.username";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            $results = [];
            foreach ($rows as $u) {
                $results[] = [
                    'id' => (int)$u['id'],
                    'registration_number' => $u['registration_number'],
                    'cdacc_registration_number' => $u['cdacc_registration_number'] ?? null,
                    'username' => $u['username'],
                    'email' => $u['email'],
                    'role' => $u['role'],
                    'first_name' => $u['first_name'],
                    'last_name' => $u['last_name'],
                    'full_name' => trim(($u['first_name'] ?? '') . ' ' . ($u['last_name'] ?? '')) ?: $u['username'],
                    'phone_number' => $u['phone_number'] ?? null,
                    'course' => $u['course_id'] ? (int)$u['course_id'] : null,
                    'semester' => $u['semester_id'] ? (int)$u['semester_id'] : null,
                    'intake' => $u['intake'],
                    'course_display' => $u['course_name'] ?? 'Unassigned',
                    'semester_display' => $u['semester_name'] ?? 'Unassigned',
                    'course_name' => $u['course_name'] ?? null,
                    'is_active' => (bool)$u['is_active'],
                ];
            }

            echo json_encode($results);
        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['detail' => 'Error fetching students: ' . $e->getMessage()]);
        }
    }
}
