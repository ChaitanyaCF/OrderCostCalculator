package com.procost.api.model;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class ErrorResponse {
    private String error;
    private String message;
    private LocalDateTime timestamp;
    private int status;
    private Map<String, String> errors = new HashMap<>();

    public ErrorResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public ErrorResponse(String error, String message) {
        this();
        this.error = error;
        this.message = message;
    }

    public ErrorResponse(String error, String message, int status) {
        this(error, message);
        this.status = status;
    }
    
    public ErrorResponse(String error, String message, int status, Map<String, String> errors) {
        this(error, message, status);
        this.errors = errors;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }
    
    public Map<String, String> getErrors() {
        return errors;
    }
    
    public void setErrors(Map<String, String> errors) {
        this.errors = errors;
    }
} 