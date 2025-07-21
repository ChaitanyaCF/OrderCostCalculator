package com.procost.api.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Configuration for API rate limiting
 */
@Configuration
@EnableCaching
public class RateLimitingConfig {

    /**
     * Cache to store rate limiters by client IP address
     */
    @Bean
    public Map<String, Object> rateLimiters() {
        return new ConcurrentHashMap<>();
    }
} 