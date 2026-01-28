# 个人科技圈博客系统设计文档

## 1. 项目概述

### 1.1 项目简介
基于AI技术的个人科技博客平台，集成知识管理、智能检索和内容总结功能。系统支持多格式文档导入，利用向量数据库实现语义检索，并通过大语言模型提供智能内容总结。

### 1.2 核心特性
- AI资讯聚合与展示
- 个人知识库管理
- 全网知识检索与总结
- 向量语义检索
- 多格式文档导入（Word、PDF、Markdown）
- 智能内容总结

### 1.3 技术栈
- **后端**: Java 17 + Spring Boot 3.x + Spring AI Alibaba
- **前端**: React 18+ + TypeScript
- **AI模型**:
  - 文本生成: Gemini 3.0
  - 向量嵌入: gemini-embedding-001
- **数据库**:
  - PostgreSQL 15+ (with pgvector extension)
  - Redis (缓存)
- **文档解析**: Apache POI (Word), Apache PDFBox (PDF), CommonMark (Markdown)

## 2. 系统架构

### 2.1 整体架构
```
┌─────────────────────────────────────────────────────────┐
│                      前端层 (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ 首页展示 │  │ 知识检索 │  │ 文档导入 │  │ 知识库  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                          │ REST API
┌─────────────────────────────────────────────────────────┐
│                  应用层 (Spring Boot)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ 内容服务 │  │ 检索服务 │  │ 导入服务 │  │ AI服务  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                      数据层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │  文件存储    │  │
│  │  (pgvector)  │  │   (缓存)     │  │   (本地/OSS) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                    外部服务层                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Gemini API  │  │  网络爬虫    │  │  RSS聚合     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 核心模块

#### 2.2.1 内容管理模块
- 博客文章CRUD
- AI资讯聚合
- 内容分类与标签
- 内容发布与草稿管理

#### 2.2.2 知识检索模块
- 向量语义检索
- 全文检索
- 混合检索（向量+关键词）
- 检索结果排序与过滤

#### 2.2.3 文档导入模块
- Word文档解析（.doc, .docx）
- PDF文档解析
- Markdown文档解析
- 文档内容提取与清洗
- 自动分块与向量化

#### 2.2.4 AI服务模块
- 内容总结生成
- 向量嵌入生成
- 全网知识检索与总结
- 智能问答

#### 2.2.5 爬虫与聚合模块
- RSS订阅源管理
- 网页内容抓取
- AI资讯聚合
- 定时任务调度

## 3. 数据库设计

### 3.1 核心表结构

#### 3.1.1 文章表 (articles)
```sql
CREATE TABLE articles (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    author VARCHAR(100),
    category VARCHAR(50),
    tags VARCHAR(200),
    source VARCHAR(100), -- 'original', 'imported', 'aggregated'
    status VARCHAR(20), -- 'draft', 'published', 'archived'
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
```

#### 3.1.2 知识库表 (knowledge_base)
```sql
CREATE TABLE knowledge_base (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    chunk_content TEXT NOT NULL, -- 分块后的内容
    chunk_index INTEGER, -- 块索引
    parent_id BIGINT, -- 父文档ID
    embedding vector(768), -- Gemini embedding维度
    metadata JSONB, -- 元数据（来源、作者、日期等）
    source_type VARCHAR(50), -- 'word', 'pdf', 'markdown', 'web'
    source_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 向量相似度检索索引
CREATE INDEX idx_knowledge_embedding ON knowledge_base
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_knowledge_parent ON knowledge_base(parent_id);
CREATE INDEX idx_knowledge_source ON knowledge_base(source_type);
```

#### 3.1.3 AI资讯表 (ai_news)
```sql
CREATE TABLE ai_news (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    summary TEXT,
    source_name VARCHAR(100),
    source_url VARCHAR(1000),
    author VARCHAR(100),
    published_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(50),
    tags VARCHAR(200),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_news_published ON ai_news(published_at DESC);
CREATE INDEX idx_ai_news_featured ON ai_news(is_featured, published_at DESC);
```

#### 3.1.4 RSS订阅源表 (rss_feeds)
```sql
CREATE TABLE rss_feeds (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    url VARCHAR(1000) NOT NULL UNIQUE,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    fetch_interval INTEGER DEFAULT 3600, -- 秒
    last_fetched_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.1.5 文档导入记录表 (import_records)
```sql
CREATE TABLE import_records (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(20), -- 'word', 'pdf', 'markdown'
    file_size BIGINT,
    file_path VARCHAR(1000),
    status VARCHAR(20), -- 'processing', 'completed', 'failed'
    error_message TEXT,
    chunks_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

### 3.2 PostgreSQL扩展配置
```sql
-- 安装pgvector扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建向量相似度搜索函数
CREATE OR REPLACE FUNCTION search_similar_knowledge(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    id BIGINT,
    title VARCHAR,
    content TEXT,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.title,
        kb.chunk_content,
        1 - (kb.embedding <=> query_embedding) as similarity
    FROM knowledge_base kb
    WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

## 4. 后端设计

### 4.1 项目结构
```
src/main/java/com/blog/
├── config/              # 配置类
│   ├── SpringAIConfig.java
│   ├── PostgresConfig.java
│   └── RedisConfig.java
├── controller/          # 控制器
│   ├── ArticleController.java
│   ├── KnowledgeController.java
│   ├── SearchController.java
│   └── ImportController.java
├── service/             # 服务层
│   ├── ArticleService.java
│   ├── KnowledgeService.java
│   ├── SearchService.java
│   ├── ImportService.java
│   ├── AIService.java
│   └── CrawlerService.java
├── repository/          # 数据访问层
│   ├── ArticleRepository.java
│   ├── KnowledgeRepository.java
│   └── AINewsRepository.java
├── model/              # 实体类
│   ├── entity/
│   ├── dto/
│   └── vo/
├── parser/             # 文档解析器
│   ├── WordParser.java
│   ├── PDFParser.java
│   └── MarkdownParser.java
└── util/               # 工具类
    ├── TextChunker.java
    └── VectorUtil.java
```

### 4.2 核心依赖 (pom.xml)
```xml
<dependencies>
    <!-- Spring Boot -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Spring AI (OpenAI Model) -->
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-starter-model-openai</artifactId>
    </dependency>

    <!-- PostgreSQL -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- pgvector JDBC support -->
    <dependency>
        <groupId>com.pgvector</groupId>
        <artifactId>pgvector</artifactId>
        <version>0.1.6</version>
    </dependency>

    <!-- Spring Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- Flyway for relational schema migrations -->
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-core</artifactId>
    </dependency>
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-database-postgresql</artifactId>
    </dependency>

    <!-- Redis -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>

    <!-- Apache POI (Word解析) -->
    <dependency>
        <groupId>org.apache.poi</groupId>
        <artifactId>poi-ooxml</artifactId>
        <version>5.2.5</version>
    </dependency>

    <!-- Apache PDFBox (PDF解析) -->
    <dependency>
        <groupId>org.apache.pdfbox</groupId>
        <artifactId>pdfbox</artifactId>
        <version>3.0.1</version>
    </dependency>

    <!-- CommonMark (Markdown解析) -->
    <dependency>
        <groupId>org.commonmark</groupId>
        <artifactId>commonmark</artifactId>
        <version>0.21.0</version>
    </dependency>

    <!-- Jsoup (网页解析) -->
    <dependency>
        <groupId>org.jsoup</groupId>
        <artifactId>jsoup</artifactId>
        <version>1.17.2</version>
    </dependency>

    <!-- Rome (RSS解析) -->
    <dependency>
        <groupId>com.rometools</groupId>
        <artifactId>rome</artifactId>
        <version>2.1.0</version>
    </dependency>
</dependencies>
```

### 4.3 Spring AI配置
```java
@Configuration
public class SpringAIConfig {

    @Bean
    @ConditionalOnBean(ChatModel.class)
    public ChatClient.Builder chatClientBuilder(ChatModel chatModel) {
        return ChatClient.builder(chatModel);
    }
}
```

### 4.4 核心服务实现

#### 4.4.1 AI服务
```java
@Service
public class AIService {

    @Autowired
    private ChatClient chatClient;

    @Autowired
    private EmbeddingClient embeddingClient;

    /**
     * 生成内容摘要
     */
    public String generateSummary(String content) {
        String prompt = String.format(
            "请为以下内容生成一个简洁的摘要（200字以内）：\n\n%s",
            content
        );
        return chatClient.call(prompt);
    }

    /**
     * 生成向量嵌入
     */
    public float[] generateEmbedding(String text) {
        EmbeddingResponse response = embeddingClient.embed(text);
        return response.getEmbedding();
    }

    /**
     * 全网知识检索与总结
     */
    public String searchAndSummarize(String query) {
        // 1. 使用搜索引擎API或爬虫获取相关内容
        List<String> searchResults = performWebSearch(query);

        // 2. 使用AI总结搜索结果
        String combinedContent = String.join("\n\n", searchResults);
        String prompt = String.format(
            "基于以下搜索结果，总结关于'%s'的关键信息：\n\n%s",
            query, combinedContent
        );
        return chatClient.call(prompt);
    }

    private List<String> performWebSearch(String query) {
        // 实现网络搜索逻辑
        return new ArrayList<>();
    }
}
```

#### 4.4.2 知识检索服务
```java
@Service
public class SearchService {

    @Autowired
    private KnowledgeRepository knowledgeRepository;

    @Autowired
    private AIService aiService;

    /**
     * 向量语义检索
     */
    public List<KnowledgeVO> vectorSearch(String query, int limit) {
        // 1. 将查询转换为向量
        float[] queryEmbedding = aiService.generateEmbedding(query);

        // 2. 执行向量相似度搜索
        return knowledgeRepository.searchSimilar(queryEmbedding, 0.7f, limit);
    }

    /**
     * 混合检索（向量+关键词）
     */
    public List<KnowledgeVO> hybridSearch(String query, int limit) {
        // 1. 向量检索
        List<KnowledgeVO> vectorResults = vectorSearch(query, limit);

        // 2. 全文检索
        List<KnowledgeVO> textResults = knowledgeRepository
            .findByContentContaining(query);

        // 3. 合并和重排序结果
        return mergeAndRank(vectorResults, textResults, limit);
    }

    private List<KnowledgeVO> mergeAndRank(
        List<KnowledgeVO> vectorResults,
        List<KnowledgeVO> textResults,
        int limit
    ) {
        // 实现结果合并和排序逻辑
        return vectorResults.stream()
            .limit(limit)
            .collect(Collectors.toList());
    }
}
```

#### 4.4.3 文档导入服务
```java
@Service
public class ImportService {

    @Autowired
    private WordParser wordParser;

    @Autowired
    private PDFParser pdfParser;

    @Autowired
    private MarkdownParser markdownParser;

    @Autowired
    private AIService aiService;

    @Autowired
    private KnowledgeRepository knowledgeRepository;

    /**
     * 导入文档
     */
    @Transactional
    public ImportResult importDocument(MultipartFile file) {
        String filename = file.getOriginalFilename();
        String fileType = getFileType(filename);

        try {
            // 1. 解析文档内容
            String content = parseDocument(file, fileType);

            // 2. 文本分块
            List<String> chunks = TextChunker.split(content, 500);

            // 3. 生成向量并存储
            for (int i = 0; i < chunks.size(); i++) {
                String chunk = chunks.get(i);
                float[] embedding = aiService.generateEmbedding(chunk);

                KnowledgeBase kb = new KnowledgeBase();
                kb.setTitle(filename);
                kb.setContent(content);
                kb.setChunkContent(chunk);
                kb.setChunkIndex(i);
                kb.setEmbedding(embedding);
                kb.setSourceType(fileType);

                knowledgeRepository.save(kb);
            }

            return ImportResult.success(chunks.size());
        } catch (Exception e) {
            return ImportResult.failure(e.getMessage());
        }
    }

    private String parseDocument(MultipartFile file, String fileType)
        throws IOException {
        return switch (fileType) {
            case "word" -> wordParser.parse(file.getInputStream());
            case "pdf" -> pdfParser.parse(file.getInputStream());
            case "markdown" -> markdownParser.parse(file.getInputStream());
            default -> throw new IllegalArgumentException("Unsupported file type");
        };
    }

    private String getFileType(String filename) {
        if (filename.endsWith(".docx") || filename.endsWith(".doc")) {
            return "word";
        } else if (filename.endsWith(".pdf")) {
            return "pdf";
        } else if (filename.endsWith(".md")) {
            return "markdown";
        }
        throw new IllegalArgumentException("Unsupported file type");
    }
}
```

#### 4.4.4 文档解析器实现

**Word解析器**
```java
@Component
public class WordParser {

    public String parse(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            StringBuilder content = new StringBuilder();

            // 提取段落
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                content.append(paragraph.getText()).append("\n");
            }

            // 提取表格
            for (XWPFTable table : document.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        content.append(cell.getText()).append("\t");
                    }
                    content.append("\n");
                }
            }

            return content.toString();
        }
    }
}
```

**PDF解析器**
```java
@Component
public class PDFParser {

    public String parse(InputStream inputStream) throws IOException {
        try (PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }
}
```

**Markdown解析器**
```java
@Component
public class MarkdownParser {

    private final Parser parser = Parser.builder().build();
    private final HtmlRenderer renderer = HtmlRenderer.builder().build();

    public String parse(InputStream inputStream) throws IOException {
        String markdown = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        Node document = parser.parse(markdown);

        // 提取纯文本（去除Markdown标记）
        return extractText(document);
    }

    private String extractText(Node node) {
        StringBuilder text = new StringBuilder();
        node.accept(new AbstractVisitor() {
            @Override
            public void visit(Text textNode) {
                text.append(textNode.getLiteral());
            }
        });
        return text.toString();
    }
}
```

### 4.5 REST API设计

#### 4.5.1 文章相关API
```
GET    /api/articles              # 获取文章列表
GET    /api/articles/published    # 获取已发布文章列表
GET    /api/articles/{id}         # 获取文章详情
POST   /api/articles              # 创建文章 (Auto Summary)
POST   /api/articles/manual       # 手动创建文章
PUT    /api/articles/{id}         # 更新文章
DELETE /api/articles/{id}         # 删除文章
POST   /api/articles/{id}/publish # 发布文章
```

#### 4.5.2 知识检索API
```
POST   /api/search/vector         # 向量检索
POST   /api/search/hybrid         # 混合检索
POST   /api/search/web            # 全网检索并总结
GET    /api/knowledge             # 获取知识库列表
GET    /api/knowledge/{id}        # 获取知识详情
```

#### 4.5.3 文档导入API
```
POST   /api/import/upload         # 上传并导入文档
GET    /api/import/records        # 获取导入记录
GET    /api/import/records/{id}   # 获取导入详情
```

#### 4.5.4 AI资讯API
```
GET    /api/news                  # 获取AI资讯列表
GET    /api/news/featured         # 获取精选资讯
POST   /api/news/summarize        # 生成资讯摘要
```

### 4.6 API请求/响应示例

**向量检索请求**
```json
POST /api/search/vector
{
  "query": "Spring AI如何集成Gemini模型",
  "limit": 10,
  "threshold": 0.7
}
```

**向量检索响应**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "results": [
      {
        "id": 1,
        "title": "Spring AI集成指南",
        "content": "...",
        "similarity": 0.92,
        "source": "imported_doc.pdf"
      }
    ],
    "total": 5
  }
}
```

**文档导入请求**
```
POST /api/import/upload
Content-Type: multipart/form-data

file: [binary data]
```

**文档导入响应**
```json
{
  "code": 200,
  "message": "导入成功",
  "data": {
    "recordId": 123,
    "filename": "技术文档.pdf",
    "chunksCount": 45,
    "status": "completed"
  }
}
```

## 5. 前端设计

### 5.1 项目结构
```
src/
├── components/          # 组件
│   ├── common/         # 通用组件
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Loading.tsx
│   ├── article/        # 文章组件
│   │   └── ArticleCard.tsx
│   ├── search/         # 搜索组件
│   │   ├── SearchBar.tsx
│   │   ├── SearchResults.tsx
│   │   └── VectorSearch.tsx
│   └── import/         # 导入组件
│       ├── FileUpload.tsx
│       └── ImportHistory.tsx
├── pages/              # 页面
│   ├── Home.tsx
│   ├── CreateArticlePage.tsx
│   ├── SearchPage.tsx
│   └── ImportPage.tsx
├── services/           # API服务
│   ├── articleService.ts
│   ├── searchService.ts
│   └── importService.ts
├── hooks/              # 自定义Hooks
│   ├── useSearch.ts
│   └── useArticles.ts
├── store/              # 状态管理
│   └── index.ts
└── utils/              # 工具函数
    └── request.ts
```

### 5.2 核心依赖 (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "antd": "^5.12.0",
    "@ant-design/icons": "^5.2.0",
    "zustand": "^4.4.0",
    "react-markdown": "^9.0.0",
    "highlight.js": "^11.9.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### 5.3 核心页面设计

#### 5.3.1 首页 (Home.tsx)
```typescript
import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Tabs } from 'antd';
import ArticleCard from '../components/article/ArticleCard';
import { articleService, newsService } from '../services';

const { Title } = Typography;

const Home: React.FC = () => {
  const [articles, setArticles] = useState([]);
  const [aiNews, setAiNews] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [articlesData, newsData] = await Promise.all([
      articleService.getLatest(10),
      newsService.getFeatured(10)
    ]);
    setArticles(articlesData);
    setAiNews(newsData);
  };

  return (
    <div className="home-page">
      <Title level={2}>个人科技圈博客</Title>

      <Tabs
        items={[
          {
            key: 'news',
            label: 'AI资讯',
            children: (
              <Row gutter={[16, 16]}>
                {aiNews.map(news => (
                  <Col xs={24} sm={12} md={8} key={news.id}>
                    <Card
                      title={news.title}
                      extra={<a href={news.sourceUrl}>来源</a>}
                    >
                      {news.summary}
                    </Card>
                  </Col>
                ))}
              </Row>
            )
          },
          {
            key: 'articles',
            label: '个人总结',
            children: (
              <Row gutter={[16, 16]}>
                {articles.map(article => (
                  <Col xs={24} sm={12} md={8} key={article.id}>
                    <ArticleCard article={article} />
                  </Col>
                ))}
              </Row>
            )
          }
        ]}
      />
    </div>
  );
};

export default Home;
```

#### 5.3.2 知识检索页面 (SearchPage.tsx)
```typescript
import React, { useState } from 'react';
import { Input, Button, List, Card, Radio, Space, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { searchService } from '../services';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'vector' | 'hybrid' | 'web'>('vector');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      let data;
      switch (searchType) {
        case 'vector':
          data = await searchService.vectorSearch(query);
          break;
        case 'hybrid':
          data = await searchService.hybridSearch(query);
          break;
        case 'web':
          data = await searchService.webSearch(query);
          break;
      }
      setResults(data.results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio.Group
              value={searchType}
              onChange={e => setSearchType(e.target.value)}
            >
              <Radio.Button value="vector">向量检索</Radio.Button>
              <Radio.Button value="hybrid">混合检索</Radio.Button>
              <Radio.Button value="web">全网检索</Radio.Button>
            </Radio.Group>

            <Input.Search
              placeholder="输入搜索关键词..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              size="large"
              loading={loading}
            />
          </Space>
        </Card>

        <List
          dataSource={results}
          loading={loading}
          renderItem={(item: any) => (
            <List.Item>
              <Card style={{ width: '100%' }}>
                <Card.Meta
                  title={item.title}
                  description={
                    <>
                      <p>{item.content}</p>
                      <Space>
                        {item.similarity && (
                          <Tag color="blue">
                            相似度: {(item.similarity * 100).toFixed(1)}%
                          </Tag>
                        )}
                        <Tag>{item.source}</Tag>
                      </Space>
                    </>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      </Space>
    </div>
  );
};

export default SearchPage;
```

#### 5.3.3 文档导入页面 (ImportPage.tsx)
```typescript
import React, { useState } from 'react';
import { Upload, Button, message, Table, Card } from 'antd';
import { UploadOutlined, FileWordOutlined, FilePdfOutlined, FileMarkdownOutlined } from '@ant-design/icons';
import { importService } from '../services';

const ImportPage: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [records, setRecords] = useState([]);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const result = await importService.upload(formData);
      message.success(`导入成功！共生成 ${result.chunksCount} 个知识块`);
      loadRecords();
    } catch (error) {
      message.error('导入失败：' + error.message);
    } finally {
      setUploading(false);
    }

    return false; // 阻止自动上传
  };

  const loadRecords = async () => {
    const data = await importService.getRecords();
    setRecords(data);
  };

  const columns = [
    { title: '文件名', dataIndex: 'filename', key: 'filename' },
    { title: '类型', dataIndex: 'fileType', key: 'fileType' },
    { title: '知识块数', dataIndex: 'chunksCount', key: 'chunksCount' },
    { title: '状态', dataIndex: 'status', key: 'status' },
    { title: '导入时间', dataIndex: 'createdAt', key: 'createdAt' }
  ];

  return (
    <div className="import-page">
      <Card title="文档导入" style={{ marginBottom: 24 }}>
        <Upload
          beforeUpload={handleUpload}
          accept=".doc,.docx,.pdf,.md"
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            选择文件上传
          </Button>
        </Upload>
        <p style={{ marginTop: 16, color: '#666' }}>
          支持格式：Word (.doc, .docx)、PDF (.pdf)、Markdown (.md)
        </p>
      </Card>

      <Card title="导入记录">
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default ImportPage;
```

### 5.4 API服务封装

```typescript
// services/searchService.ts
import request from '../utils/request';

export const searchService = {
  vectorSearch: (query: string, limit = 10) =>
    request.post('/api/search/vector', { query, limit }),

  hybridSearch: (query: string, limit = 10) =>
    request.post('/api/search/hybrid', { query, limit }),

  webSearch: (query: string) =>
    request.post('/api/search/web', { query })
};

// services/importService.ts
export const importService = {
  upload: (formData: FormData) =>
    request.post('/api/import/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  getRecords: () =>
    request.get('/api/import/records')
};
```

## 6. 部署方案

### 6.1 开发环境
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: blog
      POSTGRES_USER: blog_user
      POSTGRES_PASSWORD: blog_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/blog
      SPRING_REDIS_HOST: redis
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 6.2 生产环境配置

**application-prod.yml**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

  redis:
    host: ${REDIS_HOST}
    port: 6379
    password: ${REDIS_PASSWORD}

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

gemini:
  api:
    key: ${GEMINI_API_KEY}
    timeout: 30000

logging:
  level:
    root: INFO
    com.blog: DEBUG
```

### 6.3 性能优化建议

1. **向量检索优化**
   - 使用IVFFlat索引加速向量检索
   - 调整lists参数以平衡速度和准确性
   - 考虑使用HNSW索引（需要pgvector 0.5.0+）

2. **缓存策略**
   - 热门文章缓存（Redis）
   - 搜索结果缓存（15分钟）
   - 向量嵌入缓存

3. **异步处理**
   - 文档导入使用异步任务
   - 向量生成使用消息队列
   - RSS抓取使用定时任务

4. **数据库优化**
   - 定期VACUUM和ANALYZE
   - 合理设置连接池大小
   - 使用分区表存储历史数据

## 7. 开发流程

### 7.1 后端开发步骤
1. 创建Spring Boot项目（Java 17）
2. 配置PostgreSQL和pgvector
3. 实现实体类和Repository
4. 实现文档解析器
5. 集成Spring AI Alibaba和Gemini
6. 实现核心服务（AI、检索、导入）
7. 实现REST API
8. 编写单元测试和集成测试

### 7.2 前端开发步骤
1. 创建React项目（Vite + TypeScript）
2. 配置路由和状态管理
3. 实现通用组件
4. 实现各功能页面
5. 集成Ant Design组件库
6. 实现API服务封装
7. 优化用户体验和响应式设计

### 7.3 测试策略
- 单元测试：JUnit 5 + Mockito
- 集成测试：Spring Boot Test
- 前端测试：Jest + React Testing Library
- E2E测试：Playwright
- 性能测试：JMeter

## 8. 后续扩展

### 8.1 功能扩展
- 用户系统和权限管理
- 评论和互动功能
- 文章推荐算法
- 多语言支持
- 移动端适配

### 8.2 技术扩展
- 引入Elasticsearch提升全文检索
- 使用Kafka处理异步任务
- 引入MinIO对象存储
- 实现分布式部署
- 添加监控和日志系统（Prometheus + Grafana）
