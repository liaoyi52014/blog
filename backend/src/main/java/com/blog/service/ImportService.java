package com.blog.service;

import com.blog.model.dto.ImportResult;
import com.blog.model.entity.ImportRecord;
import com.blog.model.entity.KnowledgeBase;
import com.blog.parser.MarkdownParser;
import com.blog.parser.PDFParser;
import com.blog.parser.WordParser;
import com.blog.repository.ImportRecordRepository;
import com.blog.repository.KnowledgeRepository;
import com.blog.util.TextChunker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ImportService {

    private final WordParser wordParser;
    private final PDFParser pdfParser;
    private final MarkdownParser markdownParser;
    private final AIService aiService;
    private final KnowledgeRepository knowledgeRepository;
    private final ImportRecordRepository importRecordRepository;

    public ImportService(
        WordParser wordParser,
        PDFParser pdfParser,
        MarkdownParser markdownParser,
        AIService aiService,
        KnowledgeRepository knowledgeRepository,
        ImportRecordRepository importRecordRepository
    ) {
        this.wordParser = wordParser;
        this.pdfParser = pdfParser;
        this.markdownParser = markdownParser;
        this.aiService = aiService;
        this.knowledgeRepository = knowledgeRepository;
        this.importRecordRepository = importRecordRepository;
    }

    @Transactional
    public ImportResult importDocument(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            return ImportResult.failure("filename is missing");
        }

        String fileType;
        try {
            fileType = getFileType(filename);
        } catch (IllegalArgumentException ex) {
            return ImportResult.failure(ex.getMessage());
        }

        ImportRecord record = new ImportRecord();
        record.setFilename(filename);
        record.setFileType(fileType);
        record.setFileSize(file.getSize());
        record.setStatus("processing");
        record = importRecordRepository.save(record);

        try {
            String content = parseDocument(file, fileType);
            List<String> chunks = TextChunker.split(content, 500);

            for (int i = 0; i < chunks.size(); i++) {
                String chunk = chunks.get(i);
                float[] embedding = aiService.generateEmbedding(chunk);

                KnowledgeBase kb = new KnowledgeBase();
                kb.setTitle(filename);
                kb.setContent(content);
                kb.setChunkContent(chunk);
                kb.setChunkIndex(i);
                kb.setParentId(record.getId());
                kb.setEmbedding(embedding);
                kb.setSourceType(fileType);

                knowledgeRepository.save(kb);
            }

            record.setChunksCount(chunks.size());
            record.setStatus("completed");
            record.setCompletedAt(LocalDateTime.now());
            importRecordRepository.save(record);

            return ImportResult.success(record.getId(), filename, chunks.size());
        } catch (Exception e) {
            record.setStatus("failed");
            record.setErrorMessage(e.getMessage());
            record.setCompletedAt(LocalDateTime.now());
            importRecordRepository.save(record);
            return ImportResult.failure(e.getMessage());
        }
    }

    public List<ImportRecord> listRecords() {
        return importRecordRepository.findAll();
    }

    public ImportRecord getRecord(Long id) {
        return importRecordRepository.findById(id).orElse(null);
    }

    private String parseDocument(MultipartFile file, String fileType) throws IOException {
        return switch (fileType) {
            case "word" -> wordParser.parse(file.getInputStream());
            case "pdf" -> pdfParser.parse(file.getInputStream());
            case "markdown" -> markdownParser.parse(file.getInputStream());
            default -> throw new IllegalArgumentException("Unsupported file type");
        };
    }

    private String getFileType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
            return "word";
        }
        if (lower.endsWith(".pdf")) {
            return "pdf";
        }
        if (lower.endsWith(".md")) {
            return "markdown";
        }
        throw new IllegalArgumentException("Unsupported file type: " + filename);
    }
}