package com.procost.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.procost.api.dto.FieldMappingDto.*;
import com.procost.api.model.*;
import com.procost.api.repository.IntegrationLogRepository;
import com.procost.api.repository.IntegrationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class IntegrationService {
    
    private static final Logger logger = LoggerFactory.getLogger(IntegrationService.class);
    
    @Autowired
    private IntegrationRepository integrationRepository;
    
    @Autowired
    private IntegrationLogRepository integrationLogRepository;
    
    @Autowired
    private OpenAIService openAIService;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    /**
     * Get all integrations
     */
    public List<Integration> getAllIntegrations() {
        return integrationRepository.findAll();
    }
    
    /**
     * Get integration by ID
     */
    public Integration getIntegrationById(Long id) {
        return integrationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Integration not found with ID: " + id));
    }
    
    /**
     * Create new integration
     */
    public Integration createIntegration(Integration integration) {
        logger.info("Creating new integration: {}", integration.getName());
        
        // Check if integration with same name already exists
        Optional<Integration> existingIntegration = integrationRepository.findByNameIgnoreCase(integration.getName());
        if (existingIntegration.isPresent()) {
            // Update existing integration instead of throwing error
            Integration existing = existingIntegration.get();
            existing.setDescription(integration.getDescription());
            existing.setExternalSystemName(integration.getExternalSystemName());
            existing.setExternalApiUrl(integration.getExternalApiUrl());
            existing.setAuthType(integration.getAuthType());
            existing.setApiKey(integration.getApiKey());
            existing.setType(integration.getType());
            existing.setStatus(IntegrationStatus.INACTIVE);
            existing.setUpdatedAt(LocalDateTime.now());
            
            Integration saved = integrationRepository.save(existing);
            logOperation(saved, LogLevel.INFO, OperationType.PUSH, 
                       "Integration updated successfully", null, null, null, null, 0L);
            
            return saved;
        }
        
        integration.setCreatedAt(LocalDateTime.now());
        integration.setUpdatedAt(LocalDateTime.now());
        integration.setStatus(IntegrationStatus.INACTIVE);
        
        Integration saved = integrationRepository.save(integration);
        
        // Log creation
        logOperation(saved, LogLevel.INFO, OperationType.SYNC, 
                    "Integration created successfully", null, null, null, null, 0L);
        
        return saved;
    }
    
    /**
     * Update integration
     */
    public Integration updateIntegration(Integration integration) {
        logger.info("Updating integration: {}", integration.getName());
        
        Integration existing = getIntegrationById(integration.getId());
        
        // Update fields
        existing.setName(integration.getName());
        existing.setDescription(integration.getDescription());
        existing.setType(integration.getType());
        existing.setExternalSystemName(integration.getExternalSystemName());
        existing.setExternalApiUrl(integration.getExternalApiUrl());
        existing.setApiKey(integration.getApiKey());
        existing.setWebhookUrl(integration.getWebhookUrl());
        existing.setWebhookSecret(integration.getWebhookSecret());
        existing.setAuthType(integration.getAuthType());
        existing.setAuthConfig(integration.getAuthConfig());
        existing.setSupportedEntities(integration.getSupportedEntities());
        existing.setSyncFrequency(integration.getSyncFrequency());
        existing.setUpdatedAt(LocalDateTime.now());
        
        Integration saved = integrationRepository.save(existing);
        
        // Log update
        logOperation(saved, LogLevel.INFO, OperationType.SYNC, 
                    "Integration updated successfully", null, null, null, null, 0L);
        
        return saved;
    }
    
    /**
     * Delete integration
     */
    public void deleteIntegration(Long id) {
        logger.info("Deleting integration with ID: {}", id);
        
        Integration integration = getIntegrationById(id);
        
        // Log deletion before removing
        logOperation(integration, LogLevel.INFO, OperationType.SYNC, 
                    "Integration deleted", null, null, null, null, 0L);
        
        integrationRepository.delete(integration);
    }
    
    /**
     * Test integration connection
     */
    public Map<String, Object> testConnection(Long id) {
        logger.info("Testing connection for integration ID: {}", id);
        
        Integration integration = getIntegrationById(id);
        long startTime = System.currentTimeMillis();
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Build test request
            HttpHeaders headers = buildAuthHeaders(integration);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Try to connect to the API
            ResponseEntity<String> response = restTemplate.exchange(
                integration.getExternalApiUrl(), HttpMethod.GET, entity, String.class);
            
            boolean success = response.getStatusCode().is2xxSuccessful();
            long executionTime = System.currentTimeMillis() - startTime;
            
            result.put("success", success);
            result.put("statusCode", response.getStatusCode().value());
            result.put("responseTime", executionTime);
            result.put("message", success ? "Connection successful" : "Connection failed");
            
            // Log test result
            logOperation(integration, success ? LogLevel.INFO : LogLevel.ERROR, 
                        OperationType.TEST_CONNECTION, 
                        success ? "Connection test successful" : "Connection test failed",
                        null, null, null, success ? null : "HTTP " + response.getStatusCode(), 
                        executionTime);
            
            return result;
            
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            
            result.put("success", false);
            result.put("message", "Connection failed: " + e.getMessage());
            result.put("responseTime", executionTime);
            
            // Log error
            logOperation(integration, LogLevel.ERROR, OperationType.TEST_CONNECTION, 
                        "Connection test failed", null, null, null, e.toString(), executionTime);
            
            return result;
        }
    }
    
    /**
     * Generate mapping suggestions using AI
     */
    public List<MappingSuggestion> generateMappingSuggestions(List<SourceField> sourceFields, 
                                                             List<TargetField> targetFields, 
                                                             String entityType) {
        logger.info("Generating mapping suggestions for {} source fields", sourceFields.size());
        
        try {
            String prompt = buildMappingPrompt(sourceFields, targetFields, entityType);
            String aiResponse = openAIService.generateFieldMappingSuggestions(prompt);
            
            return parseMappingSuggestions(aiResponse);
            
        } catch (Exception e) {
            logger.warn("AI mapping suggestions failed, using fallback: {}", e.getMessage());
            return generateFallbackMappings(sourceFields, targetFields);
        }
    }
    
    /**
     * Generate transformation suggestion
     */
    public Map<String, Object> generateTransformationSuggestion(String sourceValue, String targetType, String context) {
        logger.info("Generating transformation suggestion for: {} -> {}", sourceValue, targetType);
        
        try {
            String aiResponse = openAIService.generateTransformationSuggestions(sourceValue, targetType, context);
            return objectMapper.readValue(aiResponse, new TypeReference<Map<String, Object>>() {});
            
        } catch (Exception e) {
            logger.warn("AI transformation suggestion failed: {}", e.getMessage());
            
            // Fallback transformation
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("transformation", "value"); // Direct mapping
            fallback.put("explanation", "Direct value mapping (AI suggestion failed)");
            fallback.put("examples", Arrays.asList(sourceValue + " -> " + sourceValue));
            
            return fallback;
        }
    }
    
    /**
     * Save field mappings to integration
     */
    public Integration saveFieldMappings(Long id, List<FieldMapping> mappings) {
        logger.info("Saving {} field mappings for integration ID: {}", mappings.size(), id);
        
        Integration integration = getIntegrationById(id);
        
        try {
            String mappingsJson = objectMapper.writeValueAsString(mappings);
            integration.setFieldMappings(mappingsJson);
            integration.setUpdatedAt(LocalDateTime.now());
            
            Integration saved = integrationRepository.save(integration);
            
            // Log mapping save
            logOperation(saved, LogLevel.INFO, OperationType.MAPPING_SUGGESTION, 
                        "Field mappings saved successfully", null, null, null, null, 0L);
            
            return saved;
            
        } catch (Exception e) {
            logger.error("Failed to save field mappings", e);
            throw new RuntimeException("Failed to save field mappings: " + e.getMessage(), e);
        }
    }
    
    /**
     * Update integration status
     */
    public Integration updateIntegrationStatus(Long id, IntegrationStatus status) {
        logger.info("Updating integration {} status to: {}", id, status);
        
        Integration integration = getIntegrationById(id);
        integration.setStatus(status);
        integration.setUpdatedAt(LocalDateTime.now());
        
        Integration saved = integrationRepository.save(integration);
        
        // Log status change
        logOperation(saved, LogLevel.INFO, OperationType.SYNC, 
                    "Integration status changed to: " + status, null, null, null, null, 0L);
        
        return saved;
    }
    
    /**
     * Get integration logs
     */
    public Page<IntegrationLog> getIntegrationLogs(Long id, Pageable pageable) {
        Integration integration = getIntegrationById(id);
        return integrationLogRepository.findByIntegrationOrderByCreatedAtDesc(integration, pageable);
    }
    
    /**
     * Get integration statistics
     */
    public Map<String, Object> getIntegrationStats(Long id) {
        Integration integration = getIntegrationById(id);
        Map<String, Object> stats = new HashMap<>();
        
        // Basic info
        stats.put("id", integration.getId());
        stats.put("name", integration.getName());
        stats.put("status", integration.getStatus());
        stats.put("type", integration.getType());
        stats.put("lastSync", integration.getLastSyncAt());
        
        // Log counts
        stats.put("totalLogs", integrationLogRepository.countByIntegrationAndLevel(integration, LogLevel.INFO) +
                              integrationLogRepository.countByIntegrationAndLevel(integration, LogLevel.WARN) +
                              integrationLogRepository.countByIntegrationAndLevel(integration, LogLevel.ERROR));
        stats.put("errorCount", integrationLogRepository.countByIntegrationAndLevel(integration, LogLevel.ERROR));
        stats.put("warningCount", integrationLogRepository.countByIntegrationAndLevel(integration, LogLevel.WARN));
        
        // Recent activity
        LocalDateTime since = LocalDateTime.now().minusDays(7);
        List<IntegrationLog> recentLogs = integrationLogRepository.findRecentLogs(integration, since);
        stats.put("recentActivity", recentLogs.size());
        
        return stats;
    }
    
    /**
     * Trigger manual sync
     */
    public Map<String, Object> triggerManualSync(Long id) {
        logger.info("Triggering manual sync for integration ID: {}", id);
        
        Integration integration = getIntegrationById(id);
        Map<String, Object> result = new HashMap<>();
        
        if (integration.getType() == IntegrationType.WEBHOOK_PUSH) {
            result.put("success", false);
            result.put("message", "Manual sync not supported for webhook push integrations");
            return result;
        }
        
        long startTime = System.currentTimeMillis();
        
        try {
            // TODO: Implement actual sync logic based on integration type
            // This would involve:
            // 1. Fetching data from external API
            // 2. Applying field mappings and transformations
            // 3. Creating/updating local entities
            
            integration.setLastSyncAt(LocalDateTime.now());
            integrationRepository.save(integration);
            
            long executionTime = System.currentTimeMillis() - startTime;
            
            result.put("success", true);
            result.put("message", "Sync completed successfully");
            result.put("executionTime", executionTime);
            
            // Log sync
            logOperation(integration, LogLevel.INFO, OperationType.SYNC, 
                        "Manual sync completed successfully", null, null, null, null, executionTime);
            
            return result;
            
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            
            result.put("success", false);
            result.put("message", "Sync failed: " + e.getMessage());
            result.put("executionTime", executionTime);
            
            // Log error
            logOperation(integration, LogLevel.ERROR, OperationType.SYNC, 
                        "Manual sync failed", null, null, null, e.toString(), executionTime);
            
            return result;
        }
    }
    
    /**
     * Get dashboard data
     */
    public Map<String, Object> getDashboardData() {
        Map<String, Object> data = new HashMap<>();
        
        // Integration counts by status
        data.put("totalIntegrations", integrationRepository.count());
        data.put("activeIntegrations", integrationRepository.countByStatus(IntegrationStatus.ACTIVE));
        data.put("inactiveIntegrations", integrationRepository.countByStatus(IntegrationStatus.INACTIVE));
        data.put("errorIntegrations", integrationRepository.countByStatus(IntegrationStatus.ERROR));
        
        // Recent activity - just count, don't load entities
        LocalDateTime since = LocalDateTime.now().minusHours(24);
        long recentlyActiveCount = integrationRepository.countRecentlyActive(since);
        data.put("recentlyActive", recentlyActiveCount);
        
        // Integration types - avoid loading full entities
        Map<String, Long> typeCount = new HashMap<>();
        typeCount.put("WEBHOOK_PUSH", integrationRepository.countByType(IntegrationType.WEBHOOK_PUSH));
        typeCount.put("API_PULL", integrationRepository.countByType(IntegrationType.API_PULL));
        typeCount.put("BIDIRECTIONAL", integrationRepository.countByType(IntegrationType.BIDIRECTIONAL));
        data.put("integrationsByType", typeCount);
        
        return data;
    }
    
    /**
     * Push data to external systems (called when entities are created/updated)
     */
    public void pushDataToIntegrations(String entityType, Object entityData, Long entityId) {
        logger.info("Pushing {} data to active integrations", entityType);
        
        List<Integration> activeIntegrations = integrationRepository.findActiveIntegrationsForEntity(entityType);
        
        for (Integration integration : activeIntegrations) {
            if (integration.getType() == IntegrationType.WEBHOOK_PUSH || 
                integration.getType() == IntegrationType.BIDIRECTIONAL) {
                
                pushDataToIntegration(integration, entityType, entityData, entityId);
            }
        }
    }
    
    /**
     * Push data to a specific integration
     */
    private void pushDataToIntegration(Integration integration, String entityType, Object entityData, Long entityId) {
        logger.info("Pushing {} data to integration: {}", entityType, integration.getName());
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Apply field mappings and transformations
            Map<String, Object> transformedData = applyFieldMappings(integration, entityData);
            
            // Build request
            HttpHeaders headers = buildAuthHeaders(integration);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(transformedData, headers);
            
            // Send data
            ResponseEntity<String> response = restTemplate.exchange(
                integration.getWebhookUrl(), HttpMethod.POST, entity, String.class);
            
            long executionTime = System.currentTimeMillis() - startTime;
            
            if (response.getStatusCode().is2xxSuccessful()) {
                logOperation(integration, LogLevel.INFO, OperationType.PUSH, 
                            "Data pushed successfully", entityType, entityId, 
                            objectMapper.writeValueAsString(transformedData), null, executionTime);
            } else {
                logOperation(integration, LogLevel.WARN, OperationType.PUSH, 
                            "Data push returned non-success status", entityType, entityId, 
                            objectMapper.writeValueAsString(transformedData), 
                            "HTTP " + response.getStatusCode(), executionTime);
            }
            
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            
            logger.error("Failed to push data to integration: {}", integration.getName(), e);
            
            logOperation(integration, LogLevel.ERROR, OperationType.PUSH, 
                        "Data push failed", entityType, entityId, null, e.toString(), executionTime);
        }
    }
    
    /**
     * Apply field mappings and transformations to data
     */
    private Map<String, Object> applyFieldMappings(Integration integration, Object entityData) {
        // TODO: Implement field mapping and transformation logic
        // This would involve:
        // 1. Parse field mappings from integration.getFieldMappings()
        // 2. Extract values from entityData based on source field paths
        // 3. Apply transformations
        // 4. Map to target field structure
        
        // For now, return the data as-is (placeholder)
        try {
            String json = objectMapper.writeValueAsString(entityData);
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            logger.error("Failed to convert entity data to map", e);
            return new HashMap<>();
        }
    }
    
    // Helper methods
    
    private String buildMappingPrompt(List<SourceField> sourceFields, List<TargetField> targetFields, String entityType) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Analyze these API fields and suggest mappings:\n\n");
        prompt.append("Entity Type: ").append(entityType).append("\n\n");
        
        prompt.append("Source Fields:\n");
        sourceFields.forEach(field -> 
            prompt.append("- ").append(field.getName()).append(" (").append(field.getType()).append(")\n"));
        
        prompt.append("\nTarget Fields:\n");
        targetFields.forEach(field -> 
            prompt.append("- ").append(field.getName()).append(" (").append(field.getType()).append(")\n"));
        
        prompt.append("\nReturn JSON with mapping suggestions.");
        
        return prompt.toString();
    }
    
    private List<MappingSuggestion> parseMappingSuggestions(String aiResponse) {
        try {
            Map<String, Object> response = objectMapper.readValue(aiResponse, new TypeReference<Map<String, Object>>() {});
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> mappings = (List<Map<String, Object>>) response.get("mappings");
            
            return mappings.stream().map(mapping -> {
                MappingSuggestion suggestion = new MappingSuggestion();
                suggestion.setSourceField((String) mapping.get("sourceField"));
                suggestion.setTargetField((String) mapping.get("targetField"));
                suggestion.setConfidenceScore(((Number) mapping.get("confidence")).doubleValue());
                suggestion.setReason((String) mapping.get("reason"));
                suggestion.setSuggestedTransformation((String) mapping.get("transformation"));
                return suggestion;
            }).collect(Collectors.toList());
            
        } catch (Exception e) {
            logger.error("Failed to parse AI mapping suggestions", e);
            return new ArrayList<>();
        }
    }
    
    private List<MappingSuggestion> generateFallbackMappings(List<SourceField> sourceFields, List<TargetField> targetFields) {
        // Simple name-based matching as fallback
        List<MappingSuggestion> suggestions = new ArrayList<>();
        
        for (SourceField source : sourceFields) {
            for (TargetField target : targetFields) {
                if (source.getName().toLowerCase().contains(target.getName().toLowerCase()) ||
                    target.getName().toLowerCase().contains(source.getName().toLowerCase())) {
                    
                    MappingSuggestion suggestion = new MappingSuggestion();
                    suggestion.setSourceField(source.getName());
                    suggestion.setTargetField(target.getName());
                    suggestion.setConfidenceScore(0.6);
                    suggestion.setReason("Name similarity match");
                    suggestions.add(suggestion);
                }
            }
        }
        
        return suggestions;
    }
    
    private HttpHeaders buildAuthHeaders(Integration integration) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        if (integration.getAuthType() != null) {
            switch (integration.getAuthType()) {
                case API_KEY:
                    headers.set("X-API-Key", integration.getApiKey());
                    break;
                case BEARER_TOKEN:
                    headers.setBearerAuth(integration.getApiKey());
                    break;
                case BASIC_AUTH:
                    String[] credentials = integration.getApiKey().split(":");
                    if (credentials.length == 2) {
                        headers.setBasicAuth(credentials[0], credentials[1]);
                    }
                    break;
                case NONE:
                default:
                    break;
            }
        }
        
        return headers;
    }
    
    private void logOperation(Integration integration, LogLevel level, OperationType operation, 
                             String message, String entityType, Long entityId, 
                             String requestPayload, String errorDetails, Long executionTime) {
        try {
            IntegrationLog log = new IntegrationLog(integration, level, operation, message);
            log.setEntityType(entityType);
            log.setEntityId(entityId);
            log.setRequestPayload(requestPayload);
            log.setErrorDetails(errorDetails);
            log.setExecutionTimeMs(executionTime);
            
            integrationLogRepository.save(log);
        } catch (Exception e) {
            logger.error("Failed to save integration log", e);
        }
    }
}
