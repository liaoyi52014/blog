# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered personal tech blog platform with knowledge management, intelligent search, and content summarization capabilities. The system supports multi-format document import, uses vector database for semantic search, and leverages LLM for intelligent content summarization.

**Tech Stack:**
- Backend: Java 17 + Spring Boot 3.3.x + Spring AI (OpenAI Compatible Mode)
- Frontend: React 18+ + TypeScript + Ant Design
- AI Models: Qwen/Qwen3-8B (chat), BAAI/bge-large-zh-v1.5 (embeddings) via SiliconFlow
- Database: PostgreSQL 15+ with pgvector extension
- Cache: Redis
- Document Parsing: Apache POI (Word), Apache PDFBox (PDF), CommonMark (Markdown)

## Development Commands

### Backend (Spring Boot)
```bash
# Build project
./mvnw clean package

# Run application
./mvnw spring-boot:run

# Run tests
./mvnw test

# Run specific test
./mvnw test -Dtest=ServiceNameTest
```

### Frontend (React)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Database Setup
```bash
# Start PostgreSQL with pgvector using Docker
docker run -d \
  --name blog-postgres \
  -e POSTGRES_DB=blog \
  -e POSTGRES_USER=blog_user \
  -e POSTGRES_PASSWORD=blog_pass \
  -p 5432:5432 \
  pgvector/pgvector:pg15

# Connect to database
psql -h localhost -U blog_user -d blog

# Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
```

### Docker Compose
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

## Architecture

### High-Level Architecture
The system follows a three-tier architecture:
1. **Frontend Layer**: React SPA with component-based architecture
2. **Application Layer**: Spring Boot REST API with service-oriented design
3. **Data Layer**: PostgreSQL (with pgvector), Redis, File Storage

### Core Modules

**Backend Modules:**
- `controller/`: REST API endpoints
- `service/`: Business logic (ArticleService, KnowledgeService, SearchService, AIService, ImportService)
- `repository/`: Data access layer (JPA repositories)
- `parser/`: Document parsers (WordParser, PDFParser, MarkdownParser)
- `config/`: Configuration classes (Spring AI, PostgreSQL, Redis)

**Frontend Structure:**
- `components/`: Reusable UI components (article, search, import)
- `pages/`: Page-level components (Home, SearchPage, ImportPage)
- `services/`: API service layer
- `hooks/`: Custom React hooks

### Key Features

1. **Vector Semantic Search**: Uses Gemini embeddings (768 dimensions) stored in PostgreSQL with pgvector for similarity search
2. **Document Import Pipeline**: Parse → Chunk (500 chars) → Generate Embeddings → Store in DB
3. **Hybrid Search**: Combines vector similarity search with full-text search
4. **AI Summarization**: Uses Gemini 3.0 for content summarization
5. **Web Crawling**: RSS feed aggregation and web scraping for AI news

### Database Schema

**Key Tables:**
- `articles`: Blog posts with metadata
- `knowledge_base`: Chunked content with vector embeddings (vector(768))
- `ai_news`: Aggregated AI news from various sources
- `rss_feeds`: RSS feed sources configuration
- `import_records`: Document import history

**Vector Search Function:**
```sql
search_similar_knowledge(query_embedding, match_threshold, match_count)
```

### API Endpoints

**Articles:** `/api/articles/*`
**Search:** `/api/search/vector`, `/api/search/hybrid`, `/api/search/web`
**Import:** `/api/import/upload`, `/api/import/records`
**News:** `/api/news`, `/api/news/featured`

### Configuration

**Required Environment Variables:**
- `OPENAI_API_KEY`: SiliconFlow API key
- `OPENAI_BASE_URL`: `https://api.siliconflow.cn/v1` (default)
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: PostgreSQL connection
- `REDIS_HOST`, `REDIS_PASSWORD`: Redis connection

**Spring AI Configuration:**
- Uses `spring-ai-starter-model-openai` pointing to SiliconFlow's OpenAI-compatible endpoint.
- Chat Model: `Qwen/Qwen3-8B`
- Embedding Model: `BAAI/bge-large-zh-v1.5`

### Document Parsing

**Supported Formats:**
- Word (.doc, .docx): Apache POI (XWPFDocument)
- PDF (.pdf): Apache PDFBox (PDDocument)
- Markdown (.md): CommonMark parser

**Processing Pipeline:**
1. Upload file → 2. Parse content → 3. Split into chunks → 4. Generate embeddings → 5. Store in knowledge_base

### Performance Considerations

- Use IVFFlat index for vector search: `CREATE INDEX ... USING ivfflat (embedding vector_cosine_ops)`
- Cache hot articles and search results in Redis
- Async processing for document import and vector generation
- Connection pooling for database (HikariCP)

## Design Document

See `DESIGN.md` for comprehensive system design including detailed API specifications, database schemas, and implementation examples.
