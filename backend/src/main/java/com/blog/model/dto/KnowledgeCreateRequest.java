package com.blog.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class KnowledgeCreateRequest {

    @NotBlank(message = "标题不能为空")
    @Size(max = 500)
    private String title;

    @NotBlank(message = "内容不能为空")
    private String content;

    private String sourceUrl;

    public KnowledgeCreateRequest() {
    }

    public KnowledgeCreateRequest(String title, String content, String sourceUrl) {
        this.title = title;
        this.content = content;
        this.sourceUrl = sourceUrl;
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

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }
}
