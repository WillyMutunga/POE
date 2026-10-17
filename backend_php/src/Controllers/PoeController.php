<?php
namespace App\Controllers;

use App\Utils\Database;
use App\Auth\JwtService;
use PDO;

class PoeController {
    private static function getAuthenticatedUser(): ?array {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return null;
        }
        return JwtService::decode($matches[1]);
    }

    public static function listPortfolios(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $sql = 'SELECT p.*, u.code as unit_code, u.name as unit_name, 
                       l.username as learner_username, l.first_name, l.last_name, l.registration_number
                FROM poe_core_portfolio p
                LEFT JOIN academic_unit u ON p.unit_id = u.id
                JOIN users_user l ON p.learner_id = l.id';
        $params = [];

        if ($user['role'] === 'STUDENT') {
            $sql .= ' WHERE p.learner_id = ?';
            $params[] = $user['user_id'];
        }

        $sql .= ' ORDER BY p.updated_at DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $portfolios = $stmt->fetchAll();

        // Attach evidence files to each portfolio
        foreach ($portfolios as &$p) {
            $eStmt = $db->prepare('SELECT id, file, description, uploaded_at, submission_round, file_hash
                                   FROM poe_core_evidence WHERE portfolio_id = ? ORDER BY id ASC');
            $eStmt->execute([$p['id']]);
            $p['evidence'] = $eStmt->fetchAll();
            $p['learner_display'] = trim(($p['first_name'] ?? '') . ' ' . ($p['last_name'] ?? '')) ?: $p['learner_username'];
            $p['unit_display'] = trim(($p['unit_code'] ?? '') . ' - ' . ($p['unit_name'] ?? ''));
        }

        echo json_encode($portfolios);
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

        // Upload directory
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
        $stmt = $db->prepare('INSERT INTO poe_core_evidence 
            (portfolio_id, file, description, uploaded_at, submission_round, file_hash) 
            VALUES (?, ?, ?, NOW(), 1, ?)');
        $stmt->execute([$portfolioId, $relativeUrl, $description, $fileHash]);
        $newId = $db->lastInsertId();

        http_response_code(201);
        echo json_encode([
            'id' => (int)$newId,
            'portfolio' => (int)$portfolioId,
            'file' => $relativeUrl,
            'description' => $description,
            'file_hash' => $fileHash
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
