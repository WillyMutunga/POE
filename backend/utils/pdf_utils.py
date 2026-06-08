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
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from io import BytesIO
    from academic.models import StudentMark

    buffer = BytesIO()
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
        alignment=0 # Left
    )

    # 1. Add Centered Headway Logo
    logo_path = os.path.join(os.path.dirname(__file__), 'logo1.png')
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=140, height=36)
        logo_img.hAlign = 'CENTER'
        elements.append(logo_img)
        elements.append(Spacer(1, 10))

    # 2. Add Headers
    elements.append(Paragraph("HEADWAY COLLEGE OF PROFESSIONAL STUDIES", school_title_style))
    term_upper = semester.name.upper()
    elements.append(Paragraph(f"{term_upper} EXAM RESULTS", subtitle_style))
    elements.append(Paragraph("OFFICIAL ACADEMIC TRANSCRIPT", doc_title_style))

    # 3. Student Details Grid Table
    student_name = f"{student.first_name} {student.last_name}".strip() or student.username
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
            Paragraph(f"<b>Year of Study:</b> {year_of_study}", normal_style),
            Paragraph(f"<b>Academic Year:</b> {academic_year}", normal_style)
        ]
    ]

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

    # 4. Results Grid Table
    results_data = [
        [
            Paragraph("COURSE CODE", header_style),
            Paragraph("COURSE TITLE", header_style),
            Paragraph("ACADEMIC HOURS", header_style),
            Paragraph("GRADE", header_style)
        ]
    ]

    for m in marks:
        results_data.append([
            Paragraph(m.unit.code, normal_style),
            Paragraph(m.unit.name, normal_style),
            Paragraph("45", normal_style),
            Paragraph(m.grade, normal_bold_style)
        ])

    # Calculate averages
    if marks.exists():
        term_avg = sum(m.total_score for m in marks) / len(marks)
    else:
        term_avg = 0.0

    all_marks = StudentMark.objects.filter(student=student)
    if all_marks.exists():
        cum_avg = sum(m.total_score for m in all_marks) / len(all_marks)
    else:
        cum_avg = 0.0

    # Append Average Rows
    results_data.append([
        Paragraph(f"<b>{term_upper} AVERAGE:</b>", normal_bold_style),
        Paragraph("", normal_style),
        Paragraph("", normal_style),
        Paragraph(f"<b>{term_avg:.2f}</b>", normal_bold_style)
    ])
    results_data.append([
        Paragraph("<b>CUMMULATIVE AVERAGE:</b>", normal_bold_style),
        Paragraph("", normal_style),
        Paragraph("", normal_style),
        Paragraph(f"<b>{cum_avg:.2f}</b>", normal_bold_style)
    ])

    results_table = Table(results_data, colWidths=[100, 260, 90, 50])
    results_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0000FE")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('SPAN', (0, -2), (2, -2)),
        ('SPAN', (0, -1), (2, -1)),
    ]))
    elements.append(results_table)
    elements.append(Spacer(1, 20))

    # 5. Legend section
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
