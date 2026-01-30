export type KnowledgeSource = {
  id?: number;
  title?: string;
  content?: string;
  similarity?: number;
  source?: string;
};

export type ChatResponse = {
  answer?: string;
  sources?: KnowledgeSource[];
};

export type ChatStreamEvent =
  | { type: 'chunk'; data: string }
  | { type: 'sources'; data: KnowledgeSource[] }
  | { type: 'done' }
  | { type: 'error'; data: string };

type ChatStreamOptions = {
  limit?: number;
  threshold?: number;
  signal?: AbortSignal;
};

export const chatService = {
  streamKnowledge: async (
    query: string,
    onEvent: (event: ChatStreamEvent) => void,
    options: ChatStreamOptions = {}
  ) => {
    const { limit = 6, threshold = 0.7, signal } = options;
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
    const response = await fetch(`${baseUrl}/api/chat/knowledge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify({ query, limit, threshold }),
      signal
    });

    if (!response.ok) {
      const message = `请求失败 (${response.status})`;
      onEvent({ type: 'error', data: message });
      return;
    }

    if (!response.body) {
      onEvent({ type: 'error', data: '响应体为空' });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';
      blocks.forEach(block => {
        const event = parseSseBlock(block);
        if (!event) return;
        if (event.type === 'sources') {
          try {
            const sources = JSON.parse(event.data) as KnowledgeSource[];
            onEvent({ type: 'sources', data: sources });
          } catch {
            onEvent({ type: 'error', data: '解析sources失败' });
          }
          return;
        }
        if (event.type === 'done') {
          onEvent({ type: 'done' });
          return;
        }
        if (event.type === 'error') {
          onEvent({ type: 'error', data: event.data });
          return;
        }
        onEvent({ type: 'chunk', data: event.data });
      });
    }

    const tailEvent = parseSseBlock(buffer);
    if (tailEvent) {
      if (tailEvent.type === 'sources') {
        try {
          const sources = JSON.parse(tailEvent.data) as KnowledgeSource[];
          onEvent({ type: 'sources', data: sources });
        } catch {
          onEvent({ type: 'error', data: '解析sources失败' });
        }
      } else if (tailEvent.type === 'done') {
        onEvent({ type: 'done' });
      } else if (tailEvent.type === 'error') {
        onEvent({ type: 'error', data: tailEvent.data });
      } else if (tailEvent.data) {
        onEvent({ type: 'chunk', data: tailEvent.data });
      }
    }
  }
};

type ParsedEvent = {
  type: string;
  data: string;
};

const parseSseBlock = (block: string): ParsedEvent | null => {
  if (!block.trim()) {
    return null;
  }
  let eventType = 'chunk';
  const dataLines: string[] = [];
  const lines = block.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(':')) {
      return;
    }
    if (trimmed.startsWith('event:')) {
      eventType = trimmed.slice(6).trim() || 'chunk';
      return;
    }
    if (trimmed.startsWith('data:')) {
      dataLines.push(trimmed.slice(5).trim());
    }
  });
  return { type: eventType, data: dataLines.join('\n') };
};
