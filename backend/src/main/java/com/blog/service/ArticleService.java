package com.blog.service;

import com.blog.model.dto.ArticleCreateRequest;
import com.blog.model.entity.Article;
import com.blog.repository.ArticleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final AIService aiService;

    public ArticleService(ArticleRepository articleRepository, AIService aiService) {
        this.articleRepository = articleRepository;
        this.aiService = aiService;
    }

    public List<Article> listPublished() {
        return articleRepository.findTop10ByStatusOrderByCreatedAtDesc("published");
    }

    public List<Article> listAll() {
        return articleRepository.findAll();
    }

    public Optional<Article> getById(Long id) {
        return articleRepository.findById(id);
    }

    @Transactional
    public Article create(Article article) {
        if (article.getSummary() == null || article.getSummary().isBlank()) {
            article.setSummary(aiService.generateSummary(article.getContent()));
        }
        return articleRepository.save(article);
    }

    @Transactional
    public Article createManual(ArticleCreateRequest request) {
        Article article = new Article();
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setAuthor(request.getAuthor());
        article.setCategory(request.getCategory());
        article.setTags(request.getTags());
        article.setSource("original");

        if (request.getSummary() == null || request.getSummary().isBlank()) {
            article.setSummary(aiService.generateSummary(request.getContent()));
        } else {
            article.setSummary(request.getSummary());
        }

        boolean publishNow = request.getPublish() == null || request.getPublish();
        if (publishNow) {
            article.setStatus("published");
            article.setPublishedAt(LocalDateTime.now());
        } else {
            article.setStatus("draft");
            article.setPublishedAt(null);
        }

        return articleRepository.save(article);
    }

    @Transactional
    public Optional<Article> update(Long id, Article updated) {
        return articleRepository.findById(id).map(existing -> {
            existing.setTitle(updated.getTitle());
            existing.setContent(updated.getContent());
            existing.setSummary(updated.getSummary());
            existing.setAuthor(updated.getAuthor());
            existing.setCategory(updated.getCategory());
            existing.setTags(updated.getTags());
            existing.setSource(updated.getSource());
            existing.setStatus(updated.getStatus());
            return articleRepository.save(existing);
        });
    }

    @Transactional
    public boolean delete(Long id) {
        if (!articleRepository.existsById(id)) {
            return false;
        }
        articleRepository.deleteById(id);
        return true;
    }

    @Transactional
    public Optional<Article> publish(Long id) {
        return articleRepository.findById(id).map(article -> {
            article.setStatus("published");
            article.setPublishedAt(LocalDateTime.now());
            return articleRepository.save(article);
        });
    }
}
