import React from 'react';
import { Card, Typography } from 'antd';

const { Paragraph, Text } = Typography;

type Article = {
  id: number;
  title: string;
  summary?: string;
  category?: string;
  author?: string;
};

type Props = {
  article: Article;
};

const ArticleCard: React.FC<Props> = ({ article }) => {
  return (
    <Card className="glass-card" title={article.title} hoverable>
      {article.summary ? (
        <Paragraph ellipsis={{ rows: 4 }}>{article.summary}</Paragraph>
      ) : (
        <Paragraph type="secondary">暂无摘要</Paragraph>
      )}
      <div style={{ marginTop: 8 }}>
        {article.category && <Text type="secondary">分类：{article.category}</Text>}
        {article.author && (
          <Text type="secondary" style={{ marginLeft: 12 }}>
            作者：{article.author}
          </Text>
        )}
      </div>
    </Card>
  );
};

export default ArticleCard;