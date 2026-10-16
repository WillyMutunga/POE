<?php
namespace App\Utils;

class Helpers {
    public static array $LEVELS = [
        'GRADE_I' => 'Grade I',
        'GRADE_II' => 'Grade II',
        'GRADE_III' => 'Grade III',
        'LEVEL_3' => 'Level 3',
        'LEVEL_4' => 'Level 4',
        'LEVEL_5' => 'Level 5',
        'LEVEL_6' => 'Level 6',
        'HEADWAY' => 'Headway',
    ];

    public static array $INTAKES = [
        'JANUARY' => 'January Intake',
        'MAY' => 'May Intake',
        'SEPTEMBER' => 'September Intake',
    ];

    public static array $ASSESSMENT_TYPES = [
        'PRACTICAL' => 'Practical Assessments',
        'ORAL' => 'Oral Assessments',
        'WRITTEN' => 'Written Assessments',
        'ASSIGNMENT' => 'Assignments',
        'SUPERVISED' => 'Supervised Assessments',
    ];

    public static array $REG_STATUS = [
        'PENDING' => 'Pending Approval',
        'APPROVED' => 'Approved',
        'REJECTED' => 'Rejected',
    ];

    public static array $LOG_EVENTS = [
        'CREATED' => 'Portfolio Created',
        'SUBMITTED' => 'Portfolio Submitted',
        'EVALUATED' => 'Portfolio Evaluated',
        'REDO_REQUESTED' => 'Redo Requested',
        'EVIDENCE_ADDED' => 'Evidence Uploaded',
        'EVIDENCE_DELETED' => 'Evidence Deleted',
        'VERIFIED' => 'CDACC Verified',
        'REJECTED' => 'CDACC Rejected',
    ];

    public static function fullName(array $user): string {
        $name = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
        if ($name !== '') {
            return $name;
        }
        $username = $user['username'] ?? '';
        if ($username && str_contains($username, '.')) {
            $parts = explode('.', $username);
            return implode(' ', array_map('ucfirst', $parts));
        }
        return $username;
    }

    public static function bool($v): bool {
        return $v === true || $v === 1 || $v === '1' || $v === 'true';
    }

    public static function jsonDecode($v, $default = []) {
        if (is_array($v)) {
            return $v;
        }
        if (!$v) {
            return $default;
        }
        $d = json_decode($v, true);
        return is_array($d) ? $d : $default;
    }

    public static function semesterSortKey(?string $name): array {
        if (!$name) {
            return [2, ''];
        }
        $upper = strtoupper($name);
        if (preg_match('/\b(\d+)\b/', $upper, $m)) {
            return [0, (int)$m[1]];
        }
        if (preg_match('/\b([IVXLCDM]+)\b/', $upper, $m)) {
            return [0, self::romanToInt($m[1])];
        }
        return [1, $upper];
    }

    public static function romanToInt(string $s): int {
        $roman = ['I' => 1, 'V' => 5, 'X' => 10, 'L' => 50, 'C' => 100, 'D' => 500, 'M' => 1000];
        $num = 0;
        $s = strtoupper($s);
        $len = strlen($s);
        for ($i = 0; $i < $len; $i++) {
            $cur = $roman[$s[$i]] ?? 0;
            $next = $roman[$s[$i + 1] ?? ''] ?? 0;
            $num += ($next > $cur) ? -$cur : $cur;
        }
        return $num;
    }

    public static function ids(array $rows, string $key = 'id'): array {
        return array_values(array_map(fn($r) => (int)$r[$key], $rows));
    }
}
