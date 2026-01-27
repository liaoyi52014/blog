package com.blog.controller;

import com.blog.model.dto.SearchRequest;
import com.blog.model.vo.KnowledgeVO;
import com.blog.service.SearchService;
import com.blog.util.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @PostMapping("/vector")
    public ApiResponse<Map<String, Object>> vectorSearch(@Valid @RequestBody SearchRequest request) {
        List<KnowledgeVO> results = searchService.vectorSearch(
            request.getQuery(),
            request.getLimit(),
            request.getThreshold()
        );
        return ApiResponse.success(Map.of("results", results, "total", results.size()));
    }

    @PostMapping("/hybrid")
    public ApiResponse<Map<String, Object>> hybridSearch(@Valid @RequestBody SearchRequest request) {
        List<KnowledgeVO> results = searchService.hybridSearch(
            request.getQuery(),
            request.getLimit(),
            request.getThreshold()
        );
        return ApiResponse.success(Map.of("results", results, "total", results.size()));
    }

    @PostMapping("/web")
    public ApiResponse<Map<String, Object>> webSearch(@Valid @RequestBody SearchRequest request) {
        String summary = searchService.webSearch(request.getQuery());
        return ApiResponse.success(Map.of("summary", summary));
    }
}