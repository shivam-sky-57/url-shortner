package com.example.urlshortener.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {
    Instant timestamp;
    int status;
    String error;
    String message;
    String path;
}
