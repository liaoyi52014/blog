import React, { useEffect, useState } from 'react';
import { Button, Card, message, Table, Typography, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { rssService } from '../services';

const { Paragraph, Title, Text } = Typography;

type RssFeed = {
  id: number;
  name: string;
  url: string;
  category?: string;
  active?: boolean;
  fetchInterval?: number;
  lastFetchedAt?: string;
  createdAt?: string;
};

type RssFeedImportResult = {
  sourceFile?: string;
  total?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
};

const RssImportPage: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [feeds, setFeeds] = useState<RssFeed[]>([]);

  useEffect(() => {
    void loadFeeds();
  }, []);

  const loadFeeds = async () => {
    const resp = await rssService.listFeeds<RssFeed[]>();
    setFeeds(resp.data ?? []);
  };

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    try {
      const resp = await rssService.importFeeds<RssFeedImportResult>(formData);
      const result = resp.data;
      if (result) {
        const errorCount = result.errors?.length ?? 0;
        const sourceLabel = result.sourceFile ? `（${result.sourceFile}）` : '';
        message.success(
          `RSS导入完成${sourceLabel}：新增${result.created ?? 0}，跳过${result.skipped ?? 0}` +
            (errorCount > 0 ? `（${errorCount}条异常）` : '')
        );
      } else {
        message.success('RSS导入完成');
      }
      await loadFeeds();
    } catch (error: any) {
      message.error(error.message || 'RSS导入失败');
    } finally {
      setImporting(false);
    }

    return false;
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '链接', dataIndex: 'url', key: 'url' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    {
      title: '启用',
      dataIndex: 'active',
      key: 'active',
      render: (value: boolean) => (value ? '是' : '否')
    },
    { title: '抓取间隔', dataIndex: 'fetchInterval', key: 'fetchInterval' },
    { title: '最近抓取', dataIndex: 'lastFetchedAt', key: 'lastFetchedAt' }
  ];

  return (
    <div className="rss-page">
      <section className="page-hero">
        <Title level={2} className="hero-title">
          RSS 导入
        </Title>
        <Paragraph className="hero-subtitle">
          上传文本文件批量导入RSS订阅源，每行一个URL，支持#开头的注释行。
          注释行将作为分类标签写入。
        </Paragraph>
      </section>

      <Card className="glass-card" title="上传RSS配置" style={{ marginBottom: 24 }}>
        <Upload beforeUpload={handleImport} accept=".txt" showUploadList={false}>
          <Button icon={<UploadOutlined />} loading={importing}>
            选择RSS配置文件
          </Button>
        </Upload>
        <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
          格式示例：# Models / Platforms 然后一行一个RSS链接。
        </Text>
      </Card>

      <Card className="glass-card" title="已导入RSS">
        <Table
          className="rss-feeds-table"
          dataSource={feeds}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

export default RssImportPage;
