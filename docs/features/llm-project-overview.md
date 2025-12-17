# Context
I'm a principle full-stack engineer building a webapp. 
I'm new to OpenSearch, but not to AI nor web development.

## Product requirements overview
- We have a database of ~5k curated research studies.
- Users ask an ai chatbot (our web-app) questions.
- They are non-profit funders figuring out how to give out grant money.
- They want to be able to ask questions to find relevant research studies
- They want to be able to upload documents, e.g. grant applications, and find relevant research studies. 
- They want to be able to take the results of their work and generate a report.

## Project Infrastructure Overview
* We have a managed OpenSearch instance (2GB RAM, 1 vCPU, 40GB storage) for document indexing, search functionality, and all document metadata (on Digital Ocean)
* NextJS app router with API routes for the user application. (on vercel)
* Postgres app database for storing application, etc. (also hosted on supabase)
* Supabase storage: Storage for original files (PDF, etc)
* Trigger.dev (with TypeScript and postgress/supabase file access) for background jobs:
   * Document uploads and text extraction
   * Storing original PDF files to Supabase
   * Indexing extracted text content and metadata in OpenSearch
   * Serving search queries through OpenSearch
   * Retrieving original PDFs from Supabase when needed

## Document Structure
```json
{
  "id": "study-123",
  "title": "Effects of Early Childhood Education on Long-term Outcomes",
  "authors": ["Jane Smith", "John Doe"],
  "publication_date": "2023-05-15",
  "journal": "Journal of Education Research",
  "abstract": "This study examines the long-term effects of...",
  "full_text": "The complete text content of the paper...",
  "chunked_content": [
    {
      "chunk_id": "chunk-1",
      "content": "Introduction section text...",
      "section": "introduction",
      "embedding": [0.1, 0.2, ...] // Vector embedding if you're using vector search
    },
    {
      "chunk_id": "chunk-2",
      "content": "Methodology section text...",
      "section": "methodology",
      "embedding": [0.3, 0.4, ...]
    }
    // Additional chunks
  ],
  "keywords": ["early childhood", "education", "long-term outcomes"],
  "research_methods": ["longitudinal study", "mixed methods"],
  "populations_studied": ["children ages 3-5", "low-income communities"],
  "funding_sources": ["National Science Foundation", "Department of Education"],
  "key_findings": [
    "Finding 1: Early intervention showed 15% improvement in...",
    "Finding 2: Effects persisted through adolescence..."
  ],
  "metadata": {
    "file_location": "supabase-url-to-original-pdf",
    "file_type": "pdf",
    "word_count": 5243,
    "citation_count": 18,
    "upload_date": "2024-02-15"
  }
}
```

