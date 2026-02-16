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

origins = ["https://matchpoint-frontend-alpha.vercel.app", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = None
redis_available = None
memory_cache = {}

def init_redis():
    global redis_client, redis_available
    
    if redis_available is False:
        return None
    
    if redis_client is not None:
        return redis_client
    
    try:
        redis_client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            retry_on_timeout=True,
            health_check_interval=30
        )
        redis_client.ping()
        print(f"Redis connected successfully to {redis_url}")
        redis_available = True
        return redis_client
    except Exception as e:
        print(f"Redis connection failed: {e}. Using in-memory cache.")
        redis_client = None
        redis_available = False
        return None

def get_pinecone_index():
    try:
        return init_pinecone()
    except Exception as e:
        print(f"Failed to initialize Pinecone: {e}")
        return None

def cache_set(key: str, value, expire: int = 3600):
    client = init_redis()
    
    if client is None:
        memory_cache[key] = value
        return
    
    try:
        if isinstance(value, (list, dict)):
            client.set(key, json.dumps(value), ex=expire)
        else:
            client.set(key, value, ex=expire)
        memory_cache[key] = value
    except Exception as e:
        print(f"Redis cache set failed for key {key}: {e}")
        memory_cache[key] = value

def cache_get(key: str):
    client = init_redis()
    
    if client is None:
        return memory_cache.get(key)
    
    try:
        value = client.get(key)
        if value is None:
            return memory_cache.get(key)
        try:
            parsed_value = json.loads(value)
            memory_cache[key] = parsed_value
            return parsed_value
        except json.JSONDecodeError:
            memory_cache[key] = value
            return value
    except Exception as e:
        print(f"Redis cache get failed for key {key}: {e}")
        return memory_cache.get(key)


@app.post("/upload/resume", response_model=UploadResponse)
async def upload_resume(file: UploadFile = File(...)):
    resume_id = str(uuid.uuid4())
    
    try:
        print(f"[{resume_id}] Uploading resume: {file.filename}")
        
        if not file.filename or not file.filename.endswith(('.pdf', '.docx', '.txt')):
            raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, DOCX, TXT allowed.")

        content = await file.read()
        print(f"[{resume_id}] File size: {len(content)} bytes")

        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        print(f"[{resume_id}] Extracting text...")
        text = extract_text(content, file.filename)
        
        if not text or len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract sufficient text from file")
        
        print(f"[{resume_id}] Extracted text length: {len(text)}")

        print(f"[{resume_id}] Chunking text...")
        chunks = chunk_text(text)
        print(f"[{resume_id}] Number of chunks: {len(chunks)}")

        print(f"[{resume_id}] Generating embeddings...")
        embeddings = generate_embeddings(chunks)
        print(f"[{resume_id}] Embeddings shape: {len(embeddings)} x {len(embeddings[0]) if embeddings else 0}")

        index = get_pinecone_index()
        if index:
            print(f"[{resume_id}] Storing in Pinecone...")
            try:
                success = store_embeddings(index, embeddings, chunks, resume_id, "resume")
                if success:
                    print(f"[{resume_id}] Successfully stored in Pinecone")
                else:
                    print(f"[{resume_id}] Pinecone storage returned false, continuing")
            except Exception as e:
                print(f"[{resume_id}] Pinecone storage failed: {e}, continuing")
        else:
            print(f"[{resume_id}] Pinecone not available, skipping vector storage")

        cache_set(f"text:resume:{resume_id}", text)
        cache_set(f"chunks:resume:{resume_id}", chunks)
        cache_set(f"embeddings:resume:{resume_id}", embeddings)
        print(f"[{resume_id}] Processing complete")
        
        return UploadResponse(job_id=resume_id, message="Resume uploaded and processed successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[{resume_id}] Error during processing: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/upload/job", response_model=UploadResponse)
async def upload_job(
    file: UploadFile = File(None),
    text: str = Form(None)
):
    job_id = str(uuid.uuid4())
    
    try:
        if not file and not text:
            raise HTTPException(status_code=400, detail="Either file or text must be provided.")
        
        print(f"[{job_id}] Uploading job description")
        
        if file:
            if not file.filename or not file.filename.endswith(('.pdf', '.docx', '.txt')):
                raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, DOCX, TXT allowed.")
            content = await file.read()
            
            if len(content) == 0:
                raise HTTPException(status_code=400, detail="Uploaded file is empty")
            
            text = extract_text(content, file.filename)
        
        if not text or len(text.strip()) < 20:
            raise HTTPException(status_code=400, detail="Job description text is too short or empty")
        
        print(f"[{job_id}] Processing job text (length: {len(text)})")
        
        chunks = chunk_text(text)
        embeddings = generate_embeddings(chunks)
        
        print(f"[{job_id}] Generated {len(chunks)} chunks and embeddings")
        
        index = get_pinecone_index()
        if index:
            try:
                success = store_embeddings(index, embeddings, chunks, job_id, "job")
                if success:
                    print(f"[{job_id}] Successfully stored in Pinecone")
                else:
                    print(f"[{job_id}] Pinecone storage returned false, continuing")
            except Exception as e:
                print(f"[{job_id}] Pinecone storage failed: {e}, continuing")
        
        cache_set(f"text:job:{job_id}", text)
        cache_set(f"chunks:job:{job_id}", chunks)
        cache_set(f"embeddings:job:{job_id}", embeddings)
        
        print(f"[{job_id}] Job processing complete")
        
        return UploadResponse(job_id=job_id, message="Job description uploaded and processed successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[{job_id}] Error during processing: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/match", response_model=MatchResult)
def match(request: MatchRequest):
    resume_id = request.resume_id
    job_id = request.job_id
    
    print(f"[MATCH] Processing match request: resume={resume_id}, job={job_id}")

    try:
        cache_key = f"result:{resume_id}:{job_id}"
        cached_result = cache_get(cache_key)
        if cached_result:
            print(f"[MATCH] Returning cached result for {cache_key}")
            return MatchResult(**cached_result)

        job_text = cache_get(f"text:job:{job_id}")
        job_embeddings = cache_get(f"embeddings:job:{job_id}")
        resume_text = cache_get(f"text:resume:{resume_id}")

        if not job_text or not job_embeddings:
            print(f"[MATCH] Job data not found for job_id={job_id}")
            raise HTTPException(status_code=404, detail=f"Job description not found. Please upload the job description first.")

        if not resume_text:
            print(f"[MATCH] Resume data not found for resume_id={resume_id}")
            raise HTTPException(status_code=404, detail=f"Resume not found. Please upload the resume first.")

        retrieved_texts = []
        index = get_pinecone_index()
        if index:
            try:
                results = index.query(vector=job_embeddings[0], top_k=10, include_metadata=True, filter={"doc_type": "resume"})
                retrieved_texts = [match["metadata"]["text"] for match in results["matches"]]
                print(f"[MATCH] Retrieved {len(retrieved_texts)} chunks from Pinecone")
            except Exception as e:
                print(f"[MATCH] Pinecone query failed: {e}, using fallback")
                retrieved_texts = []

        if not retrieved_texts:
            print("[MATCH] Using fallback resume text for matching")
            retrieved_texts = [resume_text]
        
        context = "\n".join(retrieved_texts)

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
   - For EACH missing skill, return an object in EXACTLY this format:
     {{
       "skill": "<skill>",
       "free_tutorial": "<youtube URL or empty string>",
       "official_resource": "<official documentation URL or empty string>",
       "explore": "<exploration/discovery URL such as daily.dev or similar, or empty string>"
     }}
   - Examples of valid explore sources:
     - https://app.daily.dev/tags/<skill>
     - reputable blogs, curated learning hubs, or developer communities
   - URLs MUST be real and verifiable.
   - If unsure about any resource, return an empty string for that field.
   - Do NOT fabricate or guess URLs.
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

        print(f"[MATCH] Job text length: {len(job_text)}, Resume text length: {len(resume_text)}")
        print(f"[MATCH] LLM Prompt length: {len(prompt)} characters")

        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            print("[MATCH] WARNING: OPENROUTER_API_KEY not set - using fallback analysis")

        try:
            print("[MATCH] Calling LLM for analysis...")
            llm_response = call_openrouter(prompt)
            print(f"[MATCH] LLM response received (length: {len(llm_response)})")

            result = json.loads(llm_response)
            print(f"[MATCH] Successfully parsed LLM result: score={result.get('match_score', 'N/A')}")
        except json.JSONDecodeError as e:
            print(f"[MATCH] JSON parse failed: {e}, attempting regex extraction")
            import re
            json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group())
                    print(f"[MATCH] Extracted JSON from response: score={result.get('match_score', 'N/A')}")
                except json.JSONDecodeError as e2:
                    print(f"[MATCH] Regex JSON parse failed: {e2}")
                    result = None
            else:
                print("[MATCH] No JSON found in LLM response")
                result = None

            if not result:
                print("[MATCH] Using ATS fallback due to JSON parsing failure")
                result = generate_ats_accurate_match(resume_text, job_text)
        except Exception as e:
            print(f"[MATCH] LLM call failed: {e}")
            import traceback
            traceback.print_exc()
            print("[MATCH] Using ATS fallback due to API failure")
            result = generate_ats_accurate_match(resume_text, job_text)

        cache_set(cache_key, result)
        print(f"[MATCH] Match complete: score={result.get('match_score', 'N/A')}")

        return MatchResult(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[MATCH] Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Match processing failed: {str(e)}")


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
            "free_tutorial": resources[0], 
            "official_resource": "",
            "explore": ""
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
@app.get("/")
def root():
    return {
        "status": "MatchPoint backend running",
        "docs": "/docs"
    }
