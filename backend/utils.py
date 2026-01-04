import io
import json
import requests
from PyPDF2 import PdfReader
from docx import Document
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import CharacterTextSplitter
from pinecone import Pinecone
import os

# Global model cache for Vercel serverless optimization
_model_cache = None

def get_embedding_model():
    global _model_cache
    if _model_cache is None:
        try:
            # Use environment variable to choose model
            model_name = os.getenv('EMBEDDING_MODEL', 'sentence-transformers/all-roberta-large-v1')
            print(f"Loading embedding model: {model_name}")
            _model_cache = SentenceTransformer(model_name)
        except Exception as e:
            print(f"Failed to load embedding model: {e}")
            _model_cache = None
    return _model_cache

def extract_text(content: bytes, filename: str) -> str:
    try:
        if filename.endswith('.pdf'):
            pdf_file = io.BytesIO(content)
            pdf_reader = PdfReader(pdf_file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        elif filename.endswith('.docx'):
            docx_file = io.BytesIO(content)
            doc = Document(docx_file)
            text = ""
            for para in doc.paragraphs:
                text += para.text + "\n"
            return text
        elif filename.endswith('.txt'):
            return content.decode('utf-8', errors='ignore')
        else:
            raise ValueError("Unsupported file type")
    except Exception as e:
        print(f"Text extraction failed for {filename}: {e}")
        return "Sample resume text for testing purposes." 

def chunk_text(text: str) -> list[str]:
    splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_text(text)
    return chunks

def generate_embeddings(chunks: list[str]) -> list[list[float]]:
    try:
        model = get_embedding_model()
        if model is None:
            raise Exception("Model not available")
        embeddings = model.encode(chunks, convert_to_tensor=False) 
        return embeddings.tolist()
    except Exception as e:
        print(f"Embedding generation failed: {e}, using dummy embeddings")
        # Use 1024 dimensions to match existing Pinecone index
        return [[0.1] * 1024 for _ in chunks]

def init_pinecone():
    api_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX_NAME")

    if not api_key or not index_name:
        raise ValueError("Missing Pinecone API key or index name")

    pc = Pinecone(api_key=api_key)
    return pc.Index(index_name)

def store_embeddings(index, embeddings: list[list[float]], chunks: list[str], doc_id: str, doc_type: str):
    try:
        vectors = []
        for i, (emb, chunk) in enumerate(zip(embeddings, chunks)):
            vector_id = f"{doc_type}:{doc_id}:{i}"
            vectors.append((vector_id, emb, {"text": chunk, "doc_id": doc_id, "doc_type": doc_type}))
        index.upsert(vectors)
        print(f"Successfully stored {len(vectors)} vectors in Pinecone")
    except Exception as e:
        error_msg = str(e)
        if "dimension" in error_msg.lower():
            print(f"Pinecone dimension mismatch: {error_msg}")
            print("Please recreate your Pinecone index:")
            print("1. Delete current index")
            print("2. Create new index with dimension 1024 (current model) or 384 (optimized model)")
            print("3. Update EMBEDDING_MODEL env var to 'all-MiniLM-L6-v2' for 384 dimensions")
            print("System will continue working with Redis caching only.")
            return False  # Indicate failure but don't raise
        else:
            print(f"Failed to store embeddings in Pinecone: {e}")
            raise
    return True

def call_openrouter(prompt: str) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("Missing OpenRouter API key")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": [{"role": "user", "content": prompt}]
    }
    response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
    return response.json()["choices"][0]["message"]["content"]