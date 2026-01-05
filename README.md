# Resume-Job Matching AI System

A comprehensive AI-powered system that helps match resumes with job descriptions, providing match scores, skill analysis, ATS improvement suggestions and learning resources.

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Services   │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (OpenRouter)  │
│                 │    │                 │    │                 │
│ • React UI      │    │ • Text Processing│    │ • LLM Analysis │
│ • File Upload   │    │ • Vector Search │    │ • ATS Scoring   │
│ • Results Display│    │ • Caching       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │   Vector DB     │    │   Cache Store   │
                    │   (Pinecone)    │    │   (Redis)       │
                    │                 │    │                 │
                    │ • Semantic Search│    │ • Fast Retrieval│
                    │ • Resume Chunks │    │ • API Responses │
                    └─────────────────┘    └─────────────────┘
```

### Technology Choices & Rationale

**Frontend - Next.js (TypeScript, TailwindCSS)**

- **Why Next.js?** Provides server-side rendering, static generation, and API routes for optimal performance and SEO
- **Why TypeScript?** Ensures type safety, better developer experience, and catches errors at compile time
- **Why TailwindCSS?** Utility-first CSS framework for rapid UI development with consistent design system

**Backend - FastAPI (Python)**

- **Why FastAPI?** High-performance async web framework with automatic OpenAPI documentation, type validation, and excellent concurrency support
- **Why Python?** Rich ecosystem for AI/ML libraries, natural language processing, and data science workloads

**Vector Database - Pinecone**

- **Why Pinecone?** Specialized vector database optimized for similarity search with high performance and scalability
- **Use Case:** Stores resume text chunks (created by LangChain text splitters) as embeddings for semantic matching against job descriptions

**Cache - Redis Cloud**

- **Why Redis?** In-memory data structure store providing sub-millisecond response times for cached data
- **Use Case:** Caches processed text, embeddings, and analysis results to reduce API calls and improve user experience

**AI Services**

- **Sentence Transformers (all-roberta-large-v1):** Converts text to high-dimensional vectors for semantic similarity comparison
- **LangChain Text Splitters:** Intelligently chunks documents with overlap for optimal embedding and retrieval (1000 char chunks, 200 char overlap)
- **OpenRouter API (Mistral-7B):** Provides access to multiple LLM providers for intelligent resume-job analysis

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
- **Learning Resources**: Tutorials and courses for missing skills
- **Caching**: Redis for fast data retrieval
- **Vector Search**: Pinecone for efficient similarity search
- **Multi-Job Comparison**: Compare one resume against multiple jobs

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: Next.js (TypeScript, TailwindCSS)
- **AI**: Sentence Transformers (all-roberta-large-v1), LangChain Text Splitters, OpenRouter API (Mistral-7B)
- **Vector DB**: Pinecone
- **Cache**: Redis Cloud
- **Deployment**: Vercel (Frontend) & Hugging Face Spaces (Backend)

## Project Structure

```
matchpoint/
├── README.md
├── backend/
│   ├── api/
│   │   └── index.py          # Serverless function entry point
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

### Important Notes

- **ATS-Grade Accuracy**: The system uses strict skill matching - only skills explicitly present in both resume and job description text are counted as matching. No assumptions or inferences are made.
- **Text Chunking**: LangChain's CharacterTextSplitter divides resumes into 1000-character chunks with 200-character overlap, ensuring semantic search can find relevant skills and experience anywhere in the document.
- **Scoring Rules**: If more than 50% of job-required skills are missing, the match score is capped at 49% (Needs Significant Improvement category).
- **Pinecone Dimension Mismatch**: The system currently uses a 1024-dimension model (all-roberta-large-v1) to match existing indexes. For better performance, you can switch to a 384-dimension model by setting `EMBEDDING_MODEL=all-MiniLM-L6-v2` and recreating your Pinecone index.
- **AI Analysis**: When OpenRouter API key is configured, LLM analysis is used.
- **Graceful Degradation**: The system continues working with Redis caching even if Pinecone operations fail.

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

### Redis Cloud Setup

1. **Sign up for Redis Cloud** (free tier available)
2. **Create a database**
3. **Get the connection URL** (format: `redis://username:password@host:port`)
4. **Add to environment variables**

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

# OpenRouter API (Optional - enables AI analysis, falls back to text analysis if not set)
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

### Common Issues

- **Missing Dependencies**: Ensure all packages in `requirements.txt` are compatible with Python 3.12+
- **Environment Variables**: All required variables must be set in Vercel dashboard
- **CORS Issues**: Update `FRONTEND_URL` in backend environment variables after frontend deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
