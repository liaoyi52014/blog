import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Dropdown } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './GanttChart.css';

export interface GanttTask {
  id: string | number;
  title: string;
  startDate: string;
  endDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  color?: string;
}

interface GanttChartProps {
  tasks: GanttTask[];
  onTaskClick?: (task: GanttTask) => void;
  onTaskUpdate?: (taskId: string | number, startDate: string, endDate: string) => void;
  onStatusChange?: (taskId: string | number, status: string) => void;
}

const CELL_WIDTH = 40; // 每天的宽度

const GanttChart: React.FC<GanttChartProps> = ({ 
  tasks, 
  onTaskClick,
  onTaskUpdate,
  onStatusChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    taskId: string | number;
    type: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    originalStart: string;
    originalEnd: string;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    taskId: string | number;
    startDate: string;
    endDate: string;
  } | null>(null);
  
  // 动态计算日期范围：当前日期前6个月 到 后18个月（约2年）
  const { dates, startDate, endDate, totalDays, todayIndex } = useMemo(() => {
    const today = dayjs();
    const start = today.subtract(6, 'month').startOf('month'); // 6个月前的月初
    const end = today.add(18, 'month').endOf('month'); // 18个月后的月末
    const days = end.diff(start, 'day') + 1;
    const todayIdx = today.diff(start, 'day');
    
    const dateList: dayjs.Dayjs[] = [];
    for (let i = 0; i < days; i++) {
      dateList.push(start.add(i, 'day'));
    }
    
    return {
      dates: dateList,
      startDate: start,
      endDate: end,
      totalDays: days,
      todayIndex: todayIdx
    };
  }, []);

  // 按月分组日期
  const monthGroups = useMemo(() => {
    const groups: { month: string; days: number; label: string }[] = [];
    let currentMonth = '';
    
    dates.forEach(date => {
      const monthKey = date.format('YYYY-MM');
      if (monthKey !== currentMonth) {
        currentMonth = monthKey;
        groups.push({ 
          month: monthKey, 
          days: 1,
          label: date.format('YYYY年M月')
        });
      } else {
        groups[groups.length - 1].days++;
      }
    });
    
    return groups;
  }, [dates]);

  // 计算任务条位置（使用像素）
  const getTaskPosition = useCallback((task: GanttTask) => {
    const preview = dragPreview?.taskId === task.id ? dragPreview : null;
    const taskStartStr = preview?.startDate || task.startDate;
    const taskEndStr = preview?.endDate || task.endDate || taskStartStr;
    
    const taskStart = dayjs(taskStartStr);
    const taskEnd = dayjs(taskEndStr);
    
    const startOffset = taskStart.diff(startDate, 'day');
    const duration = taskEnd.diff(taskStart, 'day') + 1;
    
    if (startOffset + duration < 0 || startOffset >= totalDays) {
      return null;
    }
    
    const left = Math.max(0, startOffset) * CELL_WIDTH;
    const width = Math.min(duration, totalDays - Math.max(0, startOffset)) * CELL_WIDTH;
    
    // 根据优先级显示颜色：LOW=绿色, MEDIUM=黄色, HIGH=红色
    const priorityColors: Record<string, string> = {
      LOW: '#52c41a',
      MEDIUM: '#faad14',
      HIGH: '#ff4d4f'
    };
    
    // 优先使用 task.color，其次使用优先级颜色，默认黄色
    const bgColor = task.color || priorityColors[task.priority || 'MEDIUM'] || '#faad14';
    
    return {
      left,
      width,
      duration,
      backgroundColor: bgColor
    };
  }, [startDate, totalDays, dragPreview]);

  // 拖拽开始
  const handleDragStart = useCallback((
    e: React.MouseEvent,
    task: GanttTask,
    type: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragging({
      taskId: task.id,
      type,
      startX: e.clientX,
      originalStart: task.startDate,
      originalEnd: task.endDate || task.startDate
    });
  }, []);

  // 拖拽中
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragging.startX;
      const deltaDays = Math.round(deltaX / CELL_WIDTH);
      
      if (deltaDays === 0 && !dragPreview) return;
      
      const originalStart = dayjs(dragging.originalStart);
      const originalEnd = dayjs(dragging.originalEnd);
      
      let newStart: dayjs.Dayjs;
      let newEnd: dayjs.Dayjs;
      
      if (dragging.type === 'move') {
        newStart = originalStart.add(deltaDays, 'day');
        newEnd = originalEnd.add(deltaDays, 'day');
      } else if (dragging.type === 'resize-start') {
        newStart = originalStart.add(deltaDays, 'day');
        newEnd = originalEnd;
        if (newStart.isAfter(newEnd)) {
          newStart = newEnd;
        }
      } else {
        newStart = originalStart;
        newEnd = originalEnd.add(deltaDays, 'day');
        if (newEnd.isBefore(newStart)) {
          newEnd = newStart;
        }
      }
      
      setDragPreview({
        taskId: dragging.taskId,
        startDate: newStart.format('YYYY-MM-DD'),
        endDate: newEnd.format('YYYY-MM-DD')
      });
    };

    const handleMouseUp = () => {
      if (dragPreview && onTaskUpdate) {
        onTaskUpdate(dragPreview.taskId, dragPreview.startDate, dragPreview.endDate);
      }
      setDragging(null);
      setDragPreview(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragPreview, onTaskUpdate]);

  // 滚动到今天
  useEffect(() => {
    if (containerRef.current && todayIndex >= 0) {
      const scrollLeft = todayIndex * CELL_WIDTH - 300;
      containerRef.current.scrollLeft = Math.max(0, scrollLeft);
    }
  }, [todayIndex]);

  const today = dayjs().format('YYYY-MM-DD');
  const totalWidth = totalDays * CELL_WIDTH;

  return (
    <div className="gantt-wrapper">
      {/* 左侧任务列表 */}
      <div className="gantt-task-list">
        <div className="gantt-task-header">
          <div className="gantt-task-cell task-name">任务名称</div>
          <div className="gantt-task-cell task-date">截止时间</div>
        </div>
        <div className="gantt-task-body">
          {tasks.length === 0 ? (
            <div className="gantt-empty">暂无日程</div>
          ) : (
            tasks.map(task => {
              const statusMenuItems = [
                {
                  key: 'PENDING',
                  label: '待处理',
                  icon: <ClockCircleOutlined />,
                  disabled: task.status === 'PENDING',
                  onClick: () => onStatusChange?.(task.id, 'PENDING')
                },
                {
                  key: 'IN_PROGRESS',
                  label: '进行中',
                  icon: <SyncOutlined />,
                  disabled: task.status === 'IN_PROGRESS',
                  onClick: () => onStatusChange?.(task.id, 'IN_PROGRESS')
                },
                {
                  key: 'COMPLETED',
                  label: '已完成',
                  icon: <CheckCircleOutlined />,
                  disabled: task.status === 'COMPLETED',
                  onClick: () => onStatusChange?.(task.id, 'COMPLETED')
                }
              ];
              
              const statusLabels: Record<string, string> = {
                PENDING: '待处理',
                IN_PROGRESS: '进行中',
                COMPLETED: '已完成'
              };

              return (
                <div 
                  key={task.id} 
                  className="gantt-task-row"
                >
                  <div className="gantt-task-cell task-name">
                    <Dropdown
                      menu={{ items: statusMenuItems }}
                      trigger={['click']}
                    >
                      <span 
                        className={`task-status-dot priority-${(task.priority || 'medium').toLowerCase()}`} 
                        title={`状态：${statusLabels[task.status] || task.status}（点击修改）`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Dropdown>
                    <span className="task-title" onClick={() => onTaskClick?.(task)}>{task.title}</span>
                  </div>
                  <div className="gantt-task-cell task-date">
                    {task.endDate || task.startDate}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 右侧甘特图 */}
      <div className="gantt-chart" ref={containerRef}>
        <div className="gantt-scroll-content" style={{ width: totalWidth }}>
          {/* 日期头部 */}
          <div className="gantt-header">
            <div className="gantt-month-row">
              {monthGroups.map(group => (
                <div 
                  key={group.month} 
                  className="gantt-month-cell"
                  style={{ width: group.days * CELL_WIDTH }}
                >
                  {group.label}
                </div>
              ))}
            </div>
            <div className="gantt-day-row">
              {dates.map(date => (
                <div 
                  key={date.format('YYYY-MM-DD')}
                  className={`gantt-day-cell ${date.format('YYYY-MM-DD') === today ? 'today' : ''} ${date.day() === 0 || date.day() === 6 ? 'weekend' : ''}`}
                  style={{ width: CELL_WIDTH }}
                >
                  {date.date()}
                </div>
              ))}
            </div>
          </div>

          {/* 甘特图主体 */}
          <div className="gantt-body">
            {/* 网格背景 */}
            <div className="gantt-grid">
              {dates.map(date => (
                <div 
                  key={date.format('YYYY-MM-DD')}
                  className={`gantt-grid-cell ${date.format('YYYY-MM-DD') === today ? 'today' : ''} ${date.day() === 0 || date.day() === 6 ? 'weekend' : ''}`}
                  style={{ width: CELL_WIDTH }}
                />
              ))}
            </div>

            {/* 任务条 */}
            <div className="gantt-bars">
              {tasks.length === 0 ? (
                <div className="gantt-bar-row" />
              ) : (
                tasks.map(task => {
                  const pos = getTaskPosition(task);
                  const isDragging = dragging?.taskId === task.id;
                  return (
                    <div key={task.id} className="gantt-bar-row">
                      {pos && (
                        <div 
                          className={`gantt-bar status-${task.status.toLowerCase()} ${isDragging ? 'dragging' : ''}`}
                          style={{
                            left: pos.left,
                            width: pos.width,
                            backgroundColor: pos.backgroundColor
                          }}
                          onClick={() => !dragging && onTaskClick?.(task)}
                          title={task.title}
                        >
                          {/* 左侧拖拽手柄 */}
                          <div 
                            className="gantt-bar-handle handle-left"
                            onMouseDown={(e) => handleDragStart(e, task, 'resize-start')}
                          />
                          
                          {/* 任务内容（可拖动整体移动） */}
                          <div 
                            className="gantt-bar-content"
                            onMouseDown={(e) => handleDragStart(e, task, 'move')}
                          >
                            <span className="gantt-bar-label">{task.title}</span>
                            {pos.duration > 1 && (
                              <span className="gantt-bar-duration">{pos.duration}天</span>
                            )}
                          </div>
                          
                          {/* 右侧拖拽手柄 */}
                          <div 
                            className="gantt-bar-handle handle-right"
                            onMouseDown={(e) => handleDragStart(e, task, 'resize-end')}
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* 今日线 */}
            {todayIndex >= 0 && todayIndex < totalDays && (
              <div 
                className="gantt-today-line"
                style={{ left: todayIndex * CELL_WIDTH + CELL_WIDTH / 2 }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
