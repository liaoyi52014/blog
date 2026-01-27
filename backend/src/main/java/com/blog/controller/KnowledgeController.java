package com.blog.controller;

import com.blog.model.entity.KnowledgeBase;
import com.blog.service.KnowledgeService;
import com.blog.util.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}