package com.example.urlshortener.controller;

import com.example.urlshortener.config.AppProperties;
import com.example.urlshortener.config.CorsConfig;
import com.example.urlshortener.dto.AnalyticsResponse;
import com.example.urlshortener.dto.ShortenUrlRequest;
import com.example.urlshortener.dto.ShortenUrlResponse;
import com.example.urlshortener.dto.UrlListItemResponse;
import com.example.urlshortener.exception.GlobalExceptionHandler;
import com.example.urlshortener.exception.UrlNotFoundException;
import com.example.urlshortener.service.UrlShortenerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UrlController.class)
@Import({GlobalExceptionHandler.class, CorsConfig.class})
@org.springframework.boot.context.properties.EnableConfigurationProperties(AppProperties.class)
class UrlControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UrlShortenerService urlShortenerService;


    @Test
    void shortenUrlReturnsCreatedWithValidData() throws Exception {
        ShortenUrlRequest request = new ShortenUrlRequest();
        request.setLongUrl("https://example.com/deep/path");
        request.setTtlDays(30);
        request.setCustomAlias("my-link");

        ShortenUrlResponse response = ShortenUrlResponse.builder()
                .shortUrl("http://localhost:8080/s/my-link")
                .shortCode("my-link")
                .longUrl("https://example.com/deep/path")
                .expiresAt(LocalDateTime.now().plusDays(30))
                .build();

        when(urlShortenerService.shortenUrl("https://example.com/deep/path", 30, "my-link"))
                .thenReturn(response);

        mockMvc.perform(post("/api/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shortCode").value("my-link"))
                .andExpect(jsonPath("$.shortUrl").value("http://localhost:8080/s/my-link"))
                .andExpect(jsonPath("$.longUrl").value("https://example.com/deep/path"));
    }

    @Test
    void shortenUrlValidatesBlankUrl() throws Exception {
        ShortenUrlRequest request = new ShortenUrlRequest();
        request.setLongUrl("");

        mockMvc.perform(post("/api/shorten")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    void listUrlsReturnsAllItems() throws Exception {
        UrlListItemResponse item = UrlListItemResponse.builder()
                .shortCode("abc123")
                .shortUrl("http://localhost:8080/s/abc123")
                .longUrl("https://google.com")
                .clickCount(10L)
                .createdAt(LocalDateTime.now())
                .build();

        when(urlShortenerService.listUrls()).thenReturn(List.of(item));

        mockMvc.perform(get("/api/urls"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].shortCode").value("abc123"))
                .andExpect(jsonPath("$[0].clickCount").value(10));
    }

    @Test
    void analyticsReturnsDataForExistingCode() throws Exception {
        AnalyticsResponse analytics = AnalyticsResponse.builder()
                .shortCode("test01")
                .longUrl("https://test.com")
                .clickCount(25L)
                .createdAt(LocalDateTime.now())
                .build();

        when(urlShortenerService.getAnalytics("test01")).thenReturn(analytics);

        mockMvc.perform(get("/api/analytics/test01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shortCode").value("test01"))
                .andExpect(jsonPath("$.clickCount").value(25));
    }

    @Test
    void analyticsReturns404ForUnknownCode() throws Exception {
        when(urlShortenerService.getAnalytics("missing"))
                .thenThrow(new UrlNotFoundException("Short URL not found: missing"));

        mockMvc.perform(get("/api/analytics/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void deleteUrlReturnsNoContent() throws Exception {
        doNothing().when(urlShortenerService).deleteUrl("del01");

        mockMvc.perform(delete("/api/del01"))
                .andExpect(status().isNoContent());
    }
}
