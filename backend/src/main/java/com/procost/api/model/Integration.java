package com.procost.api.model;

import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "integrations")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Integration {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IntegrationType type; // WEBHOOK_PUSH, API_PULL, BIDIRECTIONAL
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IntegrationStatus status; // ACTIVE, INACTIVE, ERROR, TESTING
    
    @Column(name = "external_system_name", columnDefinition = "TEXT")
    private String externalSystemName;
    
    @Column(name = "external_api_url", columnDefinition = "TEXT")
    private String externalApiUrl;
    
    @Column(name = "api_key", columnDefinition = "TEXT")
    private String apiKey;
    
    @Column(name = "webhook_url", columnDefinition = "TEXT")
    private String webhookUrl;
    
    @Column(name = "webhook_secret", columnDefinition = "TEXT")
    private String webhookSecret;
    
    @Column(name = "auth_type")
    @Enumerated(EnumType.STRING)
    private AuthenticationType authType; // API_KEY, BEARER_TOKEN, BASIC_AUTH, OAUTH2
    
    @Column(name = "auth_config", columnDefinition = "TEXT")
    private String authConfig; // JSON string for auth configuration
    
    @Column(name = "supported_entities", columnDefinition = "TEXT")
    private String supportedEntities; // JSON array: ["ENQUIRY", "QUOTE", "ORDER"]
    
    @Column(name = "field_mappings", columnDefinition = "TEXT")
    private String fieldMappings; // JSON string containing field mapping configuration
    
    @Column(name = "transformation_rules", columnDefinition = "TEXT")
    private String transformationRules; // JSON string containing data transformation rules
    
    @Column(name = "sync_frequency")
    private Integer syncFrequency; // Minutes for pull-based integrations
    
    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    private String createdBy;
    
    @OneToMany(mappedBy = "integration", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<IntegrationLog> logs;
    
    // Constructors
    public Integration() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = IntegrationStatus.INACTIVE;
    }
    
    public Integration(String name, IntegrationType type) {
        this();
        this.name = name;
        this.type = type;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public IntegrationType getType() { return type; }
    public void setType(IntegrationType type) { this.type = type; }
    
    public IntegrationStatus getStatus() { return status; }
    public void setStatus(IntegrationStatus status) { this.status = status; }
    
    public String getExternalSystemName() { return externalSystemName; }
    public void setExternalSystemName(String externalSystemName) { this.externalSystemName = externalSystemName; }
    
    public String getExternalApiUrl() { return externalApiUrl; }
    public void setExternalApiUrl(String externalApiUrl) { this.externalApiUrl = externalApiUrl; }
    
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    
    public String getWebhookUrl() { return webhookUrl; }
    public void setWebhookUrl(String webhookUrl) { this.webhookUrl = webhookUrl; }
    
    public String getWebhookSecret() { return webhookSecret; }
    public void setWebhookSecret(String webhookSecret) { this.webhookSecret = webhookSecret; }
    
    public AuthenticationType getAuthType() { return authType; }
    public void setAuthType(AuthenticationType authType) { this.authType = authType; }
    
    public String getAuthConfig() { return authConfig; }
    public void setAuthConfig(String authConfig) { this.authConfig = authConfig; }
    
    public String getSupportedEntities() { return supportedEntities; }
    public void setSupportedEntities(String supportedEntities) { this.supportedEntities = supportedEntities; }
    
    public String getFieldMappings() { return fieldMappings; }
    public void setFieldMappings(String fieldMappings) { this.fieldMappings = fieldMappings; }
    
    public String getTransformationRules() { return transformationRules; }
    public void setTransformationRules(String transformationRules) { this.transformationRules = transformationRules; }
    
    public Integer getSyncFrequency() { return syncFrequency; }
    public void setSyncFrequency(Integer syncFrequency) { this.syncFrequency = syncFrequency; }
    
    public LocalDateTime getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(LocalDateTime lastSyncAt) { this.lastSyncAt = lastSyncAt; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    
    public List<IntegrationLog> getLogs() { return logs; }
    public void setLogs(List<IntegrationLog> logs) { this.logs = logs; }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}


