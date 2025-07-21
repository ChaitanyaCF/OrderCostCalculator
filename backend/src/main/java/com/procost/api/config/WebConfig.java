package com.procost.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import com.procost.api.interceptor.RateLimitInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final RateLimitInterceptor rateLimitInterceptor;

public WebConfig(RateLimitInterceptor rateLimitInterceptor) {
    this.rateLimitInterceptor = rateLimitInterceptor;
}

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:3001")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("Origin", "Content-Type", "Accept", "Authorization", 
                               "X-Requested-With", "Access-Control-Request-Method", 
                               "Access-Control-Request-Headers")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
public void addInterceptors(@NonNull InterceptorRegistry registry) {
    // Apply rate limiting to all API endpoints
    registry.addInterceptor(rateLimitInterceptor)
            .addPathPatterns("/api/**")
            // Exclude authentication endpoints to prevent login issues
            .excludePathPatterns("/api/auth/**");
}
}