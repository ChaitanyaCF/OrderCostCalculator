package com.procost.api.dto;

import com.procost.api.model.AuthenticationType;
import com.procost.api.model.Integration;
import com.procost.api.model.IntegrationStatus;
import com.procost.api.model.IntegrationType;

import java.time.LocalDateTime;

public class IntegrationDto {
    private Long id;
    private String name;
    private String description;
    private IntegrationType type;
    private IntegrationStatus status;
    private String externalSystemName;
    private String externalApiUrl;
    private AuthenticationType authType;
    private String supportedEntities;
    private LocalDateTime lastSyncAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Default constructor
    public IntegrationDto() {}

    // Constructor from Integration entity
    public IntegrationDto(Integration integration) {
        this.id = integration.getId();
        this.name = integration.getName();
        this.description = integration.getDescription();
        this.type = integration.getType();
        this.status = integration.getStatus();
        this.externalSystemName = integration.getExternalSystemName();
        this.externalApiUrl = integration.getExternalApiUrl();
        this.authType = integration.getAuthType();
        this.supportedEntities = integration.getSupportedEntities();
        this.lastSyncAt = integration.getLastSyncAt();
        this.createdAt = integration.getCreatedAt();
        this.updatedAt = integration.getUpdatedAt();
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

    public AuthenticationType getAuthType() { return authType; }
    public void setAuthType(AuthenticationType authType) { this.authType = authType; }

    public String getSupportedEntities() { return supportedEntities; }
    public void setSupportedEntities(String supportedEntities) { this.supportedEntities = supportedEntities; }

    public LocalDateTime getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(LocalDateTime lastSyncAt) { this.lastSyncAt = lastSyncAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
