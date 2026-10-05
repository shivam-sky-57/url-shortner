package com.example.urlshortener.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class ShortenUrlResponse {
    String shortUrl;
    String shortCode;
    String longUrl;
    LocalDateTime expiresAt;
}
