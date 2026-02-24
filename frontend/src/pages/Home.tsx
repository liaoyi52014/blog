import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Col, Row, Typography, Spin, Tag, message, Dropdown, Button, Progress } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  PlusOutlined,
  CalendarOutlined,
  ProjectOutlined,
  RightOutlined,
  FireOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { scheduleService, projectService, type Schedule, type Project } from '../services';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [weekSchedules, setWeekSchedules] = useState<Schedule[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0 });

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const weekStart = dayjs().startOf('week').format('YYYY-MM-DD');
      const weekEnd = dayjs().endOf('week').format('YYYY-MM-DD');

      const [todayResp, weekResp, projectsResp] = await Promise.all([
        scheduleService.getTodayPending(),
        scheduleService.getByDateRange(weekStart, weekEnd),
        projectService.getActive()
      ]);

      const todayData = todayResp.data ?? [];
      const weekData = weekResp.data ?? [];
      
      setTodaySchedules(todayData);
      setWeekSchedules(weekData);
      setActiveProjects(projectsResp.data ?? []);
      
      // 计算本周统计
      setStats({
        pending: weekData.filter(s => s.status === 'PENDING').length,
        inProgress: weekData.filter(s => s.status === 'IN_PROGRESS').length,
        completed: weekData.filter(s => s.status === 'COMPLETED').length
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleStatusChange = async (id: number, newStatus: string) => {
    try {
      await scheduleService.updateStatus(id, newStatus);
      message.success('状态已更新');
      void loadData();
    } catch {
      message.error('更新状态失败');
    }
  };

  const getStatusMenuItems = (scheduleId: number, currentStatus: string) => [
    {
      key: 'PENDING',
      label: '待处理',
      icon: <ClockCircleOutlined />,
      disabled: currentStatus === 'PENDING',
      onClick: () => handleScheduleStatusChange(scheduleId, 'PENDING')
    },
    {
      key: 'IN_PROGRESS',
      label: '进行中',
      icon: <SyncOutlined />,
      disabled: currentStatus === 'IN_PROGRESS',
      onClick: () => handleScheduleStatusChange(scheduleId, 'IN_PROGRESS')
    },
    {
      key: 'COMPLETED',
      label: '已完成',
      icon: <CheckCircleOutlined />,
      disabled: currentStatus === 'COMPLETED',
      onClick: () => handleScheduleStatusChange(scheduleId, 'COMPLETED')
    }
  ];

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      PENDING: { color: 'warning', icon: <ClockCircleOutlined />, label: '待处理' },
      IN_PROGRESS: { color: 'processing', icon: <SyncOutlined spin />, label: '进行中' },
      COMPLETED: { color: 'success', icon: <CheckCircleOutlined />, label: '已完成' }
    };
    return configs[status] || configs.PENDING;
  };

  const totalWeekTasks = stats.pending + stats.inProgress + stats.completed;
  const completionRate = totalWeekTasks > 0 ? Math.round((stats.completed / totalWeekTasks) * 100) : 0;

  const pendingToday = todaySchedules.filter(s => s.status !== 'COMPLETED');
  const completedToday = todaySchedules.filter(s => s.status === 'COMPLETED');

  return (
    <div className="home-page" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            {dayjs().format('M月D日')} {['日', '一', '二', '三', '四', '五', '六'][dayjs().day()]}曜日
          </Title>
          <Text type="secondary">
            {pendingToday.length > 0 
              ? `还有 ${pendingToday.length} 项任务待完成` 
              : completedToday.length > 0 
                ? '所有任务已全部完成！' 
                : '暂无任务安排'}
          </Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={() => navigate('/schedule')}
        >
          新建日程
        </Button>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          {/* 左侧：今日任务 */}
          <Col xs={24} lg={16}>
            {/* 今日待办 */}
            <Card 
              className="glass-card" 
              title={
                <span>
                  <FireOutlined style={{ color: '#ff6b6b', marginRight: 8 }} />
                  待办任务
                </span>
              }
              extra={
                <Link to="/schedule" style={{ color: 'var(--primary)' }}>
                  甘特图视图 <RightOutlined />
                </Link>
              }
              style={{ marginBottom: 24 }}
            >
              {pendingToday.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pendingToday.map(schedule => {
                    const config = getStatusConfig(schedule.status);
                    const priorityColors: Record<string, string> = {
                      LOW: '#52c41a',
                      MEDIUM: '#faad14', 
                      HIGH: '#ff4d4f'
                    };
                    const priorityColor = priorityColors[schedule.priority || 'MEDIUM'] || '#faad14';
                    return (
                      <div 
                        key={schedule.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 12,
                          padding: '12px 16px',
                          background: 'var(--bg-2)',
                          borderRadius: 8,
                          borderLeft: `4px solid ${priorityColor}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        className="task-item"
                        onClick={() => navigate('/schedule')}
                      >
                        <Dropdown
                          menu={{ items: getStatusMenuItems(schedule.id, schedule.status) }}
                          trigger={['click']}
                        >
                          <Tag
                            color={config.color}
                            icon={config.icon}
                            style={{ cursor: 'pointer', margin: 0 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {config.label}
                          </Tag>
                        </Dropdown>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <Text style={{ fontSize: 15 }} ellipsis>{schedule.title}</Text>
                          {schedule.description && (
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                                {schedule.description}
                              </Text>
                            </div>
                          )}
                        </div>
                        {schedule.endDate && (
                          <Tag color="blue" style={{ margin: 0 }}>
                            {schedule.endDate}
                          </Tag>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <TrophyOutlined style={{ fontSize: 48, color: 'var(--primary)', marginBottom: 16 }} />
                  <div>
                    <Text type="secondary">
                      {completedToday.length > 0 
                        ? `太棒了！${completedToday.length} 项任务已全部完成` 
                        : '暂无待办任务，享受悠闲时光吧'}
                    </Text>
                  </div>
                </div>
              )}
            </Card>

            {/* 已完成任务 */}
            {completedToday.length > 0 && (
              <Card 
                className="glass-card" 
                title={
                  <span>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    今日已完成 ({completedToday.length})
                  </span>
                }
                style={{ marginBottom: 24 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {completedToday.map(schedule => (
                    <div 
                      key={schedule.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12,
                        padding: '8px 12px',
                        opacity: 0.7
                      }}
                    >
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text delete style={{ flex: 1 }}>{schedule.title}</Text>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </Col>

          {/* 右侧：统计和项目 */}
          <Col xs={24} lg={8}>
            {/* 本周统计 */}
            <Card className="glass-card" style={{ marginBottom: 24 }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Progress
                  type="circle"
                  percent={completionRate}
                  strokeColor="var(--primary)"
                  trailColor="var(--bg-2)"
                  format={() => (
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
                        {completionRate}%
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>本周完成率</div>
                    </div>
                  )}
                />
              </div>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>{stats.pending}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>待处理</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#1890ff' }}>{stats.inProgress}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>进行中</Text>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>{stats.completed}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>已完成</Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* 进行中的项目 */}
            <Card 
              className="glass-card"
              title={
                <span>
                  <ProjectOutlined style={{ marginRight: 8 }} />
                  进行中的项目
                </span>
              }
              extra={
                <Link to="/project" style={{ color: 'var(--primary)' }}>
                  全部 <RightOutlined />
                </Link>
              }
            >
              {activeProjects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeProjects.slice(0, 5).map(project => (
                    <div 
                      key={project.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        background: 'var(--bg-2)',
                        borderRadius: 8,
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate('/project')}
                    >
                      <div 
                        style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%', 
                          background: project.color || 'var(--primary)',
                          flexShrink: 0
                        }} 
                      />
                      <Text style={{ flex: 1 }} ellipsis>{project.name}</Text>
                      {project.endDate && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {project.endDate}
                        </Text>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">暂无进行中的项目</Text>
                </div>
              )}
            </Card>

            {/* 快捷入口 */}
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Button 
                block 
                icon={<CalendarOutlined />}
                onClick={() => navigate('/schedule')}
              >
                日程管理
              </Button>
              <Button 
                block 
                icon={<ProjectOutlined />}
                onClick={() => navigate('/project')}
              >
                项目管理
              </Button>
            </div>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Home;
