import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch
from django.conf import settings
import os

def generate_portfolio_pdf(portfolio, user=None):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        alignment=1, # Center
        spaceAfter=12,
        textColor=colors.HexColor("#0000FE")
    )
    
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=12,
        spaceAfter=6,
        textColor=colors.HexColor("#334155")
    )
    
    label_style = ParagraphStyle(
        'LabelStyle',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica-Bold',
        textColor=colors.gray
    )
    
    value_style = ParagraphStyle(
        'ValueStyle',
        parent=styles['Normal'],
        fontSize=11,
        fontName='Helvetica',
        textColor=colors.black
    )

    elements = []

    # Header / Title
    elements.append(Paragraph("STUDENT PORTFOLIO TRANSCRIPT", title_style))
    elements.append(Spacer(1, 0.2 * inch))

    # Student & Academic Details Table
    learner = portfolio.learner
    unit = portfolio.unit
    course = learner.course if hasattr(learner, 'course') else (unit.course if unit else None)
    
    details_data = [
        [Paragraph("<b>Full Name:</b>", label_style), Paragraph(f"{learner.first_name} {learner.last_name}" if learner.first_name else learner.username, value_style),
         Paragraph("<b>Reg Number:</b>", label_style), Paragraph(learner.registration_number or "N/A", value_style)],
        [Paragraph("<b>Course:</b>", label_style), Paragraph(course.name if course else "N/A", value_style),
         Paragraph("<b>Unit Code:</b>", label_style), Paragraph(unit.code if unit else "N/A", value_style)],
        [Paragraph("<b>Unit Name:</b>", label_style), Paragraph(unit.name if unit else "N/A", value_style),
         Paragraph("<b>Date Generated:</b>", label_style), Paragraph(portfolio.updated_at.strftime("%Y-%m-%d"), value_style)],
    ]
    
    details_table = Table(details_data, colWidths=[1.2*inch, 2*inch, 1.2*inch, 2*inch])
    details_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(details_table)
    elements.append(Spacer(1, 0.3 * inch))

    # Portfolio Info
    elements.append(Paragraph("Portfolio Overview", section_style))
    elements.append(Paragraph(f"<b>Title:</b> {portfolio.title}", styles['Normal']))
    elements.append(Paragraph(f"<b>Description:</b> {portfolio.description}", styles['Normal']))
    elements.append(Paragraph(f"<b>Status:</b> {portfolio.status}", styles['Normal']))
    elements.append(Spacer(1, 0.3 * inch))

    # Evidence Section
    elements.append(Paragraph("Submitted Evidence", section_style))
    
    if user and user.role in ['STUDENT', 'INSTRUCTOR']:
        evidences = portfolio.evidence.all()
    elif user:
        evidences = portfolio.evidence.filter(submission_round=portfolio.submission_round)
    else:
        evidences = portfolio.evidence.all()
        
    for evidence in evidences:
        elements.append(Paragraph(f"<b>Description:</b> {evidence.description}", styles['Normal']))
        
        file_path = evidence.file.path
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext in ['.jpg', '.jpeg', '.png', '.gif']:
            try:
                img = Image(file_path)
                # Resize image to fit width while maintaining aspect ratio
                max_width = 4.5 * inch
                aspect = img.drawHeight / img.drawWidth
                img.drawWidth = max_width
                img.drawHeight = max_width * aspect
                elements.append(img)
            except Exception as e:
                elements.append(Paragraph(f"[Error loading image: {str(e)}]", styles['Normal']))
        else:
            # For videos and other files, provide a link
            file_url = f"{settings.SITE_URL}{evidence.file.url}" if hasattr(settings, 'SITE_URL') else evidence.file.url
            link_text = f'<link href="{file_url}" color="blue"><u>{file_url}</u></link>'
            elements.append(Paragraph(f"<b>File Link:</b> {link_text}", styles['Normal']))
        
        elements.append(Spacer(1, 0.2 * inch))

    # Assessment Section
    if hasattr(portfolio, 'assessment'):
        assessment = portfolio.assessment
        elements.append(Paragraph("Assessment Results", section_style))
        
        assessment_data = [
            [Paragraph("<b>Grade:</b>", label_style), Paragraph(assessment.grade, value_style)],
            [Paragraph("<b>Feedback:</b>", label_style), Paragraph(assessment.feedback, value_style)],
            [Paragraph("<b>Assessor:</b>", label_style), Paragraph(assessment.assessor.get_full_name() or assessment.assessor.username, value_style)],
            [Paragraph("<b>Date:</b>", label_style), Paragraph(assessment.date.strftime("%Y-%m-%d"), value_style)],
        ]
        
        assessment_table = Table(assessment_data, colWidths=[1.2*inch, 5.2*inch])
        assessment_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke),
        ]))
        elements.append(assessment_table)

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
