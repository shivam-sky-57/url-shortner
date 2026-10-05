package com.example.urlshortener.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShortenUrlRequest {

    @NotBlank(message = "longUrl is required")
    @Size(max = 2048, message = "longUrl must be at most 2048 characters")
    private String longUrl;

    @Min(value = 1, message = "ttlDays must be at least 1")
    @Max(value = 3650, message = "ttlDays must be at most 3650")
    private Integer ttlDays;

    @Size(max = 10, message = "customAlias must be at most 10 characters")
    private String customAlias;
}
