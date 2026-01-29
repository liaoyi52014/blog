package com.blog.model.dto;

import java.util.Collections;
import java.util.List;

public class RssFeedImportResult {

    private String sourceFile;
    private int total;
    private int created;
    private int updated;
    private int skipped;
    private List<String> errors = Collections.emptyList();

    public String getSourceFile() {
        return sourceFile;
    }

    public void setSourceFile(String sourceFile) {
        this.sourceFile = sourceFile;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getCreated() {
        return created;
    }

    public void setCreated(int created) {
        this.created = created;
    }

    public int getUpdated() {
        return updated;
    }

    public void setUpdated(int updated) {
        this.updated = updated;
    }

    public int getSkipped() {
        return skipped;
    }

    public void setSkipped(int skipped) {
        this.skipped = skipped;
    }

    public List<String> getErrors() {
        return errors == null ? Collections.emptyList() : errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors == null ? Collections.emptyList() : List.copyOf(errors);
    }
}
