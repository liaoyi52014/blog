package com.blog.model.dto;

public class ImportResult {

    private boolean success;
    private String message;
    private Long recordId;
    private String filename;
    private Integer chunksCount;
    private String status;

    public static ImportResult success(Long recordId, String filename, int chunksCount) {
        ImportResult result = new ImportResult();
        result.success = true;
        result.message = "import completed";
        result.recordId = recordId;
        result.filename = filename;
        result.chunksCount = chunksCount;
        result.status = "completed";
        return result;
    }

    public static ImportResult failure(String message) {
        ImportResult result = new ImportResult();
        result.success = false;
        result.message = message;
        result.status = "failed";
        return result;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public Long getRecordId() {
        return recordId;
    }

    public String getFilename() {
        return filename;
    }

    public Integer getChunksCount() {
        return chunksCount;
    }

    public String getStatus() {
        return status;
    }
}