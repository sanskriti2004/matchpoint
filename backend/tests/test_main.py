import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 404  

def test_upload_resume():
    files = {"file": ("test.pdf", b"dummy pdf content", "application/pdf")}
    response = client.post("/upload/resume", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data

def test_upload_job_text():
    data = {"text": "Software Engineer position requiring Python and React"}
    response = client.post("/upload/job", data=data)
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data

def test_match():
    data = {"resume_id": "test-resume", "job_id": "test-job"}
    response = client.post("/match", json=data)
    assert response.status_code == 200
    result = response.json()
    assert "match_score" in result
    assert "matching_skills" in result
    assert isinstance(result["matching_skills"], list)