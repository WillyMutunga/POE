<?php
namespace App\Controllers;

use App\Http\App;
use App\Utils\Database;
use App\Utils\Pdf;
use App\Auth\JwtService;
use App\Serializers;
use PDO;

class PoeController {
    private static function getAuthenticatedUser(): ?array {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return null;
        }
        $payload = JwtService::decode($matches[1]);
        if (!$payload) {
            return null;
        }
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM users_user WHERE id = ? LIMIT 1');
        $stmt->execute([(int)($payload['user_id'] ?? 0)]);
        $user = $stmt->fetch();
        if (!$user) {
            return array_merge($payload, ['id' => $payload['user_id'] ?? 0]);
        }
        return $user;
    }

    public static function listPortfolios(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $sql = 'SELECT p.* FROM poe_core_portfolio p WHERE 1=1';
        $params = [];

        if ($user['role'] === 'STUDENT') {
            $sql .= ' AND p.learner_id = ?';
            $params[] = $user['id'];
        } elseif (!empty($_GET['learner'])) {
            $sql .= ' AND p.learner_id = ?';
            $params[] = (int)$_GET['learner'];
        }

        if (!empty($_GET['unit'])) {
            $sql .= ' AND p.unit_id = ?';
            $params[] = (int)$_GET['unit'];
        }

        $sql .= ' ORDER BY p.updated_at DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $portfolios = $stmt->fetchAll();

        $result = array_map(function ($p) use ($user) {
            return Serializers::portfolio($p, $user, false);
        }, $portfolios);

        echo json_encode($result);
    }

    public static function getPortfolio(int $id): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM poe_core_portfolio WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $portfolio = $stmt->fetch();

        if (!$portfolio) {
            http_response_code(404);
            echo json_encode(['detail' => 'Portfolio not found.']);
            return;
        }

        echo json_encode(Serializers::portfolio($portfolio, $user, true));
    }

    public static function createPortfolio(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $body = App::body();
        $title = trim($body['title'] ?? '');
        $description = trim($body['description'] ?? '');
        $unitId = !empty($body['unit']) ? (int)$body['unit'] : (!empty($body['unit_id']) ? (int)$body['unit_id'] : null);
        $elementId = !empty($body['element']) ? (int)$body['element'] : (!empty($body['element_id']) ? (int)$body['element_id'] : null);
        $assessmentType = $body['assessment_type'] ?? 'WRITTEN';

        if (!$title || !$unitId) {
            http_response_code(400);
            echo json_encode(['detail' => 'Title and Unit are required.']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO poe_core_portfolio 
            (title, description, learner_id, unit_id, element_id, assessment_type, status, submission_round, verification_status, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, "DRAFT", 1, "PENDING", NOW(), NOW())');
        $stmt->execute([$title, $description, $user['id'], $unitId, $elementId, $assessmentType]);
        $newId = (int)$db->lastInsertId();

        // Activity log
        $logStmt = $db->prepare('INSERT INTO poe_core_activitylog (portfolio_id, user_id, event_type, description, timestamp) VALUES (?, ?, "CREATED", "Portfolio created", NOW())');
        $logStmt->execute([$newId, $user['id']]);

        $stmt = $db->prepare('SELECT * FROM poe_core_portfolio WHERE id = ?');
        $stmt->execute([$newId]);
        $p = $stmt->fetch();

        http_response_code(201);
        echo json_encode(Serializers::portfolio($p, $user, true));
    }

    public static function updatePortfolio(int $id): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM poe_core_portfolio WHERE id = ?');
        $stmt->execute([$id]);
        $portfolio = $stmt->fetch();

        if (!$portfolio) {
            http_response_code(404);
            echo json_encode(['detail' => 'Portfolio not found.']);
            return;
        }

        $body = App::body();
        $title = isset($body['title']) ? trim($body['title']) : $portfolio['title'];
        $description = isset($body['description']) ? trim($body['description']) : $portfolio['description'];
        $newStatus = isset($body['status']) ? trim($body['status']) : $portfolio['status'];

        $stmt = $db->prepare('UPDATE poe_core_portfolio SET title = ?, description = ?, status = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([$title, $description, $newStatus, $id]);

        if ($newStatus === 'SUBMITTED' && $portfolio['status'] !== 'SUBMITTED') {
            $logStmt = $db->prepare('INSERT INTO poe_core_activitylog (portfolio_id, user_id, event_type, description, timestamp) VALUES (?, ?, "SUBMITTED", "Submitted portfolio for evaluation", NOW())');
            $logStmt->execute([$id, $user['id']]);
        }

        $stmt = $db->prepare('SELECT * FROM poe_core_portfolio WHERE id = ?');
        $stmt->execute([$id]);
        $updated = $stmt->fetch();

        echo json_encode(Serializers::portfolio($updated, $user, true));
    }

    public static function deletePortfolio(int $id): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM poe_core_portfolio WHERE id = ?');
        $stmt->execute([$id]);
        $portfolio = $stmt->fetch();

        if (!$portfolio) {
            http_response_code(404);
            echo json_encode(['detail' => 'Portfolio not found.']);
            return;
        }

        // Delete evidence, assessments, comments, logs
        $db->prepare('DELETE FROM poe_core_evidence WHERE portfolio_id = ?')->execute([$id]);
        $db->prepare('DELETE FROM poe_core_assessment WHERE portfolio_id = ?')->execute([$id]);
        $db->prepare('DELETE FROM poe_core_comment WHERE portfolio_id = ?')->execute([$id]);
        $db->prepare('DELETE FROM poe_core_activitylog WHERE portfolio_id = ?')->execute([$id]);
        $db->prepare('DELETE FROM poe_core_portfolio WHERE id = ?')->execute([$id]);

        http_response_code(200);
        echo json_encode(['detail' => 'Portfolio deleted successfully.']);
    }

    public static function verifyPortfolio(int $id): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $body = App::body();
        $status = $body['status'] ?? 'VERIFIED';
        $feedback = $body['feedback'] ?? '';

        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE poe_core_portfolio 
            SET verification_status = ?, verifier_id = ?, verified_at = NOW(), verification_feedback = ?, updated_at = NOW() 
            WHERE id = ?');
        $stmt->execute([$status, $user['id'], $feedback, $id]);

        $logStmt = $db->prepare('INSERT INTO poe_core_activitylog (portfolio_id, user_id, event_type, description, timestamp) VALUES (?, ?, "VERIFIED", ?, NOW())');
        $logStmt->execute([$id, $user['id'], "Verification verdict: {$status} - {$feedback}"]);

        echo json_encode(['detail' => 'Portfolio verified successfully.', 'status' => $status]);
    }

    public static function createEvidence(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $portfolioId = $_POST['portfolio'] ?? null;
        $description = $_POST['description'] ?? '';
        $order = isset($_POST['order']) ? (int)$_POST['order'] : 0;

        if (!$portfolioId || !isset($_FILES['file'])) {
            http_response_code(400);
            echo json_encode(['detail' => 'Portfolio ID and file are required.']);
            return;
        }

        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['detail' => 'File upload error code: ' . $file['error']]);
            return;
        }

        $uploadDir = __DIR__ . '/../../public/media/evidence/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'evidence_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $targetPath = $uploadDir . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            http_response_code(500);
            echo json_encode(['detail' => 'Failed to save uploaded file.']);
            return;
        }

        $fileHash = hash_file('sha256', $targetPath);
        $relativeUrl = 'evidence/' . $fileName;

        $db = Database::getConnection();
        
        // Fetch current round from portfolio
        $pStmt = $db->prepare('SELECT submission_round FROM poe_core_portfolio WHERE id = ?');
        $pStmt->execute([$portfolioId]);
        $currentRound = (int)($pStmt->fetchColumn() ?: 1);

        $stmt = $db->prepare('INSERT INTO poe_core_evidence 
            (portfolio_id, file, description, uploaded_at, submission_round, file_hash, `order`) 
            VALUES (?, ?, ?, NOW(), ?, ?, ?)');
        $stmt->execute([$portfolioId, $relativeUrl, $description, $currentRound, $fileHash, $order]);
        $newId = (int)$db->lastInsertId();

        http_response_code(201);
        echo json_encode([
            'id' => $newId,
            'portfolio' => (int)$portfolioId,
            'file' => App::mediaUrl($relativeUrl),
            'description' => $description,
            'file_hash' => $fileHash,
            'submission_round' => $currentRound,
            'order' => $order
        ]);
    }

    public static function updateEvidence(int $id): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $body = App::body();
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM poe_core_evidence WHERE id = ?');
        $stmt->execute([$id]);
        $e = $stmt->fetch();
        if (!$e) {
            http_response_code(404);
            echo json_encode(['detail' => 'Evidence not found.']);
            return;
        }

        $order = isset($body['order']) ? (int)$body['order'] : (int)$e['order'];
        $desc = isset($body['description']) ? trim($body['description']) : $e['description'];

        $upStmt = $db->prepare('UPDATE poe_core_evidence SET `order` = ?, description = ? WHERE id = ?');
        $upStmt->execute([$order, $desc, $id]);

        echo json_encode(['id' => $id, 'order' => $order, 'description' => $desc]);
    }

    public static function deleteEvidence(int $id): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM poe_core_evidence WHERE id = ?');
        $stmt->execute([$id]);
        $e = $stmt->fetch();

        if ($e) {
            $filePath = __DIR__ . '/../../public/media/' . ltrim($e['file'], '/');
            if (is_file($filePath)) {
                @unlink($filePath);
            }
            $db->prepare('DELETE FROM poe_core_evidence WHERE id = ?')->execute([$id]);
        }

        echo json_encode(['detail' => 'Evidence deleted successfully.']);
    }

    public static function createAssessment(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $body = App::body();
        $portfolioId = (int)($body['portfolio'] ?? 0);
        $grade = trim($body['grade'] ?? '');
        $feedback = trim($body['feedback'] ?? '');
        $isRedo = !empty($body['is_redo_request']);
        $criterionScores = $body['criterion_scores'] ?? [];
        $date = !empty($body['date']) ? $body['date'] : date('Y-m-d');

        if (!$portfolioId) {
            http_response_code(400);
            echo json_encode(['detail' => 'Portfolio ID is required.']);
            return;
        }

        $db = Database::getConnection();

        // Check if assessment already exists, replace or insert
        $checkStmt = $db->prepare('SELECT id FROM poe_core_assessment WHERE portfolio_id = ?');
        $checkStmt->execute([$portfolioId]);
        $existingId = $checkStmt->fetchColumn();

        if ($existingId) {
            $stmt = $db->prepare('UPDATE poe_core_assessment SET assessor_id = ?, grade = ?, feedback = ?, is_redo_request = ?, date = ? WHERE id = ?');
            $stmt->execute([$user['id'], $grade, $feedback, $isRedo ? 1 : 0, $date, $existingId]);
            $assessmentId = (int)$existingId;
            $db->prepare('DELETE FROM poe_core_assessmentcriterionscore WHERE assessment_id = ?')->execute([$assessmentId]);
        } else {
            $stmt = $db->prepare('INSERT INTO poe_core_assessment (portfolio_id, assessor_id, grade, feedback, is_redo_request, date) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$portfolioId, $user['id'], $grade, $feedback, $isRedo ? 1 : 0, $date]);
            $assessmentId = (int)$db->lastInsertId();
        }

        // Criterion scores
        if (!empty($criterionScores) && is_array($criterionScores)) {
            $scoreStmt = $db->prepare('INSERT INTO poe_core_assessmentcriterionscore (assessment_id, criterion_id, is_satisfied) VALUES (?, ?, ?)');
            foreach ($criterionScores as $cs) {
                $cId = (int)($cs['criterion'] ?? 0);
                $isSat = !empty($cs['is_satisfied']) ? 1 : 0;
                if ($cId > 0) {
                    $scoreStmt->execute([$assessmentId, $cId, $isSat]);
                }
            }
        }

        // Update portfolio status
        if ($isRedo) {
            $pUp = $db->prepare('UPDATE poe_core_portfolio SET status = "REDO", submission_round = submission_round + 1, updated_at = NOW() WHERE id = ?');
            $pUp->execute([$portfolioId]);
            $db->prepare('INSERT INTO poe_core_activitylog (portfolio_id, user_id, event_type, description, timestamp) VALUES (?, ?, "REDO_REQUESTED", ?, NOW())')
               ->execute([$portfolioId, $user['id'], "Redo requested: {$feedback}"]);
        } else {
            $pUp = $db->prepare('UPDATE poe_core_portfolio SET status = "EVALUATED", updated_at = NOW() WHERE id = ?');
            $pUp->execute([$portfolioId]);
            $db->prepare('INSERT INTO poe_core_activitylog (portfolio_id, user_id, event_type, description, timestamp) VALUES (?, ?, "EVALUATED", ?, NOW())')
               ->execute([$portfolioId, $user['id'], "Graded as {$grade}: {$feedback}"]);
        }

        http_response_code(201);
        echo json_encode([
            'id' => $assessmentId,
            'portfolio' => $portfolioId,
            'assessor' => (int)$user['id'],
            'grade' => $grade,
            'feedback' => $feedback,
            'is_redo_request' => $isRedo,
            'date' => $date
        ]);
    }

    public static function createComment(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $body = App::body();
        $portfolioId = (int)($body['portfolio'] ?? 0);
        $message = trim($body['message'] ?? '');

        if (!$portfolioId || !$message) {
            http_response_code(400);
            echo json_encode(['detail' => 'Portfolio and message are required.']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('INSERT INTO poe_core_comment (portfolio_id, user_id, message, created_at) VALUES (?, ?, ?, NOW())');
        $stmt->execute([$portfolioId, $user['id'], $message]);
        $newId = (int)$db->lastInsertId();

        $cRow = $db->query("SELECT * FROM poe_core_comment WHERE id = {$newId}")->fetch();

        http_response_code(201);
        echo json_encode(Serializers::comment($cRow));
    }

    public static function downloadPdf(int $id): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT p.*, u.code as unit_code, u.name as unit_name, l.username as learner_username, l.first_name, l.last_name, l.registration_number
            FROM poe_core_portfolio p
            LEFT JOIN academic_unit u ON p.unit_id = u.id
            JOIN users_user l ON p.learner_id = l.id
            WHERE p.id = ?');
        $stmt->execute([$id]);
        $p = $stmt->fetch();

        if (!$p) {
            http_response_code(404);
            echo json_encode(['detail' => 'Portfolio not found.']);
            return;
        }

        $learnerName = trim(($p['first_name'] ?? '') . ' ' . ($p['last_name'] ?? '')) ?: $p['learner_username'];
        $title = "POE Report: {$p['title']}";
        $subtitle = "Candidate: {$learnerName} ({$p['registration_number']}) | Unit: {$p['unit_code']} - {$p['unit_name']}";

        // Evidence list
        $eStmt = $db->prepare('SELECT description, uploaded_at, submission_round FROM poe_core_evidence WHERE portfolio_id = ? ORDER BY id ASC');
        $eStmt->execute([$id]);
        $rows = [];
        while ($er = $eStmt->fetch()) {
            $rows[] = [$er['description'], "Trial " . $er['submission_round'], substr($er['uploaded_at'], 0, 10)];
        }

        $pdfBytes = Pdf::table($title, $subtitle, ['Evidence Description', 'Submission Round', 'Date Uploaded'], $rows);
        App::sendFile($pdfBytes, "portfolio_{$id}.pdf", 'application/pdf');
    }

    public static function getReportsAnalytics(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();

        // Calculate KPI Metrics
        $totalReports = (int)$db->query('SELECT COUNT(*) FROM poe_core_portfolio')->fetchColumn();
        $approvedReports = (int)$db->query("SELECT COUNT(*) FROM poe_core_portfolio WHERE status = 'EVALUATED'")->fetchColumn();
        $pendingWorkflow = (int)$db->query("SELECT COUNT(*) FROM poe_core_portfolio WHERE status = 'SUBMITTED'")->fetchColumn();
        $declinedReports = (int)$db->query("SELECT COUNT(*) FROM poe_core_portfolio WHERE status = 'REDO'")->fetchColumn();

        // Fetch all reports
        $sql = "SELECT p.id, p.title, p.assessment_type, p.status,
                       u.name as unit_name, u.code as unit_code,
                       c.name as course_name,
                       s.name as school_name,
                       sem.name as semester_name,
                       l.first_name, l.last_name, l.username, l.registration_number
                FROM poe_core_portfolio p
                LEFT JOIN academic_unit u ON p.unit_id = u.id
                LEFT JOIN academic_course c ON u.course_id = c.id
                LEFT JOIN academic_school s ON c.school_id = s.id
                LEFT JOIN academic_semester sem ON u.semester_id = sem.id
                JOIN users_user l ON p.learner_id = l.id
                ORDER BY p.updated_at DESC";
        $stmt = $db->query($sql);
        $reports = [];

        while ($r = $stmt->fetch()) {
            $studentName = trim(($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? '')) ?: $r['username'];
            $adm = $r['registration_number'] ?: $r['username'];
            $reports[] = [
                'id' => (int)$r['id'],
                'admission_number' => $adm,
                'assessment_number' => 'ASS-' . str_pad($r['id'], 5, '0', STR_PAD_LEFT),
                'name' => $studentName,
                'department' => $r['school_name'] ?: 'General Studies',
                'title' => $r['title'],
                'category' => $r['assessment_type'] ?: 'ASSESSMENT',
                'status' => $r['status'],
                'unit' => trim(($r['unit_code'] ?? '') . ' - ' . ($r['unit_name'] ?? 'General')),
                'programme' => $r['course_name'] ?: 'Technical Diploma',
                'session' => $r['semester_name'] ?: 'Current Session'
            ];
        }

        echo json_encode([
            'metrics' => [
                'total_reports' => $totalReports,
                'approved_reports' => $approvedReports,
                'pending_workflow' => $pendingWorkflow,
                'declined_reports' => $declinedReports
            ],
            'reports' => $reports
        ]);
    }

    public static function getManagementAnalytics(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();

        $departmentId = $_GET['department'] ?? null;
        $level = $_GET['level'] ?? null;
        $courseId = $_GET['course'] ?? null;
        $search = trim($_GET['search'] ?? '');

        // Query students count
        $studentSql = "SELECT COUNT(*) FROM users_user WHERE role = 'STUDENT'";
        $sParams = [];
        if ($courseId) {
            $studentSql .= " AND course_id = ?";
            $sParams[] = (int)$courseId;
        }
        $sStmt = $db->prepare($studentSql);
        $sStmt->execute($sParams);
        $totalTrainees = (int)$sStmt->fetchColumn();

        // Query portfolio counts
        $pSql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN p.status IN ('SUBMITTED', 'EVALUATED', 'REDO') THEN 1 ELSE 0 END) as submitted,
                    SUM(CASE WHEN p.status = 'EVALUATED' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN p.status = 'SUBMITTED' THEN 1 ELSE 0 END) as pending_approval,
                    SUM(CASE WHEN p.status IN ('DRAFT', 'REDO') THEN 1 ELSE 0 END) as pending_submission
                 FROM poe_core_portfolio p
                 LEFT JOIN academic_unit u ON p.unit_id = u.id
                 LEFT JOIN academic_course c ON u.course_id = c.id
                 WHERE 1=1";
        $pParams = [];
        if ($departmentId) {
            $pSql .= " AND c.school_id = ?";
            $pParams[] = (int)$departmentId;
        }
        if ($level) {
            $pSql .= " AND c.level = ?";
            $pParams[] = $level;
        }
        if ($courseId) {
            $pSql .= " AND c.id = ?";
            $pParams[] = (int)$courseId;
        }
        if ($search !== '') {
            $pSql .= " AND (c.name LIKE ? OR p.title LIKE ?)";
            $pParams[] = "%{$search}%";
            $pParams[] = "%{$search}%";
        }
        $pStmt = $db->prepare($pSql);
        $pStmt->execute($pParams);
        $pStats = $pStmt->fetch();

        $totalPortfolios = (int)($pStats['total'] ?? 0);
        $poeSubmitted = (int)($pStats['submitted'] ?? 0);
        $poeApproved = (int)($pStats['approved'] ?? 0);
        $poePendingApproval = (int)($pStats['pending_approval'] ?? 0);
        $poePendingSubmission = (int)($pStats['pending_submission'] ?? 0);

        $poeSubmittedPct = $totalPortfolios > 0 ? round(($poeSubmitted / $totalPortfolios) * 100, 1) : 0;
        $poeApprovedPct = $totalPortfolios > 0 ? round(($poeApproved / $totalPortfolios) * 100, 1) : 0;
        $poePendingApprovalPct = $totalPortfolios > 0 ? round(($poePendingApproval / $totalPortfolios) * 100, 1) : 0;
        $poePendingSubmissionPct = $totalPortfolios > 0 ? round(($poePendingSubmission / $totalPortfolios) * 100, 1) : 0;

        // 30 days trends
        $trendsData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $displayDate = date('M d', strtotime($date));
            $tStmt = $db->prepare("SELECT 
                SUM(CASE WHEN status IN ('SUBMITTED', 'EVALUATED', 'REDO') THEN 1 ELSE 0 END) as sub,
                SUM(CASE WHEN status = 'EVALUATED' THEN 1 ELSE 0 END) as app,
                SUM(CASE WHEN status = 'SUBMITTED' THEN 1 ELSE 0 END) as pen
                FROM poe_core_portfolio WHERE DATE(created_at) = ?");
            $tStmt->execute([$date]);
            $tRow = $tStmt->fetch();
            $trendsData[] = [
                'date' => $displayDate,
                'Submitted' => (int)($tRow['sub'] ?? 0),
                'Approved' => (int)($tRow['app'] ?? 0),
                'Pending' => (int)($tRow['pen'] ?? 0),
            ];
        }

        // Albums distribution
        $aStmt = $db->query("SELECT c.name, COUNT(p.id) as count 
                             FROM academic_course c
                             JOIN academic_unit u ON u.course_id = c.id
                             JOIN poe_core_portfolio p ON p.unit_id = u.id
                             GROUP BY c.id, c.name
                             HAVING count > 0
                             ORDER BY count DESC");
        $albumsData = [];
        while ($aRow = $aStmt->fetch()) {
            $albumsData[] = [
                'name' => $aRow['name'],
                'count' => (int)$aRow['count'],
            ];
        }

        // Programme Overview
        $cSql = "SELECT c.*, s.name as school_name FROM academic_course c LEFT JOIN academic_school s ON c.school_id = s.id WHERE 1=1";
        $cParams = [];
        if ($departmentId) {
            $cSql .= " AND c.school_id = ?";
            $cParams[] = (int)$departmentId;
        }
        if ($level) {
            $cSql .= " AND c.level = ?";
            $cParams[] = $level;
        }
        if ($courseId) {
            $cSql .= " AND c.id = ?";
            $cParams[] = (int)$courseId;
        }
        if ($search !== '') {
            $cSql .= " AND c.name LIKE ?";
            $cParams[] = "%{$search}%";
        }
        $cSql .= " ORDER BY c.name ASC";
        $coursesStmt = $db->prepare($cSql);
        $coursesStmt->execute($cParams);
        $courseRows = $coursesStmt->fetchAll();

        $programmeOverview = [];
        foreach ($courseRows as $c) {
            $cid = (int)$c['id'];
            $stCount = (int)$db->query("SELECT COUNT(*) FROM users_user WHERE role = 'STUDENT' AND course_id = {$cid}")->fetchColumn();

            $pStatsStmt = $db->query("SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN p.status IN ('SUBMITTED', 'EVALUATED', 'REDO') THEN 1 ELSE 0 END) as sub,
                SUM(CASE WHEN p.status = 'EVALUATED' THEN 1 ELSE 0 END) as app,
                SUM(CASE WHEN p.status = 'SUBMITTED' THEN 1 ELSE 0 END) as pen_app,
                SUM(CASE WHEN p.status IN ('DRAFT', 'REDO') THEN 1 ELSE 0 END) as pen_sub
                FROM poe_core_portfolio p
                JOIN academic_unit u ON p.unit_id = u.id
                WHERE u.course_id = {$cid}");
            $cp = $pStatsStmt->fetch();
            $cTotal = (int)($cp['total'] ?? 0);
            $cApp = (int)($cp['app'] ?? 0);
            $cProgress = $cTotal > 0 ? round(($cApp / $cTotal) * 100, 1) : 0;

            // Units breakdown
            $uStmt = $db->prepare("SELECT u.id, u.name, u.code, sem.name as semester_name,
                COUNT(p.id) as total,
                SUM(CASE WHEN p.status IN ('SUBMITTED', 'EVALUATED', 'REDO') THEN 1 ELSE 0 END) as submitted,
                SUM(CASE WHEN p.status = 'EVALUATED' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN p.status = 'SUBMITTED' THEN 1 ELSE 0 END) as pending_approval,
                SUM(CASE WHEN p.status IN ('DRAFT', 'REDO') THEN 1 ELSE 0 END) as pending_submission
                FROM academic_unit u
                LEFT JOIN academic_semester sem ON u.semester_id = sem.id
                LEFT JOIN poe_core_portfolio p ON p.unit_id = u.id
                WHERE u.course_id = ?
                GROUP BY u.id, u.name, u.code, sem.name
                ORDER BY u.name ASC");
            $uStmt->execute([$cid]);
            $unitsData = [];
            while ($uRow = $uStmt->fetch()) {
                $unitsData[] = [
                    'id' => (int)$uRow['id'],
                    'name' => $uRow['name'],
                    'code' => $uRow['code'],
                    'semester_name' => $uRow['semester_name'] ?: 'Unassigned',
                    'total' => (int)($uRow['total'] ?? 0),
                    'submitted' => (int)($uRow['submitted'] ?? 0),
                    'approved' => (int)($uRow['approved'] ?? 0),
                    'pending_approval' => (int)($uRow['pending_approval'] ?? 0),
                    'pending_submission' => (int)($uRow['pending_submission'] ?? 0),
                ];
            }

            $programmeOverview[] = [
                'id' => $cid,
                'name' => $c['name'],
                'level' => $c['level'] ?? '',
                'total_trainees' => $stCount,
                'total_portfolios' => $cTotal,
                'submitted' => (int)($cp['sub'] ?? 0),
                'approved' => $cApp,
                'pending_approval' => (int)($cp['pen_app'] ?? 0),
                'pending_submission' => (int)($cp['pen_sub'] ?? 0),
                'progress' => $cProgress,
                'units' => $unitsData,
            ];
        }

        // Filter options
        $schools = $db->query("SELECT id, name FROM academic_school ORDER BY name")->fetchAll();
        $semesters = $db->query("SELECT id, name FROM academic_semester ORDER BY id")->fetchAll();
        $coursesList = $db->query("SELECT id, name FROM academic_course ORDER BY name")->fetchAll();

        $levels = [
            ['value' => 'GRADE_I', 'label' => 'Grade I'],
            ['value' => 'GRADE_II', 'label' => 'Grade II'],
            ['value' => 'GRADE_III', 'label' => 'Grade III'],
            ['value' => 'LEVEL_3', 'label' => 'Level 3'],
            ['value' => 'LEVEL_4', 'label' => 'Level 4'],
            ['value' => 'LEVEL_5', 'label' => 'Level 5'],
            ['value' => 'LEVEL_6', 'label' => 'Level 6'],
            ['value' => 'HEADWAY', 'label' => 'Headway Certificate'],
        ];

        echo json_encode([
            'stats' => [
                'total_students' => $totalTrainees,
                'total_trainees' => $totalTrainees,
                'total_portfolios' => $totalPortfolios,
                'poe_submitted' => $poeSubmitted,
                'poe_submitted_pct' => $poeSubmittedPct,
                'poe_approved' => $poeApproved,
                'poe_approved_pct' => $poeApprovedPct,
                'poe_pending_approval' => $poePendingApproval,
                'poe_pending_approval_pct' => $poePendingApprovalPct,
                'poe_pending_submission' => $poePendingSubmission,
                'poe_pending_submission_pct' => $poePendingSubmissionPct,
            ],
            'trends' => $trendsData,
            'albums' => $albumsData,
            'programmes' => $programmeOverview,
            'filter_options' => [
                'departments' => $schools,
                'levels' => $levels,
                'programmes' => $coursesList,
                'semesters' => $semesters,
            ]
        ]);
    }
}
