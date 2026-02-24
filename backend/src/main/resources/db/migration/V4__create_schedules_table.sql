-- 创建日程表
CREATE TABLE IF NOT EXISTS schedules (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    schedule_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建日期索引，加速按日期查询
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(schedule_date);

-- 创建状态索引，加速按状态查询
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

-- 创建复合索引，优化按日期和状态查询
CREATE INDEX IF NOT EXISTS idx_schedules_date_status ON schedules(schedule_date, status);

COMMENT ON TABLE schedules IS '日程表，记录每日待办任务';
COMMENT ON COLUMN schedules.title IS '日程标题';
COMMENT ON COLUMN schedules.description IS '日程描述';
COMMENT ON COLUMN schedules.schedule_date IS '日程日期';
COMMENT ON COLUMN schedules.status IS '状态：PENDING-待处理, IN_PROGRESS-进行中, COMPLETED-已完成';
COMMENT ON COLUMN schedules.priority IS '优先级：LOW-低, MEDIUM-中, HIGH-高';
