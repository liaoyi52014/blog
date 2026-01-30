import React, { useState } from 'react';
import { Button, Card, Input, List, Space, Tag, Typography, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { searchService } from '../services';

const { Paragraph, Text, Title } = Typography;

type SearchResult = {
  id?: number;
  title?: string;
  content?: string;
  similarity?: number;
  source?: string;
};

type UnifiedSearchData = {
  results?: SearchResult[];
  total?: number;
  source?: 'local' | 'web';
  summary?: string;
};

const toPercent = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.min(100, num * 100));
};

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [webSummary, setWebSummary] = useState('');
  const [searchSource, setSearchSource] = useState<'local' | 'web' | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setWebSummary('');
    setSearchSource(null);
    setResults([]);

    try {
      const resp = await searchService.unifiedSearch<UnifiedSearchData>(query);
      const data = resp.data;

      if (data) {
        setSearchSource(data.source ?? null);
        setResults(data.results ?? []);

        if (data.source === 'web' && data.summary) {
          setWebSummary(data.summary);
        }
      }
    } catch (error: any) {
      message.error(error.message || '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToKnowledge = async (title: string, content: string) => {
    const saveId = `${title}-${Date.now()}`;
    setSavingId(saveId);

    try {
      await searchService.addToKnowledge(title || '外部知识', content);
      message.success('已成功添加到知识库');
    } catch (error: any) {
      message.error(error.message || '添加失败');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="search-page">
      <section className="page-hero">
        <Title level={2} className="hero-title">
          知识检索
        </Title>
        <Paragraph className="hero-subtitle">
          输入你的问题，系统会优先从本地知识库中检索。如果没有找到相关内容，将自动搜索外网并总结答案。
          你可以将有价值的外部内容一键保存到知识库中。
        </Paragraph>
      </section>

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card className="glass-card">
          <Input.Search
            placeholder="输入你想了解的问题或关键词..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onSearch={handleSearch}
            enterButton={<><SearchOutlined /> 搜索</>}
            size="large"
            loading={loading}
            allowClear
          />
        </Card>

        {/* Source indicator */}
        {searchSource && !loading && (
          <div style={{ marginBottom: 8 }}>
            <Tag color={searchSource === 'local' ? 'purple' : 'blue'}>
              {searchSource === 'local' ? '📚 来自本地知识库' : '🌐 来自网络搜索'}
            </Tag>
          </div>
        )}

        {/* Web summary section */}
        {searchSource === 'web' && webSummary && (
          <Card
            className="glass-card"
            title="网络搜索总结"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={savingId === 'web-summary'}
                onClick={() => handleAddToKnowledge(query, webSummary)}
              >
                保存到知识库
              </Button>
            }
          >
            <div className="markdown-content">
              <ReactMarkdown>{webSummary}</ReactMarkdown>
            </div>
          </Card>
        )}

        {/* Local results list */}
        {searchSource === 'local' && results.length > 0 && (
          <List
            dataSource={results}
            loading={loading}
            renderItem={(item: SearchResult, index: number) => {
              const percent = toPercent(item.similarity);
              const itemKey = `result-${item.id ?? index}`;

              return (
                <List.Item>
                  <Card className="glass-card result-card" style={{ width: '100%' }} hoverable>
                    <Card.Meta
                      title={item.title}
                      description={
                        <>
                          <div className="markdown-content result-content">
                            <ReactMarkdown>{item.content || ''}</ReactMarkdown>
                          </div>

                          {percent !== null && (
                            <div className="energy-block">
                              <div className="energy-meta">
                                <span className="energy-label">语义相似度</span>
                                <span className="energy-value">{percent.toFixed(1)}%</span>
                              </div>
                              <div className="energy-bar-track">
                                <div
                                  className="energy-bar-fill"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <Space wrap style={{ marginTop: 12 }}>
                            {percent !== null && (
                              <Tag className="futuristic-tag">
                                相似度 {percent.toFixed(1)}%
                              </Tag>
                            )}
                            {item.source && <Tag className="futuristic-tag">{item.source}</Tag>}
                          </Space>
                        </>
                      }
                    />
                  </Card>
                </List.Item>
              );
            }}
          />
        )}

        {/* Empty state */}
        {!loading && searchSource === 'local' && results.length === 0 && query && (
          <Text type="secondary">
            本地知识库未找到结果，正在搜索外部资源...
          </Text>
        )}

        {!loading && !searchSource && query && (
          <Text type="secondary">未找到任何结果</Text>
        )}
      </Space>
    </div>
  );
};

export default SearchPage;
