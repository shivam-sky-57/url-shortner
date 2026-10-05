package com.example.urlshortener.controller;

import com.example.urlshortener.config.AppProperties;
import com.example.urlshortener.config.CorsConfig;
import com.example.urlshortener.exception.GlobalExceptionHandler;
import com.example.urlshortener.exception.UrlNotFoundException;
import com.example.urlshortener.service.UrlShortenerService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RedirectController.class)
@Import({GlobalExceptionHandler.class, CorsConfig.class})
@org.springframework.boot.context.properties.EnableConfigurationProperties(AppProperties.class)
class RedirectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UrlShortenerService urlShortenerService;


    @Test
    void redirectReturns302WithLocationHeader() throws Exception {
        when(urlShortenerService.getOriginalUrl("abc123"))
                .thenReturn("https://example.com/target-page");

        mockMvc.perform(get("/s/abc123"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://example.com/target-page"))
                .andExpect(header().string("Cache-Control", "no-cache, no-store, max-age=0"));
    }

    @Test
    void redirectReturns404WhenNotFound() throws Exception {
        when(urlShortenerService.getOriginalUrl("missing"))
                .thenThrow(new UrlNotFoundException("Short URL not found: missing"));

        mockMvc.perform(get("/s/missing"))
                .andExpect(status().isNotFound());
    }
}
