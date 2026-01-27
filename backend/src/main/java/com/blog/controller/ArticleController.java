package com.blog.controller;

import com.blog.model.entity.Article;
import com.blog.service.ArticleService;
import com.blog.util.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleService articleService;

    public ArticleController(ArticleService articleService) {
        this.articleService = articleService;
    }

    @GetMapping
    public ApiResponse<List<Article>> list() {
        return ApiResponse.success(articleService.listAll());
    }

    @GetMapping("/published")
    public ApiResponse<List<Article>> listPublished() {
        return ApiResponse.success(articleService.listPublished());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Article>> get(@PathVariable Long id) {
        return articleService.getById(id)
            .map(article -> ResponseEntity.ok(ApiResponse.success(article)))
            .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.failure(404, "article not found")));
    }

    @PostMapping
    public ApiResponse<Article> create(@RequestBody Article article) {
        return ApiResponse.success(articleService.create(article));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Article>> update(@PathVariable Long id, @RequestBody Article article) {
        return articleService.update(id, article)
            .map(updated -> ResponseEntity.ok(ApiResponse.success(updated)))
            .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.failure(404, "article not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> delete(@PathVariable Long id) {
        boolean deleted = articleService.delete(id);
        if (!deleted) {
            return ResponseEntity.status(404).body(ApiResponse.failure(404, "article not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of("deleted", true)));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<Article>> publish(@PathVariable Long id) {
        return articleService.publish(id)
            .map(article -> ResponseEntity.ok(ApiResponse.success(article)))
            .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.failure(404, "article not found")));
    }
}