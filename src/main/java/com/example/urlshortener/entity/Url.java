package com.example.urlshortener.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "urls",
        indexes = {
                @Index(name = "idx_urls_short_code", columnList = "short_code", unique = true),
                @Index(name = "idx_urls_long_url", columnList = "long_url")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Url {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "long_url", nullable = false, length = 2048)
    private String longUrl;

    @Column(name = "short_code", nullable = false, unique = true, length = 10)
    private String shortCode;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "expires_date")
    private LocalDateTime expiresDate;

    @Column(name = "click_count", nullable = false)
    @Builder.Default
    private Long clickCount = 0L;

    @Column(name = "last_accessed_date")
    private LocalDateTime lastAccessedDate;

    @PrePersist
    void onCreate() {
        if (createdDate == null) {
            createdDate = LocalDateTime.now();
        }
        if (clickCount == null) {
            clickCount = 0L;
        }
    }

    public boolean isExpired() {
        return expiresDate != null && LocalDateTime.now().isAfter(expiresDate);
    }
}
