package com.blog.controller;

import com.blog.model.dto.ProjectCreateRequest;
import com.blog.model.entity.Project;
import com.blog.service.ProjectService;
import com.blog.util.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ApiResponse<List<Project>> listAll() {
        return ApiResponse.success(projectService.listAll());
    }

    @GetMapping("/active")
    public ApiResponse<List<Project>> listActive() {
        return ApiResponse.success(projectService.listActive());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Project>> getById(@PathVariable Long id) {
        return projectService.getById(id)
                .map(project -> ResponseEntity.ok(ApiResponse.success(project)))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.failure(404, "项目不存在")));
    }

    @PostMapping
    public ApiResponse<Project> create(@Valid @RequestBody ProjectCreateRequest request) {
        return ApiResponse.success(projectService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Project>> update(@PathVariable Long id, @RequestBody Project project) {
        return projectService.update(id, project)
                .map(updated -> ResponseEntity.ok(ApiResponse.success(updated)))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.failure(404, "项目不存在")));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Project>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || !isValidStatus(status)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(400, "无效的状态值"));
        }
        return projectService.updateStatus(id, status)
                .map(project -> ResponseEntity.ok(ApiResponse.success(project)))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.failure(404, "项目不存在")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> delete(@PathVariable Long id) {
        boolean deleted = projectService.delete(id);
        if (!deleted) {
            return ResponseEntity.status(404).body(ApiResponse.failure(404, "项目不存在"));
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of("deleted", true)));
    }

    private boolean isValidStatus(String status) {
        return "ACTIVE".equals(status) || "COMPLETED".equals(status) || "ARCHIVED".equals(status);
    }
}
