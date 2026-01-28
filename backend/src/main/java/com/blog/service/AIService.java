package com.blog.service;

import com.blog.model.vo.KnowledgeVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Random;

@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);
    private static final int EMBEDDING_DIMENSION = 768;
    private static final int MAX_CONTEXT_CHARS = 4000;
    private static final int MAX_SNIPPET_CHARS = 480;

    private final ChatClient chatClient;
    private final EmbeddingModel embeddingModel;

    public AIService(
        ObjectProvider<ChatClient.Builder> chatClientBuilderProvider,
        ObjectProvider<EmbeddingModel> embeddingModelProvider
    ) {
        ChatClient.Builder builder = chatClientBuilderProvider.getIfAvailable();
        this.chatClient = builder != null ? builder.build() : null;
        this.embeddingModel = embeddingModelProvider.getIfAvailable();

        if (this.chatClient == null) {
            log.warn("ChatClient.Builder not available; AI summary will use fallback logic.");
        }
        if (this.embeddingModel == null) {
            log.warn("EmbeddingModel not available; embeddings will use fallback logic.");
        }
    }

    /**
     * Generate a concise summary. Uses ChatClient when available.
     */
    public String generateSummary(String content) {
        if (content == null || content.isBlank()) {
            return "";
        }

        if (chatClient != null) {
            try {
                return chatClient.prompt()
                    .system("You are a precise technical editor. Summarize the input in under 200 Chinese characters.")
                    .user(content)
                    .call()
                    .content();
            } catch (Exception ex) {
                log.warn("ChatClient summary failed, falling back to local summary: {}", ex.getMessage());
            }
        }

        return fallbackSummary(content);
    }

    /**
     * Generate embeddings. Uses EmbeddingModel when available.
     */
    public float[] generateEmbedding(String text) {
        if (text == null || text.isBlank()) {
            return new float[0];
        }

        if (embeddingModel != null) {
            try {
                return embeddingModel.embed(text);
            } catch (Exception ex) {
                log.warn("EmbeddingModel failed, falling back to deterministic embedding: {}", ex.getMessage());
            }
        }

        return fallbackEmbedding(text);
    }

    /**
     * Placeholder web search + summarize. Currently summarizes the query intent.
     */
    public String searchAndSummarize(String query) {
        if (query == null || query.isBlank()) {
            return "";
        }

        if (chatClient != null) {
            try {
                return chatClient.prompt()
                    .system("You are a research assistant. Provide a short, direct summary of what to look for.")
                    .user("Summarize the key research directions for: " + query)
                    .call()
                    .content();
            } catch (Exception ex) {
                log.warn("ChatClient web summary failed, falling back: {}", ex.getMessage());
            }
        }

        return "Web search is not yet wired. Query: " + query;
    }

    public String generateKnowledgeAnswer(String question, List<KnowledgeVO> sources) {
        if (question == null || question.isBlank()) {
            return "";
        }

        String context = buildContext(sources);
        if (chatClient != null) {
            try {
                return chatClient.prompt()
                    .system(
                        "You are a helpful assistant. Answer the question using the provided knowledge base snippets. "
                            + "If the answer is not in the snippets, say you do not know. "
                            + "Keep the answer concise and in Chinese."
                    )
                    .user("问题：" + question + "\n\n知识库片段：\n" + context)
                    .call()
                    .content();
            } catch (Exception ex) {
                log.warn("ChatClient knowledge answer failed, falling back: {}", ex.getMessage());
            }
        }

        if (context.isBlank()) {
            return "知识库暂无相关内容。";
        }
        return fallbackSummary(context);
    }

    private String fallbackSummary(String content) {
        int maxLength = Math.min(content.length(), 200);
        return content.substring(0, maxLength).trim();
    }

    private String buildContext(List<KnowledgeVO> sources) {
        if (sources == null || sources.isEmpty()) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        int index = 1;
        for (KnowledgeVO source : sources) {
            if (source == null) {
                continue;
            }
            String title = safeText(source.getTitle());
            String content = safeText(source.getContent());
            if (content.isBlank() && title.isBlank()) {
                continue;
            }
            builder.append("[").append(index).append("] ");
            if (!title.isBlank()) {
                builder.append(title).append("\n");
            }
            if (!content.isBlank()) {
                builder.append(truncate(content, MAX_SNIPPET_CHARS)).append("\n");
            }
            builder.append("\n");
            index++;
            if (builder.length() >= MAX_CONTEXT_CHARS) {
                break;
            }
        }
        if (builder.length() > MAX_CONTEXT_CHARS) {
            return builder.substring(0, MAX_CONTEXT_CHARS);
        }
        return builder.toString();
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    private float[] fallbackEmbedding(String text) {
        long seed = stableSeed(text);
        Random random = new Random(seed);
        float[] embedding = new float[EMBEDDING_DIMENSION];
        for (int i = 0; i < EMBEDDING_DIMENSION; i++) {
            embedding[i] = random.nextFloat();
        }
        return embedding;
    }

    private long stableSeed(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(text.getBytes(StandardCharsets.UTF_8));
            long seed = 0L;
            for (int i = 0; i < Math.min(8, digest.length); i++) {
                seed = (seed << 8) | (digest[i] & 0xff);
            }
            return seed;
        } catch (NoSuchAlgorithmException e) {
            return text.hashCode();
        }
    }
}
