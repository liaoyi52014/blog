-- V1: initial schema for personal AI tech blog

-- pgvector extension (required for vector type/operators)
CREATE EXTENSION IF NOT EXISTS vector;

-- 1) articles
CREATE TABLE IF NOT EXISTS articles (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    author VARCHAR(100),
    category VARCHAR(50),
    tags VARCHAR(200),
    source VARCHAR(100) DEFAULT 'original',
    status VARCHAR(20) DEFAULT 'draft',
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- 2) ai_news
CREATE TABLE IF NOT EXISTS ai_news (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    summary TEXT,
    source_name VARCHAR(100),
    source_url VARCHAR(1000),
    author VARCHAR(100),
    published_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(50),
    tags VARCHAR(200),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_news_published ON ai_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_news_featured ON ai_news(is_featured, published_at DESC);

-- 3) rss_feeds
CREATE TABLE IF NOT EXISTS rss_feeds (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    url VARCHAR(1000) NOT NULL UNIQUE,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    fetch_interval INTEGER DEFAULT 3600,
    last_fetched_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rss_feeds_active ON rss_feeds(is_active);

-- 4) import_records
CREATE TABLE IF NOT EXISTS import_records (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(20),
    file_size BIGINT,
    file_path VARCHAR(1000),
    status VARCHAR(20),
    error_message TEXT,
    chunks_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_import_records_status ON import_records(status);
CREATE INDEX IF NOT EXISTS idx_import_records_created_at ON import_records(created_at DESC);

-- 5) knowledge_base
CREATE TABLE IF NOT EXISTS knowledge_base (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    chunk_content TEXT NOT NULL,
    chunk_index INTEGER,
    parent_id BIGINT REFERENCES import_records(id) ON DELETE SET NULL,
    embedding vector(768),
    metadata JSONB,
    source_type VARCHAR(50),
    source_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_parent ON knowledge_base(parent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_source ON knowledge_base(source_type);

-- NOTE: IVFFlat should be created after the table has data. HNSW can be created on empty tables.
-- Using HNSW here to make the initial migration reliable.
DO $$
BEGIN
    -- pgvector < 0.5.0 may not support HNSW; fall back to IVFFlat when needed.
    IF EXISTS (SELECT 1 FROM pg_am WHERE amname = 'hnsw') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_embedding_hnsw') THEN
            EXECUTE 'CREATE INDEX idx_knowledge_embedding_hnsw ON knowledge_base USING hnsw (embedding vector_cosine_ops)';
        END IF;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_knowledge_embedding_ivfflat') THEN
            EXECUTE 'CREATE INDEX idx_knowledge_embedding_ivfflat ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)';
        END IF;
    END IF;
END
$$;

-- Vector similarity helper function
CREATE OR REPLACE FUNCTION search_similar_knowledge(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id BIGINT,
    title VARCHAR,
    content TEXT,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.title,
        kb.chunk_content,
        1 - (kb.embedding <=> query_embedding) AS similarity
    FROM knowledge_base kb
    WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
