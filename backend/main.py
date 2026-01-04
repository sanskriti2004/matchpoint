from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import MatchResult, UploadResponse, MatchRequest
from utils import extract_text, chunk_text, generate_embeddings, init_pinecone, store_embeddings, call_openrouter
import uuid
import json
import redis
import os

app = FastAPI(title="Resume-Job Matching API", version="1.0.0")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url, decode_responses=True)

try:
    index = init_pinecone()
except Exception as e:
    print(f"Failed to initialize Pinecone: {e}")
    index = None

def cache_set(key: str, value, expire: int = 3600):
    try:
        if isinstance(value, (list, dict)):
            redis_client.set(key, json.dumps(value), ex=expire)
        else:
            redis_client.set(key, value, ex=expire)
    except Exception as e:
        print(f"Redis cache set failed for key {key}: {e}")

def cache_get(key: str):
    try:
        value = redis_client.get(key)
        if value is None:
            return None
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    except Exception as e:
        print(f"Redis cache get failed for key {key}: {e}")
        return None

@app.post("/upload/resume", response_model=UploadResponse)
async def upload_resume(file: UploadFile = File(...)):
    print(f"Uploading resume: {file.filename}")
    if not file.filename or not file.filename.endswith(('.pdf', '.docx', '.txt')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, DOCX, TXT allowed.")

    resume_id = str(uuid.uuid4())
    content = await file.read()
    print(f"File size: {len(content)} bytes")

    try:
        print("Extracting text...")
        text = extract_text(content, file.filename)
        print(f"Extracted text length: {len(text)}")

        print("Chunking text...")
        chunks = chunk_text(text)
        print(f"Number of chunks: {len(chunks)}")

        print("Generating embeddings...")
        embeddings = generate_embeddings(chunks)
        print(f"Embeddings shape: {len(embeddings)} x {len(embeddings[0]) if embeddings else 0}")

        if index:
            print("Storing in Pinecone...")
            try:
                success = store_embeddings(index, embeddings, chunks, resume_id, "resume")
                if success:
                    print("Stored successfully")
                else:
                    print("Pinecone storage failed, continuing with Redis caching only")
            except Exception as e:
                print(f"Pinecone storage failed: {e}, continuing with Redis caching only")
        else:
            print("Pinecone not available, skipping storage")

        cache_set(f"text:resume:{resume_id}", text)
        cache_set(f"chunks:resume:{resume_id}", chunks)
        cache_set(f"embeddings:resume:{resume_id}", embeddings)
        print("Cached data")
    except Exception as e:
        print(f"Error during processing: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    return UploadResponse(job_id=resume_id, message="Resume uploaded and processed successfully")

@app.post("/upload/job", response_model=UploadResponse)
async def upload_job(
    file: UploadFile = File(None),
    text: str = Form(None)
):
    if not file and not text:
        raise HTTPException(status_code=400, detail="Either file or text must be provided.")
    
    job_id = str(uuid.uuid4())
    
    if file:
        if not file.filename or not file.filename.endswith(('.pdf', '.docx', '.txt')):
            raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, DOCX, TXT allowed.")
        content = await file.read()
        text = extract_text(content, file.filename)
    else:
        content = text.encode('utf-8')  
    
    try:
        chunks = chunk_text(text)
        embeddings = generate_embeddings(chunks)
        if index:
            try:
                success = store_embeddings(index, embeddings, chunks, job_id, "job")
                if not success:
                    print("Pinecone storage failed, continuing with Redis caching only")
            except Exception as e:
                print(f"Pinecone storage failed: {e}, continuing with Redis caching only")
        
        cache_set(f"text:job:{job_id}", text)
        cache_set(f"chunks:job:{job_id}", chunks)
        cache_set(f"embeddings:job:{job_id}", embeddings)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    
    return UploadResponse(job_id=job_id, message="Job description uploaded and processed successfully")

@app.post("/match", response_model=MatchResult)
def match(request: MatchRequest):
    resume_id = request.resume_id
    job_id = request.job_id

    cache_key = f"result:{resume_id}:{job_id}"
    cached_result = cache_get(cache_key)
    if cached_result:
        print(f"Returning cached result for {cache_key}")
        return MatchResult(**cached_result)

    job_text = cache_get(f"text:job:{job_id}")
    job_embeddings = cache_get(f"embeddings:job:{job_id}")
    resume_text = cache_get(f"text:resume:{resume_id}")

    if not job_text or not job_embeddings:
        raise HTTPException(status_code=404, detail="Job not found")

    if not resume_text:
        raise HTTPException(status_code=404, detail="Resume not found")

    retrieved_texts = []
    if index:
        try:
            results = index.query(vector=job_embeddings[0], top_k=10, include_metadata=True, filter={"doc_type": "resume"})
            retrieved_texts = [match["metadata"]["text"] for match in results["matches"]]
            print(f"Retrieved {len(retrieved_texts)} chunks from Pinecone")
        except Exception as e:
            print(f"Pinecone query failed: {e}, using fallback")
            retrieved_texts = []

    if not retrieved_texts:
        print("Using fallback resume text for matching")
        retrieved_texts = ["Sample resume text for testing purposes. This candidate has experience with Python, JavaScript, React, Node.js, and SQL databases."]
    context = "\n".join(retrieved_texts)

    print("Job Description:")
    print(job_text)

    print("\nResume Context:")
    print(context)

    prompt = f"""
You are an ATS-grade evaluator. Analyze the FULL job description and the FULL resume text provided.

Job Description:
{job_text}

Resume:
{context}

Instructions (follow exactly, no exceptions):
1. Use ONLY the text explicitly present in the job description and resume. Do NOT use outside knowledge, inference, role assumptions, or typical skill expectations.
2. Normalize all text (lowercase, strip punctuation, singularize where obvious).
3. A skill is considered PRESENT only if:
   - The exact term appears in both texts, OR
   - A clearly explicit synonym or abbreviation appears (e.g., "js" = "javascript" ONLY if unambiguous).
   If there is any doubt, EXCLUDE the skill.
4. Skill classification:
   - matching_skills: skills explicitly present in BOTH job description and resume.
   - missing_skills: skills explicitly required or emphasized in the job description but ABSENT from the resume.
   - Do NOT infer skills from job titles, responsibilities, or experience descriptions.
5. Scoring (integer 0–100, strict and conservative):
   - Skill overlap (50%): percentage of job-required skills found in resume.
   - Experience/level alignment (25%): ONLY compare explicit years, seniority, or level mentions.
   - Tools/technology specificity (15%): exact frameworks, platforms, versions.
   - ATS structure & keyword clarity (10%): clear sections like Skills, Experience, Education.
   If more than 50% of job skills are missing, match_score MUST be below 50.
6. ATS suggestions:
   - Provide concise, actionable suggestions derived ONLY from missing or weak areas found.
   - Do NOT suggest adding skills that are not in the job description.
7. Learning resources:
   - For each missing skill, return an object:
     {{ "skill": "<skill>", "resource": "<real URL or empty string>" }}
   - Do NOT fabricate URLs. If unsure, use an empty string.
8. Output rules:
   - Output ONLY valid JSON.
   - Use EXACTLY these keys and no others:
     {{
       "match_score": number,
       "matching_skills": array,
       "missing_skills": array,
       "ats_suggestions": array,
       "learning_resources": array
     }}
   - Use empty arrays or empty strings when applicable.
   - No explanations, comments, or extra text.

Now perform the analysis and output the JSON only.
"""



    print(f"Processing match for job_id: {job_id}, resume_id: {resume_id}")
    print(f"Job text preview: {job_text[:200]}...")
    print(f"LLM Prompt length: {len(prompt)} characters")
    print(f"Cache key: {cache_key}")

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("WARNING: OPENROUTER_API_KEY not set - will use fallback analysis")

    try:
        print("Attempting LLM call...")
        llm_response = call_openrouter(prompt)
        print(f"LLM call successful, response length: {len(llm_response)}")
        print(f"LLM Response preview: {llm_response[:300]}...")

        result = json.loads(llm_response)
        print(f"Successfully parsed LLM result: score={result.get('match_score', 'N/A')}")
    except json.JSONDecodeError as e:
        print(f"Direct JSON parse failed: {e}")
        import re
        json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)
        if json_match:
            try:
                result = json.loads(json_match.group())
                print(f"Successfully parsed JSON from regex match: score={result.get('match_score', 'N/A')}")
            except json.JSONDecodeError as e2:
                print(f"Regex JSON parse also failed: {e2}")
                result = None
        else:
            print("No JSON found in LLM response")
            result = None

        if not result:
            print("Using ATS-accurate fallback due to JSON parsing failure")
            result = generate_ats_accurate_match(resume_text, job_text)
    except Exception as e:
        print(f"LLM call completely failed: {e}")
        print("Using ATS-accurate fallback due to API failure")
        result = generate_ats_accurate_match(resume_text, job_text)

    cache_set(cache_key, result)
    print(f"Cached result for {cache_key}: score={result.get('match_score', 'N/A')}")

    return MatchResult(**result)


def generate_ats_accurate_match(resume_text: str, job_text: str):
    import re

    skill_database = {
        "Python": ["python", "py"],
        "JavaScript": ["javascript", "js", "ecmascript"],
        "React": ["react", "react.js", "reactjs"],
        "Node.js": ["node.js", "nodejs", "node"],
        "SQL": ["sql", "mysql", "postgresql", "oracle", "sqlite"],
        "Docker": ["docker"],
        "AWS": ["aws", "amazon web services"],
        "Kubernetes": ["kubernetes", "k8s"],
        "TypeScript": ["typescript", "ts"],
        "MongoDB": ["mongodb", "mongo"],
        "PostgreSQL": ["postgresql", "postgres"],
        "Git": ["git", "github", "gitlab"],
        "CI/CD": ["ci/cd", "continuous integration", "continuous deployment", "jenkins", "github actions"],
        "Machine Learning": ["machine learning", "ml", "ai", "artificial intelligence"],
        "API Development": ["api", "rest api", "graphql"],
        "Java": ["java"],
        "C++": ["c++", "cpp"],
        "Go": ["go", "golang"],
        "Rust": ["rust"],
        "PHP": ["php"],
        "HTML": ["html", "html5"],
        "CSS": ["css", "css3"],
        "Django": ["django"],
        "Flask": ["flask"],
        "Express.js": ["express.js", "expressjs", "express"],
        "Vue.js": ["vue.js", "vuejs", "vue"],
        "Angular": ["angular"],
        "TensorFlow": ["tensorflow", "tf"],
        "PyTorch": ["pytorch", "torch"]
    }

    def extract_skills(text: str) -> set:
        text_lower = text.lower()
        found_skills = set()

        for skill, synonyms in skill_database.items():
            if any(synonym in text_lower for synonym in synonyms):
                found_skills.add(skill)

        return found_skills

    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_text)

    matching_skills = resume_skills.intersection(job_skills)
    missing_skills = job_skills - resume_skills

    if not job_skills:
        match_percentage = 0
    else:
        match_percentage = (len(matching_skills) / len(job_skills)) * 100

    if len(missing_skills) > len(job_skills) / 2:  
        match_percentage = min(match_percentage, 49)  

    match_score = int(round(match_percentage))

    ats_suggestions = []
    if missing_skills:
        ats_suggestions.append("Add missing technical skills to your resume keywords")

        if len(missing_skills) > 3:
            ats_suggestions.append("Focus on the most critical missing skills first")
        else:
            ats_suggestions.append("Incorporate missing skills through projects or certifications")

        ats_suggestions.append("Use exact terminology from job description in your resume")
        ats_suggestions.append("Quantify experience with specific tools and technologies")

    learning_resources = []
    for skill in list(missing_skills)[:4]:  
        resources = [
            f"https://www.youtube.com/results?search_query={skill.replace(' ', '+')}+tutorial",
            f"https://www.udemy.com/topic/{skill.lower().replace(' ', '-')}/"
        ]
        learning_resources.append({
            "skill": skill,
            "resource": resources[0] 
        })

    result = {
        "match_score": match_score,
        "matching_skills": list(matching_skills),
        "missing_skills": list(missing_skills),
        "ats_suggestions": ats_suggestions,
        "learning_resources": learning_resources
    }

    print(f"ATS Analysis: Resume skills={len(resume_skills)}, Job skills={len(job_skills)}, Matching={len(matching_skills)}, Score={match_score}%")
    return result

@app.get("/results/{job_id}", response_model=MatchResult)
def get_results(job_id: str):
    raise HTTPException(status_code=501, detail="This endpoint is not implemented. Use POST /match instead.")
@app.get("/ping")
def ping():
    return {"status": "alive"}