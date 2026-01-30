package com.blog.service;

import com.blog.model.entity.KnowledgeBase;
import com.blog.model.vo.KnowledgeVO;
import com.blog.repository.KnowledgeRepository;
import com.blog.util.VectorUtil;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private final KnowledgeRepository knowledgeRepository;
    private final AIService aiService;

    public SearchService(KnowledgeRepository knowledgeRepository, AIService aiService) {
        this.knowledgeRepository = knowledgeRepository;
        this.aiService = aiService;
    }

    public List<KnowledgeVO> vectorSearch(String query, int limit, float threshold) {
        float[] embedding = aiService.generateEmbedding(query);
        String embeddingText = VectorUtil.toVectorString(embedding);
        List<Object[]> rows = knowledgeRepository.searchSimilarRaw(embeddingText, threshold, limit);

        List<KnowledgeVO> results = new ArrayList<>();
        for (Object[] row : rows) {
            Long id = ((Number) row[0]).longValue();
            String title = (String) row[1];
            String content = (String) row[2];
            String source = (String) row[3];
            Double similarity = row[4] == null ? null : ((Number) row[4]).doubleValue();
            results.add(new KnowledgeVO(id, title, content, similarity, source));
        }
        return results;
    }

    public List<KnowledgeVO> hybridSearch(String query, int limit, float threshold) {
        List<KnowledgeVO> vectorResults = vectorSearch(query, limit, threshold);
        List<KnowledgeVO> textResults = knowledgeRepository
                .findByChunkContentContainingIgnoreCase(query)
                .stream()
                .map(this::toVO)
                .collect(Collectors.toList());

        return mergeAndRank(vectorResults, textResults, limit);
    }

    public String webSearch(String query) {
        return aiService.searchAndSummarize(query);
    }

    /**
     * Perform web search focused on news articles with source attribution.
     * This method is designed for real-time news lookup.
     */
    public String webSearchWithNews(String query) {
        return aiService.searchNewsWithSources(query);
    }

    private KnowledgeVO toVO(KnowledgeBase kb) {
        return new KnowledgeVO(kb.getId(), kb.getTitle(), kb.getChunkContent(), null, kb.getSourceType());
    }

    private List<KnowledgeVO> mergeAndRank(List<KnowledgeVO> vectorResults, List<KnowledgeVO> textResults, int limit) {
        Map<Long, KnowledgeVO> merged = new HashMap<>();
        for (KnowledgeVO vo : vectorResults) {
            merged.put(vo.getId(), vo);
        }
        for (KnowledgeVO vo : textResults) {
            merged.putIfAbsent(vo.getId(), vo);
        }

        return merged.values().stream()
                .sorted(Comparator.comparing((KnowledgeVO vo) -> vo.getSimilarity() == null ? 0.0 : vo.getSimilarity())
                        .reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }
}