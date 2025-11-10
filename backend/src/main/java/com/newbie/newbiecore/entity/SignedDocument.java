package com.newbie.newbiecore.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "signed_documents")
public class SignedDocument {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(name = "path_html", nullable = false, length = 500)
    private String pathHtml;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public SignedDocument() {}

    public SignedDocument(UUID id, String title, String pathHtml, Instant createdAt) {
        this.id = id;
        this.title = title;
        this.pathHtml = pathHtml;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public String getPathHtml() { return pathHtml; }
    public Instant getCreatedAt() { return createdAt; }

    public void setId(UUID id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setPathHtml(String pathHtml) { this.pathHtml = pathHtml; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
