package com.blog.controller;

import com.blog.model.dto.ScheduleCreateRequest;
import com.blog.model.entity.Schedule;
import com.blog.service.ScheduleService;
import com.blog.util.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping
    public ApiResponse<List<Schedule>> listByDate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate queryDate = date != null ? date : LocalDate.now();
        return ApiResponse.success(scheduleService.listByDate(queryDate));
    }

    @GetMapping("/today")
    public ApiResponse<List<Schedule>> listTodayPending() {
        return ApiResponse.success(scheduleService.listTodayPending());
    }

    @GetMapping("/range")
    public ApiResponse<List<Schedule>> listByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ApiResponse.success(scheduleService.listByDateRange(start, end));
    }

    @GetMapping("/project/{projectId}")
    public ApiResponse<List<Schedule>> listByProject(@PathVariable Long projectId) {
        return ApiResponse.success(scheduleService.listByProjectId(projectId));
    }

    @GetMapping("/project/{projectId}/active")
    public ApiResponse<List<Schedule>> listActiveByProject(@PathVariable Long projectId) {
        return ApiResponse.success(scheduleService.listActiveByProjectId(projectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Schedule>> getById(@PathVariable Long id) {
        return scheduleService.getById(id)
                .map(schedule -> ResponseEntity.ok(ApiResponse.success(schedule)))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.failure(404, "日程不存在")));
    }

    @PostMapping
    public ApiResponse<Schedule> create(@Valid @RequestBody ScheduleCreateRequest request) {
        return ApiResponse.success(scheduleService.create(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Schedule>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || !isValidStatus(status)) {
            return ResponseEntity.badRequest().body(ApiResponse.failure(400, "无效的状态值"));
        }
        return scheduleService.updateStatus(id, status)
                .map(schedule -> ResponseEntity.ok(ApiResponse.success(schedule)))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.failure(404, "日程不存在")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Schedule>> update(@PathVariable Long id, @RequestBody Schedule schedule) {
        return scheduleService.update(id, schedule)
                .map(updated -> ResponseEntity.ok(ApiResponse.success(updated)))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.failure(404, "日程不存在")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> delete(@PathVariable Long id) {
        boolean deleted = scheduleService.delete(id);
        if (!deleted) {
            return ResponseEntity.status(404).body(ApiResponse.failure(404, "日程不存在"));
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of("deleted", true)));
    }

    private boolean isValidStatus(String status) {
        return "PENDING".equals(status) || "IN_PROGRESS".equals(status) || "COMPLETED".equals(status);
    }
}
