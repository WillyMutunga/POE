<?php
namespace App\Controllers;

use App\Utils\Database;
use App\Auth\JwtService;
use PDO;

class AcademicController {
    private static function getAuthenticatedUser(): ?array {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return null;
        }
        return JwtService::decode($matches[1]);
    }

    public static function listUnits(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $courseId = $_GET['course'] ?? null;
        $semesterId = $_GET['semester'] ?? null;

        $sql = 'SELECT u.*, c.name as course_name, s.name as semester_name 
                FROM academic_unit u 
                LEFT JOIN academic_course c ON u.course_id = c.id 
                LEFT JOIN academic_semester s ON u.semester_id = s.id 
                WHERE 1=1';
        $params = [];

        if ($courseId) {
            $sql .= ' AND u.course_id = ?';
            $params[] = $courseId;
        }
        if ($semesterId) {
            $sql .= ' AND u.semester_id = ?';
            $params[] = $semesterId;
        }

        $sql .= ' ORDER BY u.code ASC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $units = $stmt->fetchAll();

        echo json_encode($units);
    }

    public static function myUnits(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $uid = (int)($user['user_id'] ?? 0);

        // Fetch full user record to check role and course_id
        $uStmt = $db->prepare('SELECT * FROM users_user WHERE id = ?');
        $uStmt->execute([$uid]);
        $fullUser = $uStmt->fetch();
        $role = $fullUser['role'] ?? ($user['role'] ?? 'STUDENT');
        $courseId = $fullUser['course_id'] ?? null;

        $sql = 'SELECT u.*, c.name as course_name, s.name as semester_name 
                FROM academic_unit u 
                LEFT JOIN academic_course c ON u.course_id = c.id 
                LEFT JOIN academic_semester s ON u.semester_id = s.id 
                WHERE 1=1';
        $params = [];

        if ($role === 'INSTRUCTOR') {
            if ($courseId) {
                $sql .= ' AND (u.course_id = ? OR u.id IN (SELECT unit_id FROM academic_unit_instructors WHERE user_id = ?))';
                $params[] = $courseId;
                $params[] = $uid;
            } else {
                $sql .= ' AND u.id IN (SELECT unit_id FROM academic_unit_instructors WHERE user_id = ?)';
                $params[] = $uid;
            }
        } elseif ($role === 'STUDENT') {
            if ($courseId) {
                $sql .= ' AND (u.course_id = ? OR u.id IN (SELECT unit_id FROM academic_unitregistration WHERE student_id = ?))';
                $params[] = $courseId;
                $params[] = $uid;
            } else {
                $sql .= ' AND u.id IN (SELECT unit_id FROM academic_unitregistration WHERE student_id = ?)';
                $params[] = $uid;
            }
        }

        $sql .= ' ORDER BY u.code ASC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $units = $stmt->fetchAll();

        echo json_encode($units ?: []);
    }

    public static function listCourses(): void {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT c.*, s.name as school_name 
                            FROM academic_course c 
                            LEFT JOIN academic_school s ON c.school_id = s.id 
                            ORDER BY c.name ASC');
        echo json_encode($stmt->fetchAll());
    }

    public static function listSemesters(): void {
        $db = Database::getConnection();
        $courseId = $_GET['course'] ?? null;
        if ($courseId) {
            $stmt = $db->prepare('SELECT * FROM academic_semester WHERE course_id = ? ORDER BY id ASC');
            $stmt->execute([$courseId]);
        } else {
            $stmt = $db->query('SELECT * FROM academic_semester ORDER BY id ASC');
        }
        echo json_encode($stmt->fetchAll());
    }

    public static function listRegistrations(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $sql = 'SELECT r.*, u.code as unit_code, u.name as unit_name, s.name as semester_name 
                FROM academic_unitregistration r 
                JOIN academic_unit u ON r.unit_id = u.id 
                LEFT JOIN academic_semester s ON r.semester_id = s.id';
        $params = [];

        if ($user['role'] === 'STUDENT') {
            $sql .= ' WHERE r.student_id = ?';
            $params[] = $user['user_id'];
        }

        $sql .= ' ORDER BY r.id DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll());
    }
}
