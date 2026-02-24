import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  List,
  Modal,
  Progress,
  Select,
  Tag,
  Typography,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOutlined,
  PlusOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { projectService, scheduleService, type Project, type Schedule } from '../services';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

type ProjectForm = {
  name: string;
  description?: string;
  dateRange?: [Dayjs, Dayjs];
  color?: string;
};

const statusConfig: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: 'processing', label: '进行中' },
  COMPLETED: { color: 'success', label: '已完成' },
  ARCHIVED: { color: 'default', label: '已归档' }
};

const colorOptions = [
  { value: '#00C9A7', label: '青绿' },
  { value: '#36A8FF', label: '蓝色' },
  { value: '#9B59B6', label: '紫色' },
  { value: '#F39C12', label: '橙色' },
  { value: '#E74C3C', label: '红色' },
  { value: '#2ECC71', label: '绿色' }
];

const statusOptions = [
  { value: 'ACTIVE', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'ARCHIVED', label: '已归档' }
];

type ProjectWithSchedules = Project & { schedules?: Schedule[] };

const ProjectPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithSchedules[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm<ProjectForm>();

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await projectService.getAll();
      const projectList = resp.data ?? [];
      
      // 为每个项目加载任务
      const projectsWithSchedules = await Promise.all(
        projectList.map(async (project) => {
          const schedulesResp = await scheduleService.getByProject(project.id);
          return { ...project, schedules: schedulesResp.data ?? [] };
        })
      );
      
      setProjects(projectsWithSchedules);
    } catch {
      message.error('加载项目失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await projectService.updateStatus(id, status);
      message.success('状态已更新');
      void loadProjects();
    } catch {
      message.error('更新状态失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await projectService.delete(id);
      message.success('项目已删除');
      void loadProjects();
    } catch {
      message.error('删除失败');
    }
  };

  const openCreateModal = () => {
    setEditingProject(null);
    form.resetFields();
    form.setFieldsValue({ color: '#00C9A7' });
    setModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      description: project.description,
      dateRange: project.startDate && project.endDate 
        ? [dayjs(project.startDate), dayjs(project.endDate)] 
        : undefined,
      color: project.color
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        description: values.description,
        startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
        color: values.color
      };

      if (editingProject) {
        await projectService.update(editingProject.id, payload);
        message.success('项目已更新');
      } else {
        await projectService.create(payload);
        message.success('项目已创建');
      }

      setModalOpen(false);
      void loadProjects();
    } catch {
      // validation error
    }
  };

  const getProgress = (schedules?: Schedule[]) => {
    if (!schedules || schedules.length === 0) return 0;
    const completed = schedules.filter(s => s.status === 'COMPLETED').length;
    return Math.round((completed / schedules.length) * 100);
  };

  const renderProjectItem = (project: ProjectWithSchedules) => {
    const config = statusConfig[project.status] || statusConfig.ACTIVE;
    const progress = getProgress(project.schedules);
    const totalTasks = project.schedules?.length ?? 0;
    const completedTasks = project.schedules?.filter(s => s.status === 'COMPLETED').length ?? 0;

    return (
      <List.Item
        key={project.id}
        actions={[
          <Select
            key="status"
            value={project.status}
            onChange={(value) => handleStatusChange(project.id, value)}
            options={statusOptions}
            style={{ width: 100 }}
            size="small"
          />,
          <Button
            key="edit"
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEditModal(project)}
          />,
          <Button
            key="delete"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(project.id)}
          />
        ]}
      >
        <List.Item.Meta
          avatar={
            <div 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 8, 
                background: project.color || '#00C9A7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ProjectOutlined style={{ color: '#fff', fontSize: 20 }} />
            </div>
          }
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{project.name}</span>
              <Tag color={config.color}>{config.label}</Tag>
            </div>
          }
          description={
            <div>
              {project.description && <div style={{ marginBottom: 8 }}>{project.description}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {project.startDate && project.endDate && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {project.startDate} ~ {project.endDate}
                  </Text>
                )}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <FolderOutlined /> {completedTasks}/{totalTasks} 任务
                </Text>
              </div>
              {totalTasks > 0 && (
                <Progress 
                  percent={progress} 
                  size="small" 
                  strokeColor={project.color}
                  style={{ marginTop: 8, maxWidth: 300 }}
                />
              )}
            </div>
          }
        />
      </List.Item>
    );
  };

  return (
    <div className="project-page" style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={2}>项目管理</Title>
      <Paragraph type="secondary">
        管理长期持续的项目，跟踪整体进度
      </Paragraph>

      <Card className="glass-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建项目
          </Button>
        </div>

        <List
          loading={loading}
          dataSource={projects}
          renderItem={renderProjectItem}
          locale={{ emptyText: '暂无项目' }}
        />
      </Card>

      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="输入项目名称" maxLength={200} />
          </Form.Item>

          <Form.Item name="description" label="项目描述">
            <TextArea placeholder="输入项目描述（可选）" rows={3} />
          </Form.Item>

          <Form.Item name="dateRange" label="项目周期">
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="color" label="标识颜色">
            <Select options={colorOptions} placeholder="选择颜色" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectPage;
