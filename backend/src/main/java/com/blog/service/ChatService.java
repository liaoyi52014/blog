package com.blog.service;

import com.blog.model.dto.ChatResponse;
import com.blog.model.vo.KnowledgeVO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatService {

    private static final int DEFAULT_LIMIT = 6;
    private static final float DEFAULT_THRESHOLD = 0.7f;

    private final SearchService searchService;
    private final AIService aiService;

    public ChatService(SearchService searchService, AIService aiService) {
        this.searchService = searchService;
        this.aiService = aiService;
    }

    public ChatResponse chatWithKnowledge(String query, Integer limit, Float threshold) {
        int safeLimit = limit == null ? DEFAULT_LIMIT : limit;
        float safeThreshold = threshold == null ? DEFAULT_THRESHOLD : threshold;
        List<KnowledgeVO> sources = searchService.vectorSearch(query, safeLimit, safeThreshold);
        String answer = aiService.generateKnowledgeAnswer(query, sources);

        ChatResponse response = new ChatResponse();
        response.setAnswer(answer);
        response.setSources(sources);
        return response;
    }
}
