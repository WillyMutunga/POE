<?php
namespace App\Controllers;

use App\Utils\Database;
use App\Auth\JwtService;
use App\Serializers;
use PDO;

class AcademicController {
    private static function getAuthenticatedUser(): ?array {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $_GET['token'] ?? '';
            return $token ? JwtService::decode($token) : null;
        }
        return JwtService::decode($matches[1]);
    }

    public static function listSchools(): void {
        $db = Database::getConnection();

        // 1. Fetch all schools
        $schools = $db->query('SELECT * FROM academic_school ORDER BY name ASC')->fetchAll() ?: [];

        // 2. Fetch all courses
        $courses = $db->query('SELECT c.*, s.name as school_name FROM academic_course c LEFT JOIN academic_school s ON c.school_id = s.id ORDER BY c.name ASC')->fetchAll() ?: [];

        // 3. Fetch all semesters
        $semesters = $db->query('SELECT * FROM academic_semester ORDER BY id ASC')->fetchAll() ?: [];

        // 4. Fetch all units
        $units = $db->query('SELECT * FROM academic_unit ORDER BY code ASC')->fetchAll() ?: [];

        // 5. Fetch all elements
        $elements = $db->query('SELECT * FROM academic_element ORDER BY id ASC')->fetchAll() ?: [];

        // Group elements by unit_id
        $elementsByUnit = [];
        foreach ($elements as $el) {
            $elementsByUnit[(int)$el['unit_id']][] = [
                'id' => (int)$el['id'],
                'name' => $el['name'],
                'unit' => (int)$el['unit_id']
            ];
        }

        // Attach elements to units
        $unitsByCourseAndSemester = [];
        $unassignedUnitsByCourse = [];
        foreach ($units as $u) {
            $uId = (int)$u['id'];
            $cId = (int)($u['course_id'] ?? 0);
            $sId = !empty($u['semester_id']) ? (int)$u['semester_id'] : null;
            $unitData = [
                'id' => $uId,
                'name' => $u['name'],
                'code' => $u['code'],
                'course' => $cId,
                'semester' => $sId,
                'credit_hours' => (int)($u['credit_hours'] ?? 45),
                'is_approved' => (bool)($u['is_approved'] ?? true),
                'elements' => $elementsByUnit[$uId] ?? [],
            ];
            if ($sId) {
                $unitsByCourseAndSemester[$cId][$sId][] = $unitData;
            } else {
                $unassignedUnitsByCourse[$cId][] = $unitData;
            }
        }

        // Group semesters by course_id
        $semestersByCourse = [];
        foreach ($semesters as $sem) {
            $semId = (int)$sem['id'];
            $cId = (int)$sem['course_id'];
            $semestersByCourse[$cId][] = [
                'id' => $semId,
                'name' => $sem['name'],
                'course' => $cId,
                'units' => $unitsByCourseAndSemester[$cId][$semId] ?? []
            ];
        }

        $levelDisplayMap = [
            'GRADE_I' => 'Grade I',
            'GRADE_II' => 'Grade II',
            'GRADE_III' => 'Grade III',
            'LEVEL_3' => 'Level 3',
            'LEVEL_4' => 'Level 4',
            'LEVEL_5' => 'Level 5',
            'LEVEL_6' => 'Level 6',
            'HEADWAY' => 'Headway Certificate',
        ];

        // Group courses by school_id
        $coursesBySchool = [];
        foreach ($courses as $c) {
            $cId = (int)$c['id'];
            $schoolId = (int)($c['school_id'] ?? 0);
            $coursesBySchool[$schoolId][] = [
                'id' => $cId,
                'name' => $c['name'],
                'school' => $schoolId,
                'school_name' => $c['school_name'] ?? null,
                'level' => $c['level'] ?? 'LEVEL_6',
                'level_display' => $levelDisplayMap[$c['level'] ?? ''] ?? ($c['level'] ?? 'Level 6'),
                'semesters' => $semestersByCourse[$cId] ?? [],
                'unassigned_units' => $unassignedUnitsByCourse[$cId] ?? []
            ];
        }

        // Assemble final response
        $result = [];
        foreach ($schools as $s) {
            $sId = (int)$s['id'];
            $result[] = [
                'id' => $sId,
                'name' => $s['name'],
                'courses' => $coursesBySchool[$sId] ?? []
            ];
        }

        echo json_encode($result);
    }

    public static function listCourses(): void {
        $db = Database::getConnection();
        $schoolId = $_GET['school'] ?? null;
        $sql = 'SELECT c.*, s.name as school_name 
                FROM academic_course c 
                LEFT JOIN academic_school s ON c.school_id = s.id 
                WHERE 1=1';
        $params = [];
        if ($schoolId) {
            $sql .= ' AND c.school_id = ?';
            $params[] = (int)$schoolId;
        }
        $sql .= ' ORDER BY c.name ASC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll() ?: []);
    }

    public static function listSemesters(): void {
        $db = Database::getConnection();
        $courseId = $_GET['course'] ?? null;
        if ($courseId) {
            $stmt = $db->prepare('SELECT * FROM academic_semester WHERE course_id = ? ORDER BY id ASC');
            $stmt->execute([(int)$courseId]);
        } else {
            $stmt = $db->query('SELECT * FROM academic_semester ORDER BY id ASC');
        }
        echo json_encode($stmt->fetchAll() ?: []);
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
            $params[] = (int)$courseId;
        }
        if ($semesterId) {
            $sql .= ' AND u.semester_id = ?';
            $params[] = (int)$semesterId;
        }

        $sql .= ' ORDER BY u.code ASC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $units = $stmt->fetchAll();

        // Attach elements to each unit
        foreach ($units as &$u) {
            $u['is_approved'] = (bool)($u['is_approved'] ?? true);
            $elStmt = $db->prepare('SELECT id, name, unit_id FROM academic_element WHERE unit_id = ? ORDER BY id ASC');
            $elStmt->execute([$u['id']]);
            $u['elements'] = $elStmt->fetchAll() ?: [];
        }

        echo json_encode($units ?: []);
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
                $params[] = (int)$courseId;
                $params[] = $uid;
            } else {
                $sql .= ' AND u.id IN (SELECT unit_id FROM academic_unit_instructors WHERE user_id = ?)';
                $params[] = $uid;
            }
        } elseif ($role === 'STUDENT') {
            if ($courseId) {
                $sql .= ' AND (u.course_id = ? OR u.id IN (SELECT unit_id FROM academic_unitregistration WHERE student_id = ?))';
                $params[] = (int)$courseId;
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

        foreach ($units as &$u) {
            $u['is_approved'] = (bool)($u['is_approved'] ?? true);
            $elStmt = $db->prepare('SELECT id, name, unit_id FROM academic_element WHERE unit_id = ? ORDER BY id ASC');
            $elStmt->execute([$u['id']]);
            $u['elements'] = $elStmt->fetchAll() ?: [];
        }

        echo json_encode($units ?: []);
    }

    public static function getUnit(int $id): void {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT u.*, c.name as course_name, s.name as semester_name 
                              FROM academic_unit u 
                              LEFT JOIN academic_course c ON u.course_id = c.id 
                              LEFT JOIN academic_semester s ON u.semester_id = s.id 
                              WHERE u.id = ? LIMIT 1');
        $stmt->execute([$id]);
        $unit = $stmt->fetch();

        if (!$unit) {
            http_response_code(404);
            echo json_encode(['detail' => 'Unit not found.']);
            return;
        }

        // Attach elements
        $elStmt = $db->prepare('SELECT id, name, unit_id FROM academic_element WHERE unit_id = ? ORDER BY id ASC');
        $elStmt->execute([$id]);
        $unit['elements'] = $elStmt->fetchAll() ?: [];

        // Attach enrolled students
        $stStmt = $db->prepare('SELECT u.id, u.username, u.first_name, u.last_name, u.registration_number, u.role, u.email 
                                FROM users_user u 
                                JOIN academic_unitregistration r ON r.student_id = u.id 
                                WHERE r.unit_id = ? AND r.status = "APPROVED"');
        $stStmt->execute([$id]);
        $unit['students_detail'] = $stStmt->fetchAll() ?: [];
        $unit['student_count'] = count($unit['students_detail']);

        echo json_encode($unit);
    }

    public static function listRegistrations(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $studentParam = $_GET['student'] ?? null;

        $sql = 'SELECT r.*, u.code as unit_code, u.name as unit_name, s.name as semester_name,
                       st.first_name, st.last_name, st.username, st.registration_number,
                       c.name as course_name
                FROM academic_unitregistration r 
                JOIN academic_unit u ON r.unit_id = u.id 
                JOIN users_user st ON r.student_id = st.id
                LEFT JOIN academic_course c ON u.course_id = c.id
                LEFT JOIN academic_semester s ON r.semester_id = s.id
                WHERE 1=1';
        $params = [];

        if ($user['role'] === 'STUDENT') {
            $sql .= ' AND r.student_id = ?';
            $params[] = (int)$user['user_id'];
        } elseif ($studentParam) {
            $sql .= ' AND r.student_id = ?';
            $params[] = (int)$studentParam;
        }

        $sql .= ' ORDER BY r.id DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll() ?: [];

        foreach ($rows as &$r) {
            $r['student_name'] = trim(($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? '')) ?: $r['username'];
            $r['student_registration_number'] = $r['registration_number'] ?? null;
        }

        echo json_encode($rows);
    }

    public static function approveRegistration(int $id): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE academic_unitregistration SET status = "APPROVED", approved_by_id = ? WHERE id = ?');
        $stmt->execute([(int)$user['user_id'], $id]);
        echo json_encode(['status' => 'approved', 'id' => $id]);
    }

    public static function rejectRegistration(int $id): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE academic_unitregistration SET status = "REJECTED" WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['status' => 'rejected', 'id' => $id]);
    }

    public static function directAssign(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $studentId = (int)($input['student'] ?? $input['student_id'] ?? 0);
        $unitId = (int)($input['unit'] ?? $input['unit_id'] ?? 0);
        $semesterId = !empty($input['semester']) ? (int)$input['semester'] : null;

        if (!$studentId || !$unitId) {
            http_response_code(400);
            echo json_encode(['detail' => 'Student and unit are required.']);
            return;
        }

        $db = Database::getConnection();
        $chk = $db->prepare('SELECT id FROM academic_unitregistration WHERE student_id = ? AND unit_id = ? LIMIT 1');
        $chk->execute([$studentId, $unitId]);
        if ($chk->fetch()) {
            $upd = $db->prepare('UPDATE academic_unitregistration SET status = "APPROVED", approved_by_id = ? WHERE student_id = ? AND unit_id = ?');
            $upd->execute([(int)$user['user_id'], $studentId, $unitId]);
        } else {
            $ins = $db->prepare('INSERT INTO academic_unitregistration (student_id, unit_id, semester_id, status, registered_at, approved_by_id) 
                                 VALUES (?, ?, ?, "APPROVED", NOW(), ?)');
            $ins->execute([$studentId, $unitId, $semesterId, (int)$user['user_id']]);
        }

        echo json_encode(['status' => 'success', 'detail' => 'Unit assigned successfully.']);
    }

    public static function bulkRegister(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $unitIds = $input['unit_ids'] ?? [];
        $semesterId = !empty($input['semester_id']) ? (int)$input['semester_id'] : null;
        $uid = (int)$user['user_id'];

        if (empty($unitIds)) {
            http_response_code(400);
            echo json_encode(['detail' => 'No units selected for registration.']);
            return;
        }

        $db = Database::getConnection();
        foreach ($unitIds as $uId) {
            $uId = (int)$uId;
            $chk = $db->prepare('SELECT id FROM academic_unitregistration WHERE student_id = ? AND unit_id = ? LIMIT 1');
            $chk->execute([$uid, $uId]);
            if (!$chk->fetch()) {
                $ins = $db->prepare('INSERT INTO academic_unitregistration (student_id, unit_id, semester_id, status, registered_at) 
                                     VALUES (?, ?, ?, "PENDING", NOW())');
                $ins->execute([$uid, $uId, $semesterId]);
            }
        }

        echo json_encode(['status' => 'success', 'message' => 'Units registered successfully.']);
    }

    public static function listExams(): void {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT e.*, u.name as unit_name, u.code as unit_code, u.semester_id as unit_semester_id,
                                   i.first_name, i.last_name, i.username as instructor_name
                            FROM academic_examrepository e 
                            JOIN academic_unit u ON e.unit_id = u.id 
                            LEFT JOIN users_user i ON e.instructor_id = i.id 
                            ORDER BY e.id DESC');
        echo json_encode($stmt->fetchAll() ?: []);
    }

    public static function listGradingSystems(): void {
        $db = Database::getConnection();
        $courseId = $_GET['course'] ?? null;
        $sql = 'SELECT g.*, c.name as course_name 
                FROM academic_gradingsystem g 
                LEFT JOIN academic_course c ON g.course_id = c.id 
                WHERE 1=1';
        $params = [];
        if ($courseId) {
            $sql .= ' AND g.course_id = ?';
            $params[] = (int)$courseId;
        }
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $systems = $stmt->fetchAll() ?: [];

        foreach ($systems as &$g) {
            $rStmt = $db->prepare('SELECT * FROM academic_graderange WHERE grading_system_id = ? ORDER BY min_score DESC');
            $rStmt->execute([$g['id']]);
            $g['ranges'] = $rStmt->fetchAll() ?: [];
        }

        echo json_encode($systems);
    }

    public static function listRubrics(): void {
        $db = Database::getConnection();
        $unitId = $_GET['unit'] ?? null;
        $sql = 'SELECT * FROM academic_rubric WHERE 1=1';
        $params = [];
        if ($unitId) {
            $sql .= ' AND unit_id = ?';
            $params[] = (int)$unitId;
        }
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rubrics = $stmt->fetchAll() ?: [];

        foreach ($rubrics as &$r) {
            $cStmt = $db->prepare('SELECT * FROM academic_rubriccriterion WHERE rubric_id = ? ORDER BY id ASC');
            $cStmt->execute([$r['id']]);
            $r['criteria'] = $cStmt->fetchAll() ?: [];
        }

        echo json_encode($rubrics);
    }

    public static function listStudentMarks(): void {
        $db = Database::getConnection();
        $unitId = $_GET['unit_id'] ?? $_GET['unit'] ?? null;
        $studentId = $_GET['student_id'] ?? null;

        $sql = 'SELECT m.*, u.name as unit_name, u.code as unit_code,
                       s.first_name, s.last_name, s.username, s.registration_number
                FROM academic_studentmark m
                JOIN academic_unit u ON m.unit_id = u.id
                JOIN users_user s ON m.student_id = s.id
                WHERE 1=1';
        $params = [];
        if ($unitId) {
            $sql .= ' AND m.unit_id = ?';
            $params[] = (int)$unitId;
        }
        if ($studentId) {
            $sql .= ' AND m.student_id = ?';
            $params[] = (int)$studentId;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $marks = $stmt->fetchAll() ?: [];

        foreach ($marks as &$m) {
            $m['component_marks'] = json_decode($m['component_marks'] ?? '{}', true);
            $m['student_name'] = trim(($m['first_name'] ?? '') . ' ' . ($m['last_name'] ?? '')) ?: $m['username'];
        }

        echo json_encode($marks);
    }

    public static function getComponents(int $unitId): void {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM academic_unitmarkcomponent WHERE unit_id = ? ORDER BY id ASC');
        $stmt->execute([$unitId]);
        echo json_encode($stmt->fetchAll() ?: []);
    }

    public static function bulkApprove(): void {
        $user = self::getAuthenticatedUser();
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $ids = $input['registration_ids'] ?? [];
        $db = Database::getConnection();
        if (!empty($ids) && is_array($ids)) {
            $in = implode(',', array_map('intval', $ids));
            $approvedBy = (int)($user['user_id'] ?? 0);
            $db->query("UPDATE academic_unitregistration SET status = 'APPROVED', approved_by_id = {$approvedBy} WHERE id IN ({$in})");
        }
        echo json_encode(['status' => 'success', 'message' => 'Registrations approved.']);
    }

    public static function bulkReject(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $ids = $input['registration_ids'] ?? [];
        $db = Database::getConnection();
        if (!empty($ids) && is_array($ids)) {
            $in = implode(',', array_map('intval', $ids));
            $db->query("UPDATE academic_unitregistration SET status = 'REJECTED' WHERE id IN ({$in})");
        }
        echo json_encode(['status' => 'success', 'message' => 'Registrations rejected.']);
    }

    public static function registrationList(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Unauthorized']);
            return;
        }
        $db = Database::getConnection();
        $uid = (int)($user['user_id'] ?? 0);
        $uStmt = $db->prepare('SELECT course_id FROM users_user WHERE id = ?');
        $uStmt->execute([$uid]);
        $courseId = $uStmt->fetchColumn();

        $sql = 'SELECT u.*, c.name as course_name, s.name as semester_name,
                       (SELECT r.status FROM academic_unitregistration r WHERE r.unit_id = u.id AND r.student_id = ? LIMIT 1) as registration_status
                FROM academic_unit u
                LEFT JOIN academic_course c ON u.course_id = c.id
                LEFT JOIN academic_semester s ON u.semester_id = s.id';
        $params = [$uid];
        if ($courseId) {
            $sql .= ' WHERE u.course_id = ?';
            $params[] = (int)$courseId;
        }
        $sql .= ' ORDER BY u.code ASC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $units = $stmt->fetchAll() ?: [];
        echo json_encode($units);
    }

    public static function studentUnitsForAssignment(): void {
        $studentId = (int)($_GET['student_id'] ?? 0);
        $db = Database::getConnection();
        $sStmt = $db->prepare('SELECT course_id FROM users_user WHERE id = ?');
        $sStmt->execute([$studentId]);
        $courseId = $sStmt->fetchColumn();

        $sql = 'SELECT u.*, s.name as semester_name,
                       (SELECT r.status FROM academic_unitregistration r WHERE r.unit_id = u.id AND r.student_id = ? LIMIT 1) as registration_status
                FROM academic_unit u
                LEFT JOIN academic_semester s ON u.semester_id = s.id';
        $params = [$studentId];
        if ($courseId) {
            $sql .= ' WHERE u.course_id = ?';
            $params[] = (int)$courseId;
        }
        $sql .= ' ORDER BY u.code ASC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll() ?: []);
    }

    public static function enterMarks(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $studentId = (int)($input['student_id'] ?? 0);
        $unitId = (int)($input['unit_id'] ?? 0);
        $compMarks = is_array($input['component_marks'] ?? null) ? json_encode($input['component_marks']) : ($input['component_marks'] ?? '{}');
        $totalScore = (float)($input['total_score'] ?? 0);
        $grade = $input['grade'] ?? 'F';

        $db = Database::getConnection();
        $chk = $db->prepare('SELECT id FROM academic_studentmark WHERE student_id = ? AND unit_id = ? LIMIT 1');
        $chk->execute([$studentId, $unitId]);
        $existingId = $chk->fetchColumn();

        if ($existingId) {
            $stmt = $db->prepare('UPDATE academic_studentmark SET component_marks = ?, total_score = ?, grade = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$compMarks, $totalScore, $grade, $existingId]);
        } else {
            $stmt = $db->prepare('INSERT INTO academic_studentmark (student_id, unit_id, component_marks, total_score, grade, updated_at) VALUES (?, ?, ?, ?, ?, NOW())');
            $stmt->execute([$studentId, $unitId, $compMarks, $totalScore, $grade]);
        }
        echo json_encode(['status' => 'success', 'message' => 'Marks saved.']);
    }

    public static function createUnit(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $name = trim($input['name'] ?? '');
        $code = trim($input['code'] ?? '');
        $courseId = (int)($input['course'] ?? $input['course_id'] ?? 0);
        $semesterId = !empty($input['semester']) ? (int)$input['semester'] : (!empty($input['semester_id']) ? (int)$input['semester_id'] : null);
        $creditHours = (int)($input['credit_hours'] ?? 45);

        if (!$name || !$code || !$courseId) {
            http_response_code(400);
            echo json_encode(['detail' => 'Name, code, and course are required.']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO academic_unit (name, code, course_id, semester_id, credit_hours, is_approved) VALUES (?, ?, ?, ?, ?, 1)');
        $stmt->execute([$name, $code, $courseId, $semesterId, $creditHours]);
        $newId = (int)$db->lastInsertId();

        $fetchStmt = $db->prepare('SELECT * FROM academic_unit WHERE id = ?');
        $fetchStmt->execute([$newId]);
        http_response_code(201);
        echo json_encode($fetchStmt->fetch());
    }

    public static function createElement(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $name = trim($input['name'] ?? '');
        $unitId = (int)($input['unit'] ?? $input['unit_id'] ?? 0);

        if (!$name || !$unitId) {
            http_response_code(400);
            echo json_encode(['detail' => 'Name and unit are required.']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO academic_element (name, unit_id) VALUES (?, ?)');
        $stmt->execute([$name, $unitId]);
        $newId = (int)$db->lastInsertId();

        http_response_code(201);
        echo json_encode(['id' => $newId, 'name' => $name, 'unit' => $unitId]);
    }

    public static function enrollStudents(int $unitId): void {
        $user = self::getAuthenticatedUser();
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $studentIds = $input['student_ids'] ?? [];
        $db = Database::getConnection();

        foreach ($studentIds as $sId) {
            $sId = (int)$sId;
            $chk = $db->prepare('SELECT id FROM academic_unitregistration WHERE student_id = ? AND unit_id = ? LIMIT 1');
            $chk->execute([$sId, $unitId]);
            if ($chk->fetch()) {
                $db->prepare('UPDATE academic_unitregistration SET status = "APPROVED", approved_by_id = ? WHERE student_id = ? AND unit_id = ?')
                   ->execute([(int)($user['user_id'] ?? 0), $sId, $unitId]);
            } else {
                $db->prepare('INSERT INTO academic_unitregistration (student_id, unit_id, status, registered_at, approved_by_id) VALUES (?, ?, "APPROVED", NOW(), ?)')
                   ->execute([$sId, $unitId, (int)($user['user_id'] ?? 0)]);
            }
        }
        echo json_encode(['status' => 'success', 'message' => 'Students enrolled successfully.']);
    }

    public static function removeStudent(int $unitId): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $studentId = (int)($input['student_id'] ?? 0);
        $db = Database::getConnection();
        $db->prepare('DELETE FROM academic_unitregistration WHERE student_id = ? AND unit_id = ?')->execute([$studentId, $unitId]);
        echo json_encode(['status' => 'success', 'message' => 'Student removed from unit.']);
    }

    public static function deleteExam(int $id): void {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM academic_examrepository WHERE id = ?');
        $stmt->execute([$id]);
        $exam = $stmt->fetch();
        if ($exam) {
            $db->prepare('DELETE FROM academic_examrepository WHERE id = ?')->execute([$id]);
        }
        echo json_encode(['detail' => 'Exam deleted successfully.']);
    }

    public static function createSchool(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $name = trim($input['name'] ?? '');
        if (!$name) {
            http_response_code(400);
            echo json_encode(['detail' => 'School name is required.']);
            return;
        }
        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO academic_school (name) VALUES (?)');
        $stmt->execute([$name]);
        $newId = (int)$db->lastInsertId();
        http_response_code(201);
        echo json_encode(['id' => $newId, 'name' => $name, 'courses' => []]);
    }

    public static function updateSchool(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $name = trim($input['name'] ?? '');
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE academic_school SET name = ? WHERE id = ?');
        $stmt->execute([$name, $id]);
        echo json_encode(['id' => $id, 'name' => $name]);
    }

    public static function deleteSchool(int $id): void {
        $db = Database::getConnection();
        $db->prepare('DELETE FROM academic_school WHERE id = ?')->execute([$id]);
        echo json_encode(['detail' => 'School deleted.']);
    }

    public static function createCourse(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $name = trim($input['name'] ?? '');
        $schoolId = (int)($input['school'] ?? $input['school_id'] ?? 0);
        $level = $input['level'] ?? 'LEVEL_6';
        $instructorId = !empty($input['instructor']) ? (int)$input['instructor'] : null;

        if (!$name || !$schoolId) {
            http_response_code(400);
            echo json_encode(['detail' => 'Course name and school are required.']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO academic_course (name, school_id, level, instructor_id) VALUES (?, ?, ?, ?)');
        $stmt->execute([$name, $schoolId, $level, $instructorId]);
        $newId = (int)$db->lastInsertId();
        http_response_code(201);
        echo json_encode(['id' => $newId, 'name' => $name, 'school' => $schoolId, 'level' => $level, 'semesters' => [], 'unassigned_units' => []]);
    }

    public static function updateCourse(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $db = Database::getConnection();
        $fields = [];
        $params = [];
        if (isset($input['name'])) { $fields[] = 'name = ?'; $params[] = trim($input['name']); }
        if (isset($input['school'])) { $fields[] = 'school_id = ?'; $params[] = (int)$input['school']; }
        if (isset($input['level'])) { $fields[] = 'level = ?'; $params[] = $input['level']; }
        if (isset($input['instructor'])) { $fields[] = 'instructor_id = ?'; $params[] = !empty($input['instructor']) ? (int)$input['instructor'] : null; }
        if (!empty($fields)) {
            $params[] = $id;
            $db->prepare('UPDATE academic_course SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        }
        $c = $db->query("SELECT * FROM academic_course WHERE id = {$id}")->fetch();
        echo json_encode($c ?: ['id' => $id]);
    }

    public static function deleteCourse(int $id): void {
        $db = Database::getConnection();
        $db->prepare('DELETE FROM academic_course WHERE id = ?')->execute([$id]);
        echo json_encode(['detail' => 'Course deleted.']);
    }

    public static function createSemester(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $name = trim($input['name'] ?? '');
        $courseId = (int)($input['course'] ?? $input['course_id'] ?? 0);
        if (!$name || !$courseId) {
            http_response_code(400);
            echo json_encode(['detail' => 'Semester name and course are required.']);
            return;
        }
        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO academic_semester (name, course_id) VALUES (?, ?)');
        $stmt->execute([$name, $courseId]);
        $newId = (int)$db->lastInsertId();
        http_response_code(201);
        echo json_encode(['id' => $newId, 'name' => $name, 'course' => $courseId, 'units' => []]);
    }

    public static function updateSemester(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $name = trim($input['name'] ?? '');
        $db = Database::getConnection();
        $db->prepare('UPDATE academic_semester SET name = ? WHERE id = ?')->execute([$name, $id]);
        echo json_encode(['id' => $id, 'name' => $name]);
    }

    public static function deleteSemester(int $id): void {
        $db = Database::getConnection();
        $db->prepare('DELETE FROM academic_semester WHERE id = ?')->execute([$id]);
        echo json_encode(['detail' => 'Semester deleted.']);
    }

    public static function updateUnit(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $db = Database::getConnection();
        $fields = [];
        $params = [];
        if (isset($input['name'])) { $fields[] = 'name = ?'; $params[] = trim($input['name']); }
        if (isset($input['code'])) { $fields[] = 'code = ?'; $params[] = trim($input['code']); }
        if (array_key_exists('semester', $input)) { $fields[] = 'semester_id = ?'; $params[] = !empty($input['semester']) ? (int)$input['semester'] : null; }
        if (isset($input['credit_hours'])) { $fields[] = 'credit_hours = ?'; $params[] = (int)$input['credit_hours']; }
        if (isset($input['is_approved'])) { $fields[] = 'is_approved = ?'; $params[] = !empty($input['is_approved']) ? 1 : 0; }
        if (!empty($fields)) {
            $params[] = $id;
            $db->prepare('UPDATE academic_unit SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        }
        $u = $db->query("SELECT * FROM academic_unit WHERE id = {$id}")->fetch();
        echo json_encode($u ?: ['id' => $id]);
    }

    public static function deleteUnit(int $id): void {
        $db = Database::getConnection();
        $db->prepare('DELETE FROM academic_unit WHERE id = ?')->execute([$id]);
        echo json_encode(['detail' => 'Unit deleted.']);
    }

    public static function deleteElement(int $id): void {
        $db = Database::getConnection();
        $db->prepare('DELETE FROM academic_element WHERE id = ?')->execute([$id]);
        echo json_encode(['detail' => 'Element deleted.']);
    }

    public static function saveComponents(int $unitId): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $components = $input['components'] ?? [];
        $db = Database::getConnection();
        $db->prepare('DELETE FROM academic_unitmarkcomponent WHERE unit_id = ?')->execute([$unitId]);
        $ins = $db->prepare('INSERT INTO academic_unitmarkcomponent (unit_id, name, weight) VALUES (?, ?, ?)');
        foreach ($components as $c) {
            $name = trim($c['name'] ?? '');
            $weight = (int)($c['weight'] ?? 0);
            if ($name) {
                $ins->execute([$unitId, $name, $weight]);
            }
        }
        echo json_encode(['status' => 'success', 'message' => 'Components saved.']);
    }

    public static function assignSemester(int $unitId): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $semesterId = !empty($input['semester_id']) ? (int)$input['semester_id'] : null;
        $db = Database::getConnection();
        $db->prepare('UPDATE academic_unit SET semester_id = ? WHERE id = ?')->execute([$semesterId, $unitId]);
        echo json_encode(['status' => 'success', 'message' => 'Semester assigned.']);
    }

    public static function bulkCreateUnits(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $courseId = (int)($input['course'] ?? 0);
        $units = $input['units'] ?? [];
        $db = Database::getConnection();
        $ins = $db->prepare('INSERT INTO academic_unit (name, code, course_id, credit_hours, is_approved) VALUES (?, ?, ?, 45, 1)');
        foreach ($units as $u) {
            $code = trim($u['code'] ?? '');
            $name = trim($u['name'] ?? '');
            if ($code && $name && $courseId) {
                $ins->execute([$name, $code, $courseId]);
            }
        }
        echo json_encode(['status' => 'success', 'message' => 'Units uploaded successfully.']);
    }

    public static function createGradingSystem(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $name = trim($input['name'] ?? '');
        $courseId = (int)($input['course'] ?? 0);
        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO academic_gradingsystem (name, course_id) VALUES (?, ?)');
        $stmt->execute([$name, $courseId]);
        $newId = (int)$db->lastInsertId();
        http_response_code(201);
        echo json_encode(['id' => $newId, 'name' => $name, 'course' => $courseId, 'ranges' => []]);
    }

    public static function addGradeRange(int $systemId): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $min = (int)($input['min_score'] ?? 0);
        $max = (int)($input['max_score'] ?? 100);
        $grade = trim($input['grade'] ?? '');
        $desc = trim($input['description'] ?? '');
        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO academic_graderange (grading_system_id, min_score, max_score, grade, description) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$systemId, $min, $max, $grade, $desc]);
        echo json_encode(['status' => 'success']);
    }

    public static function deleteGradeRange(int $systemId): void {
        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
        $rangeId = (int)($input['range_id'] ?? 0);
        $db = Database::getConnection();
        $db->prepare('DELETE FROM academic_graderange WHERE id = ? AND grading_system_id = ?')->execute([$rangeId, $systemId]);
        echo json_encode(['status' => 'success']);
    }
}
