from pydantic import BaseModel
from typing import List, Optional

class MatchResult(BaseModel):
    match_score: int
    matching_skills: List[str]
    missing_skills: List[str]
    ats_suggestions: List[str]
    learning_resources: List[dict]

class UploadResponse(BaseModel):
    job_id: str
    message: str

class MatchRequest(BaseModel):
    resume_id: str
    job_id: str