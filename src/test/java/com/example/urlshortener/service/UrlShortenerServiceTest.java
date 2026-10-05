package com.example.urlshortener.service;

import com.example.urlshortener.config.AppProperties;
import com.example.urlshortener.dto.ShortenUrlResponse;
import com.example.urlshortener.entity.Url;
import com.example.urlshortener.exception.AliasAlreadyExistsException;
import com.example.urlshortener.exception.InvalidUrlException;
import com.example.urlshortener.exception.UrlNotFoundException;
import com.example.urlshortener.repository.UrlRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UrlShortenerServiceTest {

    @Mock
    private UrlRepository urlRepository;

    @Mock
    private UrlCacheService urlCacheService;

    @Mock
    private ClickCountService clickCountService;

    private UrlShortenerService service;

    @BeforeEach
    void setUp() {
        AppProperties properties = new AppProperties("http://localhost:8080", 6, "http://localhost:5173");
        service = new UrlShortenerService(urlRepository, urlCacheService, clickCountService, properties);
    }

    @Test
    void shortenUrlRejectsInvalidAddress() {
        assertThatThrownBy(() -> service.shortenUrl("not-a-url", null, null))
                .isInstanceOf(InvalidUrlException.class);
    }

    @Test
    void shortenUrlReturnsExistingCodeForSameLongUrl() {
        Url existing = Url.builder()
                .id(10L)
                .longUrl("https://example.com/docs")
                .shortCode("00000A")
                .createdDate(LocalDateTime.now())
                .clickCount(3L)
                .build();
        when(urlRepository.findFirstByLongUrlOrderByCreatedDateDesc("https://example.com/docs"))
                .thenReturn(Optional.of(existing));

        ShortenUrlResponse response = service.shortenUrl("https://example.com/docs", null, null);

        assertThat(response.getShortCode()).isEqualTo("00000A");
        assertThat(response.getShortUrl()).isEqualTo("http://localhost:8080/s/00000A");
        verify(urlRepository, never()).saveAndFlush(any());
    }

    @Test
    void shortenUrlGeneratesBase62FromPersistedId() {
        when(urlRepository.findFirstByLongUrlOrderByCreatedDateDesc(any())).thenReturn(Optional.empty());
        when(urlRepository.saveAndFlush(any(Url.class))).thenAnswer(invocation -> {
            Url url = invocation.getArgument(0);
            url.setId(62L);
            return url;
        });
        when(urlRepository.save(any(Url.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShortenUrlResponse response = service.shortenUrl("https://spring.io", 7, null);

        assertThat(response.getShortCode()).isEqualTo("000010");
        assertThat(response.getExpiresAt()).isNotNull();
        verify(urlCacheService).put(any(), any(), any());
    }

    @Test
    void customAliasMustBeUnique() {
        when(urlRepository.existsByShortCode("docs")).thenReturn(true);

        assertThatThrownBy(() -> service.shortenUrl("https://example.com", null, "docs"))
                .isInstanceOf(AliasAlreadyExistsException.class);
    }

    @Test
    void getOriginalUrlLoadsFromDatabaseWhenCacheMisses() {
        Url url = Url.builder()
                .id(1L)
                .longUrl("https://example.com/a")
                .shortCode("abc123")
                .createdDate(LocalDateTime.now())
                .clickCount(0L)
                .build();
        when(urlCacheService.get("abc123")).thenReturn(Optional.empty());
        when(urlRepository.findByShortCode("abc123")).thenReturn(Optional.of(url));

        String resolved = service.getOriginalUrl("abc123");

        assertThat(resolved).isEqualTo("https://example.com/a");
        verify(urlCacheService).put(any(), any(), any());
        verify(clickCountService).incrementClickCountAsync("abc123");
    }

    @Test
    void getOriginalUrlThrowsWhenExpired() {
        Url url = Url.builder()
                .id(1L)
                .longUrl("https://example.com/old")
                .shortCode("expired1")
                .createdDate(LocalDateTime.now().minusDays(10))
                .expiresDate(LocalDateTime.now().minusDays(1))
                .clickCount(0L)
                .build();
        when(urlCacheService.get("expired1")).thenReturn(Optional.empty());
        when(urlRepository.findByShortCode("expired1")).thenReturn(Optional.of(url));

        assertThatThrownBy(() -> service.getOriginalUrl("expired1"))
                .isInstanceOf(UrlNotFoundException.class);
    }

    @Test
    void shortenUrlPersistsCustomAlias() {
        when(urlRepository.existsByShortCode("launch")).thenReturn(false);
        when(urlRepository.saveAndFlush(any(Url.class))).thenAnswer(invocation -> {
            Url url = invocation.getArgument(0);
            url.setId(5L);
            return url;
        });

        ShortenUrlResponse response = service.shortenUrl("https://example.com/launch", null, "launch");

        ArgumentCaptor<Url> captor = ArgumentCaptor.forClass(Url.class);
        verify(urlRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getShortCode()).isEqualTo("launch");
        assertThat(response.getShortCode()).isEqualTo("launch");
    }

    @Test
    void getAnalyticsReturnsValidMetrics() {
        Url url = Url.builder()
                .id(1L)
                .longUrl("https://example.com/target")
                .shortCode("stats1")
                .createdDate(LocalDateTime.now())
                .clickCount(42L)
                .build();
        when(urlRepository.findByShortCode("stats1")).thenReturn(Optional.of(url));

        var analytics = service.getAnalytics("stats1");

        assertThat(analytics.getShortCode()).isEqualTo("stats1");
        assertThat(analytics.getLongUrl()).isEqualTo("https://example.com/target");
        assertThat(analytics.getClickCount()).isEqualTo(42L);
    }

    @Test
    void deleteUrlRemovesFromDatabaseAndEvictsCache() {
        Url url = Url.builder()
                .id(2L)
                .longUrl("https://example.com/delete-me")
                .shortCode("del01")
                .createdDate(LocalDateTime.now())
                .build();
        when(urlRepository.findByShortCode("del01")).thenReturn(Optional.of(url));

        service.deleteUrl("del01");

        verify(urlRepository).delete(url);
        verify(urlCacheService).evict("del01");
    }
}

