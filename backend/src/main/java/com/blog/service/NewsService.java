package com.blog.service;

import com.blog.model.entity.AINews;
import com.blog.repository.AINewsRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NewsService {

    private final AINewsRepository aiNewsRepository;

    public NewsService(AINewsRepository aiNewsRepository) {
        this.aiNewsRepository = aiNewsRepository;
    }

    public List<AINews> listLatest() {
        return aiNewsRepository.findTop20ByOrderByPublishedAtDesc();
    }

    public List<AINews> listFeatured() {
        return aiNewsRepository.findTop10ByFeaturedTrueOrderByPublishedAtDesc();
    }
}