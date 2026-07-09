from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO

def generate_pdf_report(title, subtitle, headers, data, filename):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#1e3a8a"),
        alignment=1, # Center
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.gray,
        alignment=1,
        spaceAfter=30
    )
    
    # Add Title and Subtitle
    elements.append(Paragraph(title, title_style))
    elements.append(Paragraph(subtitle, subtitle_style))
    
    # Prepare Table Data with Paragraphs for wrapping
    cell_style = ParagraphStyle(
        'CellStyle',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        alignment=0, # Left align for readability in multiline
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.whitesmoke,
        fontName='Helvetica-Bold',
        alignment=1, # Center
    )

    formatted_data = []
    # Process Headers
    formatted_data.append([Paragraph(h, header_style) for h in headers])
    
    # Process Rows
    for row in data:
        formatted_row = []
        for cell in row:
            formatted_row.append(Paragraph(str(cell), cell_style))
        formatted_data.append(formatted_row)
    
    # Create Table
    col_count = len(headers)
    available_width = A4[0] - 60
    
    # Custom column width logic: Give more space to curriculum columns
    if col_count == 4: # Typically Name, Email, Courses, Units
        col_widths = [available_width * 0.15, available_width * 0.25, available_width * 0.25, available_width * 0.35]
    elif col_count == 5: # Typically Students: RegNo, Name, Course, Semester, Intake
        col_widths = [available_width * 0.15, available_width * 0.25, available_width * 0.25, available_width * 0.20, available_width * 0.15]
    else:
        col_widths = [available_width / col_count] * col_count
    
    table = Table(formatted_data, colWidths=col_widths)
    
    # Style Table
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ])
    table.setStyle(style)
    
    elements.append(table)
    
    # Build PDF
    doc.build(elements)
    
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

def generate_comprehensive_pdf_report(school_name, course_name, semesters_data, filename):
    import os
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = []
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    school_style = ParagraphStyle(
        'SchoolStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#475569"), # Slate-600
        alignment=1, # Center
        spaceAfter=4
    )
    
    course_style = ParagraphStyle(
        'CourseStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#1e3a8a"), # Navy Blue
        alignment=1, # Center
        spaceAfter=6
    )
    
    doc_title_style = ParagraphStyle(
        'DocTitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b"), # Gray-500
        alignment=1, # Center
        spaceAfter=15
    )
    
    semester_style = ParagraphStyle(
        'SemesterStyle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.white,
        backColor=colors.HexColor("#1e3a8a"),
        borderPadding=6,
        spaceBefore=14,
        spaceAfter=10,
        keepWithNext=True
    )
    
    unit_style = ParagraphStyle(
        'UnitStyle',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    
    element_style = ParagraphStyle(
        'ElementStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
        leftIndent=20,
        firstLineIndent=-10,
        spaceAfter=3
    )
    
    no_element_style = ParagraphStyle(
        'NoElementStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b"),
        leftIndent=20,
        spaceAfter=3
    )
    
    # Add Logo
    logo_path = os.path.join(os.path.dirname(__file__), 'logo1.png')
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=140, height=36)
        logo_img.hAlign = 'CENTER'
        elements.append(logo_img)
        elements.append(Spacer(1, 12))
        
    # Add Header Text
    elements.append(Paragraph(school_name.upper(), school_style))
    elements.append(Paragraph(course_name, course_style))
    elements.append(Paragraph("Comprehensive Curriculum Map (Modules, Units, & Elements)", doc_title_style))
    elements.append(Spacer(1, 10))
    
    # Render Semesters, Units, and Elements
    for sem in semesters_data:
        elements.append(Paragraph(sem['semester_name'].upper(), semester_style))
        
        for unit in sem['units']:
            unit_header = f"<b>{unit['code']}</b> — {unit['name']}"
            elements.append(Paragraph(unit_header, unit_style))
            
            if not unit['elements']:
                elements.append(Paragraph("• No elements defined for this unit", no_element_style))
            else:
                for idx, el_name in enumerate(unit['elements'], 1):
                    bullet_text = f"• <b>Element {idx}:</b> {el_name}"
                    elements.append(Paragraph(bullet_text, element_style))
            
            elements.append(Spacer(1, 4))
            
    # Build PDF
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

def generate_provisional_results_pdf(student, semester, marks, legend_data):
    import os
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from io import BytesIO
    from academic.models import StudentMark

    # Helper function to look up grade from legend ranges
    def get_grade_for_percentage(percentage, legend):
        for entry in legend:
            try:
                min_val = float(entry.get('min', 0))
                max_val = float(entry.get('max', 100))
                if min_val <= percentage <= max_val:
                    return entry.get('grade', 'NYC')
            except (ValueError, TypeError):
                continue
        # Fallback if not found in criteria
        if percentage >= 80: return "AM"
        if percentage >= 50: return "M"
        return "NYC"

    def format_score(score):
        try:
            val = float(score)
            if val.is_integer():
                return f"{int(val)}"
            return f"{val:.1f}"
        except (ValueError, TypeError):
            return str(score)

    # 1. Determine orientation dynamically based on number of columns
    max_cams = 0
    max_pracs = 0
    for m in marks:
        components = m.unit.mark_components.all().order_by('id')
        cams_list = []
        pracs_list = []
        for comp in components:
            name_lower = comp.name.lower()
            if 'prac' in name_lower or 'practical' in name_lower or 'oral' in name_lower:
                pracs_list.append(comp)
            else:
                cams_list.append(comp)
        if len(cams_list) > max_cams:
            max_cams = len(cams_list)
        if len(pracs_list) > max_pracs:
            max_pracs = len(pracs_list)

    if max_cams == 0:
        max_cams = 1
    if max_pracs == 0:
        max_pracs = 1

    Total_cols = 7 + max_cams + max_pracs
    is_landscape = Total_cols > 6  # Wide table layout

    buffer = BytesIO()
    if is_landscape:
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    else:
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        
    elements = []
    styles = getSampleStyleSheet()

    # Custom styles
    school_title_style = ParagraphStyle(
        'SchoolTitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#0000FE"), # Headway Blue
        alignment=1, # Center
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#475569"),
        alignment=1, # Center
        spaceAfter=4
    )

    doc_title_style = ParagraphStyle(
        'DocTitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        alignment=1, # Center
        spaceAfter=15
    )

    normal_bold_style = ParagraphStyle(
        'NormalBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#1e293b")
    )

    normal_style = ParagraphStyle(
        'NormalStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#1e293b")
    )

    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white,
        alignment=1 # Center
    )

    # 2. Add Centered Headway Logo
    logo_path = os.path.join(os.path.dirname(__file__), 'logo1.png')
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=140, height=36)
        logo_img.hAlign = 'CENTER'
        elements.append(logo_img)
        elements.append(Spacer(1, 10))

    # 3. Add Headers
    elements.append(Paragraph("HEADWAY COLLEGE OF PROFESSIONAL STUDIES", school_title_style))
    term_upper = semester.name.upper()
    elements.append(Paragraph(f"{term_upper} EXAM RESULTS", subtitle_style))
    elements.append(Paragraph("OFFICIAL ACADEMIC TRANSCRIPT", doc_title_style))

    # 4. Student Details Grid Table
    student_name = student.get_full_name()
    year_of_study = semester.name
    
    from django.utils import timezone
    current_year = timezone.now().year
    academic_year = f"{current_year-1}/{current_year}" if timezone.now().month < 9 else f"{current_year}/{current_year+1}"

    details_data = [
        [
            Paragraph(f"<b>Reg. Number:</b> {student.registration_number or 'N/A'}", normal_style),
            Paragraph(f"<b>Name:</b> {student_name.upper()}", normal_style)
        ],
        [
            Paragraph(f"<b>CDACC Reg. Number:</b> {student.cdacc_registration_number or 'N/A'}", normal_style),
            Paragraph(f"<b>Academic Year:</b> {academic_year}", normal_style)
        ],
        [
            Paragraph(f"<b>Year of Study:</b> {year_of_study}", normal_style),
            Paragraph("", normal_style)
        ]
    ]

    if is_landscape:
        details_table = Table(details_data, colWidths=[370, 370])
    else:
        details_table = Table(details_data, colWidths=[250, 250])

    details_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('LINEBELOW', (0, -1), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ]))
    elements.append(details_table)
    elements.append(Spacer(1, 15))

    # 5. Results Grid Table Setup
    # Row 0: General labels & grouped header labels
    header_row_0 = [
        Paragraph("S/N", header_style),
        Paragraph("UNIT CODE", header_style),
        Paragraph("UNIT TITLE", header_style),
    ]
    # CAM components span label
    header_row_0.append(Paragraph("CAM COMPONENTS", header_style))
    for _ in range(max_cams - 1):
        header_row_0.append(Paragraph("", header_style))
    header_row_0.append(Paragraph("CT", header_style))
    header_row_0.append(Paragraph("CR", header_style))
    # Practical components span label
    header_row_0.append(Paragraph("PRACTICAL COMPONENTS", header_style))
    for _ in range(max_pracs - 1):
        header_row_0.append(Paragraph("", header_style))
    header_row_0.append(Paragraph("CP", header_style))
    header_row_0.append(Paragraph("CR", header_style))

    # Row 1: Sub-column names (specific components)
    header_row_1 = [
        Paragraph("", header_style),
        Paragraph("", header_style),
        Paragraph("", header_style),
    ]
    # CAM sub-column names
    for i in range(max_cams):
        header_row_1.append(Paragraph(f"CAM {i+1}", header_style))
    header_row_1.append(Paragraph("", header_style))
    header_row_1.append(Paragraph("", header_style))
    # Practical sub-column names
    for i in range(max_pracs):
        header_row_1.append(Paragraph(f"PRAC {i+1}", header_style))
    header_row_1.append(Paragraph("", header_style))
    header_row_1.append(Paragraph("", header_style))

    results_data = [header_row_0, header_row_1]

    # Spanning rules for header rows
    table_spans = [
        ('SPAN', (0, 0), (0, 1)), # S/N
        ('SPAN', (1, 0), (1, 1)), # Unit Code
        ('SPAN', (2, 0), (2, 1)), # Unit Title
        ('SPAN', (3, 0), (3 + max_cams - 1, 0)), # CAM components span
        ('SPAN', (3 + max_cams, 0), (3 + max_cams, 1)), # CT span
        ('SPAN', (4 + max_cams, 0), (4 + max_cams, 1)), # CAM CR span
        ('SPAN', (5 + max_cams, 0), (5 + max_cams + max_pracs - 1, 0)), # PRAC components span
        ('SPAN', (5 + max_cams + max_pracs, 0), (5 + max_cams + max_pracs, 1)), # CP span
        ('SPAN', (6 + max_cams + max_pracs, 0), (6 + max_cams + max_pracs, 1)), # PRAC CR span
    ]

    # Populating data rows
    cam_term_scores = []
    prac_term_scores = []
    
    for idx, m in enumerate(marks):
        row = [
            Paragraph(str(idx + 1), normal_style),
            Paragraph(m.unit.code, normal_style),
            Paragraph(m.unit.name, normal_style),
        ]
        
        components = m.unit.mark_components.all().order_by('id')
        cams_list = []
        pracs_list = []
        for comp in components:
            name_lower = comp.name.lower()
            if 'prac' in name_lower or 'practical' in name_lower or 'oral' in name_lower:
                pracs_list.append(comp)
            else:
                cams_list.append(comp)

        # 1. Fill CAM scores
        cam_pcts = []
        for i in range(max_cams):
            if i < len(cams_list):
                comp = cams_list[i]
                score = m.component_marks.get(str(comp.id)) or m.component_marks.get(comp.name) or m.component_marks.get(comp.name.upper())
                if score is not None:
                    try:
                        score_val = float(score)
                        pct = (score_val / comp.weight) * 100.0 if comp.weight > 0 else 0.0
        # 1. Fill CAM scores
        cam_pcts = []
        for i in range(max_cams):
            if i < len(cams_list):
                comp = cams_list[i]
                score = m.component_marks.get(str(comp.id)) or m.component_marks.get(comp.name) or m.component_marks.get(comp.name.upper())
                if score is not None:
                    try:
                        score_val = float(score)
                        pct = (score_val / comp.weight) * 100.0 if comp.weight > 0 else 0.0
                        cam_pcts.append(pct)
                        row.append(Paragraph(f"<font size='7'>{format_score(score_val)}/{comp.weight}</font>", normal_style))
                    except ValueError:
                        row.append(Paragraph(f"<font size='7'>{score}</font>", normal_style))
                else:
                    row.append(Paragraph(f"<font size='7'>-/{comp.weight}</font>", normal_style))
            else:
                row.append(Paragraph("", normal_style))

        # Combined CAM total (CT) & rating
        if cam_pcts:
            ct_pct = sum(cam_pcts) / len(cam_pcts)
            cam_term_scores.append(ct_pct)
            row.append(Paragraph(f"<font size='7'><b>{ct_pct:.1f}%</b></font>", normal_bold_style))
            row.append(Paragraph(f"<font size='7'><b>{get_grade_for_percentage(ct_pct, legend_data)}</b></font>", normal_bold_style))
        else:
            row.append(Paragraph("<font size='7'>-</font>", normal_style))
            row.append(Paragraph("<font size='7'>-</font>", normal_style))

        # 2. Fill Practical scores
        prac_pcts = []
        for i in range(max_pracs):
            if i < len(pracs_list):
                comp = pracs_list[i]
                score = m.component_marks.get(str(comp.id)) or m.component_marks.get(comp.name) or m.component_marks.get(comp.name.upper())
                if score is not None:
                    try:
                        score_val = float(score)
                        pct = (score_val / comp.weight) * 100.0 if comp.weight > 0 else 0.0
                        prac_pcts.append(pct)
                        row.append(Paragraph(f"<font size='7'>{format_score(score_val)}/{comp.weight}</font>", normal_style))
                    except ValueError:
                        row.append(Paragraph(f"<font size='7'>{score}</font>", normal_style))
                else:
                    row.append(Paragraph(f"<font size='7'>-/{comp.weight}</font>", normal_style))
            else:
                row.append(Paragraph("", normal_style))

        # Combined Practical total (CP) & rating
        if prac_pcts:
            cp_pct = sum(prac_pcts) / len(prac_pcts)
            prac_term_scores.append(cp_pct)
            row.append(Paragraph(f"<font size='7'><b>{cp_pct:.1f}%</b></font>", normal_bold_style))
            row.append(Paragraph(f"<font size='7'><b>{get_grade_for_percentage(cp_pct, legend_data)}</b></font>", normal_bold_style))
        else:
            row.append(Paragraph("<font size='7'>-</font>", normal_style))
            row.append(Paragraph("<font size='7'>-</font>", normal_style))

        results_data.append(row)

    # Calculate averages
    term_cam_avg = sum(cam_term_scores) / len(cam_term_scores) if cam_term_scores else 0.0
    term_prac_avg = sum(prac_term_scores) / len(prac_term_scores) if prac_term_scores else 0.0

    if marks.exists():
        term_avg = sum(m.total_score for m in marks) / len(marks)
    else:
        term_avg = 0.0

    all_marks = StudentMark.objects.filter(student=student)
    if all_marks.exists():
        cum_avg = sum(m.total_score for m in all_marks) / len(all_marks)
    else:
        cum_avg = 0.0

    # 1. CAM & Practical Averages Row
    averages_row = [Paragraph(f"<b>{term_upper} AVERAGES:</b>", normal_bold_style)]
    for _ in range(2 + max_cams):
        averages_row.append(Paragraph("", normal_style))
    averages_row.append(Paragraph(f"<b>{term_cam_avg:.1f}%</b>", normal_bold_style))
    averages_row.append(Paragraph(f"<b>{get_grade_for_percentage(term_cam_avg, legend_data)}</b>", normal_bold_style))
    for _ in range(max_pracs):
        averages_row.append(Paragraph("", normal_style))
    averages_row.append(Paragraph(f"<b>{term_prac_avg:.1f}%</b>", normal_bold_style))
    averages_row.append(Paragraph(f"<b>{get_grade_for_percentage(term_prac_avg, legend_data)}</b>", normal_bold_style))
    results_data.append(averages_row)

    # 2. Overall Semester Average Row
    term_avg_row = [Paragraph(f"<b>OVERALL {term_upper} AVERAGE:</b>", normal_bold_style)]
    for _ in range(Total_cols - 2):
        term_avg_row.append(Paragraph("", normal_style))
    term_avg_row.append(Paragraph(f"<b>{term_avg:.2f}%</b>", normal_bold_style))
    results_data.append(term_avg_row)

    # 3. Cumulative Average Row
    cum_avg_row = [Paragraph("<b>CUMULATIVE AVERAGE:</b>", normal_bold_style)]
    for _ in range(Total_cols - 2):
        cum_avg_row.append(Paragraph("", normal_style))
    cum_avg_row.append(Paragraph(f"<b>{cum_avg:.2f}%</b>", normal_bold_style))
    results_data.append(cum_avg_row)

    # Add summary rows spans
    # -3 is averages_row
    # -2 is term_avg_row
    # -1 is cum_avg_row
    table_spans.extend([
        ('SPAN', (0, -3), (2 + max_cams, -3)),
        ('SPAN', (5 + max_cams, -3), (4 + max_cams + max_pracs, -3)),
        ('SPAN', (0, -2), (Total_cols - 2, -2)),
        ('SPAN', (0, -1), (Total_cols - 2, -1)),
    ])

    # Column Widths Budgeting
    if is_landscape:
        rem_width = 760 - (25 + 65 + 140 + 35 + 30 + 35 + 30) # remaining 400 pts
        col_w = rem_width / (max_cams + max_pracs)
        col_widths = [25, 65, 140] + [col_w] * max_cams + [35, 30] + [col_w] * max_pracs + [35, 30]
    else:
        rem_width = 515 - (20 + 55 + 100 + 30 + 25 + 30 + 25) # remaining 230 pts
        col_w = rem_width / (max_cams + max_pracs)
        col_widths = [20, 55, 100] + [col_w] * max_cams + [30, 25] + [col_w] * max_pracs + [30, 25]

    results_table = Table(results_data, colWidths=col_widths)
    
    results_style = [
        ('BACKGROUND', (0, 0), (-1, 1), colors.HexColor("#0000FE")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (2, 2), (2, -4), 'LEFT'), # Left-align unit titles
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
    ]
    results_style.extend(table_spans)
    results_table.setStyle(TableStyle(results_style))
    
    elements.append(results_table)
    elements.append(Spacer(1, 20))

    # 6. Legend section
    legend_cells = []
    for entry in legend_data:
        range_str = f"{entry['min']}%-{entry['max']}%"
        legend_cells.append(Paragraph(f"<b>{range_str}</b>", normal_style))
        legend_cells.append(Paragraph(f"<b>{entry['grade']}</b>", normal_bold_style))
        legend_cells.append(Paragraph(entry['desc'], normal_style))

    legend_grid_data = []
    for i in range(0, len(legend_cells), 3):
        if i + 2 < len(legend_cells):
            legend_grid_data.append([
                legend_cells[i],
                legend_cells[i+1],
                legend_cells[i+2]
            ])

    if is_landscape:
        legend_grid_table = Table(legend_grid_data, colWidths=[100, 60, 250])
    else:
        legend_grid_table = Table(legend_grid_data, colWidths=[80, 50, 150])

    legend_grid_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))

    parent_legend_data = [
        [
            Paragraph("<b>Legend :</b>", normal_bold_style),
            legend_grid_table
        ]
    ]

    if is_landscape:
        parent_legend_table = Table(parent_legend_data, colWidths=[80, 680])
    else:
        parent_legend_table = Table(parent_legend_data, colWidths=[60, 440])

    parent_legend_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))

    elements.append(parent_legend_table)

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
