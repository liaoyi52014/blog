package com.blog.service;

import com.blog.model.dto.RssFeedImportResult;
import com.blog.model.entity.RssFeed;
import com.blog.repository.RssFeedRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class RssFeedService {

    private static final Logger log = LoggerFactory.getLogger(RssFeedService.class);

    private static final int CATEGORY_MAX_LENGTH = 50;
    private static final int NAME_MAX_LENGTH = 200;
    private static final int MAX_ERROR_SAMPLES = 20;
    private static final String COMMENT_PREFIX = "#";

    private static final Pattern URL_PATTERN =
            Pattern.compile("^https?://\\S+$", Pattern.CASE_INSENSITIVE);

    private final RssFeedRepository rssFeedRepository;

    public RssFeedService(RssFeedRepository rssFeedRepository) {
        this.rssFeedRepository = rssFeedRepository;
    }

    public List<RssFeed> listAll() {
        return rssFeedRepository.findAll();
    }

    public RssFeedImportResult importFromUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("RSS file is empty.");
        }
        String sourceLabel = file.getOriginalFilename();
        if (sourceLabel == null || sourceLabel.isBlank()) {
            sourceLabel = "uploaded-feeds";
        }
        List<String> lines = readLines(file);
        return importFromLines(lines, sourceLabel);
    }

    private RssFeedImportResult importFromLines(List<String> lines, String sourceLabel) {
        if (lines == null) {
            lines = Collections.emptyList();
        }

        int total = 0;
        int created = 0;
        int updated = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();
        Set<String> seenUrls = new HashSet<>();

        String currentCategory = null;

        for (int i = 0; i < lines.size(); i++) {
            int lineNumber = i + 1;
            String rawLine = lines.get(i);
            String line = rawLine == null ? "" : rawLine.trim();

            if (line.isEmpty()) {
                continue;
            }

            if (line.startsWith(COMMENT_PREFIX)) {
                String comment = line.substring(1).trim();
                if (!comment.isEmpty() && !isUrl(comment)) {
                    currentCategory = normalizeCategory(comment);
                }
                continue;
            }

            if (!isUrl(line)) {
                skipped++;
                addError(errors, lineNumber, "invalid url: " + line);
                continue;
            }

            if (!seenUrls.add(line)) {
                skipped++;
                continue;
            }

            RssFeed existing = rssFeedRepository.findByUrl(line).orElse(null);
            if (existing != null) {
                skipped++;
                continue;
            }

            RssFeed feed = new RssFeed();
            feed.setUrl(line);
            feed.setName(deriveName(line));
            feed.setCategory(currentCategory);
            if (feed.getActive() == null) {
                feed.setActive(Boolean.TRUE);
            }

            rssFeedRepository.save(feed);
            created++;
            total++;
        }

        RssFeedImportResult result = new RssFeedImportResult();
        result.setSourceFile(sourceLabel);
        result.setTotal(total);
        result.setCreated(created);
        result.setUpdated(updated);
        result.setSkipped(skipped);
        result.setErrors(errors);

        if (!errors.isEmpty()) {
            log.warn("RSS feed import completed with {} issue(s).", errors.size());
        }

        return result;
    }

    private List<String> readLines(MultipartFile file) {
        List<String> lines = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                lines.add(line);
            }
        } catch (IOException ex) {
            log.error("Failed to read RSS feeds upload: {}", file.getOriginalFilename(), ex);
            throw new IllegalStateException("Failed to read RSS feeds upload.", ex);
        }
        return lines;
    }

    private void addError(List<String> errors, int lineNumber, String message) {
        if (errors.size() >= MAX_ERROR_SAMPLES) {
            return;
        }
        errors.add("line " + lineNumber + ": " + message);
    }

    private boolean isUrl(String value) {
        return URL_PATTERN.matcher(value).matches();
    }

    private String normalizeCategory(String value) {
        String normalized = value.trim();
        if (normalized.isEmpty()) {
            return null;
        }
        if (normalized.length() > CATEGORY_MAX_LENGTH) {
            return normalized.substring(0, CATEGORY_MAX_LENGTH);
        }
        return normalized;
    }

    private String deriveName(String url) {
        try {
            URI uri = URI.create(url);
            String host = uri.getHost();
            String path = uri.getPath();
            String query = uri.getQuery();

            String base = host == null ? url : host.toLowerCase(Locale.ROOT);
            String suffix = pickSuffix(path, query);
            String name = suffix == null || suffix.isBlank() ? base : base + " - " + suffix;
            return truncate(name, NAME_MAX_LENGTH);
        } catch (Exception ex) {
            return truncate(url, NAME_MAX_LENGTH);
        }
    }

    private String pickSuffix(String path, String query) {
        if (query != null && !query.isBlank()) {
            return query;
        }
        if (path == null || path.isBlank() || "/".equals(path)) {
            return null;
        }
        String[] parts = path.split("/");
        for (int i = parts.length - 1; i >= 0; i--) {
            if (!parts[i].isBlank()) {
                return parts[i];
            }
        }
        return null;
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
