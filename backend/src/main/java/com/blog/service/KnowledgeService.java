package com.blog.service;

import com.blog.model.entity.KnowledgeBase;
import com.blog.repository.KnowledgeRepository;
import com.blog.util.TextChunker;
import com.blog.util.VectorUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class KnowledgeService {

    private final KnowledgeRepository knowledgeRepository;
    private final AIService aiService;

    public KnowledgeService(KnowledgeRepository knowledgeRepository, AIService aiService) {
        this.knowledgeRepository = knowledgeRepository;
        this.aiService = aiService;
    }

    public List<KnowledgeBase> listAll() {
        return knowledgeRepository.findAll();
    }

    public Optional<KnowledgeBase> getById(Long id) {
        return knowledgeRepository.findById(id);
    }

    @Transactional
    public void createFromExternal(String title, String content, String sourceUrl) {
        // Split content into chunks for better vector search
        List<String> chunks = TextChunker.split(content, 500);

        // If content is very short, use the whole content as a single chunk
        if (chunks.isEmpty()) {
            chunks = List.of(content);
        }

        // Create an embedding for each chunk
        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);
            float[] embedding = aiService.generateEmbedding(chunk);
            String embeddingText = VectorUtil.toVectorString(embedding);

            // Insert using native query to handle vector type
            knowledgeRepository.insertWithVector(
                    title,
                    content, // full content
                    chunk, // chunk content for vector search
                    i, // chunkIndex
                    null, // parentId
                    embeddingText,
                    null, // metadata
                    "external", // sourceType
                    sourceUrl);
        }
    }

    @Transactional
    public void updateContent(Long id, String newContent) {
        // Generate new embedding for the updated content
        float[] embedding = aiService.generateEmbedding(newContent);
        String embeddingText = VectorUtil.toVectorString(embedding);

        // Update using native query to handle vector type
        knowledgeRepository.updateWithVector(id, newContent, newContent, embeddingText);
    }
}