from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document  # <--- UPDATED IMPORT
import json

# Initialize Ollama (Mistral)
llm = ChatOllama(
    base_url="http://localhost:11434",
    model="mistral",
    temperature=0.2
)

# Setup Embeddings
embeddings = OllamaEmbeddings(
    base_url="http://localhost:11434",
    model="mistral" 
)

async def generate_cover_letter(resume_text: str, job_description: str) -> str:
    template = """
    You are an expert career consultant. 
    Using the following Resume: "{resume}" 
    and this Job Description: "{jd}",
    write a professional cover letter.
    Highlight relevant skills from the resume that match the JD.
    Keep it concise and professional.
    """
    
    prompt = PromptTemplate.from_template(template)
    chain = prompt | llm
    
    response = chain.invoke({"resume": resume_text, "jd": job_description})
    return response.content

async def calculate_ats_score(resume_text: str, job_description: str):
    # 1. Create a Vector Store for the JD (Ephemeral/In-memory)
    vector_store = Chroma.from_documents(
        documents=[Document(page_content=job_description)],
        embedding=embeddings,
        collection_name="job_description"
    )

    # 2. Similarity Search
    # We ask: "How similar is the resume content to this JD?"
    results = vector_store.similarity_search_with_score(resume_text, k=1)
    
    # Clean up (Chroma persists by default, let's delete the collection to keep it stateless)
    vector_store.delete_collection()

    # 3. Qualitative Feedback via LLM
    prompt_template = """
    Act as an ATS Scanner.
    Resume: {resume}
    Job Description: {jd}
    
    Task:
    1. Give a match score from 0 to 100 based on keyword overlap.
    2. List missing critical keywords from the JD.
    3. List matching strong skills.
    
    Output purely in JSON format: {{ "score": 0, "missing": [], "matching": [] }}
    """
    
    prompt = PromptTemplate.from_template(prompt_template)
    chain = prompt | llm
    
    response = chain.invoke({"resume": resume_text, "jd": job_description})
    
    # Attempt to parse JSON (LLMs sometimes add extra text, so be careful)
    try:
        # Simple cleanup if the LLM wraps code in markdown blocks
        clean_json = response.content.replace("```json", "").replace("```", "")
        return json.loads(clean_json)
    except:
        return {"raw_response": response.content}

async def generate_resume_text(github_data: dict) -> str:
    template = """
    You are a professional Resume Writer.
    Convert this GitHub profile JSON into a professional resume summary.
    GitHub Data: {data}
    
    Output Format: HTML (clean, using <h2> for headers, <p> for text, <ul> for lists).
    Do not include markdown ticks. Just pure HTML.
    """
    
    prompt = PromptTemplate.from_template(template)
    chain = prompt | llm
    
    response = chain.invoke({"data": str(github_data)})
    return response.content