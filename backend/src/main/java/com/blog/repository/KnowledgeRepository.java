package com.blog.repository;

import com.blog.model.entity.KnowledgeBase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface KnowledgeRepository extends JpaRepository<KnowledgeBase, Long> {

    List<KnowledgeBase> findByChunkContentContainingIgnoreCase(String query);

    /**
     * Vector similarity search using pgvector operators.
     * The embedding parameter should be in vector text format, e.g. "[0.1,0.2,...]".
     */
    @Query(value = """
        SELECT id, title, chunk_content, source_type,
               1 - (embedding <=> CAST(:embedding AS vector)) AS similarity
        FROM knowledge_base
        WHERE 1 - (embedding <=> CAST(:embedding AS vector)) > :threshold
        ORDER BY embedding <=> CAST(:embedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> searchSimilarRaw(
        @Param("embedding") String embedding,
        @Param("threshold") float threshold,
        @Param("limit") int limit
    );
}