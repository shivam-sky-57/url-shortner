package com.example.urlshortener.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String baseUrl,
        int shortCodeLength,
        String corsOrigins
) {
    public AppProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://localhost:8080";
        }
        if (shortCodeLength <= 0) {
            shortCodeLength = 6;
        }
        if (corsOrigins == null || corsOrigins.isBlank()) {
            corsOrigins = "http://localhost:5173,http://127.0.0.1:5173";
        }
    }
}

