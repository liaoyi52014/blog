package com.blog.parser;

import org.commonmark.node.AbstractVisitor;
import org.commonmark.node.Node;
import org.commonmark.node.Text;
import org.commonmark.parser.Parser;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Component
public class MarkdownParser {

    private final Parser parser = Parser.builder().build();

    public String parse(InputStream inputStream) throws IOException {
        String markdown = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        Node document = parser.parse(markdown);
        return extractText(document);
    }

    private String extractText(Node node) {
        StringBuilder text = new StringBuilder();
        node.accept(new AbstractVisitor() {
            @Override
            public void visit(Text textNode) {
                text.append(textNode.getLiteral());
            }
        });
        return text.toString();
    }
}