import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Input, Typography, Spin } from 'antd';
import {
  SearchOutlined,
  MessageOutlined,
  UploadOutlined,
  EditOutlined,
  DatabaseOutlined,
  ReadOutlined,
  NotificationOutlined
} from '@ant-design/icons';
import ArticleCard from '../components/article/ArticleCard';
import { articleService, newsService, statsService, type DashboardStats } from '../services';

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

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

const QUICK_ACTIONS = [
  {
    key: 'search',
    icon: <SearchOutlined />,
    title: '知识检索',
    desc: '语义搜索知识库',
    path: '/search',
    gradient: 'linear-gradient(135deg, #00C9A7, #00E5C4)'
  },
  {
    key: 'chat',
    icon: <MessageOutlined />,
    title: '知识对话',
    desc: 'AI 智能问答',
    path: '/chat',
    gradient: 'linear-gradient(135deg, #36A8FF, #6BC5FF)'
  },
  {
    key: 'import',
    icon: <UploadOutlined />,
    title: '文档导入',
    desc: '上传文档到知识库',
    path: '/import',
    gradient: 'linear-gradient(135deg, #9B59B6, #BE90D4)'
  },
  {
    key: 'create',
    icon: <EditOutlined />,
    title: '写博客',
    desc: '创作技术文章',
    path: '/create',
    gradient: 'linear-gradient(135deg, #F39C12, #F1C40F)'
  }
];

import { useAuth } from '../contexts/AuthContext';
import { message } from 'antd';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [aiNews, setAiNews] = useState<News[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ knowledgeCount: 0, articleCount: 0, newsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [articlesResp, newsResp, dashboardStats] = await Promise.all([
        articleService.getPublished<Article[]>(),
        newsService.getFeatured<News[]>(),
        statsService.getDashboardStats()
      ]);

      setArticles(articlesResp.data ?? []);
      setAiNews(newsResp.data ?? []);
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((value: string) => {
    if (!isLoggedIn) {
      message.warning('请先登录以使用知识检索功能');
      navigate('/login');
      return;
    }
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    } else {
      navigate('/search');
    }
  }, [navigate, isLoggedIn]);

  const handleQuickAction = useCallback((path: string) => {
    // For protected routes, check login status first for better UX
    const protectedPaths = ['/search', '/chat', '/import', '/create'];
    if (protectedPaths.some(p => path.startsWith(p)) && !isLoggedIn) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    navigate(path);
  }, [navigate, isLoggedIn]);

  const statsCards = [
    {
      key: 'knowledge',
      icon: <DatabaseOutlined />,
      label: '知识库',
      value: stats.knowledgeCount,
      hint: '已导入条目'
    },
    {
      key: 'articles',
      icon: <ReadOutlined />,
      label: '文章',
      value: stats.articleCount,
      hint: '已发布博客'
    },
    {
      key: 'news',
      icon: <NotificationOutlined />,
      label: 'AI 资讯',
      value: stats.newsCount,
      hint: '聚合信息流'
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section with Search */}
      <section className="home-hero">
        <div className="home-hero-content">
          <Title level={1} className="home-hero-title">
            个人科技圈博客
          </Title>
          <Paragraph className="home-hero-subtitle">
            以知识为底座，以 AI 为引擎。沉淀技术理解，连接语义检索与智能总结。
          </Paragraph>

          <div className="home-search-wrapper">
            <Search
              className="home-search"
              placeholder="搜索知识库..."
              enterButton={<><SearchOutlined /> 搜索</>}
              size="large"
              onSearch={handleSearch}
              allowClear
            />
          </div>

          <div className="home-status-chips">
            <div className="status-chip">
              <span className="status-chip-label">向量索引</span>
              <span className="status-chip-value">已就绪</span>
            </div>
            <div className="status-chip">
              <span className="status-chip-label">AI 协议</span>
              <span className="status-chip-value">OpenAI 兼容</span>
            </div>
            <div className="status-chip">
              <span className="status-chip-label">系统状态</span>
              <span className="status-chip-value">
                {stats.knowledgeCount + stats.articleCount > 0 ? '在线' : '待注入数据'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="home-section">
        <Title level={4} className="section-title">快捷操作</Title>
        <Row gutter={[16, 16]}>
          {QUICK_ACTIONS.map(action => (
            <Col xs={12} sm={12} md={6} key={action.key}>
              <div
                className="quick-action-card"
                onClick={() => handleQuickAction(action.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAction(action.path)}
              >
                <div className="quick-action-icon" style={{ background: action.gradient }}>
                  {action.icon}
                </div>
                <div className="quick-action-content">
                  <div className="quick-action-title">{action.title}</div>
                  <div className="quick-action-desc">{action.desc}</div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </section>

      {/* Dashboard Stats */}
      <section className="home-section">
        <Title level={4} className="section-title">知识概览</Title>
        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            {statsCards.map(stat => (
              <Col xs={24} sm={8} key={stat.key}>
                <div className="stats-card">
                  <div className="stats-card-icon">{stat.icon}</div>
                  <div className="stats-card-content">
                    <div className="stats-card-value">{stat.value}</div>
                    <div className="stats-card-label">{stat.label}</div>
                    <div className="stats-card-hint">{stat.hint}</div>
                  </div>
                  <div className="stats-card-bar">
                    <div
                      className="stats-card-bar-fill"
                      style={{ width: `${Math.min(100, Math.max(8, stat.value * 5))}%` }}
                    />
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Spin>
      </section>

      {/* Content Discovery */}
      <section className="home-section">
        <Row gutter={[24, 24]}>
          {/* Recent Articles */}
          <Col xs={24} lg={12}>
            <div className="content-section">
              <Title level={4} className="section-title">
                <ReadOutlined /> 最近文章
              </Title>
              <Spin spinning={loading}>
                {articles.length > 0 ? (
                  <div className="content-list">
                    {articles.slice(0, 4).map(article => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                ) : (
                  <div className="content-empty">
                    <Text type="secondary">暂无文章，开始创作吧！</Text>
                  </div>
                )}
              </Spin>
            </div>
          </Col>

          {/* AI News */}
          <Col xs={24} lg={12}>
            <div className="content-section">
              <Title level={4} className="section-title">
                <NotificationOutlined /> 热门资讯
              </Title>
              <Spin spinning={loading}>
                {aiNews.length > 0 ? (
                  <div className="content-list">
                    {aiNews.slice(0, 4).map(news => (
                      <Card
                        key={news.id}
                        className="news-card glass-card"
                        size="small"
                        hoverable
                      >
                        <div className="news-card-title">{news.title}</div>
                        <Paragraph ellipsis={{ rows: 2 }} className="news-card-summary">
                          {news.summary || '暂无摘要'}
                        </Paragraph>
                        <div className="news-card-meta">
                          {news.sourceName && <Text type="secondary">{news.sourceName}</Text>}
                          {news.sourceUrl && (
                            <a href={news.sourceUrl} target="_blank" rel="noreferrer">
                              阅读原文
                            </a>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="content-empty">
                    <Text type="secondary">暂无资讯，导入 RSS 开始聚合吧！</Text>
                  </div>
                )}
              </Spin>
            </div>
          </Col>
        </Row>
      </section>
    </div>
  );
};

export default Home;
