package com.procost.api.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Collection;

/**
 * Service to provide different rate limits based on user role, endpoint, etc.
 */
@Service
public class RateLimitService {

    // Different rate limits based on user roles
    private static final int ANONYMOUS_CAPACITY = 20;
    private static final int USER_CAPACITY = 40;
    private static final int ADMIN_CAPACITY = 100;
    
    // Default refill rate: once per minute
    private static final Duration REFILL_DURATION = Duration.ofMinutes(1);
    
    /**
     * Create a rate limiter for the current user based on their role
     */
    public Bucket createRateLimiterForCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        // Default to anonymous rate limit
        int capacity = ANONYMOUS_CAPACITY;
        
        if (auth != null && auth.isAuthenticated()) {
            Collection<? extends GrantedAuthority> authorities = auth.getAuthorities();
            
            // Check roles and adjust rate limits
            if (authorities.contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
                capacity = ADMIN_CAPACITY;
            } else if (authorities.contains(new SimpleGrantedAuthority("ROLE_USER"))) {
                capacity = USER_CAPACITY;
            }
        }
        
        // Create bandwidth limit based on user role
        Bandwidth limit = Bandwidth.classic(capacity, Refill.intervally(capacity, REFILL_DURATION));
        
        // Build and return the bucket
        return Bucket.builder().addLimit(limit).build();
    }
    
    /**
     * Create a rate limiter for specific API endpoint with custom rate limit
     */
    public Bucket createRateLimiterForEndpoint(String endpoint, int requestsPerMinute) {
        Bandwidth limit = Bandwidth.classic(
            requestsPerMinute, 
            Refill.intervally(requestsPerMinute, Duration.ofMinutes(1))
        );
        
        return Bucket.builder().addLimit(limit).build();
    }
} 