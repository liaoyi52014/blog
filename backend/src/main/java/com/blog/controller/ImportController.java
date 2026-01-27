package com.blog.controller;

import com.blog.model.dto.ImportResult;
import com.blog.model.entity.ImportRecord;
import com.blog.service.ImportService;
import com.blog.util.ApiResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/import")
public class ImportController {

    private final ImportService importService;

    public ImportController(ImportService importService) {
        this.importService = importService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ImportResult> upload(@RequestPart("file") MultipartFile file) {
        return ApiResponse.success(importService.importDocument(file));
    }

    @GetMapping("/records")
    public ApiResponse<List<ImportRecord>> listRecords() {
        return ApiResponse.success(importService.listRecords());
    }

    @GetMapping("/records/{id}")
    public ApiResponse<ImportRecord> getRecord(@PathVariable Long id) {
        ImportRecord record = importService.getRecord(id);
        if (record == null) {
            return ApiResponse.failure(404, "record not found");
        }
        return ApiResponse.success(record);
    }
}