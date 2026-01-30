package com.blog.repository;

import com.blog.model.entity.KnowledgeBase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface KnowledgeRepository extends JpaRepository<KnowledgeBase, Long> {

        List<KnowledgeBase> findByChunkContentContainingIgnoreCase(String query);

        /**
         * Vector similarity search using pgvector operators.
         * The embedding parameter should be in vector text format, e.g.
         * "[0.1,0.2,...]".
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
                        @Param("limit") int limit);

        /**
         * Native INSERT that explicitly casts the embedding string to vector type.
         * This bypasses JPA's type handling issue with pgvector.
         */
        @Modifying
        @Query(value = """
                        INSERT INTO knowledge_base (title, content, chunk_content, chunk_index, parent_id,
                                                     embedding, metadata, source_type, source_url, created_at, updated_at)
                        VALUES (:title, :content, :chunkContent, :chunkIndex, :parentId,
                                CAST(:embedding AS vector), CAST(:metadata AS jsonb), :sourceType, :sourceUrl,
                                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        """, nativeQuery = true)
        void insertWithVector(
                        @Param("title") String title,
                        @Param("content") String content,
                        @Param("chunkContent") String chunkContent,
                        @Param("chunkIndex") Integer chunkIndex,
                        @Param("parentId") Long parentId,
                        @Param("embedding") String embedding,
                        @Param("metadata") String metadata,
                        @Param("sourceType") String sourceType,
                        @Param("sourceUrl") String sourceUrl);

        /**
         * Native UPDATE that explicitly casts the embedding string to vector type.
         */
        @Modifying
        @Query(value = """
                        UPDATE knowledge_base
                        SET content = :content,
                            chunk_content = :chunkContent,
                            embedding = CAST(:embedding AS vector),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = :id
                        """, nativeQuery = true)
        void updateWithVector(
                        @Param("id") Long id,
                        @Param("content") String content,
                        @Param("chunkContent") String chunkContent,
                        @Param("embedding") String embedding);
}