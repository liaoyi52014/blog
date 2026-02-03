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

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import java.net.URLEncoder;
import java.io.IOException;

@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);
    private static final int EMBEDDING_DIMENSION = 1024;
    private static final int MAX_CONTEXT_CHARS = 4000;
    private static final int MAX_SNIPPET_CHARS = 480;

    private final ChatClient chatClient;
    private final EmbeddingModel embeddingModel;

    public AIService(
            ObjectProvider<ChatClient.Builder> chatClientBuilderProvider,
            ObjectProvider<EmbeddingModel> embeddingModelProvider) {
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

        // Perform actual web search
        String searchContext = performWebSearch(query);

        if (chatClient != null) {
            try {
                return chatClient.prompt()
                        .system("You are a research assistant. Provide a short, direct summary based on the provided search results.")
                        .user("Query: " + query + "\n\nSearch Results:\n" + searchContext)
                        .call()
                        .content();
            } catch (Exception ex) {
                log.warn("ChatClient web summary failed, falling back: {}", ex.getMessage());
            }
        }

        return "Web search results for: " + query + "\n\n" + searchContext;
    }

    /**
     * Search for news and provide a summary with source attribution.
     * Uses AI to generate a comprehensive news summary based on the query.
     */
    public String searchNewsWithSources(String query) {
        if (query == null || query.isBlank()) {
            return "";
        }

        // Strategy to improve relevance for tech topics:
        // 1. Search for original query
        // 2. Search for query + " AI" (if not already present)
        // Combine results
        StringBuilder combinedResults = new StringBuilder();

        String searchResults1 = performWebSearch(query);
        combinedResults.append("--- Search Query: ").append(query).append(" ---\n");
        combinedResults.append(searchResults1).append("\n\n");

        if (!query.toLowerCase().contains("ai")) {
            String queryAi = query + " AI";
            String searchResults2 = performWebSearch(queryAi);
            combinedResults.append("--- Search Query: ").append(queryAi).append(" ---\n");
            combinedResults.append(searchResults2).append("\n\n");
        }

        if (chatClient != null) {
            try {
                // Include current date to help AI focus on latest information
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter
                        .ofPattern("yyyy年MM月dd日 HH:mm");
                String currentTime = now.format(formatter);

                String systemPrompt = """
                        你是一个专业的新闻研究助手。当前时间是：%s

                        请基于以下提供的【真实网络搜索结果】，总结关于用户查询的最新新闻和资讯。
                        如果搜索结果中包含特定软件、游戏或项目的具体信息，请准确描述，不要编造。

                        用户查询: %s

                        【搜索策略说明】
                        为了获取更准确的结果，系统分别搜索了"%s"和"%s AI"（如果是科技相关词汇）。请综合这两部分结果进行回答。
                        如果结果中包含官方网站或项目主页，请优先提及。

                        搜索结果：
                        %s

                        请按以下格式回复：

                        ## 📰 相关新闻摘要（截至 %s）

                        [基于搜索结果，总结与该话题相关的最新动态和重要信息，大约200-300字。如果搜索结果显示是关于某个具体项目（如OpenClaw重制版游戏、OpenClaw AI等），请准确说明其性质]

                        ## 🔗 建议查看的来源

                        [列出搜索结果中提到的网站，特别是官方网站、GitHub仓库或权威新闻源]

                        ## 💡 关键要点

                        - 要点1
                        - 要点2
                        - 要点3

                        ⚠️ **时效性提醒**：以上信息基于实时网络搜索结果摘要。
                        """.formatted(currentTime, query, query, query + " AI", combinedResults.toString(),
                        currentTime);

                return chatClient.prompt()
                        .system(systemPrompt)
                        .user("请搜索并总结关于以下话题的最新新闻和资讯（特别关注最近发生的事件）：" + query)
                        .call()
                        .content();
            } catch (Exception ex) {
                log.warn("ChatClient news search failed, falling back: {}", ex.getMessage());
                return "AI服务暂时不可用，以下是原始搜索结果：\n\n" + combinedResults.toString();
            }
        }

        return "## 📰 搜索结果 (无AI总结)\n\n" + combinedResults.toString();
    }

    private String performWebSearch(String query) {
        StringBuilder sb = new StringBuilder();

        // 1. Try scraping cn.bing.com (Web Search)
        try {
            String searchUrl = "https://cn.bing.com/search?q=" + URLEncoder.encode(query, StandardCharsets.UTF_8);

            Document doc = Jsoup.connect(searchUrl)
                    .userAgent(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
                    .header("Cookie", "SRCHHPGUSR=CW=1600&CH=900; _EDGE_S=F=1; MUIDB=1")
                    .timeout(6000)
                    .get();

            Elements results = doc.select("li.b_algo");
            int count = 0;

            for (Element result : results) {
                if (count >= 6)
                    break;
                Element titleEl = result.selectFirst("h2 a");
                Element snippetEl = result.selectFirst(".b_caption p");
                if (snippetEl == null)
                    snippetEl = result.selectFirst(".b_algoSlug");

                if (titleEl != null) {
                    sb.append(count + 1).append(". ").append(titleEl.text()).append("\n");
                    if (snippetEl != null) {
                        sb.append("   Snippet: ").append(snippetEl.text()).append("\n");
                    }
                    String url = titleEl.attr("href");
                    if (url != null && !url.isEmpty()) {
                        sb.append("   Source: ").append(url).append("\n");
                    }
                    sb.append("\n");
                    count++;
                }
            }
        } catch (Exception e) {
            log.warn("Bing Web Search (cn.bing.com) failed: {}", e.getMessage());
        }

        // 2. Fallback: Try Bing News RSS if web scraping yielded no results
        if (sb.length() == 0) {
            try {
                String rssUrl = "https://cn.bing.com/news/search?q=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                        + "&format=rss";
                Document rssDoc = Jsoup.connect(rssUrl)
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                        .parser(org.jsoup.parser.Parser.xmlParser())
                        .timeout(6000)
                        .get();

                Elements items = rssDoc.select("item");
                int count = 0;
                sb.append("--- Bing News RSS Fallback results ---\n");

                for (Element item : items) {
                    if (count >= 6)
                        break;
                    String title = item.select("title").text();
                    String link = item.select("link").text();
                    String desc = item.select("description").text(); // RSS desc might be HTML

                    if (!title.isEmpty()) {
                        sb.append(count + 1).append(". ").append(title).append("\n");
                        if (!desc.isEmpty()) {
                            // Strip basic HTML from desc if present
                            sb.append("   Snippet: ").append(Jsoup.parse(desc).text()).append("\n");
                        }
                        sb.append("   Source: ").append(link).append("\n\n");
                        count++;
                    }
                }
            } catch (Exception e) {
                log.warn("Bing News RSS failed: {}", e.getMessage());
                return "搜索服务全线繁忙 (Bing/RSS 均无法连接)。错误: " + e.getMessage();
            }
        }

        if (sb.length() == 0) {
            return "未找到相关搜索结果 (Web/News)。";
        }

        return sb.toString();
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
                                        + "Keep the answer concise and in Chinese.")
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
