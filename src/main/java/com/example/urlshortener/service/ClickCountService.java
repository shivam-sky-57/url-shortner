package com.example.urlshortener.service;

import com.example.urlshortener.repository.UrlRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClickCountService {

    private final UrlRepository urlRepository;

    @Async("taskExecutor")
    @Transactional
    public void incrementClickCountAsync(String shortCode) {
        try {
            urlRepository.incrementClickCount(shortCode, LocalDateTime.now());
        } catch (Exception ex) {
            log.warn("Failed to increment click count for {}: {}", shortCode, ex.getMessage());
        }
    }
}
