from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn

# Import your services
from services.parser import parse_pdf
from services.llm import generate_cover_letter, calculate_ats_score, generate_resume_text
from services.github_service import get_github_data
from services.pdf_generator import create_pdf

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class CoverLetterRequest(BaseModel):
    resume_text: str
    job_description: str

class PdfRequest(BaseModel):
    resumeContent: str

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "Python Backend Running"}

@app.post("/api/parse-resume")
async def parse_resume_endpoint(resume: UploadFile = File(...)):
    text = await parse_pdf(resume)
    return {"text": text}

@app.post("/api/generate-cover-letter")
async def cover_letter_endpoint(req: CoverLetterRequest):
    result = await generate_cover_letter(req.resume_text, req.job_description)
    return {"coverLetter": result}

@app.post("/api/ats-score")
async def ats_endpoint(req: CoverLetterRequest):
    result = await calculate_ats_score(req.resume_text, req.job_description)
    return result

@app.get("/api/github/{username}")
async def github_endpoint(username: str):
    data = await get_github_data(username)
    return data

@app.post("/api/generate-resume")
async def generate_resume_endpoint(req: dict):
    # req['githubData'] is passed from frontend
    html_content = await generate_resume_text(req['githubData'])
    return {"resumeContent": html_content}

@app.post("/api/download-pdf")
def download_pdf_endpoint(req: PdfRequest):
    pdf_io = create_pdf(req.resumeContent)
    return StreamingResponse(
        pdf_io, 
        media_type="application/pdf", 
        headers={"Content-Disposition": "attachment; filename=resume.pdf"}
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)