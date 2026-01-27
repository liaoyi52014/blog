# 个人科技圈博客（AI Knowledge Blog）

一个以 **知识沉淀 + 语义检索 + AI 总结** 为核心的个人技术博客系统。
后端使用 Spring Boot + Flyway + PostgreSQL（pgvector），前端使用 React + Vite + Ant Design，AI 模型采用 **OpenAI 协议兼容**接入方式。

## 技术栈

- 后端：Java 17 / Spring Boot 3 / Spring Data JPA / Flyway
- 数据库：PostgreSQL + pgvector
- 前端：React 18 / TypeScript / Vite / Ant Design
- AI：OpenAI 协议兼容模型（chat + embedding）

## 目录结构

```text
backend/    Spring Boot 后端
frontend/   React + Vite 前端
docker-compose.yml
DESIGN.md   设计文档
CLAUDE.md   开发约束与说明
```

## 快速开始（本地开发）

### 1. 准备数据库（PostgreSQL + pgvector）

建议手动创建数据库一次（更稳）：

```sql
CREATE DATABASE blog;
\c blog
CREATE EXTENSION IF NOT EXISTS vector;
```

> 项目已内置“自动建库”逻辑，但前提是数据库账号具备 `CREATEDB` 权限。

### 2. 启动后端

```bash
cd backend
mvn spring-boot:run
```

启动时 Flyway 会自动执行迁移脚本：

- `backend/src/main/resources/db/migration/V1__init.sql`

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

默认访问：

- 前端：http://localhost:5173
- 后端：http://localhost:8080

## 环境变量（推荐使用）

后端主要配置项（可通过环境变量覆盖）：

- 数据库：`DB_HOST` `DB_NAME` `DB_USER` `DB_PASSWORD`
- 自动建库：`DB_AUTO_CREATE=true|false`（默认 true）
- 管理库名：`DB_ADMIN_DATABASE=postgres`
- AI：
  - `OPENAI_API_KEY`
  - `OPENAI_BASE_URL`（如果是兼容 OpenAI 协议的第三方服务，通常需要）
  - `OPENAI_CHAT_MODEL`
  - `OPENAI_EMBEDDING_MODEL`
  - `OPENAI_EMBEDDING_DIMENSIONS`（需与 `vector(768)` 保持一致）

## 常见问题

### 1）Flyway 报错：Unsupported Database / hnsw 不存在

- 已通过依赖与迁移脚本兼容处理：
  - 引入 `flyway-database-postgresql`
  - 索引会在 HNSW 不可用时回退到 IVFFlat

### 2）前端乱码 / 中文异常

请确保所有前端源码文件为 **UTF-8** 编码。

---

如需系统设计细节与 API 说明，请查看：`DESIGN.md`。
