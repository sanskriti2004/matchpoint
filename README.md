# Resume-Job Matching AI System

A comprehensive AI-powered system that helps match resumes with job descriptions, providing match scores, skill analysis, ATS improvement suggestions and learning resources.

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Services   │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (OpenRouter)  │
│                 │    │                 │    │                 │
│ • React UI      │    │ • Process Text  │    │ • LLM Analysis  │
│ • File Upload   │    │ • Vector Search │    │ • ATS Scoring   │
│ • Result Display│    │ • Caching       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌──────────────────┐    ┌─────────────────┐
                    │   Vector DB      │    │   Cache Store   │
                    │   (Pinecone)     │    │   (Redis)       │
                    │                  │    │                 │
                    │ • Semantic Search│    │ • Fast Retrieval│
                    │ • Resume Chunks  │    │ • API Responses │
                    └──────────────────┘    └─────────────────┘
```

## Features

- **Resume & Job Processing**: Extract text from PDF, DOCX and TXT files
- **ATS-Grade Matching**: Strict, accurate skill matching based on explicit text analysis
- **Precise Skill Analysis**: Only skills explicitly present in both resume and job description are counted as matching
- **Intelligent Scoring**: 0-100% match score based on skill overlap percentage with ATS-compliant ranges:
  - 0-29%: Very Poor Match
  - 30-49%: Weak Match
  - 50-69%: Moderate Match
  - 70-84%: Good Match
  - 85-100%: Strong Match
- **Semantic Matching**: Vector embeddings using Hugging Face models (all-roberta-large-v1) with LangChain-powered text chunking for comprehensive document analysis
- **AI Analysis**: LLM-powered analysis using OpenRouter (Mistral-7B) with ATS-accurate fallback
- **ATS Optimization**: Targeted suggestions for resume improvement
- **Learning Resources**: Recommends free tutorials, official documentation and curated discovery link to explore the latest updates for missing skills
- **Caching**: Redis for fast data retrieval
- **Vector Search**: Pinecone for efficient similarity search

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: Next.js (TypeScript, TailwindCSS)
- **AI/ML**: Sentence Transformers (all-roberta-large-v1), LangChain Text Splitters, OpenRouter API (Mistral-7B)
- **Vector DB**: Pinecone
- **Cache**: Redis Cloud
- **Deployment**: Vercel (Frontend) & Hugging Face Spaces (Backend)

## Project Structure

```
matchpoint/
├── README.md
├── backend/
│   ├── Dockerfile            # Container configuration
│   ├── main.py               # FastAPI application with endpoints
│   ├── models.py             # Pydantic data models
│   ├── requirements.txt      # Python dependencies
│   ├── runtime.txt           # Python version specification
│   ├── tests/
│   │   └── test_main.py      # Unit and integration tests
│   └── utils.py              # Text processing, embeddings and AI utilities
├── frontend/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ResultsDisplay.tsx
│   │   │   └── UploadForm.tsx
│   │   ├── globals.css       # Global styles and Tailwind imports
│   │   ├── layout.tsx        # Root layout component
│   │   └── page.tsx          # Main application page
│   ├── package.json          # Node.js dependencies and scripts
│   ├── tsconfig.json         # TypeScript configuration
│   └── vercel.json           # Vercel deployment configuration
```

## Setup & Development

### Prerequisites

- Python 3.11+ (matches Vercel runtime)
- Node.js 18+
- Git

### Backend Setup

1. **Clone and navigate to backend:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

3. **Environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Run locally:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /upload/resume` - Upload and process resume file (PDF, DOCX, TXT)
- `POST /upload/job` - Upload and process job description (file or text)
- `POST /match` - Perform resume-job matching analysis and return results

All endpoints return JSON responses with appropriate HTTP status codes and error handling.

## Environment Variables

### Backend (.env)

```env
# Pinecone Configuration (Required for vector search)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=matchpoint-index

# OpenRouter API 
OPENROUTER_API_KEY=your_openrouter_api_key

# Redis Cloud (Required for caching)
REDIS_URL=redis://username:password@host:port

# Frontend URL for CORS
FRONTEND_URL=https://your-frontend.vercel.app

# Optional: Embedding Model (default: sentence-transformers/all-roberta-large-v1, alternative: all-MiniLM-L6-v2)
EMBEDDING_MODEL=sentence-transformers/all-roberta-large-v1
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend.vercel.app
```