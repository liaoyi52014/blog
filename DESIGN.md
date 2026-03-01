# DayNote 个人知识管理系统设计文档（当前实现版）

更新时间：2026-03-01  
适用分支：`main`（以当前仓库代码为准）

## 1. 项目定位

DayNote 是一个面向个人使用的知识与执行管理系统，核心目标是把“任务执行（日程/项目）”与“知识沉淀（检索/导入/对话/笔记）”放在同一套产品里。

当前系统重点能力：

1. 任务与项目管理（含紧急提醒、项目进度、项目状态管理）
2. 个人知识库管理（知识检索、文档导入、RSS 导入、知识对话、知识条目管理、笔记）
3. 向量检索与 AI 总结（本地知识 + 网络检索）
4. 管理员登录与会话鉴权（JWT + HttpOnly Cookie）
5. Docker 镜像化部署（PostgreSQL + pgvector + Redis + Backend + Frontend）

## 2. 技术栈（实际）

### 2.1 前端

1. React 18 + TypeScript + Vite
2. Ant Design 5 + Ant Icons
3. React Router v6
4. Axios

### 2.2 后端

1. Java 17
2. Spring Boot 3.3.5
3. Spring Data JPA + Flyway
4. Spring Security + JWT
5. Spring AI（OpenAI 兼容模型接入）

### 2.3 数据与中间件

1. PostgreSQL 15（`pgvector/pgvector:pg15`）
2. pgvector 扩展（Flyway 自动执行 `CREATE EXTENSION IF NOT EXISTS vector`）
3. Redis 7

## 3. 信息架构与导航（实际）

### 3.1 顶级菜单

1. 仪表盘
2. 任务日程
3. 项目管理
4. 个人知识库（分组菜单）

### 3.2 个人知识库子菜单

1. 知识检索（`/search`）
2. 文档导入（`/import`）
3. RSS 导入（`/rss`）
4. 知识对话（`/chat`）
5. 知识条目管理（`/create`）
6. 笔记（`/notes`）

### 3.3 路由访问控制（前端）

受保护路由：`/search`、`/import`、`/rss`、`/chat`、`/create`、`/notes`。  
未登录访问会跳转 `/login`。

## 4. 核心业务规则（当前代码）

### 4.1 笔记展示规则

笔记页来源于 `articles` 表，并按分类过滤：

1. `category = 'notes'`
2. `category` 为空（`null`/空字符串/空白）

支持关键词搜索、状态筛选、内容预览。

### 4.2 项目进度定义

项目卡片进度 = `已完成日程数 / 项目总日程数 * 100%`。  
用于展示项目执行进度，不等同于项目状态（`ACTIVE/COMPLETED/ARCHIVED`）。

### 4.3 项目删除限制（前端约束）

在项目管理页点击删除时，会先检查该项目是否存在“生效日程”（后端定义为 `status <> COMPLETED`）：

1. 若存在，弹出警告并阻止删除
2. 若不存在，才执行删除

说明：该约束目前在前端实现，后端 `DELETE /api/projects/{id}` 尚未做同等强校验。

## 5. 后端模块与 API（当前）

### 5.1 控制器清单

1. `AuthController`：`/api/auth`
2. `ArticleController`：`/api/articles`
3. `KnowledgeController`：`/api/knowledge`
4. `SearchController`：`/api/search`
5. `ChatController`：`/api/chat`
6. `ImportController`：`/api/import`
7. `RssFeedController`：`/api/rss/feeds`
8. `NewsController`：`/api/news`
9. `ScheduleController`：`/api/schedules`
10. `ProjectController`：`/api/projects`

### 5.2 关键 API（摘要）

1. 认证：
   - `GET /api/auth/status`
   - `POST /api/auth/setup`
   - `POST /api/auth/login`
   - `POST /api/auth/logout`
   - `GET /api/auth/me`
2. 文章/笔记：
   - `GET /api/articles`
   - `POST /api/articles/manual`
   - `PUT /api/articles/{id}`
   - `DELETE /api/articles/{id}`
3. 搜索：
   - `POST /api/search/vector`
   - `POST /api/search/hybrid`
   - `POST /api/search/web`
   - `POST /api/search/unified`
4. 对话（SSE）：
   - `POST /api/chat/knowledge`（`text/event-stream`）
5. 导入：
   - `POST /api/import/upload`
   - `GET /api/import/records`
6. RSS：
   - `GET /api/rss/feeds`
   - `POST /api/rss/feeds/import`
7. 日程：
   - `GET /api/schedules`
   - `GET /api/schedules/today`
   - `GET /api/schedules/range`
   - `GET /api/schedules/project/{projectId}`
   - `GET /api/schedules/project/{projectId}/active`
   - `PATCH /api/schedules/{id}/status`
8. 项目：
   - `GET /api/projects`
   - `GET /api/projects/active`
   - `PATCH /api/projects/{id}/status`
   - `DELETE /api/projects/{id}`

### 5.3 鉴权策略（`SecurityConfig`）

1. `search`、`chat`、`import`、`rss`、文章写操作、知识库写操作、`/api/auth/me`、`/api/auth/logout` 需要登录
2. 文章读取、知识读取、新闻读取、日程与项目接口当前允许匿名访问

## 6. 数据库设计（Flyway 实际）

### 6.1 迁移版本

1. `V1__init.sql`：文章、资讯、RSS、导入记录、知识库、vector 扩展与检索函数
2. `V2__update_vector_dimension.sql`：向量维度从 768 升级到 1024
3. `V3__create_users_table.sql`：管理员用户表
4. `V4__create_schedules_table.sql`：日程表
5. `V5__add_projects_and_schedule_fields.sql`：项目表 + 日程关联字段

### 6.2 关键实体

1. `articles`
2. `knowledge_base`（`embedding vector(1024)`）
3. `ai_news`
4. `rss_feeds`
5. `import_records`
6. `users`
7. `schedules`
8. `projects`

## 7. 部署设计（镜像优先）

### 7.1 文件角色

1. `docker-compose.yml`：生产/服务器运行（使用 `image`，不依赖源码）
2. `docker-compose.build.yml`：本地构建镜像覆盖文件
3. `.env.example`：环境变量模板
4. `frontend/nginx.conf`：静态资源 + `/api` 反向代理到 `backend:8080`

### 7.2 运行拓扑

1. `frontend`（nginx，默认暴露 80）
2. `backend`（Spring Boot，默认暴露 8080）
3. `postgres`（`pgvector/pgvector:pg15`，健康检查）
4. `redis`（启用密码，健康检查）

`backend` 依赖 `postgres` 与 `redis` 的 `service_healthy`。

### 7.3 推荐发布流程

1. 本地构建镜像：  
   `docker compose -f docker-compose.yml -f docker-compose.build.yml build`
2. 导出并上传镜像：  
   `docker save ...`
3. 服务器导入镜像：  
   `docker load -i ...`
4. 复制 `.env.example` 为 `.env` 并填写密码/API Key
5. 启动：  
   `docker compose --env-file .env up -d`

## 8. 已知约束与后续建议

1. 项目删除的“有关联生效日程禁止删除”目前仅前端防护，建议后端同步强制校验。
2. 当前 CORS 白名单是本地开发地址，生产建议按域名配置。
3. `AuthController` 的 cookie `secure=false` 仅适合本地，生产应在 HTTPS 下改为 `true`。
4. PostgreSQL 与 Redis 是否对公网暴露需结合安全组和运维策略收敛。

---

本设计文档以当前仓库实现为准，后续功能变更请同步更新本文件，避免“文档与代码”偏离。
