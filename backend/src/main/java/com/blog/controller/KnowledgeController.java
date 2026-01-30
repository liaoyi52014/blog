package com.blog.controller;

import com.blog.model.dto.KnowledgeCreateRequest;
import com.blog.model.entity.KnowledgeBase;
import com.blog.service.KnowledgeService;
import com.blog.util.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    public KnowledgeController(KnowledgeService knowledgeService) {
        this.knowledgeService = knowledgeService;
    }

    @GetMapping
    public ApiResponse<List<KnowledgeBase>> list() {
        return ApiResponse.success(knowledgeService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<KnowledgeBase>> get(@PathVariable Long id) {
        return knowledgeService.getById(id)
                .map(kb -> ResponseEntity.ok(ApiResponse.success(kb)))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.failure(404, "knowledge not found")));
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@Valid @RequestBody KnowledgeCreateRequest request) {
        knowledgeService.createFromExternal(
                request.getTitle(),
                request.getContent(),
                request.getSourceUrl());
        return ApiResponse.success(Map.of(
                "success", true,
                "message", "知识已成功添加到知识库"));
    }

    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> update(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String content = request.get("content");
        if (content == null || content.isBlank()) {
            return ApiResponse.failure(400, "内容不能为空");
        }
        knowledgeService.updateContent(id, content);
        return ApiResponse.success(Map.of(
                "success", true,
                "message", "知识库已更新"));
    }
}