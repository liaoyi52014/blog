package com.blog.repository;

import com.blog.model.entity.RssFeed;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RssFeedRepository extends JpaRepository<RssFeed, Long> {
}