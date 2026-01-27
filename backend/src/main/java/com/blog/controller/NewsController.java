package com.blog.controller;

import com.blog.model.entity.AINews;
import com.blog.service.NewsService;
import com.blog.util.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/news")
public class NewsController {

    private final NewsService newsService;

    public NewsController(NewsService newsService) {
        this.newsService = newsService;
    }

    @GetMapping
    public ApiResponse<List<AINews>> listLatest() {
        return ApiResponse.success(newsService.listLatest());
    }

    @GetMapping("/featured")
    public ApiResponse<List<AINews>> listFeatured() {
        return ApiResponse.success(newsService.listFeatured());
    }
}