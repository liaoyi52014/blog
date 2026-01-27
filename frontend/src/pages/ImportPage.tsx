import React, { useEffect, useState } from 'react';
import { Button, Card, message, Table, Typography, Upload } from 'antd';
import {
  FileMarkdownOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { importService } from '../services';

const { Paragraph, Title, Text } = Typography;

type ImportRecord = {
  id: number;
  filename: string;
  fileType?: string;
  chunksCount?: number;
  status?: string;
  createdAt?: string;
};

type ImportResult = {
  success: boolean;
  message: string;
  recordId?: number;
  filename?: string;
  chunksCount?: number;
  status?: string;
};

const ImportPage: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [records, setRecords] = useState<ImportRecord[]>([]);

  useEffect(() => {
    void loadRecords();
  }, []);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const resp = await importService.upload<ImportResult>(formData);
      const result = resp.data;
      if (result?.success) {
        message.success(`导入成功，共生成 ${result.chunksCount ?? 0} 个知识块`);
      } else {
        message.error(result?.message ?? '导入失败');
      }
      await loadRecords();
    } catch (error: any) {
      message.error(error.message || '导入失败');
    } finally {
      setUploading(false);
    }

    return false;
  };

  const loadRecords = async () => {
    const resp = await importService.getRecords<ImportRecord[]>();
    setRecords(resp.data ?? []);
  };

  const columns = [
    { title: '文件名', dataIndex: 'filename', key: 'filename' },
    { title: '类型', dataIndex: 'fileType', key: 'fileType' },
    { title: '知识块数', dataIndex: 'chunksCount', key: 'chunksCount' },
    { title: '状态', dataIndex: 'status', key: 'status' },
    { title: '导入时间', dataIndex: 'createdAt', key: 'createdAt' }
  ];

  return (
    <div className="import-page">
      <section className="page-hero">
        <Title level={2} className="hero-title">
          文档导入
        </Title>
        <Paragraph className="hero-subtitle">
          导入你的 Word、PDF、Markdown 文档，系统将自动解析、分块、向量化并写入知识库。
          这是构建“可检索记忆”的第一步。
        </Paragraph>
      </section>

      <Card className="glass-card" title="上传与解析" style={{ marginBottom: 24 }}>
        <Upload
          beforeUpload={handleUpload}
          accept=".doc,.docx,.pdf,.md"
          showUploadList={false}
        >
          <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
            选择文件上传
          </Button>
        </Upload>

        <div className="import-hint" style={{ marginTop: 14 }}>
          支持格式：Word (.doc, .docx) / PDF (.pdf) / Markdown (.md)
        </div>

        <div style={{ marginTop: 10, color: '#aab4d6' }}>
          <FileWordOutlined />
          <FilePdfOutlined style={{ marginLeft: 10 }} />
          <FileMarkdownOutlined style={{ marginLeft: 10 }} />
          <Text type="secondary" style={{ marginLeft: 12 }}>
            系统会自动分块并生成向量索引
          </Text>
        </div>
      </Card>

      <Card className="glass-card" title="导入记录">
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

export default ImportPage;
