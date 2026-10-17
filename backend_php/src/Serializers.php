<?php
namespace App;

use App\Http\App;
use App\Utils\Helpers;

class Serializers {
    public static function user(array $u): array {
        $course = $u['course_id'] ? self::lookup('academic_course', (int)$u['course_id']) : null;
        $semester = $u['semester_id'] ? self::lookup('academic_semester', (int)$u['semester_id']) : null;
        $school = null;
        if ($course && $course['school_id']) {
            $school = self::lookup('academic_school', (int)$course['school_id']);
        }
        return [
            'id' => (int)$u['id'],
            'registration_number' => $u['registration_number'],
            'cdacc_registration_number' => $u['cdacc_registration_number'] ?? null,
            'username' => $u['username'],
            'email' => $u['email'],
            'role' => $u['role'],
            'first_name' => $u['first_name'],
            'last_name' => $u['last_name'],
            'phone_number' => $u['phone_number'] ?? null,
            'course' => $u['course_id'] ? (int)$u['course_id'] : null,
            'semester' => $u['semester_id'] ? (int)$u['semester_id'] : null,
            'intake' => $u['intake'],
            'course_display' => $course['name'] ?? null,
            'semester_display' => $semester['name'] ?? null,
            'school' => $school['id'] ?? null,
            'school_name' => $school['name'] ?? null,
            'course_name' => $course['name'] ?? null,
            'full_name' => Helpers::fullName($u),
            'course_level' => $course['level'] ?? null,
        ];
    }

    public static function users(array $rows): array {
        return array_map([self::class, 'user'], $rows);
    }

    public static function school(array $s, bool $nested = true): array {
        $out = ['id' => (int)$s['id'], 'name' => $s['name']];
        if ($nested) {
            $courses = App::db()->prepare('SELECT * FROM academic_course WHERE school_id = ? ORDER BY name');
            $courses->execute([(int)$s['id']]);
            $out['courses'] = array_map(fn($c) => self::courseStructure($c), $courses->fetchAll());
        }
        return $out;
    }

    public static function courseStructure(array $c): array {
        return [
            'id' => (int)$c['id'],
            'name' => $c['name'],
            'level' => $c['level'],
            'level_display' => Helpers::$LEVELS[$c['level']] ?? $c['level'],
            'semesters' => self::semestersForCourse((int)$c['id'], true),
            'unassigned_units' => self::unitsWhere('u.course_id = ? AND u.semester_id IS NULL', [(int)$c['id']]),
        ];
    }

    public static function course(array $c, ?array $viewer = null): array {
        $school = $c['school_id'] ? self::lookup('academic_school', (int)$c['school_id']) : null;
        $instructor = $c['instructor_id'] ? self::lookup('users_user', (int)$c['instructor_id']) : null;
        $semesters = self::semestersForCourse((int)$c['id'], true, $viewer);
        $sessions = App::db()->prepare('SELECT * FROM academic_coursesession WHERE course_id = ?');
        $sessions->execute([(int)$c['id']]);
        $sessionRows = array_map([self::class, 'session'], $sessions->fetchAll());

        $students = App::db()->prepare("SELECT * FROM users_user WHERE role = 'STUDENT' AND course_id = ? ORDER BY first_name, last_name, username");
        $students->execute([(int)$c['id']]);
        $instructors = App::db()->prepare(
            "SELECT DISTINCT u.* FROM users_user u
             JOIN academic_unit_instructors ui ON ui.user_id = u.id
             JOIN academic_unit un ON un.id = ui.unit_id
             WHERE un.course_id = ? ORDER BY u.first_name, u.last_name"
        );
        $instructors->execute([(int)$c['id']]);

        return [
            'id' => (int)$c['id'],
            'name' => $c['name'],
            'school' => $c['school_id'] ? (int)$c['school_id'] : null,
            'school_name' => $school['name'] ?? null,
            'level' => $c['level'],
            'level_display' => Helpers::$LEVELS[$c['level']] ?? $c['level'],
            'semesters' => $semesters,
            'sessions' => $sessionRows,
            'unassigned_units' => self::unitsWhere('u.course_id = ? AND u.semester_id IS NULL', [(int)$c['id']], $viewer),
            'students_detail' => self::users($students->fetchAll()),
            'instructors_detail' => self::users($instructors->fetchAll()),
            'instructor' => $c['instructor_id'] ? (int)$c['instructor_id'] : null,
            'instructor_name' => $instructor ? Helpers::fullName($instructor) : null,
        ];
    }

    public static function session(array $s): array {
        $sem = $s['semester_id'] ? self::lookup('academic_semester', (int)$s['semester_id']) : null;
        return [
            'id' => (int)$s['id'],
            'course' => (int)$s['course_id'],
            'semester' => (int)$s['semester_id'],
            'semester_name' => $sem['name'] ?? null,
            'intake' => $s['intake'],
            'is_active' => Helpers::bool($s['is_active']),
        ];
    }

    public static function semester(array $s, bool $withUnits = true, ?array $viewer = null): array {
        $course = $s['course_id'] ? self::lookup('academic_course', (int)$s['course_id']) : null;
        $out = [
            'id' => (int)$s['id'],
            'name' => $s['name'],
            'course' => (int)$s['course_id'],
            'course_name' => $course['name'] ?? null,
        ];
        if ($withUnits) {
            $sql = 'u.semester_id = ?';
            $params = [(int)$s['id']];
            if ($viewer && in_array($viewer['role'], ['STUDENT', 'INSTRUCTOR', 'CDACC'], true)) {
                $sql .= ' AND u.is_approved = 1';
            }
            $out['units'] = self::unitsWhere($sql, $params, $viewer);
        }
        return $out;
    }

    public static function semestersForCourse(int $courseId, bool $withUnits, ?array $viewer = null): array {
        $stmt = App::db()->prepare('SELECT * FROM academic_semester WHERE course_id = ?');
        $stmt->execute([$courseId]);
        $rows = $stmt->fetchAll();
        if ($viewer && in_array($viewer['role'], ['STUDENT', 'INSTRUCTOR'], true)) {
            $active = App::db()->prepare('SELECT semester_id FROM academic_coursesession WHERE course_id = ? AND is_active = 1');
            $active->execute([$courseId]);
            $ids = array_map('intval', array_column($active->fetchAll(), 'semester_id'));
            $rows = array_values(array_filter($rows, fn($s) => in_array((int)$s['id'], $ids, true)));
        }
        usort($rows, fn($a, $b) => Helpers::semesterSortKey($a['name']) <=> Helpers::semesterSortKey($b['name']));
        return array_map(fn($s) => self::semester($s, $withUnits, $viewer), $rows);
    }

    public static function unit(array $u, ?array $viewer = null): array {
        $sem = $u['semester_id'] ? self::lookup('academic_semester', (int)$u['semester_id']) : null;
        $course = $u['course_id'] ? self::lookup('academic_course', (int)$u['course_id']) : null;
        $id = (int)$u['id'];
        $instructors = self::m2mUsers('academic_unit_instructors', 'unit_id', $id);
        $students = array_values(array_filter(
            self::m2mUsers('academic_unit_students', 'unit_id', $id),
            fn($x) => $x['role'] === 'STUDENT'
        ));
        $els = App::db()->prepare('SELECT * FROM academic_element WHERE unit_id = ? ORDER BY id');
        $els->execute([$id]);
        $elements = $els->fetchAll();
        $elCount = count($elements);
        $theoryTotal = $elCount;
        $practicalTotal = $elCount;
        $oralTotal = (strtolower($u['name']) === 'default' || str_contains(strtolower($u['name']), 'communication')) ? 1 : 0;

        $isLocked = false;
        $registeredSemester = null;
        $theory = '0/0';
        $practical = '0/0';
        $oral = '0/0';
        $progress = 0.0;
        if ($viewer && $viewer['role'] === 'STUDENT') {
            $reg = App::db()->prepare("SELECT r.*, s.name as semester_name FROM academic_unitregistration r LEFT JOIN academic_semester s ON s.id = r.semester_id WHERE r.student_id = ? AND r.unit_id = ? LIMIT 1");
            $reg->execute([(int)$viewer['id'], $id]);
            $regRow = $reg->fetch();
            if (!$regRow || $regRow['status'] !== 'APPROVED') {
                $isLocked = true;
            }
            if ($regRow && $regRow['status'] === 'APPROVED' && $regRow['semester_id']) {
                $registeredSemester = ['id' => (int)$regRow['semester_id'], 'name' => $regRow['semester_name']];
            }
            $countStmt = App::db()->prepare("SELECT assessment_type, COUNT(*) c FROM poe_core_portfolio WHERE learner_id = ? AND unit_id = ? AND status = 'EVALUATED' GROUP BY assessment_type");
            $countStmt->execute([(int)$viewer['id'], $id]);
            $counts = ['WRITTEN' => 0, 'PRACTICAL' => 0, 'ORAL' => 0];
            $evaluated = 0;
            foreach ($countStmt->fetchAll() as $row) {
                $counts[$row['assessment_type']] = (int)$row['c'];
                $evaluated += (int)$row['c'];
            }
            $allEval = App::db()->prepare("SELECT COUNT(*) FROM poe_core_portfolio WHERE learner_id = ? AND unit_id = ? AND status = 'EVALUATED'");
            $allEval->execute([(int)$viewer['id'], $id]);
            $evaluated = (int)$allEval->fetchColumn();
            $theory = ($counts['WRITTEN'] ?? 0) . '/' . $theoryTotal;
            $practical = ($counts['PRACTICAL'] ?? 0) . '/' . $practicalTotal;
            $oral = ($counts['ORAL'] ?? 0) . '/' . $oralTotal;
            $expected = $theoryTotal + $practicalTotal + $oralTotal;
            $progress = $expected > 0 ? round($evaluated / $expected * 100, 1) : 0.0;
        }

        $instructorIds = array_map(fn($x) => (int)$x['id'], $instructors);
        $studentIds = array_map(fn($x) => (int)$x['id'], $students);

        return [
            'id' => $id,
            'name' => $u['name'],
            'code' => $u['code'],
            'course' => $u['course_id'] ? (int)$u['course_id'] : null,
            'semester' => $u['semester_id'] ? (int)$u['semester_id'] : null,
            'semester_name' => $sem['name'] ?? null,
            'course_name' => $course['name'] ?? null,
            'instructors' => $instructorIds,
            'students' => $studentIds,
            'student_count' => count($students),
            'instructors_detail' => self::users($instructors),
            'students_detail' => self::users($students),
            'elements' => array_map(fn($e, $i) => [
                'id' => (int)$e['id'],
                'name' => 'Element ' . ($i + 1) . ': ' . $e['name'],
                'unit' => (int)$e['unit_id'],
            ], $elements, array_keys($elements)),
            'is_approved' => Helpers::bool($u['is_approved']),
            'registered_semester' => $registeredSemester,
            'credit_hours' => (int)($u['credit_hours'] ?? 45),
            'is_locked' => $isLocked,
            'theory_count' => $theory,
            'practical_count' => $practical,
            'oral_count' => $oral,
            'overall_progress' => $progress,
        ];
    }

    public static function unitsWhere(string $where, array $params, ?array $viewer = null): array {
        $stmt = App::db()->prepare("SELECT u.* FROM academic_unit u WHERE {$where} ORDER BY u.name");
        $stmt->execute($params);
        return array_map(fn($u) => self::unit($u, $viewer), $stmt->fetchAll());
    }

    public static function element(array $e): array {
        $els = App::db()->prepare('SELECT id, name FROM academic_element WHERE unit_id = ? ORDER BY id');
        $els->execute([(int)$e['unit_id']]);
        $all = $els->fetchAll();
        $index = 1;
        foreach ($all as $i => $row) {
            if ((int)$row['id'] === (int)$e['id']) {
                $index = $i + 1;
                break;
            }
        }
        return [
            'id' => (int)$e['id'],
            'name' => "Element {$index}: {$e['name']}",
            'unit' => (int)$e['unit_id'],
        ];
    }

    public static function registration(array $r): array {
        $student = self::lookup('users_user', (int)$r['student_id']);
        $unit = self::lookup('academic_unit', (int)$r['unit_id']);
        $sem = $r['semester_id'] ? self::lookup('academic_semester', (int)$r['semester_id']) : null;
        $course = ($unit && $unit['course_id']) ? self::lookup('academic_course', (int)$unit['course_id']) : null;
        return [
            'id' => (int)$r['id'],
            'student' => (int)$r['student_id'],
            'student_name' => $student ? Helpers::fullName($student) : '',
            'student_registration_number' => $student['registration_number'] ?? null,
            'unit' => (int)$r['unit_id'],
            'unit_code' => $unit['code'] ?? null,
            'unit_name' => $unit['name'] ?? null,
            'semester' => $r['semester_id'] ? (int)$r['semester_id'] : null,
            'semester_name' => $sem['name'] ?? null,
            'course_name' => $course['name'] ?? null,
            'status' => $r['status'],
            'status_display' => Helpers::$REG_STATUS[$r['status']] ?? $r['status'],
            'registered_at' => self::iso($r['registered_at'] ?? null),
            'approved_by' => $r['approved_by_id'] ? (int)$r['approved_by_id'] : null,
        ];
    }

    public static function gradingSystem(array $g): array {
        $course = self::lookup('academic_course', (int)$g['course_id']);
        $ranges = App::db()->prepare('SELECT * FROM academic_graderange WHERE grading_system_id = ? ORDER BY min_score DESC');
        $ranges->execute([(int)$g['id']]);
        return [
            'id' => (int)$g['id'],
            'name' => $g['name'],
            'course' => (int)$g['course_id'],
            'course_name' => $course['name'] ?? null,
            'ranges' => array_map(fn($r) => [
                'id' => (int)$r['id'],
                'grading_system' => (int)$r['grading_system_id'],
                'min_score' => (int)$r['min_score'],
                'max_score' => (int)$r['max_score'],
                'grade' => $r['grade'],
                'description' => $r['description'],
            ], $ranges->fetchAll()),
        ];
    }

    public static function mark(array $m): array {
        $student = self::lookup('users_user', (int)$m['student_id']);
        $unit = self::lookup('academic_unit', (int)$m['unit_id']);
        $sem = $m['semester_id'] ? self::lookup('academic_semester', (int)$m['semester_id']) : null;
        return [
            'id' => (int)$m['id'],
            'student' => (int)$m['student_id'],
            'student_name' => $student ? Helpers::fullName($student) : '',
            'unit' => (int)$m['unit_id'],
            'unit_code' => $unit['code'] ?? null,
            'unit_name' => $unit['name'] ?? null,
            'semester' => $m['semester_id'] ? (int)$m['semester_id'] : null,
            'semester_name' => $sem['name'] ?? null,
            'component_marks' => Helpers::jsonDecode($m['component_marks'], []),
            'total_score' => (float)$m['total_score'],
            'grade' => $m['grade'],
            'updated_at' => self::iso($m['updated_at'] ?? null),
        ];
    }

    public static function exam(array $e): array {
        $unit = self::lookup('academic_unit', (int)$e['unit_id']);
        $inst = self::lookup('users_user', (int)$e['instructor_id']);
        return [
            'id' => (int)$e['id'],
            'unit' => (int)$e['unit_id'],
            'unit_code' => $unit['code'] ?? null,
            'unit_name' => $unit['name'] ?? null,
            'unit_semester_id' => $unit['semester_id'] ? (int)$unit['semester_id'] : null,
            'instructor' => (int)$e['instructor_id'],
            'instructor_name' => $inst ? Helpers::fullName($inst) : null,
            'title' => $e['title'],
            'exam_paper' => App::mediaUrl($e['exam_paper']),
            'marking_scheme' => App::mediaUrl($e['marking_scheme'] ?? null),
            'uploaded_at' => self::iso($e['uploaded_at'] ?? null),
        ];
    }

    public static function onlineExam(array $e, bool $includeAnswers = false): array {
        $questions = Helpers::jsonDecode($e['questions'], []);
        if (!$includeAnswers) {
            $questions = array_map(function ($q) {
                unset($q['correct_option_index'], $q['correct_answer_text']);
                return $q;
            }, $questions);
        }
        $count = App::db()->prepare('SELECT COUNT(*) FROM academic_onlineexamattendance WHERE exam_id = ?');
        $count->execute([(int)$e['id']]);
        return [
            'id' => (int)$e['id'],
            'title' => $e['title'],
            'class_name' => $e['class_name'],
            'duration_minutes' => (int)$e['duration_minutes'],
            'is_active' => Helpers::bool($e['is_active']),
            'questions' => $questions,
            'created_at' => self::iso($e['created_at'] ?? null),
            'attendance_count' => (int)$count->fetchColumn(),
        ];
    }

    public static function attendance(array $a, ?array $exam = null): array {
        $exam = $exam ?: self::lookup('academic_onlineexam', (int)$a['exam_id']);
        return [
            'id' => (int)$a['id'],
            'exam' => (int)$a['exam_id'],
            'exam_title' => $exam['title'] ?? null,
            'exam_class' => $exam['class_name'] ?? null,
            'exam_duration' => isset($exam['duration_minutes']) ? (int)$exam['duration_minutes'] : null,
            'student_reg_no' => $a['student_reg_no'],
            'has_started' => Helpers::bool($a['has_started']),
            'started_at' => self::iso($a['started_at'] ?? null),
            'has_submitted' => Helpers::bool($a['has_submitted']),
            'submitted_at' => self::iso($a['submitted_at'] ?? null),
            'score' => $a['score'] !== null ? (float)$a['score'] : null,
            'answers' => Helpers::jsonDecode($a['answers'], []),
        ];
    }

    public static function certificate(array $c): array {
        $student = $c['student_id'] ? self::lookup('users_user', (int)$c['student_id']) : null;
        return [
            'id' => (int)$c['id'],
            'student' => $c['student_id'] ? (int)$c['student_id'] : null,
            'cert_ref_no' => $c['cert_ref_no'],
            'registration_no' => $c['registration_no'],
            'student_name' => $c['student_name'],
            'award_title' => $c['award_title'],
            'modules_covered' => Helpers::jsonDecode($c['modules_covered'], []),
            'date_earned' => $c['date_earned'],
            'print_date' => $c['print_date'],
            'qr_code_text' => $c['qr_code_text'],
            'created_at' => self::iso($c['created_at'] ?? null),
            'student_username' => $student['username'] ?? null,
            'student_display_name' => $student ? Helpers::fullName($student) : null,
        ];
    }

    public static function template(array $t): array {
        $out = $t;
        $out['id'] = (int)$t['id'];
        foreach (['logo_size', 'college_name_font_size', 'title_font_size', 'student_name_font_size', 'award_title_font_size', 'modules_font_size'] as $k) {
            if (isset($out[$k])) {
                $out[$k] = (int)$out[$k];
            }
        }
        if (isset($out['spacing_multiplier'])) {
            $out['spacing_multiplier'] = (float)$out['spacing_multiplier'];
        }
        return $out;
    }

    public static function portfolio(array $p, ?array $viewer = null, bool $detail = true): array {
        $learner = self::lookup('users_user', (int)$p['learner_id']);
        $unit = $p['unit_id'] ? self::lookup('academic_unit', (int)$p['unit_id']) : null;
        $element = $p['element_id'] ? self::lookup('academic_element', (int)$p['element_id']) : null;
        $verifier = $p['verifier_id'] ? self::lookup('users_user', (int)$p['verifier_id']) : null;
        $elementDisplay = null;
        $elementNumber = null;
        if ($unit && $element) {
            $els = App::db()->prepare('SELECT id FROM academic_element WHERE unit_id = ? ORDER BY id');
            $els->execute([(int)$unit['id']]);
            foreach ($els->fetchAll() as $i => $row) {
                if ((int)$row['id'] === (int)$element['id']) {
                    $elementNumber = $i + 1;
                    $elementDisplay = "Element {$elementNumber}: {$element['name']}";
                    break;
                }
            }
        } elseif ($element) {
            $elementDisplay = $element['name'];
        }

        $evSql = 'SELECT * FROM poe_core_evidence WHERE portfolio_id = ?';
        $evParams = [(int)$p['id']];
        if (!$viewer || !in_array($viewer['role'], ['STUDENT', 'INSTRUCTOR'], true)) {
            $evSql .= ' AND submission_round = ?';
            $evParams[] = (int)$p['submission_round'];
        }
        $evSql .= ' ORDER BY `order`, id';
        $evStmt = App::db()->prepare($evSql);
        $evStmt->execute($evParams);
        $evidence = array_map([self::class, 'evidence'], $evStmt->fetchAll());

        $assessment = null;
        $aStmt = App::db()->prepare('SELECT * FROM poe_core_assessment WHERE portfolio_id = ? LIMIT 1');
        $aStmt->execute([(int)$p['id']]);
        $aRow = $aStmt->fetch();
        if ($aRow) {
            $assessment = self::assessment($aRow);
        }

        $comments = [];
        $logs = [];
        if ($detail) {
            $cStmt = App::db()->prepare('SELECT * FROM poe_core_comment WHERE portfolio_id = ? ORDER BY created_at');
            $cStmt->execute([(int)$p['id']]);
            $comments = array_map([self::class, 'comment'], $cStmt->fetchAll());
            $lStmt = App::db()->prepare('SELECT * FROM poe_core_activitylog WHERE portfolio_id = ? ORDER BY timestamp DESC');
            $lStmt->execute([(int)$p['id']]);
            $logs = array_map([self::class, 'log'], $lStmt->fetchAll());
        }

        $plag = App::db()->prepare('SELECT COUNT(*) FROM poe_core_plagiarismflag f JOIN poe_core_evidence e ON e.id = f.evidence_id WHERE e.portfolio_id = ?');
        $plag->execute([(int)$p['id']]);

        return [
            'id' => (int)$p['id'],
            'title' => $p['title'],
            'description' => $p['description'],
            'learner' => (int)$p['learner_id'],
            'learner_display' => $learner ? (trim(($learner['first_name'] ?? '') . ' ' . ($learner['last_name'] ?? '')) ?: ($learner['username'] ?? 'Student')) : 'Student',
            'learner_registration_number' => $learner['registration_number'] ?? null,
            'unit' => $p['unit_id'] ? (int)$p['unit_id'] : null,
            'unit_display' => $unit ? (trim(($unit['code'] ?? '') . ' - ' . ($unit['name'] ?? '')) ?: ($unit['name'] ?? 'Unit')) : 'Unit',
            'element' => $p['element_id'] ? (int)$p['element_id'] : null,
            'element_display' => $elementDisplay,
            'element_number' => $elementNumber,
            'assessment_type' => $p['assessment_type'],
            'assessment_type_display' => Helpers::$ASSESSMENT_TYPES[$p['assessment_type']] ?? $p['assessment_type'],
            'status' => $p['status'],
            'submission_round' => (int)$p['submission_round'],
            'evidence' => $evidence,
            'evidence_count' => count($evidence),
            'assessment' => $assessment,
            'comments' => $comments,
            'verification_status' => $p['verification_status'],
            'verifier' => $p['verifier_id'] ? (int)$p['verifier_id'] : null,
            'verifier_name' => $verifier ? (trim(($verifier['first_name'] ?? '') . ' ' . ($verifier['last_name'] ?? '')) ?: ($verifier['username'] ?? null)) : null,
            'verified_at' => self::iso($p['verified_at'] ?? null),
            'verification_feedback' => $p['verification_feedback'],
            'logs' => $logs,
            'plagiarism_count' => (int)$plag->fetchColumn(),
            'created_at' => self::iso($p['created_at'] ?? null),
            'updated_at' => self::iso($p['updated_at'] ?? null),
        ];
    }

    public static function evidence(array $e): array {
        $flags = App::db()->prepare('SELECT * FROM poe_core_plagiarismflag WHERE evidence_id = ?');
        $flags->execute([(int)$e['id']]);
        $flagRows = [];
        foreach ($flags->fetchAll() as $f) {
            $dup = self::lookup('poe_core_evidence', (int)$f['duplicate_of_id']);
            $dupPort = $dup ? self::lookup('poe_core_portfolio', (int)$dup['portfolio_id']) : null;
            $dupLearner = $dupPort ? self::lookup('users_user', (int)$dupPort['learner_id']) : null;
            $flagRows[] = [
                'id' => (int)$f['id'],
                'evidence' => (int)$f['evidence_id'],
                'duplicate_of' => (int)$f['duplicate_of_id'],
                'duplicate_of_student' => $dupLearner['username'] ?? null,
                'duplicate_of_portfolio' => $dupPort['title'] ?? null,
                'duplicate_of_portfolio_id' => $dupPort ? (int)$dupPort['id'] : null,
                'duplicate_of_file_url' => $dup ? App::mediaUrl($dup['file']) : null,
                'created_at' => self::iso($f['created_at'] ?? null),
            ];
        }
        return [
            'id' => (int)$e['id'],
            'portfolio' => (int)$e['portfolio_id'],
            'file' => App::mediaUrl($e['file']),
            'description' => $e['description'],
            'uploaded_at' => self::iso($e['uploaded_at'] ?? null),
            'submission_round' => (int)$e['submission_round'],
            'file_hash' => $e['file_hash'],
            'plagiarism_flags' => $flagRows,
            'order' => (int)($e['order'] ?? 0),
        ];
    }

    public static function assessment(array $a): array {
        $assessor = self::lookup('users_user', (int)$a['assessor_id']);
        $scores = App::db()->prepare(
            'SELECT s.*, c.description, c.is_critical FROM poe_core_assessmentcriterionscore s
             JOIN academic_rubriccriterion c ON c.id = s.criterion_id WHERE s.assessment_id = ?'
        );
        $scores->execute([(int)$a['id']]);
        return [
            'id' => (int)$a['id'],
            'portfolio' => (int)$a['portfolio_id'],
            'assessor' => (int)$a['assessor_id'],
            'assessor_name' => $assessor ? Helpers::fullName($assessor) : null,
            'grade' => $a['grade'],
            'feedback' => $a['feedback'],
            'is_redo_request' => Helpers::bool($a['is_redo_request']),
            'date' => self::iso($a['date'] ?? null),
            'criterion_scores' => array_map(fn($s) => [
                'id' => (int)$s['id'],
                'assessment' => (int)$s['assessment_id'],
                'criterion' => (int)$s['criterion_id'],
                'criterion_description' => $s['description'],
                'is_critical' => Helpers::bool($s['is_critical']),
                'is_satisfied' => Helpers::bool($s['is_satisfied']),
            ], $scores->fetchAll()),
        ];
    }

    public static function comment(array $c): array {
        $user = self::lookup('users_user', (int)$c['user_id']);
        return [
            'id' => (int)$c['id'],
            'portfolio' => (int)$c['portfolio_id'],
            'user' => (int)$c['user_id'],
            'user_name' => $user['username'] ?? null,
            'user_role' => $user['role'] ?? null,
            'message' => $c['message'],
            'created_at' => self::iso($c['created_at'] ?? null),
        ];
    }

    public static function log(array $l): array {
        $user = self::lookup('users_user', (int)$l['user_id']);
        return [
            'id' => (int)$l['id'],
            'portfolio' => (int)$l['portfolio_id'],
            'user' => (int)$l['user_id'],
            'user_name' => $user['username'] ?? null,
            'user_role' => $user['role'] ?? null,
            'event_type' => $l['event_type'],
            'event_type_display' => Helpers::$LOG_EVENTS[$l['event_type']] ?? $l['event_type'],
            'description' => $l['description'],
            'timestamp' => self::iso($l['timestamp'] ?? null),
        ];
    }

    public static function notification(array $n): array {
        return [
            'id' => (int)$n['id'],
            'title' => $n['title'],
            'message' => $n['message'],
            'notification_type' => $n['notification_type'],
            'is_read' => Helpers::bool($n['is_read']),
            'target_url' => $n['target_url'],
            'action_text' => $n['action_text'],
            'created_at' => self::iso($n['created_at'] ?? null),
        ];
    }

    public static function lookup(string $table, int $id): ?array {
        static $cache = [];
        $key = $table . ':' . $id;
        if (!array_key_exists($key, $cache)) {
            $stmt = App::db()->prepare("SELECT * FROM {$table} WHERE id = ? LIMIT 1");
            $stmt->execute([$id]);
            $cache[$key] = $stmt->fetch() ?: null;
        }
        return $cache[$key];
    }

    public static function m2mUsers(string $table, string $fk, int $id): array {
        $stmt = App::db()->prepare("SELECT u.* FROM users_user u JOIN {$table} m ON m.user_id = u.id WHERE m.{$fk} = ? ORDER BY u.first_name, u.last_name, u.username");
        $stmt->execute([$id]);
        return $stmt->fetchAll();
    }

    public static function iso(?string $dt): ?string {
        if (!$dt) {
            return null;
        }
        return str_replace(' ', 'T', $dt);
    }
}
