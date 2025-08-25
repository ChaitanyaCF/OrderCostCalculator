package com.procost.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "integration_logs")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class IntegrationLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "integration_id", nullable = false)
    private Integration integration;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LogLevel level; // INFO, WARN, ERROR, DEBUG
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OperationType operation; // PUSH, PULL, FIELD_DISCOVERY, MAPPING_SUGGESTION, TRANSFORMATION
    
    @Column(nullable = false)
    private String message;
    
    @Column(name = "entity_type")
    private String entityType; // ENQUIRY, QUOTE, ORDER
    
    @Column(name = "entity_id")
    private Long entityId;
    
    @Column(name = "request_payload", columnDefinition = "TEXT")
    private String requestPayload;
    
    @Column(name = "response_payload", columnDefinition = "TEXT")
    private String responsePayload;
    
    @Column(name = "error_details", columnDefinition = "TEXT")
    private String errorDetails;
    
    @Column(name = "execution_time_ms")
    private Long executionTimeMs;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    // Constructors
    public IntegrationLog() {
        this.createdAt = LocalDateTime.now();
    }
    
    public IntegrationLog(Integration integration, LogLevel level, OperationType operation, String message) {
        this();
        this.integration = integration;
        this.level = level;
        this.operation = operation;
        this.message = message;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Integration getIntegration() { return integration; }
    public void setIntegration(Integration integration) { this.integration = integration; }
    
    public LogLevel getLevel() { return level; }
    public void setLevel(LogLevel level) { this.level = level; }
    
    public OperationType getOperation() { return operation; }
    public void setOperation(OperationType operation) { this.operation = operation; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    
    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    
    public String getRequestPayload() { return requestPayload; }
    public void setRequestPayload(String requestPayload) { this.requestPayload = requestPayload; }
    
    public String getResponsePayload() { return responsePayload; }
    public void setResponsePayload(String responsePayload) { this.responsePayload = responsePayload; }
    
    public String getErrorDetails() { return errorDetails; }
    public void setErrorDetails(String errorDetails) { this.errorDetails = errorDetails; }
    
    public Long getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(Long executionTimeMs) { this.executionTimeMs = executionTimeMs; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}


