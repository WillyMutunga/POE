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

    // Authentication Routes
    case $uri === '/users/login' && $method === 'POST':
        \App\Controllers\AuthController::login();
        break;

    case ($uri === '/users/token/refresh' || $uri === '/users/token/refresh/' || $uri === '/token/refresh' || $uri === '/token/refresh/') && $method === 'POST':
        \App\Controllers\AuthController::refreshToken();
        break;

    case $uri === '/users/profile' && $method === 'GET':
        \App\Controllers\AuthController::profile();
        break;

    // Academic Routes
    case $uri === '/academic/units' && $method === 'GET':
        \App\Controllers\AcademicController::listUnits();
        break;

    case $uri === '/academic/courses' && $method === 'GET':
        \App\Controllers\AcademicController::listCourses();
        break;

    case $uri === '/academic/semesters' && $method === 'GET':
        \App\Controllers\AcademicController::listSemesters();
        break;

    case $uri === '/academic/registrations' && $method === 'GET':
        \App\Controllers\AcademicController::listRegistrations();
        break;

    // PoE Evidence & Portfolio Routes
    case ($uri === '/poe/portfolios' || $uri === '/poe/portfolios/') && $method === 'GET':
        \App\Controllers\PoeController::listPortfolios();
        break;

    case ($uri === '/poe/evidence' || $uri === '/poe/evidence/') && $method === 'POST':
        \App\Controllers\PoeController::createEvidence();
        break;

    case ($uri === '/poe/poe-management-analytics' || $uri === '/poe/poe-management-analytics/') && $method === 'GET':
        \App\Controllers\PoeController::getManagementAnalytics();
        break;

    // Online Exam Routes
    case $uri === '/academic/online-exams' && $method === 'GET':
        \App\Controllers\ExamController::listOnlineExams();
        break;

    case preg_match('#^/academic/online-exams/(\d+)$#', $uri, $m) && $method === 'GET':
        \App\Controllers\ExamController::getExamDetails((int)$m[1]);
        break;

    case preg_match('#^/academic/online-exams/(\d+)/submit$#', $uri, $m) && $method === 'POST':
        \App\Controllers\ExamController::submitExam((int)$m[1]);
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
