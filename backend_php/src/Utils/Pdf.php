<?php
namespace App\Utils;

/**
 * Minimal PDF 1.4 writer (Helvetica) for table-style reports.
 */
class Pdf {
    private array $pages = [];
    private string $current = '';
    private int $y = 800;
    private string $title;
    private string $subtitle;

    public function __construct(string $title, string $subtitle = '') {
        $this->title = $title;
        $this->subtitle = $subtitle;
        $this->newPage();
        $this->text(50, 800, $title, 16, true);
        if ($subtitle) {
            $this->text(50, 780, $subtitle, 10);
            $this->y = 750;
        } else {
            $this->y = 770;
        }
    }

    public function addTable(array $headers, array $rows): void {
        $colW = 500 / max(count($headers), 1);
        $this->drawRow($headers, $colW, true);
        foreach ($rows as $row) {
            if ($this->y < 60) {
                $this->newPage();
                $this->y = 800;
                $this->drawRow($headers, $colW, true);
            }
            $this->drawRow($row, $colW, false);
        }
    }

    public function addParagraph(string $text): void {
        $this->text(50, $this->y, $text, 10);
        $this->y -= 16;
    }

    public function output(): string {
        $this->pages[] = $this->current;
        $n = count($this->pages);
        $objs = [];
        $objs[] = '<< /Type /Catalog /Pages 2 0 R >>';
        $kids = [];
        $contentIds = [];
        $objNum = 3;
        for ($i = 0; $i < $n; $i++) {
            $contentIds[] = $objNum + 1;
            $kids[] = $objNum . ' 0 R';
            $objNum += 2;
        }
        $objs[] = '<< /Type /Pages /Kids [' . implode(' ', $kids) . '] /Count ' . $n . ' >>';
        $fontId = $objNum;
        foreach ($this->pages as $i => $content) {
            $stream = "BT /F1 12 Tf\n" . $content . "ET";
            $pageId = 3 + $i * 2;
            $contentId = $pageId + 1;
            $objs[$pageId - 1] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents {$contentId} 0 R /Resources << /Font << /F1 {$fontId} 0 R >> >> >>";
            $objs[$contentId - 1] = '<< /Length ' . strlen($stream) . " >>\nstream\n{$stream}\nendstream";
        }
        $objs[$fontId - 1] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

        $out = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objs as $i => $body) {
            $offsets[$i + 1] = strlen($out);
            $out .= ($i + 1) . " 0 obj\n{$body}\nendobj\n";
        }
        $xref = strlen($out);
        $count = count($objs) + 1;
        $out .= "xref\n0 {$count}\n0000000000 65535 f \n";
        for ($i = 1; $i < $count; $i++) {
            $out .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }
        $out .= "trailer << /Size {$count} /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
        return $out;
    }

    public static function table(string $title, string $subtitle, array $headers, array $rows): string {
        $pdf = new self($title, $subtitle);
        $pdf->addTable($headers, $rows);
        return $pdf->output();
    }

    private function newPage(): void {
        if ($this->current !== '') {
            $this->pages[] = $this->current;
        }
        $this->current = '';
        $this->y = 800;
    }

    private function drawRow(array $cells, float $colW, bool $bold): void {
        $x = 50;
        foreach ($cells as $cell) {
            $this->text($x, $this->y, mb_substr((string)$cell, 0, 40), $bold ? 9 : 8, $bold);
            $x += $colW;
        }
        $this->y -= $bold ? 16 : 14;
    }

    private function text(float $x, float $y, string $text, int $size, bool $bold = false): void {
        $safe = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
        $this->current .= "/F1 {$size} Tf\n1 0 0 1 {$x} {$y} Tm ({$safe}) Tj\n";
    }
}
