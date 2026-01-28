package com.blog.repository;

import com.blog.model.entity.RssFeed;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RssFeedRepository extends JpaRepository<RssFeed, Long> {

    Optional<RssFeed> findByUrl(String url);
}
