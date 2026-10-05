package com.example.urlshortener.controller;

import com.example.urlshortener.service.UrlShortenerService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class RedirectController {

    private final UrlShortenerService urlShortenerService;

    @GetMapping("/s/{shortCode}")
    public void redirect(@PathVariable String shortCode, HttpServletResponse response) {
        String longUrl = urlShortenerService.getOriginalUrl(shortCode);
        response.setStatus(HttpStatus.FOUND.value());
        response.setHeader("Location", longUrl);
        response.setHeader("Cache-Control", "no-cache, no-store, max-age=0");
    }
}
