<?php
namespace App\Controllers;

use App\Utils\Database;
use App\Auth\JwtService;
use PDO;

class ExamController {
    private static function getAuthenticatedUser(): ?array {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return null;
        }
        return JwtService::decode($matches[1]);
    }

    public static function listOnlineExams(): void {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT id, title, class_name, duration_minutes, is_active, created_at 
                            FROM academic_onlineexam WHERE is_active = 1 ORDER BY id DESC');
        echo json_encode($stmt->fetchAll());
    }

    public static function getExamDetails(int $id): void {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM academic_onlineexam WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $exam = $stmt->fetch();

        if (!$exam) {
            http_response_code(404);
            echo json_encode(['detail' => 'Online exam not found.']);
            return;
        }

        $exam['questions'] = json_decode($exam['questions'] ?? '[]', true);
        echo json_encode($exam);
    }

    public static function submitExam(int $id): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $answers = $input['answers'] ?? [];

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM academic_onlineexam WHERE id = ?');
        $stmt->execute([$id]);
        $exam = $stmt->fetch();

        if (!$exam) {
            http_response_code(404);
            echo json_encode(['detail' => 'Exam not found.']);
            return;
        }

        $questions = json_decode($exam['questions'] ?? '[]', true);
        $totalQuestions = count($questions);
        $correctCount = 0;

        foreach ($questions as $idx => $q) {
            $studentAnswer = $answers[(string)$idx] ?? $answers[$idx] ?? null;
            if ($studentAnswer !== null && (int)$studentAnswer === (int)($q['correct_option_index'] ?? -1)) {
                $correctCount++;
            }
        }

        $score = $totalQuestions > 0 ? round(($correctCount / $totalQuestions) * 100, 2) : 0;
        $regNo = $user['username']; // or student registration_number

        $attStmt = $db->prepare('REPLACE INTO academic_onlineexamattendance 
            (exam_id, student_reg_no, has_started, started_at, has_submitted, submitted_at, score, answers)
            VALUES (?, ?, 1, NOW(), 1, NOW(), ?, ?)');
        $attStmt->execute([$id, $regNo, $score, json_encode($answers)]);

        echo json_encode([
            'status' => 'success',
            'score' => $score,
            'correct_count' => $correctCount,
            'total_questions' => $totalQuestions
        ]);
    }
}
