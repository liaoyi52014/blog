import React, { useEffect, useRef, useState } from 'react';
import { Button, Card, Input, message, Tooltip, Typography } from 'antd';
import { PlusOutlined, SendOutlined, SyncOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { chatService, ChatStreamEvent, KnowledgeSource, searchService } from '../services';

const { Paragraph, Title, Text } = Typography;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  sources?: {
    id?: number;
    title?: string;
    content?: string;
    similarity?: number;
    source?: string;
  }[];
};

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const assistantIndexRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const appendAssistantChunk = (chunk: string) => {
    const index = assistantIndexRef.current;
    if (index == null) return;
    setMessages(prev => {
      if (!prev[index]) return prev;
      const next = [...prev];
      const target = next[index];
      next[index] = { ...target, content: (target.content ?? '') + chunk };
      return next;
    });
  };

  const attachSources = (sources: KnowledgeSource[]) => {
    const index = assistantIndexRef.current;
    if (index == null) return;
    setMessages(prev => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = { ...next[index], sources };
      return next;
    });
  };

  const handleStreamEvent = (event: ChatStreamEvent) => {
    if (event.type === 'chunk') {
      appendAssistantChunk(event.data);
      return;
    }
    if (event.type === 'sources') {
      attachSources(event.data);
      return;
    }
    if (event.type === 'error') {
      appendAssistantChunk(event.data || '请求失败');
    }
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setMessages(prev => {
      const next: ChatMessage[] = [
        ...prev,
        { role: 'user' as const, content: question },
        { role: 'assistant' as const, content: '' }
      ];
      assistantIndexRef.current = next.length - 1;
      return next;
    });
    setInput('');
    setLoading(true);
    try {
      await chatService.streamKnowledge(question, handleStreamEvent, {
        signal: controller.signal
      });
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        appendAssistantChunk(error.message || '请求失败，请稍后重试。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setInput('');
    setLoading(false);
  };

  return (
    <div className="chat-page">
      <section className="page-hero">
        <div className="hero-header">
          <Title level={2} className="hero-title" style={{ marginBottom: 0 }}>
            知识对话
          </Title>
          <Button
            className="new-chat-btn"
            icon={<PlusOutlined />}
            onClick={handleNewChat}
          >
            新对话
          </Button>
        </div>
        <Paragraph className="hero-subtitle">
          基于知识库进行向量检索，再由模型加工回答。适合做快速提问与沉浸式复盘。
        </Paragraph>
      </section>

      <Card className="glass-card chat-window">
        <div className="chat-messages">
          {messages.length === 0 && (
            <Text type="secondary">输入问题开始对话，例如：如何搭建本地向量检索？</Text>
          )}

          {messages.map((msg, index) => (
            <div key={`${msg.role}-${index}`} className={`chat-message ${msg.role}`}>
              <div className="message-bubble">
                {msg.role === 'assistant' ? (
                  <div className="markdown-content">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                <div className="message-sources">
                  <div className="sources-header">
                    <div className="sources-title">参考片段</div>
                    <Tooltip title="点击同步按钮可将上述回答更新到对应知识库条目">
                      <span className="sources-hint">可更新至知识库</span>
                    </Tooltip>
                  </div>
                  <div className="sources-list">
                    {msg.sources.slice(0, 4).map((source, sourceIndex) => (
                      <div key={`${source.id ?? sourceIndex}`} className="source-item">
                        <div className="source-item-header">
                          <div className="source-name">{source.title || '未命名内容'}</div>
                          {source.id && (
                            <Tooltip title="用AI回答更新此知识">
                              <Button
                                className="source-update-btn"
                                type="text"
                                size="small"
                                icon={<SyncOutlined spin={updatingId === source.id} />}
                                loading={updatingId === source.id}
                                onClick={async () => {
                                  if (!source.id || updatingId) return;
                                  setUpdatingId(source.id);
                                  try {
                                    await searchService.updateKnowledge(source.id, msg.content);
                                    message.success('知识库已更新');
                                  } catch {
                                    message.error('更新失败');
                                  } finally {
                                    setUpdatingId(null);
                                  }
                                }}
                              />
                            </Tooltip>
                          )}
                        </div>
                        {source.content && (
                          <div className="source-snippet">{source.content}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <div className="message-bubble">正在整理知识库片段…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-wrapper">
          <Input.TextArea
            className="chat-input-modern"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="请输入你的问题，Enter 发送，Shift+Enter 换行..."
            autoSize={{ minRows: 1, maxRows: 6 }}
            onPressEnter={e => {
              if (!e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <Button
            className="chat-send-btn"
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
          />
        </div>
      </Card>
    </div>
  );
};

export default ChatPage;
