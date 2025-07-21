package com.procost.api.interceptor;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Interceptor to apply rate limiting to API endpoints
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitInterceptor.class);

    @Value("${rate.limit.capacity:30}")
    private int capacity;
    
    @Value("${rate.limit.refill.tokens:30}")
    private int refillTokens;
    
    @Value("${rate.limit.refill.duration.minutes:1}")
    private int refillDurationMinutes;
    
    // Add rate limit headers
    private static final String HEADER_LIMIT = "X-Rate-Limit-Limit";
    private static final String HEADER_REMAINING = "X-Rate-Limit-Remaining";
    private static final String HEADER_RESET = "X-Rate-Limit-Reset";

    @Lazy
    @Autowired
    private Map<String, Object> rateLimiters;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Skip rate limiting for OPTIONS requests (pre-flight CORS)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        
        // Get client IP address
        String clientIp = getClientIP(request);
        
        // Get or create bucket for this client
        Bucket bucket = getOrCreateBucket(clientIp);
        
        // Add rate limit headers
        response.addHeader(HEADER_LIMIT, String.valueOf(capacity));
        
        // Get remaining tokens and add to response header
        long remainingTokens = bucket.getAvailableTokens();
        response.addHeader(HEADER_REMAINING, String.valueOf(remainingTokens));
        
        // Add reset time header (when bucket will be refilled)
        long resetTimeSeconds = Duration.ofMinutes(refillDurationMinutes).getSeconds();
        response.addHeader(HEADER_RESET, String.valueOf(resetTimeSeconds));
        
        // Try to consume a token
        if (bucket.tryConsume(1)) {
            // Request allowed, let it through
            return true;
        } else {
            // Rate limit exceeded
            logger.warn("Rate limit exceeded for IP: {}", clientIp);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Rate limit exceeded. Please try again later.\"}");
            return false;
        }
    }

    /**
     * Get or create a rate limiter bucket for a specific client
     */
    private Bucket getOrCreateBucket(String clientIp) {
        if (rateLimiters.containsKey(clientIp)) {
            return (Bucket) rateLimiters.get(clientIp);
        } else {
            // Create new bucket with capacity and refill rate from properties
            Bandwidth limit = Bandwidth.classic(capacity, 
                                               Refill.intervally(refillTokens, 
                                                              Duration.ofMinutes(refillDurationMinutes)));
            Bucket bucket = Bucket.builder().addLimit(limit).build();
            rateLimiters.put(clientIp, bucket);
            return bucket;
        }
    }

    /**
     * Extract client IP from request, handling proxies/load balancers
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs - use the first (client) one
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
} 