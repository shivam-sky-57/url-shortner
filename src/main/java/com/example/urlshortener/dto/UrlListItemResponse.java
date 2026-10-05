package com.example.urlshortener.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class UrlListItemResponse {
    String shortCode;
    String shortUrl;
    String longUrl;
    Long clickCount;
    LocalDateTime createdAt;
    LocalDateTime expiresAt;
    LocalDateTime lastAccessedAt;
}
