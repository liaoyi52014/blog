import React, { useState } from 'react';
import { Button, Card, Form, Input, Select, Space, Switch, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { articleService, type ArticleCreatePayload } from '../services';

const { Title, Paragraph, Text } = Typography;

const categoryOptions = [
  { label: 'AI 工程', value: 'ai-engineering' },
  { label: '系统设计', value: 'system-design' },
  { label: '后端开发', value: 'backend' },
  { label: '前端工程', value: 'frontend' },
  { label: '数据与检索', value: 'data-search' },
  { label: '学习笔记', value: 'notes' }
];

type CreatedArticle = {
  id: number;
  title: string;
  status?: string;
};

const CreateArticlePage: React.FC = () => {
  const [form] = Form.useForm<ArticleCreatePayload>();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleFinish = async (values: ArticleCreatePayload) => {
    setSubmitting(true);
    try {
      const resp = await articleService.createManual<CreatedArticle>(values);
      const article = resp.data;
      message.success(`创建成功：${article?.title ?? '未命名文章'}`);
      navigate('/');
    } catch (error: any) {
      message.error(error.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-article-page">
      <section className="page-hero">
        <Title level={2} className="hero-title">
          创建科技博客
        </Title>
        <Paragraph className="hero-subtitle">
          手动撰写一篇结构清晰、可检索的技术文章。系统会在需要时自动生成摘要，
          并可选择立即发布。
        </Paragraph>
        <div className="hero-chips">
          <div className="status-chip">
            <span className="status-chip-label">写作模式</span>
            <span className="status-chip-value">Manual</span>
          </div>
          <div className="status-chip">
            <span className="status-chip-label">摘要策略</span>
            <span className="status-chip-value">自动补全</span>
          </div>
        </div>
      </section>

      <Card className="glass-card" title="文章信息">
        <Form
          form={form}
          layout="vertical"
          initialValues={{ publish: true }}
          onFinish={handleFinish}
        >
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }, { max: 500 }]}
          >
            <Input placeholder="例如：Spring AI + pgvector 的实战检索架构" />
          </Form.Item>

          <Space size="middle" style={{ width: '100%' }} wrap>
            <Form.Item label="分类" name="category" style={{ minWidth: 220, flex: 1 }}>
              <Select
                placeholder="选择分类"
                options={categoryOptions}
                allowClear
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Form.Item label="作者" name="author" style={{ minWidth: 200, flex: 1 }}>
              <Input placeholder="你的名字或昵称" />
            </Form.Item>
          </Space>

          <Form.Item label="标签（逗号分隔）" name="tags">
            <Input placeholder="例如：spring-ai, pgvector, semantic-search" />
          </Form.Item>

          <Form.Item label="摘要（可选，不填将自动生成）" name="summary">
            <Input.TextArea rows={3} placeholder="用 1-2 句话总结这篇文章的价值" />
          </Form.Item>

          <Form.Item
            label="正文"
            name="content"
            rules={[{ required: true, message: '请输入正文内容' }]}
          >
            <Input.TextArea
              rows={16}
              showCount
              placeholder="从问题背景、方案设计、关键实现、踩坑与总结几个部分展开..."
            />
          </Form.Item>

          <div className="form-actions">
            <Form.Item name="publish" valuePropName="checked" noStyle>
              <Switch checkedChildren="发布" unCheckedChildren="草稿" />
            </Form.Item>
            <Text type="secondary">提交后可在首页查看</Text>
          </div>

          <Form.Item style={{ marginTop: 18, marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={submitting}>
              生成文章
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateArticlePage;
