import React, { useEffect, useMemo, useState } from 'react';
import { Card, Col, Row, Tabs, Typography } from 'antd';
import ArticleCard from '../components/article/ArticleCard';
import { articleService, newsService } from '../services';

type Article = {
  id: number;
  title: string;
  summary?: string;
  category?: string;
  author?: string;
};

type News = {
  id: number;
  title: string;
  summary?: string;
  sourceUrl?: string;
  sourceName?: string;
};

type MetricItem = {
  key: string;
  label: string;
  value: string;
  percent: number;
  hint: string;
};

const { Title, Paragraph, Text } = Typography;

const clampPercent = (value: number) => Math.max(6, Math.min(100, value));

const Home: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [aiNews, setAiNews] = useState<News[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    const [articlesResp, newsResp] = await Promise.all([
      articleService.getPublished<Article[]>(),
      newsService.getFeatured<News[]>()
    ]);

    setArticles(articlesResp.data ?? []);
    setAiNews(newsResp.data ?? []);
  };

  const metrics = useMemo<MetricItem[]>(() => {
    const articleCount = articles.length;
    const newsCount = aiNews.length;
    const knowledgeSignals = articleCount * 6 + newsCount * 3;

    return [
      {
        key: 'articles',
        label: '知识沉淀',
        value: `${articleCount}`,
        percent: clampPercent(articleCount * 9),
        hint: '已发布文章'
      },
      {
        key: 'news',
        label: '信号密度',
        value: `${newsCount}`,
        percent: clampPercent(newsCount * 11),
        hint: 'AI 资讯流'
      },
      {
        key: 'energy',
        label: '语义能量',
        value: `${knowledgeSignals}`,
        percent: clampPercent(knowledgeSignals),
        hint: '向量索引活跃度'
      }
    ];
  }, [articles, aiNews]);

  const statusChips = useMemo(
    () => [
      { key: 'vector', label: '向量索引', value: '已就绪' },
      { key: 'ai', label: 'AI 协议', value: 'OpenAI 兼容' },
      {
        key: 'system',
        label: '系统状态',
        value: articles.length + aiNews.length > 0 ? '在线' : '待注入数据'
      }
    ],
    [articles.length, aiNews.length]
  );

  const newsGrid = useMemo(
    () => (
      <Row gutter={[18, 18]}>
        {aiNews.map(news => (
          <Col xs={24} sm={12} md={8} key={news.id}>
            <Card
              className="glass-card"
              title={news.title}
              extra={
                news.sourceUrl ? (
                  <a href={news.sourceUrl} target="_blank" rel="noreferrer">
                    来源
                  </a>
                ) : undefined
              }
              hoverable
            >
              <Paragraph ellipsis={{ rows: 4 }}>
                {news.summary || '暂无摘要'}
              </Paragraph>
              {news.sourceName && <Text type="secondary">{news.sourceName}</Text>}
            </Card>
          </Col>
        ))}
      </Row>
    ),
    [aiNews]
  );

  const articleGrid = useMemo(
    () => (
      <Row gutter={[18, 18]}>
        {articles.map(article => (
          <Col xs={24} sm={12} md={8} key={article.id}>
            <ArticleCard article={article} />
          </Col>
        ))}
      </Row>
    ),
    [articles]
  );

  return (
    <div className="home-page">
      <section className="page-hero">
        <Title level={2} className="hero-title">
          个人科技圈博客
        </Title>
        <Paragraph className="hero-subtitle">
          以知识为底座，以 AI 为引擎。沉淀你的技术理解，连接语义检索与智能总结，
          用更高维度的方式组织与发现内容。
        </Paragraph>

        <div className="hero-metrics">
          {metrics.map(metric => (
            <div key={metric.key} className="metric-card">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">{metric.value}</div>
              <div className="metric-hint">{metric.hint}</div>
              <div className="metric-bar">
                <div
                  className="metric-bar-fill"
                  style={{ width: `${metric.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="hero-chips">
          {statusChips.map(chip => (
            <div key={chip.key} className="status-chip">
              <span className="status-chip-label">{chip.label}</span>
              <span className="status-chip-value">{chip.value}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="soft-section">
        <Tabs
          size="large"
          items={[
            {
              key: 'news',
              label: 'AI 资讯',
              children: newsGrid
            },
            {
              key: 'articles',
              label: '个人总结',
              children: articleGrid
            }
          ]}
        />
      </div>
    </div>
  );
};

export default Home;
