import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  List,
  Modal,
  Radio,
  Select,
  Tag,
  Typography,
  message
} from 'antd';
import {
  BarsOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  BarChartOutlined,
  PlusOutlined,
  ProjectOutlined,
  SyncOutlined,
  WarningOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { scheduleService, projectService, type Schedule, type Project } from '../services';
import GanttChart, { type GanttTask } from '../components/GanttChart';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

type ScheduleForm = {
  title: string;
  description?: string;
  scheduleDate: Dayjs;
  hasEndDate: boolean;
  endDate?: Dayjs;
  projectId?: number;
  priority?: string;
};

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  PENDING: { color: 'warning', icon: <ClockCircleOutlined />, label: '待处理' },
  IN_PROGRESS: { color: 'processing', icon: <SyncOutlined spin />, label: '进行中' },
  COMPLETED: { color: 'success', icon: <CheckCircleOutlined />, label: '已完成' }
};

const priorityOptions = [
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' }
];

const statusOptions = [
  { value: 'PENDING', label: '待处理' },
  { value: 'IN_PROGRESS', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' }
];

const SchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [ganttSchedules, setGanttSchedules] = useState<Schedule[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'gantt'>('gantt');
  const [form] = Form.useForm<ScheduleForm>();

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      // 列表视图加载所有未完成的日程
      const resp = await scheduleService.getTodayPending();
      setSchedules(resp.data ?? []);
    } catch {
      message.error('加载日程失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const resp = await projectService.getActive();
      setProjects(resp.data ?? []);
    } catch {
      // ignore
    }
  }, []);

  const loadGanttSchedules = useCallback(async () => {
    if (viewMode !== 'gantt') return;
    setLoading(true);
    try {
      // 动态范围：当前日期前6个月到后18个月
      const start = dayjs().subtract(6, 'month').startOf('month').format('YYYY-MM-DD');
      const end = dayjs().add(18, 'month').endOf('month').format('YYYY-MM-DD');
      const resp = await scheduleService.getByDateRange(start, end);
      setGanttSchedules(resp.data ?? []);
    } catch {
      message.error('加载甘特图数据失败');
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    void loadSchedules();
    void loadProjects();
  }, [loadSchedules, loadProjects]);

  useEffect(() => {
    void loadGanttSchedules();
  }, [loadGanttSchedules]);

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await scheduleService.updateStatus(id, status);
      message.success('状态已更新');
      void loadSchedules();
      void loadGanttSchedules();
    } catch {
      message.error('更新状态失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await scheduleService.delete(id);
      message.success('日程已删除');
      void loadSchedules();
      void loadGanttSchedules();
    } catch {
      message.error('删除失败');
    }
  };

  const openCreateModal = () => {
    setEditingSchedule(null);
    setHasEndDate(false);
    form.resetFields();
    form.setFieldsValue({ scheduleDate: selectedDate, priority: 'MEDIUM', hasEndDate: false });
    setModalOpen(true);
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    const hasEnd = !!schedule.endDate;
    setHasEndDate(hasEnd);
    form.setFieldsValue({
      title: schedule.title,
      description: schedule.description,
      scheduleDate: dayjs(schedule.scheduleDate),
      hasEndDate: hasEnd,
      endDate: schedule.endDate ? dayjs(schedule.endDate) : undefined,
      projectId: schedule.projectId,
      priority: schedule.priority
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        title: values.title,
        description: values.description,
        scheduleDate: values.scheduleDate.format('YYYY-MM-DD'),
        endDate: values.hasEndDate && values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
        projectId: values.projectId,
        priority: values.priority as 'LOW' | 'MEDIUM' | 'HIGH' | undefined
      };

      if (editingSchedule) {
        await scheduleService.update(editingSchedule.id, payload);
        message.success('日程已更新');
      } else {
        await scheduleService.create(payload);
        message.success('日程已创建');
      }

      setModalOpen(false);
      void loadSchedules();
      void loadGanttSchedules();
    } catch {
      // validation error
    }
  };

  const getProjectName = (projectId?: number) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.name;
  };

  const getProjectColor = (projectId?: number) => {
    if (!projectId) return undefined;
    const project = projects.find(p => p.id === projectId);
    return project?.color;
  };

  const renderScheduleItem = (schedule: Schedule) => {
    const config = statusConfig[schedule.status] || statusConfig.PENDING;
    const projectName = getProjectName(schedule.projectId);
    const projectColor = getProjectColor(schedule.projectId);
    const deadline = schedule.endDate || schedule.scheduleDate;
    const isOverdue = schedule.status !== 'COMPLETED' && dayjs(deadline).isBefore(dayjs(), 'day');
    const isDueToday = schedule.status !== 'COMPLETED' && dayjs(deadline).isSame(dayjs(), 'day');
    const isUrgent = isOverdue || isDueToday;

    return (
      <List.Item
        key={schedule.id}
        style={{
          background: isOverdue 
            ? 'rgba(255, 77, 79, 0.06)' 
            : isDueToday 
              ? 'rgba(250, 173, 20, 0.06)' 
              : undefined,
          borderLeft: isUrgent 
            ? `3px solid ${isOverdue ? '#ff4d4f' : '#faad14'}` 
            : undefined,
          paddingLeft: isUrgent ? 12 : undefined,
          animation: isUrgent ? 'taskUrgentPulse 2.5s ease-in-out infinite' : undefined
        }}
        actions={[
          <Select
            key="status"
            value={schedule.status}
            onChange={(value) => handleStatusChange(schedule.id, value)}
            options={statusOptions}
            style={{ width: 100 }}
            size="small"
          />,
          <Button
            key="edit"
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEditModal(schedule)}
          />,
          <Button
            key="delete"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(schedule.id)}
          />
        ]}
      >
        <List.Item.Meta
          avatar={
            <Tag color={config.color} icon={config.icon}>
              {config.label}
            </Tag>
          }
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ textDecoration: schedule.status === 'COMPLETED' ? 'line-through' : 'none' }}>
                {schedule.title}
              </span>
              {schedule.endDate && (
                <Tag color="blue" style={{ fontSize: 11 }}>
                  {schedule.scheduleDate} ~ {schedule.endDate}
                </Tag>
              )}
              {projectName && (
                <Tag color={projectColor} icon={<ProjectOutlined />} style={{ fontSize: 11 }}>
                  {projectName}
                </Tag>
              )}
              {isOverdue && (
                <Tag color="error" icon={<WarningOutlined />} style={{ fontSize: 11 }}>
                  已过期
                </Tag>
              )}
              {isDueToday && !isOverdue && (
                <Tag color="warning" icon={<ExclamationCircleOutlined />} style={{ fontSize: 11 }}>
                  今日到期
                </Tag>
              )}
            </div>
          }
          description={schedule.description}
        />
      </List.Item>
    );
  };

  const projectOptions = projects.map(p => ({
    value: p.id,
    label: p.name
  }));

  // 转换为甘特图任务格式
  const ganttTasks: GanttTask[] = ganttSchedules.map(schedule => ({
    id: schedule.id,
    title: schedule.title,
    startDate: schedule.scheduleDate,
    endDate: schedule.endDate,
    status: schedule.status,
    priority: schedule.priority,
    color: getProjectColor(schedule.projectId)
  }));

  const handleGanttTaskClick = (task: GanttTask) => {
    const schedule = ganttSchedules.find(s => s.id === task.id);
    if (schedule) {
      openEditModal(schedule);
    }
  };

  const handleGanttTaskUpdate = async (taskId: string | number, startDate: string, endDate: string) => {
    try {
      const schedule = ganttSchedules.find(s => s.id === taskId);
      if (!schedule) return;
      
      await scheduleService.update(Number(taskId), {
        ...schedule,
        scheduleDate: startDate,
        endDate: endDate
      });
      message.success('日程已更新');
      void loadGanttSchedules();
    } catch {
      message.error('更新失败');
    }
  };

  return (
    <div className="schedule-page" style={{ maxWidth: viewMode === 'gantt' ? 1400 : 900, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={2}>日程管理</Title>
      <Paragraph type="secondary">
        记录每日待办任务，轻松管理工作与生活
      </Paragraph>

      <Card className="glass-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Radio.Group 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="list"><BarsOutlined /> 列表</Radio.Button>
              <Radio.Button value="gantt"><BarChartOutlined /> 甘特图</Radio.Button>
            </Radio.Group>
            
            {viewMode === 'list' && (
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                allowClear={false}
                style={{ width: 200 }}
              />
            )}
          </div>
          
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建日程
          </Button>
        </div>

        {viewMode === 'list' ? (
          <List
            loading={loading}
            dataSource={schedules}
            renderItem={renderScheduleItem}
            locale={{ emptyText: '当天没有日程' }}
          />
        ) : (
          <GanttChart 
            tasks={ganttTasks}
            onTaskClick={handleGanttTaskClick}
            onTaskUpdate={handleGanttTaskUpdate}
            onStatusChange={async (taskId, status) => {
              await handleStatusChange(Number(taskId), status);
              void loadGanttSchedules();
            }}
          />
        )}
      </Card>

      <Modal
        title={editingSchedule ? '编辑日程' : '新建日程'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="输入日程标题" maxLength={200} />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea placeholder="输入日程描述（可选）" rows={3} />
          </Form.Item>

          <Form.Item
            name="scheduleDate"
            label="开始日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="hasEndDate" valuePropName="checked">
            <Checkbox onChange={(e) => setHasEndDate(e.target.checked)}>
              设置结束日期（跨天日程）
            </Checkbox>
          </Form.Item>

          {hasEndDate && (
            <Form.Item name="endDate" label="结束日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          )}

          <Form.Item name="projectId" label="关联项目">
            <Select 
              options={projectOptions} 
              placeholder="选择项目（可选）" 
              allowClear
            />
          </Form.Item>

          <Form.Item name="priority" label="优先级">
            <Select options={priorityOptions} placeholder="选择优先级" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchedulePage;
