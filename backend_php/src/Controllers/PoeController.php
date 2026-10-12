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
}
