package com.example.urlshortener.controller;

import com.example.urlshortener.dto.AnalyticsResponse;
import com.example.urlshortener.dto.ShortenUrlRequest;
import com.example.urlshortener.dto.ShortenUrlResponse;
import com.example.urlshortener.dto.UrlListItemResponse;
import com.example.urlshortener.service.UrlShortenerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UrlController {

    private final UrlShortenerService urlShortenerService;

    @PostMapping("/shorten")
    @ResponseStatus(HttpStatus.CREATED)
    public ShortenUrlResponse shorten(@Valid @RequestBody ShortenUrlRequest request) {
        return urlShortenerService.shortenUrl(request.getLongUrl(), request.getTtlDays(), request.getCustomAlias());
    }

    @GetMapping("/urls")
    public List<UrlListItemResponse> listUrls() {
        return urlShortenerService.listUrls();
    }

    @GetMapping("/analytics/{shortCode}")
    public AnalyticsResponse analytics(@PathVariable String shortCode) {
        return urlShortenerService.getAnalytics(shortCode);
    }

    @DeleteMapping("/{shortCode}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String shortCode) {
        urlShortenerService.deleteUrl(shortCode);
    }
}
