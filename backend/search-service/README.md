# Muthu Browser — Search Engine Backend Service

## Architecture Overview

A production-grade, AWS-ready Search and AI Answer Generation service designed to back the **AI-Powered Privacy Web Browser**.

```
┌─────────────────┐       REST / JSON       ┌────────────────────────┐
│  Muthu Browser  │ ──────────────────────> │ Spring Boot Search API │
│ (Electron Client)│ <────────────────────── │ (Port 8080)            │
└─────────────────┘                         └───────────┬────────────┘
                                                        │
                      ┌─────────────────────────────────┼───────────────────────────────┐
                      │                                 │                               │
                      ▼                                 ▼                               ▼
       ┌─────────────────────────────┐   ┌─────────────────────────────┐   ┌─────────────────────────────┐
       │   PostgreSQL + pgvector     │   │        Elasticsearch        │   │    LLM & Embedding Engine   │
       │  (Dense Vector Embeddings)  │   │  (BM25 Inverted Text Index) │   │ (Ollama / Claude / OpenAI)  │
       └─────────────────────────────┘   └─────────────────────────────┘   └─────────────────────────────┘
```

---

## Key Components

### 1. Document Crawler & Ingestion Pipeline
- **Politeness Engine**: Implements strict `robots.txt` parsing using Crawler4j / custom politeness queues.
- **Rate Limiting**: Enforces max 1 request per domain every 2.5 seconds with exponential backoff on HTTP 429.
- **Content Extractor**: Strips HTML boilerplate, extracting clean title, meta description, canonical URL, and readable body text.
- **Hash De-duplication**: Uses SimHash / SHA-256 content hashing to avoid indexing duplicate web pages.

### 2. Hybrid Search Engine
- **Keyword / Inverted Index**: Elasticsearch / OpenSearch cluster running BM25 relevance scoring.
- **Vector Semantic Search**: PostgreSQL with `pgvector` extension utilizing `HNSW` (Hierarchical Navigable Small World) indexing over 768-dim embeddings.
- **Reciprocal Rank Fusion (RRF)**: Merges the ranked lists:
  $$\text{RRF Score}(d) = \sum_{m \in \{\text{BM25}, \text{Vector}\}} \frac{1}{60 + \text{Rank}_m(d)}$$

### 3. AI Answer Generator & Attributed Citations
- Extracts top 5 ranked passages from the retrieved sources.
- Uses prompt engineering with strict anti-hallucination guardrails:
  - Answers must rely strictly on retrieved passage evidence.
  - Generates numbered source tags (`[1]`, `[2]`).
  - If insufficient evidence is present, explicitly states lack of data.

---

## API Endpoints

### 1. Execute Search
```http
GET /api/v1/search?q={query}&limit=10
```
**Response Format**:
```json
{
  "query": "electron memory optimization",
  "aiAnswer": {
    "text": "Chromium multi-process model allows tabs to sleep and discard in the background to free RAM [1].",
    "citations": [
      { "sourceId": "doc-1", "citationIndex": 1, "quote": "Tab discarding reduces idle memory." }
    ],
    "hasSufficientEvidence": true
  },
  "sources": [
    {
      "id": "doc-1",
      "title": "Electron Performance Guide",
      "url": "https://www.electronjs.org/docs/latest/tutorial/performance",
      "domain": "electronjs.org",
      "snippet": "Tab discarding reduces idle memory.",
      "score": 0.89
    }
  ],
  "webResults": [ ... ],
  "relatedQueries": [ ... ]
}
```

### 2. Submit URL for Indexing
```http
POST /api/v1/crawl/submit
Content-Type: application/json

{
  "url": "https://example.com/docs",
  "priority": 1
}
```

---

## Deployment (AWS-Ready)
- **Container**: Packaged via Docker (`Dockerfile` multi-stage build).
- **Compute**: Deployed to AWS ECS Fargate or EKS.
- **Database**: Amazon Aurora PostgreSQL (pgvector enabled).
- **Search Cluster**: Amazon OpenSearch Service.
