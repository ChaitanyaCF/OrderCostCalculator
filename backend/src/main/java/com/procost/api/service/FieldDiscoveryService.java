package com.procost.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.procost.api.dto.FieldMappingDto.*;
import com.procost.api.model.Integration;
import com.procost.api.model.IntegrationLog;
import com.procost.api.model.LogLevel;
import com.procost.api.model.OperationType;
import com.procost.api.repository.IntegrationLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;


@Service
public class FieldDiscoveryService {
    
    private static final Logger logger = LoggerFactory.getLogger(FieldDiscoveryService.class);
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private IntegrationLogRepository integrationLogRepository;
    
    @Autowired
    private OpenAIService openAIService;
    
    /**
     * Discover fields from external API by making sample requests
     */
    public FieldDiscoveryResponse discoverFields(Integration integration, String entityType) {
        logger.info("🔍 Starting field discovery for integration: {} - entity: {}", 
                   integration.getName(), entityType);
        
        long startTime = System.currentTimeMillis();
        FieldDiscoveryResponse response = new FieldDiscoveryResponse();
        
        try {
            // 1. Discover source fields from external API
            List<SourceField> sourceFields = discoverSourceFields(integration, entityType);
            response.setSourceFields(sourceFields);
            
            // 2. Get target fields from our system
            List<TargetField> targetFields = getTargetFields(entityType);
            response.setTargetFields(targetFields);
            
            // 3. Generate AI mapping suggestions
            List<MappingSuggestion> aiSuggestions = generateMappingSuggestions(sourceFields, targetFields, entityType);
            response.setAiSuggestions(aiSuggestions);
            
            // 4. Add metadata
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("discoveryTime", System.currentTimeMillis() - startTime);
            metadata.put("sourceFieldCount", sourceFields.size());
            metadata.put("targetFieldCount", targetFields.size());
            metadata.put("suggestionCount", aiSuggestions.size());
            response.setMetadata(metadata);
            
            // Log success
            logOperation(integration, LogLevel.INFO, OperationType.FIELD_DISCOVERY, 
                        String.format("Successfully discovered %d source fields and generated %d AI suggestions", 
                                    sourceFields.size(), aiSuggestions.size()),
                        entityType, null, null, null, System.currentTimeMillis() - startTime);
            
            return response;
            
        } catch (Exception e) {
            logger.error("❌ Field discovery failed for integration: {}", integration.getName(), e);
            
            logOperation(integration, LogLevel.ERROR, OperationType.FIELD_DISCOVERY, 
                        "Field discovery failed: " + e.getMessage(),
                        entityType, null, null, e.toString(), System.currentTimeMillis() - startTime);
            
            throw new RuntimeException("Field discovery failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Discover source fields from external API
     */
    private List<SourceField> discoverSourceFields(Integration integration, String entityType) {
        logger.info("🔍 Discovering source fields from external API: {}", integration.getExternalApiUrl());
        
        try {
            // Build API request
            HttpHeaders headers = buildAuthHeaders(integration);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Try different endpoints to discover schema
            List<String> discoveryEndpoints = buildDiscoveryEndpoints(integration, entityType);
            
            for (String endpoint : discoveryEndpoints) {
                try {
                    logger.info("🔍 Trying discovery endpoint: {}", endpoint);
                    
                    ResponseEntity<String> response = restTemplate.exchange(
                        endpoint, HttpMethod.GET, entity, String.class);
                    
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        return parseFieldsFromResponse(response.getBody(), entityType);
                    }
                    
                } catch (Exception e) {
                    logger.warn("⚠️ Discovery endpoint failed: {} - {}", endpoint, e.getMessage());
                }
            }
            
            // If all endpoints fail, provide mock data for demo purposes
            logger.warn("⚠️ All discovery endpoints failed, providing mock data for demo");
            return generateMockSourceFields(entityType);
            
        } catch (Exception e) {
            logger.error("❌ Source field discovery failed", e);
            throw new RuntimeException("Failed to discover source fields: " + e.getMessage(), e);
        }
    }
    
    /**
     * Parse fields from API response
     */
    private List<SourceField> parseFieldsFromResponse(String responseBody, String entityType) {
        List<SourceField> fields = new ArrayList<>();
        
        try {
            JsonNode rootNode = objectMapper.readTree(responseBody);
            
            // Handle different response structures
            JsonNode dataNode = rootNode;
            if (rootNode.has("data")) {
                dataNode = rootNode.get("data");
            }
            if (dataNode.isArray() && dataNode.size() > 0) {
                dataNode = dataNode.get(0); // Use first item as schema reference
            }
            
            // Extract fields recursively
            extractFieldsFromNode(dataNode, "", fields);
            
            logger.info("✅ Parsed {} fields from API response", fields.size());
            return fields;
            
        } catch (Exception e) {
            logger.error("❌ Failed to parse fields from response", e);
            throw new RuntimeException("Failed to parse API response: " + e.getMessage(), e);
        }
    }
    
    /**
     * Recursively extract fields from JSON node
     */
    private void extractFieldsFromNode(JsonNode node, String prefix, List<SourceField> fields) {
        if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fieldsIterator = node.fields();
            while (fieldsIterator.hasNext()) {
                Map.Entry<String, JsonNode> field = fieldsIterator.next();
                String fieldName = prefix.isEmpty() ? field.getKey() : prefix + "." + field.getKey();
                JsonNode fieldValue = field.getValue();
                
                if (fieldValue.isObject() && !isSimpleObject(fieldValue)) {
                    // Nested object - recurse
                    extractFieldsFromNode(fieldValue, fieldName, fields);
                } else if (fieldValue.isArray() && fieldValue.size() > 0) {
                    // Array - analyze first element
                    extractFieldsFromNode(fieldValue.get(0), fieldName + "[]", fields);
                } else {
                    // Simple field
                    SourceField sourceField = new SourceField();
                    sourceField.setName(fieldName);
                    sourceField.setType(determineFieldType(fieldValue));
                    sourceField.setSampleValue(extractSampleValue(fieldValue));
                    sourceField.setRequired(false); // Can't determine from sample
                    fields.add(sourceField);
                }
            }
        }
    }
    
    /**
     * Check if JSON node represents a simple object (like date, money, etc.)
     */
    private boolean isSimpleObject(JsonNode node) {
        // Simple heuristics for common object types
        if (node.has("amount") && node.has("currency")) return true; // Money object
        if (node.has("date") || node.has("timestamp")) return true; // Date object
        if (node.size() <= 2) return true; // Very small objects are likely simple
        return false;
    }
    
    /**
     * Determine field type from JSON value
     */
    private String determineFieldType(JsonNode value) {
        if (value.isNull()) return "string";
        if (value.isBoolean()) return "boolean";
        if (value.isInt()) return "integer";
        if (value.isLong()) return "long";
        if (value.isDouble() || value.isFloat()) return "decimal";
        if (value.isArray()) return "array";
        if (value.isObject()) return "object";
        
        // Analyze string content for more specific types
        String stringValue = value.asText();
        if (stringValue.matches("\\d{4}-\\d{2}-\\d{2}.*")) return "date";
        if (stringValue.matches("^[\\w._%+-]+@[\\w.-]+\\.[A-Za-z]{2,}$")) return "email";
        if (stringValue.matches("^https?://.*")) return "url";
        if (stringValue.matches("^\\+?[1-9]\\d{1,14}$")) return "phone";
        
        return "string";
    }
    
    /**
     * Extract sample value from JSON node
     */
    private Object extractSampleValue(JsonNode value) {
        if (value.isNull()) return null;
        if (value.isBoolean()) return value.asBoolean();
        if (value.isNumber()) return value.asDouble();
        return value.asText();
    }
    
    /**
     * Get target fields for our system entities
     */
    private List<TargetField> getTargetFields(String entityType) {
        List<TargetField> fields = new ArrayList<>();
        
        switch (entityType.toUpperCase()) {
            case "ENQUIRY":
                addEnquiryFields(fields);
                break;
            case "QUOTE":
                addQuoteFields(fields);
                break;
            case "ORDER":
                addOrderFields(fields);
                break;
            default:
                logger.warn("⚠️ Unknown entity type: {}", entityType);
        }
        
        return fields;
    }
    
    /**
     * Add enquiry target fields
     */
    private void addEnquiryFields(List<TargetField> fields) {
        // Customer fields
        fields.add(new TargetField("customer.email", "email", "ENQUIRY"));
        fields.add(new TargetField("customer.companyName", "string", "ENQUIRY"));
        fields.add(new TargetField("customer.contactPerson", "string", "ENQUIRY"));
        fields.add(new TargetField("customer.phone", "phone", "ENQUIRY"));
        fields.add(new TargetField("customer.address", "string", "ENQUIRY"));
        fields.add(new TargetField("customer.country", "string", "ENQUIRY"));
        
        // Enquiry fields
        fields.add(new TargetField("subject", "string", "ENQUIRY"));
        fields.add(new TargetField("emailBody", "text", "ENQUIRY"));
        fields.add(new TargetField("status", "enum", "ENQUIRY"));
        fields.add(new TargetField("priority", "enum", "ENQUIRY"));
        fields.add(new TargetField("dueDate", "date", "ENQUIRY"));
        
        // Item fields
        fields.add(new TargetField("items[].product", "enum", "ENQUIRY"));
        fields.add(new TargetField("items[].trimType", "enum", "ENQUIRY"));
        fields.add(new TargetField("items[].rmSpec", "string", "ENQUIRY"));
        fields.add(new TargetField("items[].requestedQuantity", "decimal", "ENQUIRY"));
        fields.add(new TargetField("items[].packagingType", "enum", "ENQUIRY"));
        fields.add(new TargetField("items[].boxQuantity", "string", "ENQUIRY"));
        fields.add(new TargetField("items[].productDescription", "text", "ENQUIRY"));
        fields.add(new TargetField("items[].specialInstructions", "text", "ENQUIRY"));
    }
    
    /**
     * Add quote target fields
     */
    private void addQuoteFields(List<TargetField> fields) {
        // Include enquiry fields
        addEnquiryFields(fields);
        
        // Quote-specific fields
        fields.add(new TargetField("quoteNumber", "string", "QUOTE"));
        fields.add(new TargetField("totalAmount", "decimal", "QUOTE"));
        fields.add(new TargetField("currency", "string", "QUOTE"));
        fields.add(new TargetField("validityPeriod", "integer", "QUOTE"));
        fields.add(new TargetField("terms", "text", "QUOTE"));
        
        // Quote item fields
        fields.add(new TargetField("items[].unitPrice", "decimal", "QUOTE"));
        fields.add(new TargetField("items[].totalPrice", "decimal", "QUOTE"));
        fields.add(new TargetField("items[].notes", "text", "QUOTE"));
    }
    
    /**
     * Add order target fields
     */
    private void addOrderFields(List<TargetField> fields) {
        // Include quote fields
        addQuoteFields(fields);
        
        // Order-specific fields
        fields.add(new TargetField("orderNumber", "string", "ORDER"));
        fields.add(new TargetField("orderDate", "date", "ORDER"));
        fields.add(new TargetField("deliveryDate", "date", "ORDER"));
        fields.add(new TargetField("shippingAddress", "text", "ORDER"));
        fields.add(new TargetField("orderStatus", "enum", "ORDER"));
        fields.add(new TargetField("paymentStatus", "enum", "ORDER"));
    }
    
    /**
     * Generate AI-powered mapping suggestions
     */
    private List<MappingSuggestion> generateMappingSuggestions(List<SourceField> sourceFields, 
                                                              List<TargetField> targetFields, 
                                                              String entityType) {
        logger.info("🤖 Generating AI mapping suggestions for {} source fields", sourceFields.size());
        
        try {
            String prompt = buildMappingPrompt(sourceFields, targetFields, entityType);
            String aiResponse = openAIService.generateFieldMappingSuggestions(prompt);
            
            return parseMappingSuggestions(aiResponse, sourceFields, targetFields);
            
        } catch (Exception e) {
            logger.warn("⚠️ AI mapping suggestions failed, using fallback: {}", e.getMessage());
            return generateFallbackMappings(sourceFields, targetFields);
        }
    }
    
    /**
     * Build prompt for AI mapping suggestions
     */
    private String buildMappingPrompt(List<SourceField> sourceFields, List<TargetField> targetFields, String entityType) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert in API field mapping for business systems. ");
        prompt.append("Analyze the following source and target fields and suggest the best mappings.\n\n");
        
        prompt.append("ENTITY TYPE: ").append(entityType).append("\n\n");
        
        prompt.append("SOURCE FIELDS (from external system):\n");
        for (SourceField field : sourceFields) {
            prompt.append("- ").append(field.getName())
                  .append(" (").append(field.getType()).append(")");
            if (field.getSampleValue() != null) {
                prompt.append(" = ").append(field.getSampleValue());
            }
            prompt.append("\n");
        }
        
        prompt.append("\nTARGET FIELDS (our system):\n");
        for (TargetField field : targetFields) {
            prompt.append("- ").append(field.getName())
                  .append(" (").append(field.getType()).append(")");
            if (field.getDescription() != null) {
                prompt.append(" - ").append(field.getDescription());
            }
            prompt.append("\n");
        }
        
        prompt.append("\nProvide mapping suggestions in JSON format:\n");
        prompt.append("{\n");
        prompt.append("  \"mappings\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"sourceField\": \"source_field_name\",\n");
        prompt.append("      \"targetField\": \"target_field_name\",\n");
        prompt.append("      \"confidence\": 0.95,\n");
        prompt.append("      \"reason\": \"explanation for this mapping\",\n");
        prompt.append("      \"transformation\": \"optional transformation rule\"\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n\n");
        prompt.append("Focus on:\n");
        prompt.append("1. Semantic similarity between field names\n");
        prompt.append("2. Data type compatibility\n");
        prompt.append("3. Business logic relationships\n");
        prompt.append("4. Common naming conventions\n");
        
        return prompt.toString();
    }
    
    /**
     * Parse AI mapping suggestions from response
     */
    private List<MappingSuggestion> parseMappingSuggestions(String aiResponse, 
                                                           List<SourceField> sourceFields, 
                                                           List<TargetField> targetFields) {
        List<MappingSuggestion> suggestions = new ArrayList<>();
        
        try {
            JsonNode responseNode = objectMapper.readTree(aiResponse);
            JsonNode mappingsNode = responseNode.get("mappings");
            
            if (mappingsNode != null && mappingsNode.isArray()) {
                for (JsonNode mappingNode : mappingsNode) {
                    MappingSuggestion suggestion = new MappingSuggestion();
                    suggestion.setSourceField(mappingNode.get("sourceField").asText());
                    suggestion.setTargetField(mappingNode.get("targetField").asText());
                    suggestion.setConfidenceScore(mappingNode.get("confidence").asDouble());
                    suggestion.setReason(mappingNode.get("reason").asText());
                    
                    if (mappingNode.has("transformation")) {
                        suggestion.setSuggestedTransformation(mappingNode.get("transformation").asText());
                    }
                    
                    suggestions.add(suggestion);
                }
            }
            
            logger.info("✅ Parsed {} AI mapping suggestions", suggestions.size());
            return suggestions;
            
        } catch (Exception e) {
            logger.warn("⚠️ Failed to parse AI mapping suggestions: {}", e.getMessage());
            return generateFallbackMappings(sourceFields, targetFields);
        }
    }
    
    /**
     * Generate fallback mappings using simple heuristics
     */
    private List<MappingSuggestion> generateFallbackMappings(List<SourceField> sourceFields, 
                                                            List<TargetField> targetFields) {
        List<MappingSuggestion> suggestions = new ArrayList<>();
        
        for (SourceField sourceField : sourceFields) {
            for (TargetField targetField : targetFields) {
                double similarity = calculateFieldSimilarity(sourceField.getName(), targetField.getName());
                
                if (similarity > 0.6) { // Threshold for suggesting mapping
                    MappingSuggestion suggestion = new MappingSuggestion();
                    suggestion.setSourceField(sourceField.getName());
                    suggestion.setTargetField(targetField.getName());
                    suggestion.setConfidenceScore(similarity);
                    suggestion.setReason("Field name similarity: " + String.format("%.2f", similarity));
                    suggestions.add(suggestion);
                }
            }
        }
        
        // Sort by confidence score
        suggestions.sort((a, b) -> Double.compare(b.getConfidenceScore(), a.getConfidenceScore()));
        
        return suggestions;
    }
    
    /**
     * Calculate similarity between field names
     */
    private double calculateFieldSimilarity(String source, String target) {
        // Simple similarity calculation based on common substrings and patterns
        source = source.toLowerCase().replaceAll("[^a-z]", "");
        target = target.toLowerCase().replaceAll("[^a-z]", "");
        
        if (source.equals(target)) return 1.0;
        if (source.contains(target) || target.contains(source)) return 0.8;
        
        // Check for common business field patterns
        Map<String, List<String>> patterns = Map.of(
            "email", Arrays.asList("email", "mail", "address"),
            "company", Arrays.asList("company", "organization", "org", "business"),
            "name", Arrays.asList("name", "title", "label"),
            "phone", Arrays.asList("phone", "tel", "mobile", "contact"),
            "address", Arrays.asList("address", "location", "addr"),
            "date", Arrays.asList("date", "time", "created", "updated"),
            "amount", Arrays.asList("amount", "price", "cost", "total", "value"),
            "quantity", Arrays.asList("quantity", "qty", "amount", "count")
        );
        
        for (Map.Entry<String, List<String>> pattern : patterns.entrySet()) {
            if (pattern.getValue().stream().anyMatch(source::contains) && 
                pattern.getValue().stream().anyMatch(target::contains)) {
                return 0.7;
            }
        }
        
        return 0.0;
    }
    
    /**
     * Build discovery endpoints for different entity types
     */
    private List<String> buildDiscoveryEndpoints(Integration integration, String entityType) {
        List<String> endpoints = new ArrayList<>();
        String baseUrl = integration.getExternalApiUrl();
        
        // Common API patterns
        String[] patterns = {
            "/%s",           // /enquiries
            "/%ss",          // /enquirys  
            "/api/%s",       // /api/enquiry
            "/api/%ss",      // /api/enquiries
            "/v1/%s",        // /v1/enquiry
            "/v1/%ss",       // /v1/enquiries
            "/%s/schema",    // /enquiry/schema
            "/%s/sample"     // /enquiry/sample
        };
        
        String entityPath = entityType.toLowerCase();
        for (String pattern : patterns) {
            endpoints.add(baseUrl + String.format(pattern, entityPath));
        }
        
        return endpoints;
    }
    
    /**
     * Build authentication headers
     */
    private HttpHeaders buildAuthHeaders(Integration integration) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        switch (integration.getAuthType()) {
            case API_KEY:
                headers.set("X-API-Key", integration.getApiKey());
                break;
            case BEARER_TOKEN:
                headers.setBearerAuth(integration.getApiKey());
                break;
            case BASIC_AUTH:
                // Parse username:password from apiKey
                String[] credentials = integration.getApiKey().split(":");
                if (credentials.length == 2) {
                    headers.setBasicAuth(credentials[0], credentials[1]);
                }
                break;
            case NONE:
            default:
                // No authentication
                break;
        }
        
        return headers;
    }
    
    /**
     * Log integration operation
     */
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
            logger.error("❌ Failed to save integration log", e);
        }
    }
    
    /**
     * Generate mock source fields for demo purposes when external API is not reachable
     */
    private List<SourceField> generateMockSourceFields(String entityType) {
        List<SourceField> mockFields = new ArrayList<>();
        
        switch (entityType.toUpperCase()) {
            case "ENQUIRY":
                mockFields.add(createMockField("enquiry_id", "string", "ENQ-2024-001"));
                mockFields.add(createMockField("customer_name", "string", "Acme Corporation"));
                mockFields.add(createMockField("customer_email", "string", "orders@acme.com"));
                mockFields.add(createMockField("product_name", "string", "Atlantic Salmon Fillet"));
                mockFields.add(createMockField("quantity_kg", "number", "500"));
                mockFields.add(createMockField("delivery_date", "date", "2024-09-15"));
                mockFields.add(createMockField("special_requirements", "string", "Skin-on, pin-bone removed"));
                mockFields.add(createMockField("price_per_kg", "number", "12.50"));
                break;
                
            case "QUOTE":
                mockFields.add(createMockField("quote_number", "string", "QT-2024-001"));
                mockFields.add(createMockField("customer_id", "string", "CUST-001"));
                mockFields.add(createMockField("total_amount", "number", "6250.00"));
                mockFields.add(createMockField("currency", "string", "USD"));
                mockFields.add(createMockField("valid_until", "date", "2024-09-30"));
                mockFields.add(createMockField("status", "string", "PENDING"));
                break;
                
            case "ORDER":
                mockFields.add(createMockField("order_number", "string", "ORD-2024-001"));
                mockFields.add(createMockField("customer_reference", "string", "PO-12345"));
                mockFields.add(createMockField("order_status", "string", "CONFIRMED"));
                mockFields.add(createMockField("delivery_address", "string", "123 Main St, City, Country"));
                mockFields.add(createMockField("payment_terms", "string", "NET30"));
                break;
                
            default:
                mockFields.add(createMockField("id", "string", "12345"));
                mockFields.add(createMockField("name", "string", "Sample Item"));
                mockFields.add(createMockField("created_date", "date", "2024-08-25"));
                break;
        }
        
        logger.info("🎭 Generated {} mock source fields for entity type: {}", mockFields.size(), entityType);
        return mockFields;
    }
    
    /**
     * Helper method to create a mock source field with sample value
     */
    private SourceField createMockField(String name, String type, String sampleValue) {
        SourceField field = new SourceField(name, type);
        field.setSampleValue(sampleValue);
        field.setDescription("Mock field for demo purposes");
        return field;
    }
}
