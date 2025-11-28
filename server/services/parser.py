import fitz  # PyMuPDF
from fastapi import UploadFile
import re

# Regex to detect URLs that appear in the text itself
URL_REGEX = re.compile(r'https?://\S+')

async def parse_pdf(file: UploadFile) -> str:
    # Read file bytes
    content = await file.read()

    # Open PDF from memory
    doc = fitz.open(stream=content, filetype="pdf")
    full_output = []

    for page_idx, page in enumerate(doc):

        # ---------------------------
        # 1. Extract text normally
        # ---------------------------
        text = page.get_text("text")
        full_output.append(text)

        # ---------------------------
        # 2. Extract links from PDF annotations
        # ---------------------------
        annotation_links = []
        links = page.get_links()

        for link in links:
            if "uri" in link and link["uri"]:
                annotation_links.append(link["uri"])

        # ---------------------------
        # 3. Extract URLs that appear in text
        # ---------------------------
        text_urls = URL_REGEX.findall(text)

        # ---------------------------
        # 4. Combine and deduplicate
        # ---------------------------
        all_urls = list(set(annotation_links + text_urls))

        if all_urls:
            section = [
                "\n--- Links found on this page ---",
                *all_urls,
                "--------------------------------\n"
            ]
            full_output.append("\n".join(section))

    doc.close()

    return "\n".join(full_output)
