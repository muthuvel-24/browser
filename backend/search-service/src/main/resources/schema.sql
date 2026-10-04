-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table storing crawled and indexed web pages
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(64) PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    snippet TEXT,
    content TEXT,
    domain VARCHAR(255) NOT NULL,
    embedding vector(384),
    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search tsvector index for keyword/BM25 retrieval
CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents USING gin(to_tsvector('english', title || ' ' || content));

-- HNSW vector cosine similarity index for fast semantic search
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING hnsw (embedding vector_cosine_ops);
