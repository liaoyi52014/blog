package com.blog.repository;

import com.blog.model.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByStatusOrderByCreatedAtDesc(String status);

    List<Project> findAllByOrderByCreatedAtDesc();
}
