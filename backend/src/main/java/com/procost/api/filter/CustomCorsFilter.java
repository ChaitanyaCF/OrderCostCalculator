package com.procost.api.filter;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class CustomCorsFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        
        // Get origin from request header
        String origin = request.getHeader("Origin");
        
        // Get allowed origins from environment variable or use defaults
        String allowedOriginsEnv = System.getenv("ALLOWED_ORIGINS");
        List<String> allowedOrigins;
        
        if (allowedOriginsEnv != null && !allowedOriginsEnv.trim().isEmpty()) {
            // Parse comma-separated origins from environment
            allowedOrigins = Arrays.asList(allowedOriginsEnv.split(","));
            // Trim whitespace from each origin
            allowedOrigins = allowedOrigins.stream()
                .map(String::trim)
                .collect(java.util.stream.Collectors.toList());
        } else {
            // Default to localhost for development
            allowedOrigins = Arrays.asList("http://localhost:3000", "http://localhost:3001");
        }
        
        // Check if origin is allowed
        if (origin != null && allowedOrigins.contains(origin.trim())) {
            response.setHeader("Access-Control-Allow-Origin", origin);
        } else if (!allowedOrigins.isEmpty()) {
            // Fallback to first allowed origin
            response.setHeader("Access-Control-Allow-Origin", allowedOrigins.get(0));
        }
        
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
        } else {
            filterChain.doFilter(request, response);
        }
    }
} 