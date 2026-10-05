package com.example.urlshortener.service;

import com.example.urlshortener.config.AppProperties;
import com.example.urlshortener.dto.AnalyticsResponse;
import com.example.urlshortener.dto.ShortenUrlResponse;
import com.example.urlshortener.dto.UrlListItemResponse;
import com.example.urlshortener.entity.Url;
import com.example.urlshortener.exception.AliasAlreadyExistsException;
import com.example.urlshortener.exception.InvalidUrlException;
import com.example.urlshortener.exception.UrlNotFoundException;
import com.example.urlshortener.repository.UrlRepository;
import org.apache.commons.validator.routines.UrlValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class UrlShortenerService {

    private static final Pattern ALIAS_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{3,10}$");
    private static final String[] SCHEMES = {"http", "https"};

    private final UrlRepository urlRepository;
    private final UrlCacheService urlCacheService;
    private final ClickCountService clickCountService;
    private final AppProperties appProperties;
    private final Base62Encoder base62Encoder;
    private final UrlValidator urlValidator;

    public UrlShortenerService(
            UrlRepository urlRepository,
            UrlCacheService urlCacheService,
            ClickCountService clickCountService,
            AppProperties appProperties
    ) {
        this.urlRepository = urlRepository;
        this.urlCacheService = urlCacheService;
        this.clickCountService = clickCountService;
        this.appProperties = appProperties;
        this.base62Encoder = new Base62Encoder(appProperties.shortCodeLength());
        this.urlValidator = new UrlValidator(SCHEMES, UrlValidator.ALLOW_LOCAL_URLS);
    }

    @Transactional
    public ShortenUrlResponse shortenUrl(String longUrl, Integer ttlDays, String customAlias) {
        String normalizedUrl = normalizeUrl(longUrl);
        validateHttpUrl(normalizedUrl);

        String trimmedAlias = StringUtils.hasText(customAlias) ? customAlias.trim() : null;
        if (trimmedAlias != null) {
            validateAlias(trimmedAlias);
            if (urlRepository.existsByShortCode(trimmedAlias)) {
                throw new AliasAlreadyExistsException("Custom alias is already in use: " + trimmedAlias);
            }
        } else {
            Url existing = urlRepository.findFirstByLongUrlOrderByCreatedDateDesc(normalizedUrl)
                    .filter(url -> !url.isExpired())
                    .orElse(null);
            if (existing != null) {
                cache(existing);
                return toShortenResponse(existing);
            }
        }

        LocalDateTime expiresAt = ttlDays == null ? null : LocalDateTime.now().plusDays(ttlDays);
        String pendingCode = trimmedAlias != null ? trimmedAlias : pendingCode();

        Url url = Url.builder()
                .longUrl(normalizedUrl)
                .shortCode(pendingCode)
                .createdDate(LocalDateTime.now())
                .expiresDate(expiresAt)
                .clickCount(0L)
                .build();

        url = urlRepository.saveAndFlush(url);

        if (trimmedAlias == null) {
            url.setShortCode(base62Encoder.generateShortCode(url.getId()));
            url = urlRepository.save(url);
        }

        cache(url);
        return toShortenResponse(url);
    }

    public String getOriginalUrl(String shortCode) {
        Optional<String> cached = urlCacheService.get(shortCode);
        if (cached.isPresent()) {
            clickCountService.incrementClickCountAsync(shortCode);
            return cached.get();
        }

        Url url = urlRepository.findByShortCode(shortCode)
                .filter(candidate -> !candidate.isExpired())
                .orElseThrow(() -> new UrlNotFoundException("Short URL not found or expired: " + shortCode));

        cache(url);
        clickCountService.incrementClickCountAsync(shortCode);
        return url.getLongUrl();
    }

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(String shortCode) {
        Url url = requireActiveUrl(shortCode);
        return AnalyticsResponse.builder()
                .shortCode(url.getShortCode())
                .longUrl(url.getLongUrl())
                .clickCount(url.getClickCount())
                .createdAt(url.getCreatedDate())
                .expiresAt(url.getExpiresDate())
                .lastAccessedAt(url.getLastAccessedDate())
                .build();
    }

    @Transactional(readOnly = true)
    public List<UrlListItemResponse> listUrls() {
        return urlRepository.findAllByOrderByCreatedDateDesc().stream()
                .map(this::toListItem)
                .toList();
    }

    @Transactional
    public void deleteUrl(String shortCode) {
        Url url = urlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new UrlNotFoundException("Short URL not found: " + shortCode));
        urlRepository.delete(url);
        urlCacheService.evict(shortCode);
    }

    public String toShortUrl(String shortCode) {
        String base = appProperties.baseUrl();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + "/s/" + shortCode;
    }

    private Url requireActiveUrl(String shortCode) {
        Url url = urlRepository.findByShortCode(shortCode)
                .orElseThrow(() -> new UrlNotFoundException("Short URL not found: " + shortCode));
        if (url.isExpired()) {
            throw new UrlNotFoundException("Short URL has expired: " + shortCode);
        }
        return url;
    }

    private void cache(Url url) {
        Duration ttl = remainingTtl(url);
        urlCacheService.put(url.getShortCode(), url.getLongUrl(), ttl);
    }

    private Duration remainingTtl(Url url) {
        if (url.getExpiresDate() == null) {
            return Duration.ofDays(1);
        }
        Duration remaining = Duration.between(LocalDateTime.now(), url.getExpiresDate());
        return remaining.isNegative() ? Duration.ZERO : remaining;
    }

    private void validateHttpUrl(String longUrl) {
        if (!urlValidator.isValid(longUrl)) {
            throw new InvalidUrlException("Invalid URL. Use an absolute http or https address.");
        }
    }

    private void validateAlias(String alias) {
        if (!ALIAS_PATTERN.matcher(alias).matches()) {
            throw new InvalidUrlException("customAlias must be 3-10 characters: letters, digits, _ or -");
        }
    }

    private String normalizeUrl(String longUrl) {
        return longUrl == null ? null : longUrl.trim();
    }

    /**
     * Temporary unique placeholder so we can persist, obtain the generated ID,
     * then replace this value with a Base62 encoding of that ID.
     */
    private String pendingCode() {
        return "t" + UUID.randomUUID().toString().replace("-", "").substring(0, 9);
    }

    private ShortenUrlResponse toShortenResponse(Url url) {
        return ShortenUrlResponse.builder()
                .shortUrl(toShortUrl(url.getShortCode()))
                .shortCode(url.getShortCode())
                .longUrl(url.getLongUrl())
                .expiresAt(url.getExpiresDate())
                .build();
    }

    private UrlListItemResponse toListItem(Url url) {
        return UrlListItemResponse.builder()
                .shortCode(url.getShortCode())
                .shortUrl(toShortUrl(url.getShortCode()))
                .longUrl(url.getLongUrl())
                .clickCount(url.getClickCount())
                .createdAt(url.getCreatedDate())
                .expiresAt(url.getExpiresDate())
                .lastAccessedAt(url.getLastAccessedDate())
                .build();
    }
}
