<?php
namespace App\Controllers;

use App\Utils\Database;
use App\Auth\JwtService;
use PDO;

class CertificateController {
    private static function getAuthenticatedUser(): ?array {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            // Check query param token for direct PDF download links
            $token = $_GET['token'] ?? '';
            return $token ? JwtService::decode($token) : null;
        }
        return JwtService::decode($matches[1]);
    }

    public static function listCertificates(): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $sql = 'SELECT * FROM academic_certificate';
        $params = [];

        if ($user['role'] === 'STUDENT') {
            $sql .= ' WHERE student_id = ? OR registration_no = ?';
            $params[] = $user['user_id'];
            $params[] = $user['username'];
        }

        $sql .= ' ORDER BY created_at DESC';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $certs = $stmt->fetchAll();

        foreach ($certs as &$c) {
            $c['modules_covered'] = json_decode($c['modules_covered'] ?? '[]', true);
        }

        echo json_encode($certs);
    }

    public static function getTemplate(): void {
        $db = Database::getConnection();
        $stmt = $db->query('SELECT * FROM academic_certificatetemplate LIMIT 1');
        $template = $stmt->fetch();
        echo json_encode($template ?: []);
    }

    public static function downloadPdf(int $id): void {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['detail' => 'Authentication credentials were not provided.']);
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM academic_certificate WHERE id = ?');
        $stmt->execute([$id]);
        $cert = $stmt->fetch();

        if (!$cert) {
            http_response_code(404);
            echo json_encode(['detail' => 'Certificate not found.']);
            return;
        }

        $tStmt = $db->query('SELECT * FROM academic_certificatetemplate LIMIT 1');
        $template = $tStmt->fetch() ?: [];

        // Generate printable HTML Certificate (which renders in browser or exports to PDF)
        $cert['modules_covered'] = json_decode($cert['modules_covered'] ?? '[]', true);
        
        header('Content-Type: text/html; charset=UTF-8');
        echo self::renderCertificateHtml($cert, $template);
    }

    private static function renderCertificateHtml(array $cert, array $template): string {
        $college = htmlspecialchars($template['college_name'] ?? 'HEADWAY COLLEGE OF PROFESSIONAL STUDIES');
        $motto = htmlspecialchars($template['college_motto'] ?? 'Learning for Global Relevance');
        $title = htmlspecialchars($template['title'] ?? 'Certificate of Competence');
        $student = htmlspecialchars($cert['student_name'] ?? '');
        $award = htmlspecialchars($cert['award_title'] ?? '');
        $regNo = htmlspecialchars($cert['registration_no'] ?? '');
        $refNo = htmlspecialchars($cert['cert_ref_no'] ?? '');
        $date = htmlspecialchars($cert['date_earned'] ?? '');
        $modules = $cert['modules_covered'] ?? [];

        $modulesHtml = '';
        foreach ($modules as $m) {
            $modulesHtml .= '<li>' . htmlspecialchars($m) . '</li>';
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Certificate - {$refNo}</title>
    <style>
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; padding: 40px; font-family: 'Times New Roman', serif; background: #fff; color: #1e293b; display: flex; justify-content: center; }
        .cert-container { width: 595pt; height: 842pt; border: 8px solid #0000FE; padding: 25px; box-sizing: border-box; position: relative; text-align: center; }
        .cert-inner { border: 2px solid #dc2626; height: 100%; padding: 30px; box-sizing: border-box; }
        .college-title { font-size: 22pt; font-weight: bold; color: #0000FE; margin: 10px 0 0; text-transform: uppercase; }
        .motto { font-size: 11pt; font-style: italic; color: #64748b; margin-bottom: 25px; }
        .cert-title { font-size: 26pt; font-weight: bold; color: #dc2626; margin: 20px 0; text-transform: uppercase; }
        .certify-text { font-size: 12pt; margin: 10px 0; }
        .student-name { font-size: 24pt; font-weight: bold; color: #0f172a; border-bottom: 2px solid #cbd5e1; display: inline-block; padding: 5px 40px; margin: 10px 0; }
        .award-title { font-size: 15pt; font-weight: bold; color: #0000FE; margin: 15px 0; }
        .modules-box { margin: 25px auto; max-width: 450px; text-align: left; }
        .modules-box h4 { font-size: 11pt; margin-bottom: 5px; text-transform: uppercase; color: #475569; }
        .modules-box ul { font-size: 10pt; column-count: 2; margin: 0; padding-left: 20px; }
        .footer-row { position: absolute; bottom: 50px; left: 55px; right: 55px; display: flex; justify-content: space-between; font-size: 10pt; }
        .sig-block { border-top: 1px solid #94a3b8; width: 140px; padding-top: 5px; text-align: center; }
    </style>
</head>
<body onload="window.print()">
    <div class="cert-container">
        <div class="cert-inner">
            <div class="college-title">{$college}</div>
            <div class="motto">"{$motto}"</div>
            <div class="cert-title">{$title}</div>
            <div class="certify-text">This is to Certify that</div>
            <div class="student-name">{$student}</div>
            <div class="certify-text">Registration No: <strong>{$regNo}</strong></div>
            <div class="certify-text">Has completed and passed all prescribed modules for the award of:</div>
            <div class="award-title">{$award}</div>
            
            <div class="modules-box">
                <h4>Modules Covered:</h4>
                <ul>{$modulesHtml}</ul>
            </div>

            <div class="footer-row">
                <div class="sig-block">Principal</div>
                <div>Ref: <strong>{$refNo}</strong><br>Date: {$date}</div>
                <div class="sig-block">Director of Studies</div>
            </div>
        </div>
    </div>
</body>
</html>
HTML;
    }
}
