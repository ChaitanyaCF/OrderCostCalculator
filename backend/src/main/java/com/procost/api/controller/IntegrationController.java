package com.procost.api.controller;

import com.procost.api.dto.FieldMappingDto.*;
import com.procost.api.dto.IntegrationDto;
import com.procost.api.model.Integration;
import com.procost.api.model.IntegrationLog;
import com.procost.api.model.IntegrationStatus;
import com.procost.api.service.FieldDiscoveryService;
import com.procost.api.service.IntegrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/integrations")
@PreAuthorize("hasRole('ADMIN')")
public class IntegrationController {
    
    private static final Logger logger = LoggerFactory.getLogger(IntegrationController.class);
    
    @Autowired
    private IntegrationService integrationService;
    
    @Autowired
    private FieldDiscoveryService fieldDiscoveryService;
    
    /**
     * Get all integrations
     */
    @GetMapping
    public ResponseEntity<List<IntegrationDto>> getAllIntegrations() {
        logger.info("📋 Fetching all integrations");
        List<Integration> integrations = integrationService.getAllIntegrations();
        List<IntegrationDto> integrationDtos = integrations.stream()
                .map(IntegrationDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(integrationDtos);
    }
    
    /**
     * Get integration by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Integration> getIntegration(@PathVariable Long id) {
        logger.info("🔍 Fetching integration with ID: {}", id);
        Integration integration = integrationService.getIntegrationById(id);
        return ResponseEntity.ok(integration);
    }
    
    /**
     * Create new integration
     */
    @PostMapping
    public ResponseEntity<IntegrationDto> createIntegration(@RequestBody Integration integration) {
        logger.info("➕ Creating new integration: {}", integration.getName());
        Integration created = integrationService.createIntegration(integration);
        return ResponseEntity.ok(new IntegrationDto(created));
    }
    
    /**
     * Update integration
     */
    @PutMapping("/{id}")
    public ResponseEntity<Integration> updateIntegration(@PathVariable Long id, @RequestBody Integration integration) {
        logger.info("✏️ Updating integration with ID: {}", id);
        integration.setId(id);
        Integration updated = integrationService.updateIntegration(integration);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * Delete integration
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIntegration(@PathVariable Long id) {
        logger.info("🗑️ Deleting integration with ID: {}", id);
        integrationService.deleteIntegration(id);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Test integration connection
     */
    @PostMapping("/{id}/test")
    public ResponseEntity<Map<String, Object>> testConnection(@PathVariable Long id) {
        logger.info("🧪 Testing connection for integration ID: {}", id);
        Map<String, Object> result = integrationService.testConnection(id);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Discover fields from external API
     */
    @PostMapping("/{id}/discover-fields")
    public ResponseEntity<FieldDiscoveryResponse> discoverFields(
            @PathVariable Long id, 
            @RequestParam String entityType) {
        logger.info("🔍 Discovering fields for integration ID: {} - entity: {}", id, entityType);
        
        Integration integration = integrationService.getIntegrationById(id);
        FieldDiscoveryResponse response = fieldDiscoveryService.discoverFields(integration, entityType);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get AI mapping suggestions
     */
    @PostMapping("/{id}/suggest-mappings")
    public ResponseEntity<List<MappingSuggestion>> suggestMappings(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        logger.info("🤖 Generating mapping suggestions for integration ID: {}", id);
        
        @SuppressWarnings("unchecked")
        List<SourceField> sourceFields = (List<SourceField>) request.get("sourceFields");
        @SuppressWarnings("unchecked")
        List<TargetField> targetFields = (List<TargetField>) request.get("targetFields");
        String entityType = (String) request.get("entityType");
        
        List<MappingSuggestion> suggestions = integrationService.generateMappingSuggestions(
            sourceFields, targetFields, entityType);
        
        return ResponseEntity.ok(suggestions);
    }
    
    /**
     * Get transformation suggestions
     */
    @PostMapping("/suggest-transformation")
    public ResponseEntity<Map<String, Object>> suggestTransformation(@RequestBody Map<String, String> request) {
        logger.info("🔄 Generating transformation suggestions");
        
        String sourceValue = request.get("sourceValue");
        String targetType = request.get("targetType");
        String context = request.get("context");
        
        Map<String, Object> suggestion = integrationService.generateTransformationSuggestion(
            sourceValue, targetType, context);
        
        return ResponseEntity.ok(suggestion);
    }
    
    /**
     * Save field mappings
     */
    @PostMapping("/{id}/mappings")
    public ResponseEntity<Integration> saveFieldMappings(
            @PathVariable Long id, 
            @RequestBody List<FieldMapping> mappings) {
        logger.info("💾 Saving field mappings for integration ID: {}", id);
        
        Integration updated = integrationService.saveFieldMappings(id, mappings);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * Activate integration
     */
    @PostMapping("/{id}/activate")
    public ResponseEntity<Integration> activateIntegration(@PathVariable Long id) {
        logger.info("▶️ Activating integration ID: {}", id);
        Integration activated = integrationService.updateIntegrationStatus(id, IntegrationStatus.ACTIVE);
        return ResponseEntity.ok(activated);
    }
    
    /**
     * Deactivate integration
     */
    @PostMapping("/{id}/deactivate")
    public ResponseEntity<Integration> deactivateIntegration(@PathVariable Long id) {
        logger.info("⏸️ Deactivating integration ID: {}", id);
        Integration deactivated = integrationService.updateIntegrationStatus(id, IntegrationStatus.INACTIVE);
        return ResponseEntity.ok(deactivated);
    }
    
    /**
     * Get integration logs
     */
    @GetMapping("/{id}/logs")
    public ResponseEntity<Page<IntegrationLog>> getIntegrationLogs(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        logger.info("📜 Fetching logs for integration ID: {}", id);
        
        Pageable pageable = PageRequest.of(page, size);
        Page<IntegrationLog> logs = integrationService.getIntegrationLogs(id, pageable);
        
        return ResponseEntity.ok(logs);
    }
    
    /**
     * Get integration statistics
     */
    @GetMapping("/{id}/stats")
    public ResponseEntity<Map<String, Object>> getIntegrationStats(@PathVariable Long id) {
        logger.info("📊 Fetching statistics for integration ID: {}", id);
        Map<String, Object> stats = integrationService.getIntegrationStats(id);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Trigger manual sync for pull-based integrations
     */
    @PostMapping("/{id}/sync")
    public ResponseEntity<Map<String, Object>> triggerSync(@PathVariable Long id) {
        logger.info("🔄 Triggering manual sync for integration ID: {}", id);
        Map<String, Object> result = integrationService.triggerManualSync(id);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Get integration dashboard data
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        logger.info("📊 Fetching integration dashboard data");
        Map<String, Object> dashboardData = integrationService.getDashboardData();
        return ResponseEntity.ok(dashboardData);
    }
}
