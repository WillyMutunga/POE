import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether
from reportlab.lib.units import inch
from django.conf import settings
import os

def generate_portfolio_pdf(portfolio, user=None):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=54, leftMargin=54, topMargin=36, bottomMargin=18)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=1, # Center
        spaceAfter=6,
        textColor=colors.HexColor("#0000FE")
    )
    
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontSize=12,
        spaceBefore=8,
        spaceAfter=3,
        textColor=colors.HexColor("#334155")
    )
    
    label_style = ParagraphStyle(
        'LabelStyle',
        parent=styles['Normal'],
        fontSize=9,
        fontName='Helvetica-Bold',
        textColor=colors.gray
    )
    
    value_style = ParagraphStyle(
        'ValueStyle',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica',
        textColor=colors.black
    )

    elements = []

    # Header / Title
    elements.append(Paragraph("STUDENT PORTFOLIO TRANSCRIPT", title_style))
    elements.append(Spacer(1, 0.05 * inch))

    # Student & Academic Details Table
    learner = portfolio.learner
    unit = portfolio.unit
    course = learner.course if hasattr(learner, 'course') else (unit.course if unit else None)
    
    details_data = [
        [Paragraph("<b>Full Name:</b>", label_style), Paragraph(learner.get_full_name(), value_style),
         Paragraph("<b>Reg Number:</b>", label_style), Paragraph(learner.registration_number or "N/A", value_style)],
        [Paragraph("<b>Course:</b>", label_style), Paragraph(course.name if course else "N/A", value_style),
         Paragraph("<b>CDACC Reg No:</b>", label_style), Paragraph(learner.cdacc_registration_number or "N/A", value_style)],
        [Paragraph("<b>Module:</b>", label_style), Paragraph(learner.semester.name if (hasattr(learner, 'semester') and learner.semester) else "N/A", value_style),
         Paragraph("<b>Unit Code:</b>", label_style), Paragraph(unit.code if unit else "N/A", value_style)],
        [Paragraph("<b>Unit Name:</b>", label_style), Paragraph(unit.name if unit else "N/A", value_style),
         Paragraph("<b>Date Generated:</b>", label_style), Paragraph(portfolio.updated_at.strftime("%Y-%m-%d"), value_style)],
    ]
    
    details_table = Table(details_data, colWidths=[1.2*inch, 2*inch, 1.2*inch, 2*inch])
    details_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(details_table)
    elements.append(Spacer(1, 0.1 * inch))

    # Portfolio Info
    elements.append(Paragraph("Portfolio Overview", section_style))
    elements.append(Paragraph(f"<b>Title:</b> {portfolio.title} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Status:</b> {portfolio.status}", styles['Normal']))
    elements.append(Paragraph(f"<b>Description:</b> {portfolio.description}", styles['Normal']))
    elements.append(Spacer(1, 0.1 * inch))

    # Evidence Section
    elements.append(Paragraph("Submitted Evidence", section_style))
    
    if user and user.role in ['STUDENT', 'INSTRUCTOR']:
        evidences = portfolio.evidence.all()
    elif user:
        evidences = portfolio.evidence.filter(submission_round=portfolio.submission_round)
    else:
        evidences = portfolio.evidence.all()
        
    if len(evidences) > 1:
        cells = []
        for evidence in evidences:
            cell_elements = []
            desc_style = ParagraphStyle(
                'EvidenceDescStyle',
                parent=styles['Normal'],
                fontSize=9,
                leading=11,
                spaceAfter=4
            )
            cell_elements.append(Paragraph(f"<b>Description:</b> {evidence.description}", desc_style))
            
            file_path = evidence.file.path
            ext = os.path.splitext(file_path)[1].lower()
            
            if ext in ['.jpg', '.jpeg', '.png', '.gif']:
                try:
                    img = Image(file_path)
                    # Resize to fit in a 2-column grid cell: max_w = 3.0*inch, max_h = 1.5*inch
                    max_w = 3.0 * inch
                    max_h = 1.5 * inch
                    aspect = img.drawHeight / img.drawWidth
                    
                    if aspect > 1: # Portrait
                        img.drawHeight = max_h
                        img.drawWidth = max_h / aspect
                        if img.drawWidth > max_w:
                            img.drawWidth = max_w
                            img.drawHeight = max_w * aspect
                    else: # Landscape
                        img.drawWidth = max_w
                        img.drawHeight = max_w * aspect
                        if img.drawHeight > max_h:
                            img.drawHeight = max_h
                            img.drawWidth = max_h / aspect
                            
                    cell_elements.append(img)
                except Exception as e:
                    cell_elements.append(Paragraph(f"[Error loading image: {str(e)}]", styles['Normal']))
            else:
                file_url = f"{settings.SITE_URL}{evidence.file.url}" if hasattr(settings, 'SITE_URL') else evidence.file.url
                link_text = f'<link href="{file_url}" color="blue"><u>{file_url}</u></link>'
                cell_elements.append(Paragraph(f"<b>File Link:</b> {link_text}", styles['Normal']))
            
            cells.append(cell_elements)
            
        # Group cells into rows of 2
        grid_data = []
        row = []
        for cell in cells:
            row.append(cell)
            if len(row) == 2:
                grid_data.append(row)
                row = []
        if row:
            row.append([]) # Empty cell
            grid_data.append(row)
            
        evidence_table = Table(grid_data, colWidths=[3.3 * inch, 3.3 * inch])
        evidence_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(evidence_table)
    else:
        # Just 1 evidence, or 0. Render it in single column layout
        for evidence in evidences:
            elements.append(Paragraph(f"<b>Description:</b> {evidence.description}", styles['Normal']))
            
            file_path = evidence.file.path
            ext = os.path.splitext(file_path)[1].lower()
            
            if ext in ['.jpg', '.jpeg', '.png', '.gif']:
                try:
                    img = Image(file_path)
                    max_width = 4.0 * inch
                    max_height = 2.2 * inch
                    aspect = img.drawHeight / img.drawWidth
                    img.drawWidth = max_width
                    img.drawHeight = max_width * aspect
                    if img.drawHeight > max_height:
                        img.drawHeight = max_height
                        img.drawWidth = max_height / aspect
                    elements.append(img)
                except Exception as e:
                    elements.append(Paragraph(f"[Error loading image: {str(e)}]", styles['Normal']))
            else:
                file_url = f"{settings.SITE_URL}{evidence.file.url}" if hasattr(settings, 'SITE_URL') else evidence.file.url
                link_text = f'<link href="{file_url}" color="blue"><u>{file_url}</u></link>'
                elements.append(Paragraph(f"<b>File Link:</b> {link_text}", styles['Normal']))
            
            elements.append(Spacer(1, 0.05 * inch))

    # Assessment Section
    if hasattr(portfolio, 'assessment'):
        assessment = portfolio.assessment
        
        assessment_elements = []
        assessment_elements.append(Paragraph("Assessment Results", section_style))
        assessment_elements.append(Spacer(1, 0.05 * inch))
        
        assessment_data = [
            [Paragraph("<b>Grade:</b>", label_style), Paragraph(assessment.grade, value_style)],
            [Paragraph("<b>Feedback:</b>", label_style), Paragraph(assessment.feedback, value_style)],
            [Paragraph("<b>Assessor:</b>", label_style), Paragraph(assessment.assessor.get_full_name(), value_style)],
            [Paragraph("<b>Date:</b>", label_style), Paragraph(assessment.date.strftime("%Y-%m-%d"), value_style)],
        ]
        
        assessment_table = Table(assessment_data, colWidths=[1.2*inch, 5.4*inch])
        assessment_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke),
        ]))
        assessment_elements.append(assessment_table)
        
        elements.append(KeepTogether(assessment_elements))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
