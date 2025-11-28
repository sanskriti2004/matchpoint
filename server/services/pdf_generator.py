from xhtml2pdf import pisa
from io import BytesIO

def create_pdf(html_content: str) -> BytesIO:
    # Add simple styling
    full_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Helvetica; font-size: 12px; }}
            h2 {{ color: #333; border-bottom: 1px solid #ccc; }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    result = BytesIO()
    pisa_status = pisa.CreatePDF(full_html, dest=result)
    
    if pisa_status.err:
        raise Exception("PDF generation failed")
        
    result.seek(0)
    return result