import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import main
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200

@patch("main.extract_text")
@patch("main.chunk_text")
@patch("main.generate_embeddings")
@patch("main.get_pinecone_index")
@patch("main.cache_set")
def test_upload_resume(mock_cache_set, mock_get_index, mock_gen_emb, mock_chunk, mock_extract):
    # Setup mocks
    mock_extract.return_value = "dummy text"
    mock_chunk.return_value = ["dummy chunk"]
    mock_gen_emb.return_value = [[0.1]*384]
    mock_get_index.return_value = None 

    files = {"file": ("test.pdf", b"dummy pdf content", "application/pdf")}
    response = client.post("/upload/resume", files=files)
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data

@patch("main.chunk_text")
@patch("main.generate_embeddings")
@patch("main.get_pinecone_index")
@patch("main.cache_set")
def test_upload_job_text(mock_cache_set, mock_get_index, mock_gen_emb, mock_chunk):
    # Setup mocks
    mock_chunk.return_value = ["dummy chunk"]
    mock_gen_emb.return_value = [[0.1]*384]
    mock_get_index.return_value = None

    data = {"text": "Software Engineer position requiring Python and React"}
    response = client.post("/upload/job", data=data)
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data

@patch("main.cache_get")
@patch("main.get_pinecone_index")
@patch("main.call_openrouter")
@patch("main.cache_set")
def test_match(mock_cache_set, mock_openrouter, mock_get_index, mock_cache_get):
    # Mock cache retrieval
    def side_effect(key):
        if "text:job" in key: return "Job Description: Python developer"
        if "embeddings:job" in key: return [[0.1]*384]
        if "text:resume" in key: return "Resume: I know Python"
        return None
    mock_cache_get.side_effect = side_effect
    
    mock_get_index.return_value = None 
    
    # Mock LLM response
    mock_openrouter.return_value = '{"match_score": 85, "matching_skills": ["Python"], "missing_skills": [], "ats_suggestions": [], "learning_resources": []}'

    data = {"resume_id": "test-resume", "job_id": "test-job"}
    response = client.post("/match", json=data)
    
    assert response.status_code == 200
    result = response.json()
    assert "match_score" in result
    assert "matching_skills" in result
    assert isinstance(result["matching_skills"], list)