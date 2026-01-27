package com.blog.repository;

import com.blog.model.entity.AINews;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AINewsRepository extends JpaRepository<AINews, Long> {

    List<AINews> findTop10ByFeaturedTrueOrderByPublishedAtDesc();

    List<AINews> findTop20ByOrderByPublishedAtDesc();
}