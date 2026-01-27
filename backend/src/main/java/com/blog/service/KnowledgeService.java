package com.blog.service;

import com.blog.model.entity.KnowledgeBase;
import com.blog.repository.KnowledgeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class KnowledgeService {

    private final KnowledgeRepository knowledgeRepository;

    public KnowledgeService(KnowledgeRepository knowledgeRepository) {
        this.knowledgeRepository = knowledgeRepository;
    }

    public List<KnowledgeBase> listAll() {
        return knowledgeRepository.findAll();
    }

    public Optional<KnowledgeBase> getById(Long id) {
        return knowledgeRepository.findById(id);
    }
}