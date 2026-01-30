-- V2: Update vector dimension from 768 to 1024 for BAAI/bge-large-zh-v1.5 model

-- Drop the existing index first
DROP INDEX IF EXISTS idx_knowledge_embedding_hnsw;
DROP INDEX IF EXISTS idx_knowledge_embedding_ivfflat;

-- Drop the function that uses the old vector size
DROP FUNCTION IF EXISTS search_similar_knowledge(vector(768), float, int);

-- Alter the embedding column to use 1024 dimensions
ALTER TABLE knowledge_base
ALTER COLUMN embedding TYPE vector(1024);

-- Recreate the index
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_am WHERE amname = 'hnsw') THEN
        EXECUTE 'CREATE INDEX idx_knowledge_embedding_hnsw ON knowledge_base USING hnsw (embedding vector_cosine_ops)';
    ELSE
        EXECUTE 'CREATE INDEX idx_knowledge_embedding_ivfflat ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)';
    END IF;
END
$$;

-- Recreate the search function with new vector size
CREATE OR REPLACE FUNCTION search_similar_knowledge(
    query_embedding vector(1024),
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
