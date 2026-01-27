import React, { useState } from 'react';
import { Card, Input, List, Radio, Space, Tag, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { searchService } from '../services';

const { Paragraph, Text, Title } = Typography;

type SearchData = {
  results?: any[];
  total?: number;
  summary?: string;
};

const toPercent = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const percent = Math.max(0, Math.min(100, num * 100));
  return percent;
};

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'vector' | 'hybrid' | 'web'>('vector');
  const [results, setResults] = useState<any[]>([]);
  const [webSummary, setWebSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setWebSummary('');
    try {
      switch (searchType) {
        case 'vector': {
          const resp = await searchService.vectorSearch<SearchData>(query);
          setResults(resp.data?.results ?? []);
          break;
        }
        case 'hybrid': {
          const resp = await searchService.hybridSearch<SearchData>(query);
          setResults(resp.data?.results ?? []);
          break;
        }
        case 'web': {
          const resp = await searchService.webSearch<SearchData>(query);
          setResults([]);
          setWebSummary(resp.data?.summary ?? '');
          break;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <section className="page-hero">
        <Title level={2} className="hero-title">
          知识检索
        </Title>
        <Paragraph className="hero-subtitle">
          向量检索用于语义理解，混合检索兼顾关键词命中，全网检索用于探索式问题。
          选择合适的检索方式，让信息自己浮现。
        </Paragraph>
      </section>

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card className="glass-card">
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Radio.Group
              value={searchType}
              onChange={e => setSearchType(e.target.value)}
            >
              <Radio.Button value="vector">向量检索</Radio.Button>
              <Radio.Button value="hybrid">混合检索</Radio.Button>
              <Radio.Button value="web">全网检索</Radio.Button>
            </Radio.Group>

            <Input.Search
              placeholder="输入你想理解的问题或关键词..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              size="large"
              loading={loading}
              allowClear
            />
          </Space>
        </Card>

        {searchType === 'web' && webSummary && (
          <Card className="glass-card" title="全网总结" loading={loading}>
            <Paragraph style={{ marginBottom: 0 }}>{webSummary}</Paragraph>
          </Card>
        )}

        {searchType !== 'web' && (
          <List
            dataSource={results}
            loading={loading}
            renderItem={(item: any) => {
              const percent = toPercent(item.similarity);
              return (
                <List.Item>
                  <Card className="glass-card result-card" style={{ width: '100%' }} hoverable>
                    <Card.Meta
                      title={item.title}
                      description={
                        <>
                          <Paragraph ellipsis={{ rows: 4 }}>{item.content}</Paragraph>

                          {percent !== null && (
                            <div className="energy-block">
                              <div className="energy-meta">
                                <span className="energy-label">语义能量</span>
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

                          <Space wrap>
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

        {!loading && searchType !== 'web' && results.length === 0 && query && (
          <Text type="secondary">未找到结果，试试更具体的关键词或换一种检索方式。</Text>
        )}
      </Space>
    </div>
  );
};

export default SearchPage;
