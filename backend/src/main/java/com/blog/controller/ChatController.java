package com.blog.controller;

import com.blog.model.dto.ChatResponse;
import com.blog.model.dto.SearchRequest;
import com.blog.service.ChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.annotation.PreDestroy;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private static final int STREAM_CORE_SIZE = 2;
    private static final int STREAM_MAX_SIZE = 4;
    private static final int STREAM_QUEUE_CAPACITY = 200;
    private static final long STREAM_KEEP_ALIVE_SECONDS = 60L;
    private static final long SSE_TIMEOUT_MILLIS = 0L;
    private static final int CHUNK_SIZE = 24;

    private final ChatService chatService;
    private final ObjectMapper objectMapper;
    private final ExecutorService streamExecutor;

    public ChatController(ChatService chatService, ObjectMapper objectMapper) {
        this.chatService = chatService;
        this.objectMapper = objectMapper;
        this.streamExecutor = new ThreadPoolExecutor(
            STREAM_CORE_SIZE,
            STREAM_MAX_SIZE,
            STREAM_KEEP_ALIVE_SECONDS,
            TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(STREAM_QUEUE_CAPACITY),
            new NamedThreadFactory("chat-stream"),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }

    @PostMapping(value = "/knowledge", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatWithKnowledgeStream(@Valid @RequestBody SearchRequest request) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MILLIS);
        streamExecutor.execute(() -> streamKnowledge(emitter, request));
        return emitter;
    }

    private void streamKnowledge(SseEmitter emitter, SearchRequest request) {
        try {
            ChatResponse response = chatService.chatWithKnowledge(
                request.getQuery(),
                request.getLimit(),
                request.getThreshold()
            );
            String answer = response.getAnswer() == null ? "" : response.getAnswer();
            sendChunks(emitter, answer);
            sendSources(emitter, response);
            sendEvent(emitter, "done", "[DONE]");
            emitter.complete();
        } catch (Exception ex) {
            log.error("Knowledge chat stream failed.", ex);
            try {
                sendEvent(emitter, "error", ex.getMessage());
            } catch (Exception ignored) {
                log.warn("Failed to send error event: {}", ignored.getMessage());
            }
            emitter.completeWithError(ex);
        }
    }

    private void sendChunks(SseEmitter emitter, String answer) throws Exception {
        if (answer == null || answer.isBlank()) {
            return;
        }
        int index = 0;
        while (index < answer.length()) {
            int end = Math.min(answer.length(), index + CHUNK_SIZE);
            String chunk = answer.substring(index, end);
            sendEvent(emitter, "chunk", chunk);
            index = end;
        }
    }

    private void sendSources(SseEmitter emitter, ChatResponse response) throws Exception {
        String json = objectMapper.writeValueAsString(response.getSources());
        sendEvent(emitter, "sources", json);
    }

    private void sendEvent(SseEmitter emitter, String name, String data) throws Exception {
        emitter.send(SseEmitter.event().name(name).data(data));
    }

    @PreDestroy
    public void shutdownStreamExecutor() {
        streamExecutor.shutdown();
    }

    private static final class NamedThreadFactory implements ThreadFactory {
        private final String prefix;
        private final AtomicInteger index = new AtomicInteger(1);

        private NamedThreadFactory(String prefix) {
            this.prefix = prefix;
        }

        @Override
        public Thread newThread(Runnable runnable) {
            Thread thread = new Thread(runnable);
            thread.setName(prefix + "-" + index.getAndIncrement());
            thread.setDaemon(true);
            return thread;
        }
    }
}
