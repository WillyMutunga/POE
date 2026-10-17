<?php
// CORS headers for React frontend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Simple PSR-4 style autoloader
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

// Load .env if present
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$name, $value] = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value));
    }
}

// Parse request path
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Strip prefix for any deployment context
$uri = preg_replace('#^/(poe/backend_php/public/|poe/backend_php/|poe_backend/api/|poe_backend/|api/)#', '/', $uri);
$uri = rtrim($uri, '/') ?: '/';

// Router mapping
switch (true) {
    // Health check
    case $uri === '/' || $uri === '/health':
        echo json_encode([
            'status' => 'online',
            'engine' => 'Headway PoE PHP Backend v1.0',
            'php_version' => PHP_VERSION,
            'time' => date('Y-m-d H:i:s')
        ]);
        break;

    // Authentication & User Routes
    case $uri === '/users/login' && $method === 'POST':
        \App\Controllers\AuthController::login();
        break;

    case ($uri === '/users/token/refresh' || $uri === '/token/refresh') && $method === 'POST':
        \App\Controllers\AuthController::refreshToken();
        break;

    case $uri === '/users/profile' && $method === 'GET':
        \App\Controllers\AuthController::profile();
        break;

    case $uri === '/users/profile' && ($method === 'PATCH' || $method === 'PUT'):
        \App\Controllers\AuthController::updateProfile();
        break;

    case ($uri === '/users/list-all' || $uri === '/users') && $method === 'GET':
        \App\Controllers\AuthController::listAll();
        break;

    case $uri === '/users/my-students' && $method === 'GET':
        \App\Controllers\AuthController::myStudents();
        break;

    case $uri === '/users/create' && $method === 'POST':
        \App\Controllers\AuthController::createUser();
        break;

    case $uri === '/users/export-students-pdf' && $method === 'GET':
        \App\Controllers\AuthController::exportStudentsPdf();
        break;

    // Academic Routes - Schools, Courses, Semesters
    case $uri === '/academic/schools' && $method === 'GET':
        \App\Controllers\AcademicController::listSchools();
        break;

    case $uri === '/academic/courses' && $method === 'GET':
        \App\Controllers\AcademicController::listCourses();
        break;

    case $uri === '/academic/semesters' && $method === 'GET':
        \App\Controllers\AcademicController::listSemesters();
        break;

    // Academic Routes - Units
    case $uri === '/academic/units/my_units' && $method === 'GET':
        \App\Controllers\AcademicController::myUnits();
        break;

    case $uri === '/academic/units/registration_list' && $method === 'GET':
        \App\Controllers\AcademicController::registrationList();
        break;

    case $uri === '/academic/units/student_units_for_assignment' && $method === 'GET':
        \App\Controllers\AcademicController::studentUnitsForAssignment();
        break;

    case $uri === '/academic/units' && $method === 'GET':
        \App\Controllers\AcademicController::listUnits();
        break;

    case $uri === '/academic/units' && $method === 'POST':
        \App\Controllers\AcademicController::createUnit();
        break;

    case preg_match('#^/academic/units/(\d+)$#', $uri, $m) && $method === 'GET':
        \App\Controllers\AcademicController::getUnit((int)$m[1]);
        break;

    case preg_match('#^/academic/units/(\d+)/get_components$#', $uri, $m) && $method === 'GET':
        \App\Controllers\AcademicController::getComponents((int)$m[1]);
        break;

    case preg_match('#^/academic/units/(\d+)/enroll_students$#', $uri, $m) && $method === 'POST':
        \App\Controllers\AcademicController::enrollStudents((int)$m[1]);
        break;

    case preg_match('#^/academic/units/(\d+)/remove_student$#', $uri, $m) && $method === 'POST':
        \App\Controllers\AcademicController::removeStudent((int)$m[1]);
        break;

    case $uri === '/academic/elements' && $method === 'POST':
        \App\Controllers\AcademicController::createElement();
        break;

    // Academic Routes - Registrations
    case $uri === '/academic/registrations' && $method === 'GET':
        \App\Controllers\AcademicController::listRegistrations();
        break;

    case $uri === '/academic/registrations/bulk_register' && $method === 'POST':
        \App\Controllers\AcademicController::bulkRegister();
        break;

    case $uri === '/academic/registrations/direct_assign' && $method === 'POST':
        \App\Controllers\AcademicController::directAssign();
        break;

    case $uri === '/academic/registrations/bulk_approve' && $method === 'POST':
        \App\Controllers\AcademicController::bulkApprove();
        break;

    case $uri === '/academic/registrations/bulk_reject' && $method === 'POST':
        \App\Controllers\AcademicController::bulkReject();
        break;

    case preg_match('#^/academic/registrations/(\d+)/approve$#', $uri, $m) && $method === 'POST':
        \App\Controllers\AcademicController::approveRegistration((int)$m[1]);
        break;

    case preg_match('#^/academic/registrations/(\d+)/reject$#', $uri, $m) && $method === 'POST':
        \App\Controllers\AcademicController::rejectRegistration((int)$m[1]);
        break;

    // Academic Routes - Exams & Grading
    case $uri === '/academic/exams' && $method === 'GET':
        \App\Controllers\AcademicController::listExams();
        break;

    case preg_match('#^/academic/exams/(\d+)$#', $uri, $m) && $method === 'DELETE':
        \App\Controllers\AcademicController::deleteExam((int)$m[1]);
        break;

    case ($uri === '/academic/grading-systems' || $uri === '/academic/grading') && $method === 'GET':
        \App\Controllers\AcademicController::listGradingSystems();
        break;

    case $uri === '/academic/rubrics' && $method === 'GET':
        \App\Controllers\AcademicController::listRubrics();
        break;

    case $uri === '/academic/student-marks' && $method === 'GET':
        \App\Controllers\AcademicController::listStudentMarks();
        break;

    case $uri === '/academic/student-marks/enter_marks' && $method === 'POST':
        \App\Controllers\AcademicController::enterMarks();
        break;

    // PoE Evidence & Portfolio Routes
    case $uri === '/poe/portfolios' && $method === 'GET':
        \App\Controllers\PoeController::listPortfolios();
        break;

    case $uri === '/poe/portfolios' && $method === 'POST':
        \App\Controllers\PoeController::createPortfolio();
        break;

    case preg_match('#^/poe/portfolios/(\d+)$#', $uri, $m) && $method === 'GET':
        \App\Controllers\PoeController::getPortfolio((int)$m[1]);
        break;

    case preg_match('#^/poe/portfolios/(\d+)$#', $uri, $m) && ($method === 'PATCH' || $method === 'PUT'):
        \App\Controllers\PoeController::updatePortfolio((int)$m[1]);
        break;

    case preg_match('#^/poe/portfolios/(\d+)$#', $uri, $m) && $method === 'DELETE':
        \App\Controllers\PoeController::deletePortfolio((int)$m[1]);
        break;

    case preg_match('#^/poe/portfolios/(\d+)/verify$#', $uri, $m) && $method === 'POST':
        \App\Controllers\PoeController::verifyPortfolio((int)$m[1]);
        break;

    case preg_match('#^/poe/portfolios/(\d+)/download_pdf$#', $uri, $m) && $method === 'GET':
        \App\Controllers\PoeController::downloadPdf((int)$m[1]);
        break;

    case $uri === '/poe/evidence' && $method === 'POST':
        \App\Controllers\PoeController::createEvidence();
        break;

    case preg_match('#^/poe/evidence/(\d+)$#', $uri, $m) && $method === 'PATCH':
        \App\Controllers\PoeController::updateEvidence((int)$m[1]);
        break;

    case preg_match('#^/poe/evidence/(\d+)$#', $uri, $m) && $method === 'DELETE':
        \App\Controllers\PoeController::deleteEvidence((int)$m[1]);
        break;

    case $uri === '/poe/assessments' && $method === 'POST':
        \App\Controllers\PoeController::createAssessment();
        break;

    case $uri === '/poe/comments' && $method === 'POST':
        \App\Controllers\PoeController::createComment();
        break;

    case $uri === '/poe/poe-management-analytics' && $method === 'GET':
        \App\Controllers\PoeController::getManagementAnalytics();
        break;

    case $uri === '/poe/reports-analytics' && $method === 'GET':
        \App\Controllers\PoeController::getReportsAnalytics();
        break;

    // Online Exam Routes
    case $uri === '/academic/online-exams/my-pending' && $method === 'GET':
        \App\Controllers\ExamController::myPending();
        break;

    case $uri === '/academic/online-exams' && $method === 'GET':
        \App\Controllers\ExamController::listOnlineExams();
        break;

    case preg_match('#^/academic/online-exams/(\d+)$#', $uri, $m) && $method === 'GET':
        \App\Controllers\ExamController::getExamDetails((int)$m[1]);
        break;

    case preg_match('#^/academic/online-exams/(\d+)/submit$#', $uri, $m) && $method === 'POST':
        \App\Controllers\ExamController::submitExam((int)$m[1]);
        break;

    // Notifications Routes
    case $uri === '/notifications' && $method === 'GET':
        \App\Controllers\NotificationController::list();
        break;

    case $uri === '/notifications/mark_all_as_read' && $method === 'POST':
        \App\Controllers\NotificationController::markAllRead();
        break;

    case preg_match('#^/notifications/(\d+)/mark_as_read$#', $uri, $m) && $method === 'POST':
        \App\Controllers\NotificationController::markRead((int)$m[1]);
        break;

    // Certificate Routes
    case $uri === '/academic/certificates' && $method === 'GET':
        \App\Controllers\CertificateController::listCertificates();
        break;

    case $uri === '/academic/certificate-templates' && $method === 'GET':
        \App\Controllers\CertificateController::getTemplate();
        break;

    case preg_match('#^/academic/certificates/(\d+)/download-pdf$#', $uri, $m) && $method === 'GET':
        \App\Controllers\CertificateController::downloadPdf((int)$m[1]);
        break;

    default:
        http_response_code(404);
        echo json_encode([
            'detail' => "Route {$method} {$uri} not found on PHP backend."
        ]);
        break;
}
