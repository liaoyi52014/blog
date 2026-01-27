package com.blog.model.vo;

public class KnowledgeVO {

    private Long id;
    private String title;
    private String content;
    private Double similarity;
    private String source;

    public KnowledgeVO() {
    }

    public KnowledgeVO(Long id, String title, String content, Double similarity, String source) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.similarity = similarity;
        this.source = source;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Double getSimilarity() {
        return similarity;
    }

    public void setSimilarity(Double similarity) {
        this.similarity = similarity;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}