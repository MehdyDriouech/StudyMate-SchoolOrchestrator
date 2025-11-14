<?php
/**
 * Sprint 18 - Service d'export PDF de curriculum
 * Génère un PDF du curriculum avec séquences et objectifs
 */

class CurriculumPDFExporter {
    private $curriculum;
    private $sequences;

    public function __construct($curriculum, $sequences) {
        $this->curriculum = $curriculum;
        $this->sequences = $sequences;
    }

    /**
     * Génère le contenu HTML du curriculum pour conversion PDF
     * @return string HTML
     */
    public function generateHTML() {
        $html = '<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>' . htmlspecialchars($this->curriculum['title']) . '</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
        }
        .meta-info {
            margin: 20px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
        }
        .meta-info p {
            margin: 5px 0;
        }
        .sequence {
            page-break-inside: avoid;
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .sequence h2 {
            color: #007bff;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
            margin-top: 0;
        }
        .sequence-meta {
            display: flex;
            gap: 20px;
            margin: 10px 0;
            font-size: 0.9em;
            color: #666;
        }
        .objectives {
            margin-top: 15px;
        }
        .objectives h3 {
            font-size: 1.1em;
            color: #555;
        }
        .objectives ul {
            list-style-type: disc;
            margin-left: 20px;
        }
        .objectives li {
            margin: 5px 0;
        }
        .progress-bar {
            height: 20px;
            background-color: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background-color: #28a745;
            text-align: center;
            color: white;
            line-height: 20px;
            font-size: 0.8em;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 0.9em;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
    </style>
</head>
<body>';

        // Header
        $html .= '<div class="header">';
        $html .= '<h1>' . htmlspecialchars($this->curriculum['title']) . '</h1>';
        $html .= '<p>' . htmlspecialchars($this->curriculum['class_name'] ?? '') . '</p>';
        $html .= '</div>';

        // Meta info
        $html .= '<div class="meta-info">';
        $html .= '<p><strong>Année scolaire :</strong> ' . $this->curriculum['year_start'] . ' - ' . $this->curriculum['year_end'] . '</p>';
        if (!empty($this->curriculum['level'])) {
            $html .= '<p><strong>Niveau :</strong> ' . htmlspecialchars($this->curriculum['level']) . '</p>';
        }
        $html .= '<p><strong>Enseignant :</strong> ' . htmlspecialchars($this->curriculum['teacher_firstname'] . ' ' . $this->curriculum['teacher_lastname']) . '</p>';
        if (!empty($this->curriculum['description'])) {
            $html .= '<p><strong>Description :</strong> ' . nl2br(htmlspecialchars($this->curriculum['description'])) . '</p>';
        }
        $html .= '<p><strong>Nombre de séquences :</strong> ' . count($this->sequences) . '</p>';
        $html .= '</div>';

        // Séquences
        foreach ($this->sequences as $sequence) {
            $html .= $this->renderSequence($sequence);
        }

        // Footer
        $html .= '<div class="footer">';
        $html .= '<p>Document généré le ' . date('d/m/Y à H:i') . '</p>';
        $html .= '<p>StudyMate School Orchestrator - Curriculum Builder</p>';
        $html .= '</div>';

        $html .= '</body></html>';

        return $html;
    }

    /**
     * Génère le HTML d'une séquence
     */
    private function renderSequence($sequence) {
        $html = '<div class="sequence">';
        $html .= '<h2>Séquence ' . $sequence['position'] . ' : ' . htmlspecialchars($sequence['label']) . '</h2>';

        // Meta
        $html .= '<div class="sequence-meta">';
        if (!empty($sequence['duration_weeks'])) {
            $html .= '<span><strong>Durée :</strong> ' . $sequence['duration_weeks'] . ' semaines</span>';
        }
        if (!empty($sequence['start_date'])) {
            $html .= '<span><strong>Début :</strong> ' . date('d/m/Y', strtotime($sequence['start_date'])) . '</span>';
        }
        if (!empty($sequence['end_date'])) {
            $html .= '<span><strong>Fin :</strong> ' . date('d/m/Y', strtotime($sequence['end_date'])) . '</span>';
        }
        $html .= '</div>';

        // Description
        if (!empty($sequence['description'])) {
            $html .= '<p>' . nl2br(htmlspecialchars($sequence['description'])) . '</p>';
        }

        // Progress bar
        $completion = floatval($sequence['completion_percent'] ?? 0);
        $html .= '<div class="progress-bar">';
        $html .= '<div class="progress-fill" style="width: ' . $completion . '%">' . number_format($completion, 1) . '%</div>';
        $html .= '</div>';

        // Objectifs
        $objectives = json_decode($sequence['objectives'] ?? '[]', true);
        if (!empty($objectives) && is_array($objectives)) {
            $html .= '<div class="objectives">';
            $html .= '<h3>Objectifs pédagogiques :</h3>';
            $html .= '<ul>';
            foreach ($objectives as $obj) {
                $label = is_array($obj) ? ($obj['label'] ?? $obj['id'] ?? '') : $obj;
                $html .= '<li>' . htmlspecialchars($label) . '</li>';
            }
            $html .= '</ul>';
            $html .= '</div>';
        }

        // Compétences
        $skills = json_decode($sequence['skills'] ?? '[]', true);
        if (!empty($skills) && is_array($skills)) {
            $html .= '<div class="objectives">';
            $html .= '<h3>Compétences visées :</h3>';
            $html .= '<p>' . implode(', ', array_map('htmlspecialchars', $skills)) . '</p>';
            $html .= '</div>';
        }

        // Ressources liées
        $assignmentCount = $sequence['assignment_count'] ?? 0;
        $themeCount = $sequence['theme_count'] ?? 0;
        if ($assignmentCount > 0 || $themeCount > 0) {
            $html .= '<p style="margin-top: 15px; font-size: 0.9em; color: #666;">';
            if ($assignmentCount > 0) {
                $html .= '<strong>' . $assignmentCount . '</strong> mission(s) liée(s) • ';
            }
            if ($themeCount > 0) {
                $html .= '<strong>' . $themeCount . '</strong> thème(s) lié(s)';
            }
            $html .= '</p>';
        }

        $html .= '</div>';

        return $html;
    }

    /**
     * Génère le PDF (nécessite une bibliothèque comme TCPDF, mPDF ou Dompdf)
     * Pour une implémentation simple, on retourne le HTML
     * En production, utiliser une lib PDF
     */
    public function export() {
        // Version simple: retourner HTML pour impression navigateur
        return $this->generateHTML();

        // Avec une lib PDF (exemple avec TCPDF) :
        /*
        require_once(__DIR__ . '/../vendor/autoload.php');

        $pdf = new TCPDF();
        $pdf->AddPage();
        $pdf->writeHTML($this->generateHTML());

        return $pdf->Output('curriculum.pdf', 'S'); // 'S' = retourner comme string
        */
    }

    /**
     * Télécharge le PDF directement
     */
    public function download($filename = 'curriculum.pdf') {
        $html = $this->generateHTML();

        header('Content-Type: text/html; charset=utf-8');
        header('Content-Disposition: inline; filename="' . $filename . '.html"');

        echo $html;
        exit;
    }
}
