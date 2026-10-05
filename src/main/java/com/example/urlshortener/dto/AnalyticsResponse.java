package com.example.urlshortener.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class AnalyticsResponse {
    String shortCode;
    String longUrl;
    Long clickCount;
    LocalDateTime createdAt;
    LocalDateTime expiresAt;
    LocalDateTime lastAccessedAt;
}
