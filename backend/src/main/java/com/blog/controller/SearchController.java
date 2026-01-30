package com.blog.controller;

import com.blog.model.dto.SearchRequest;
import com.blog.model.vo.KnowledgeVO;
import com.blog.service.SearchService;
import com.blog.util.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

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
                request.getThreshold());
        return ApiResponse.success(Map.of("results", results, "total", results.size()));
    }

    @PostMapping("/hybrid")
    public ApiResponse<Map<String, Object>> hybridSearch(@Valid @RequestBody SearchRequest request) {
        List<KnowledgeVO> results = searchService.hybridSearch(
                request.getQuery(),
                request.getLimit(),
                request.getThreshold());
        return ApiResponse.success(Map.of("results", results, "total", results.size()));
    }

    @PostMapping("/web")
    public ApiResponse<Map<String, Object>> webSearch(@Valid @RequestBody SearchRequest request) {
        String summary = searchService.webSearch(request.getQuery());
        return ApiResponse.success(Map.of("summary", summary));
    }

    @PostMapping("/unified")
    public ApiResponse<Map<String, Object>> unifiedSearch(@Valid @RequestBody SearchRequest request) {
        // Run local search and web search in parallel for better performance
        CompletableFuture<List<KnowledgeVO>> localFuture = CompletableFuture
                .supplyAsync(() -> searchService.hybridSearch(
                        request.getQuery(),
                        request.getLimit(),
                        request.getThreshold()));

        CompletableFuture<String> webFuture = CompletableFuture
                .supplyAsync(() -> searchService.webSearchWithNews(request.getQuery()));

        // Wait for both to complete
        List<KnowledgeVO> localResults = localFuture.join();
        String webSummary = webFuture.join();

        // Always return both local results and web summary
        // Frontend can display both sections
        if (!localResults.isEmpty() && (webSummary == null || webSummary.isBlank())) {
            return ApiResponse.success(Map.of(
                    "results", localResults,
                    "total", localResults.size(),
                    "source", "local"));
        }

        if (localResults.isEmpty() && webSummary != null && !webSummary.isBlank()) {
            return ApiResponse.success(Map.of(
                    "results", List.of(),
                    "total", 0,
                    "source", "web",
                    "summary", webSummary));
        }

        // Both have results - return combined
        return ApiResponse.success(Map.of(
                "results", localResults,
                "total", localResults.size(),
                "source", "combined",
                "summary", webSummary != null ? webSummary : ""));
    }
}