-- 创建项目表
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    color VARCHAR(50) DEFAULT '#00C9A7',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 为 schedules 表添加 end_date 和 project_id 字段
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS project_id BIGINT;

-- 创建项目外键索引
CREATE INDEX IF NOT EXISTS idx_schedules_project_id ON schedules(project_id);

-- 创建项目状态索引
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

COMMENT ON TABLE projects IS '项目表，用于管理长期持续的任务集合';
COMMENT ON COLUMN projects.name IS '项目名称';
COMMENT ON COLUMN projects.description IS '项目描述';
COMMENT ON COLUMN projects.start_date IS '项目开始日期';
COMMENT ON COLUMN projects.end_date IS '项目预计结束日期';
COMMENT ON COLUMN projects.status IS '状态：ACTIVE-进行中, COMPLETED-已完成, ARCHIVED-已归档';
COMMENT ON COLUMN projects.color IS '项目标识颜色';

COMMENT ON COLUMN schedules.end_date IS '日程结束日期（用于跨天日程）';
COMMENT ON COLUMN schedules.project_id IS '关联的项目ID';
