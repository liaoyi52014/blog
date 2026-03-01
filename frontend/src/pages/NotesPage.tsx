import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Input,
  List,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message
} from 'antd';
import { EyeOutlined, FileTextOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { articleService } from '../services';

const { Title, Paragraph, Text } = Typography;

type NoteArticle = {
  id: number;
  title: string;
  content: string;
  summary?: string;
  category?: string;
  tags?: string;
  author?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
};

const statusLabelMap: Record<string, string> = {
  published: '已发布',
  draft: '草稿'
};

const NotesPage: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [previewNote, setPreviewNote] = useState<NoteArticle | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await articleService.getAll<NoteArticle[]>();
      const allArticles = resp.data ?? [];
      const filtered = allArticles
        .filter(article => {
          const normalizedCategory = (article.category ?? '').trim().toLowerCase();
          return normalizedCategory === '' || normalizedCategory === 'notes';
        })
        .sort((a, b) => {
          const left = dayjs(b.updatedAt || b.createdAt).valueOf();
          const right = dayjs(a.updatedAt || a.createdAt).valueOf();
          return left - right;
        });
      setNotes(filtered);
    } catch (error: any) {
      message.error(error.message || '加载笔记失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const keywordMatch = !normalizedKeyword ||
        note.title?.toLowerCase().includes(normalizedKeyword) ||
        note.summary?.toLowerCase().includes(normalizedKeyword) ||
        note.content?.toLowerCase().includes(normalizedKeyword) ||
        note.tags?.toLowerCase().includes(normalizedKeyword);
      const normalizedStatus = (note.status ?? '').toLowerCase();
      const statusMatch = statusFilter === 'all' || normalizedStatus === statusFilter;
      return keywordMatch && statusMatch;
    });
  }, [notes, keyword, statusFilter]);

  return (
    <div className="notes-page" style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px' }}>
      <section style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 10 }}>笔记</Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          展示你手动编写并归类为“学习笔记”的知识条目，支持搜索与快速预览。
        </Paragraph>
      </section>

      <Card className="glass-card">
        <Space size={12} wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space wrap>
            <Input.Search
              placeholder="搜索标题、摘要、正文或标签"
              allowClear
              style={{ width: 320 }}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <Select
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: '全部状态', value: 'all' },
                { label: '已发布', value: 'published' },
                { label: '草稿', value: 'draft' }
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void loadNotes()} loading={loading}>
              刷新
            </Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/create?category=notes')}>
            新建笔记
          </Button>
        </Space>

        <List
          loading={loading}
          dataSource={filteredNotes}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无笔记，请在知识条目管理中创建“学习笔记”或留空分类"
              />
            )
          }}
          renderItem={note => {
            const statusKey = (note.status ?? '').toLowerCase();
            const statusLabel = statusLabelMap[statusKey] || (note.status ?? '未知状态');
            const tags = (note.tags ?? '')
              .split(',')
              .map(tag => tag.trim())
              .filter(Boolean);

            return (
              <List.Item
                key={note.id}
                actions={[
                  <Button key="preview" type="text" icon={<EyeOutlined />} onClick={() => setPreviewNote(note)}>
                    查看
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined style={{ fontSize: 20, color: 'var(--primary)' }} />}
                  title={
                    <Space size={8} wrap>
                      <span>{note.title}</span>
                      <Tag color={statusKey === 'published' ? 'success' : 'processing'}>{statusLabel}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      <Text type="secondary">
                        {note.summary || `${note.content?.slice(0, 160) ?? ''}${(note.content?.length ?? 0) > 160 ? '...' : ''}`}
                      </Text>
                      <Space size={8} wrap>
                        {tags.map(tag => (
                          <Tag key={`${note.id}-${tag}`} color="cyan" style={{ marginInlineEnd: 0 }}>
                            {tag}
                          </Tag>
                        ))}
                        <Text type="secondary">
                          更新于 {dayjs(note.updatedAt || note.createdAt).isValid()
                            ? dayjs(note.updatedAt || note.createdAt).format('YYYY-MM-DD HH:mm')
                            : '-'}
                        </Text>
                        {note.author && <Text type="secondary">作者：{note.author}</Text>}
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>

      <Modal
        title={previewNote?.title || '笔记预览'}
        open={Boolean(previewNote)}
        onCancel={() => setPreviewNote(null)}
        footer={null}
        width={840}
        styles={{ body: { color: 'var(--text)' } }}
      >
        {previewNote?.summary && (
          <Paragraph style={{ marginBottom: 12, color: 'var(--text)' }}>
            <Text strong style={{ color: 'var(--text)' }}>摘要：</Text>
            <Text style={{ color: 'var(--text-secondary)' }}>{previewNote.summary}</Text>
          </Paragraph>
        )}
        <div
          style={{
            maxHeight: '58vh',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.75,
            color: 'var(--text)',
            background: 'rgba(10, 18, 24, 0.55)',
            border: '1px solid rgba(90, 122, 140, 0.28)',
            borderRadius: 10,
            padding: 14
          }}
        >
          {previewNote?.content}
        </div>
      </Modal>
    </div>
  );
};

export default NotesPage;
