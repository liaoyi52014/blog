package com.blog.repository;

import com.blog.model.entity.Article;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    List<Article> findTop10ByStatusOrderByCreatedAtDesc(String status);
}