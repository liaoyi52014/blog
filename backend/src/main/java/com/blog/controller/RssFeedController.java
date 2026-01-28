package com.blog.controller;

import com.blog.model.dto.RssFeedImportResult;
import com.blog.model.entity.RssFeed;
import com.blog.service.RssFeedService;
import com.blog.util.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/rss/feeds")
public class RssFeedController {

    private static final Logger log = LoggerFactory.getLogger(RssFeedController.class);

    private final RssFeedService rssFeedService;

    public RssFeedController(RssFeedService rssFeedService) {
        this.rssFeedService = rssFeedService;
    }

    @GetMapping
    public ApiResponse<List<RssFeed>> list() {
        return ApiResponse.success(rssFeedService.listAll());
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<RssFeedImportResult> importFromUpload(@RequestParam("file") MultipartFile file) {
        try {
            return ApiResponse.success(rssFeedService.importFromUpload(file));
        } catch (Exception ex) {
            log.error("RSS feed import failed.", ex);
            return ApiResponse.failure(500, ex.getMessage());
        }
    }
}
