package com.blog.model.dto;

import com.blog.model.vo.KnowledgeVO;

import java.util.ArrayList;
import java.util.List;

public class ChatResponse {

    private String answer;
    private List<KnowledgeVO> sources = new ArrayList<>();

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public List<KnowledgeVO> getSources() {
        return sources == null ? new ArrayList<>() : sources;
    }

    public void setSources(List<KnowledgeVO> sources) {
        if (sources == null) {
            this.sources = new ArrayList<>();
        } else {
            this.sources = new ArrayList<>(sources);
        }
    }
}
