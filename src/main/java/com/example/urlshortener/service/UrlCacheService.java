package com.example.urlshortener.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

/**
 * Redis lookup cache: shortCode -> longUrl.
 * Failures are logged and ignored so redirects still work from PostgreSQL.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UrlCacheService {

    private static final String KEY_PREFIX = "url:";

    private final StringRedisTemplate redisTemplate;

    public void put(String shortCode, String longUrl, Duration ttl) {
        try {
            String key = key(shortCode);
            if (ttl != null && !ttl.isNegative() && !ttl.isZero()) {
                redisTemplate.opsForValue().set(key, longUrl, ttl);
            } else {
                redisTemplate.opsForValue().set(key, longUrl);
            }
        } catch (Exception ex) {
            log.warn("Failed to cache short code {}: {}", shortCode, ex.getMessage());
        }
    }

    public Optional<String> get(String shortCode) {
        try {
            return Optional.ofNullable(redisTemplate.opsForValue().get(key(shortCode)));
        } catch (Exception ex) {
            log.warn("Failed to read cache for {}: {}", shortCode, ex.getMessage());
            return Optional.empty();
        }
    }

    public void evict(String shortCode) {
        try {
            redisTemplate.delete(key(shortCode));
        } catch (Exception ex) {
            log.warn("Failed to evict cache for {}: {}", shortCode, ex.getMessage());
        }
    }

    private String key(String shortCode) {
        return KEY_PREFIX + shortCode;
    }
}
