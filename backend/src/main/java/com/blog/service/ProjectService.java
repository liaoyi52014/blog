package com.blog.service;

import com.blog.model.dto.ProjectCreateRequest;
import com.blog.model.entity.Project;
import com.blog.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<Project> listAll() {
        return projectRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Project> listActive() {
        return projectRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
    }

    public Optional<Project> getById(Long id) {
        return projectRepository.findById(id);
    }

    @Transactional
    public Project create(ProjectCreateRequest request) {
        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setColor(request.getColor() != null ? request.getColor() : "#00C9A7");
        project.setStatus("ACTIVE");
        return projectRepository.save(project);
    }

    @Transactional
    public Optional<Project> update(Long id, Project updated) {
        return projectRepository.findById(id).map(project -> {
            if (updated.getName() != null) {
                project.setName(updated.getName());
            }
            if (updated.getDescription() != null) {
                project.setDescription(updated.getDescription());
            }
            if (updated.getStartDate() != null) {
                project.setStartDate(updated.getStartDate());
            }
            if (updated.getEndDate() != null) {
                project.setEndDate(updated.getEndDate());
            }
            if (updated.getStatus() != null) {
                project.setStatus(updated.getStatus());
            }
            if (updated.getColor() != null) {
                project.setColor(updated.getColor());
            }
            return projectRepository.save(project);
        });
    }

    @Transactional
    public Optional<Project> updateStatus(Long id, String status) {
        return projectRepository.findById(id).map(project -> {
            project.setStatus(status);
            return projectRepository.save(project);
        });
    }

    @Transactional
    public boolean delete(Long id) {
        if (projectRepository.existsById(id)) {
            projectRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
