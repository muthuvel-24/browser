package com.muthu.browser.search.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
public class DocumentEntity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    private String url;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String title;

    @Column(columnDefinition = "TEXT")
    private String snippet;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false, length = 255)
    private String domain;

    @Column(name = "indexed_at")
    private LocalDateTime indexedAt = LocalDateTime.now();

    public DocumentEntity() {}

    public DocumentEntity(String id, String url, String title, String snippet, String content, String domain) {
        this.id = id;
        this.url = url;
        this.title = title;
        this.snippet = snippet;
        this.content = content;
        this.domain = domain;
        this.indexedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSnippet() { return snippet; }
    public void setSnippet(String snippet) { this.snippet = snippet; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public LocalDateTime getIndexedAt() { return indexedAt; }
    public void setIndexedAt(LocalDateTime indexedAt) { this.indexedAt = indexedAt; }
}
