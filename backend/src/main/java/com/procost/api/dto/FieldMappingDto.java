package com.procost.api.dto;

import java.util.List;
import java.util.Map;

public class FieldMappingDto {
    
    // Source field information from external API
    public static class SourceField {
        private String name;
        private String type;
        private String description;
        private boolean required;
        private Object sampleValue;
        private List<String> possibleValues; // For enum fields
        
        // Constructors
        public SourceField() {}
        
        public SourceField(String name, String type) {
            this.name = name;
            this.type = type;
        }
        
        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public boolean isRequired() { return required; }
        public void setRequired(boolean required) { this.required = required; }
        
        public Object getSampleValue() { return sampleValue; }
        public void setSampleValue(Object sampleValue) { this.sampleValue = sampleValue; }
        
        public List<String> getPossibleValues() { return possibleValues; }
        public void setPossibleValues(List<String> possibleValues) { this.possibleValues = possibleValues; }
    }
    
    // Target field information from our system
    public static class TargetField {
        private String name;
        private String type;
        private String description;
        private boolean required;
        private String entityType; // ENQUIRY, QUOTE, ORDER
        private String fieldPath; // e.g., "customer.companyName", "items[].product"
        
        // Constructors
        public TargetField() {}
        
        public TargetField(String name, String type, String entityType) {
            this.name = name;
            this.type = type;
            this.entityType = entityType;
        }
        
        // Getters and Setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public boolean isRequired() { return required; }
        public void setRequired(boolean required) { this.required = required; }
        
        public String getEntityType() { return entityType; }
        public void setEntityType(String entityType) { this.entityType = entityType; }
        
        public String getFieldPath() { return fieldPath; }
        public void setFieldPath(String fieldPath) { this.fieldPath = fieldPath; }
    }
    
    // Field mapping configuration
    public static class FieldMapping {
        private String sourceField;
        private String targetField;
        private String transformationRule; // JavaScript-like expression
        private boolean isActive;
        private double confidenceScore; // AI confidence in this mapping
        private String mappingType; // DIRECT, TRANSFORMED, CALCULATED, CONDITIONAL
        
        // Constructors
        public FieldMapping() {}
        
        public FieldMapping(String sourceField, String targetField) {
            this.sourceField = sourceField;
            this.targetField = targetField;
            this.isActive = true;
            this.mappingType = "DIRECT";
        }
        
        // Getters and Setters
        public String getSourceField() { return sourceField; }
        public void setSourceField(String sourceField) { this.sourceField = sourceField; }
        
        public String getTargetField() { return targetField; }
        public void setTargetField(String targetField) { this.targetField = targetField; }
        
        public String getTransformationRule() { return transformationRule; }
        public void setTransformationRule(String transformationRule) { this.transformationRule = transformationRule; }
        
        public boolean isActive() { return isActive; }
        public void setActive(boolean active) { isActive = active; }
        
        public double getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }
        
        public String getMappingType() { return mappingType; }
        public void setMappingType(String mappingType) { this.mappingType = mappingType; }
    }
    
    // AI mapping suggestion
    public static class MappingSuggestion {
        private String sourceField;
        private String targetField;
        private double confidenceScore;
        private String reason;
        private String suggestedTransformation;
        private List<String> alternativeTargets;
        
        // Constructors
        public MappingSuggestion() {}
        
        public MappingSuggestion(String sourceField, String targetField, double confidenceScore, String reason) {
            this.sourceField = sourceField;
            this.targetField = targetField;
            this.confidenceScore = confidenceScore;
            this.reason = reason;
        }
        
        // Getters and Setters
        public String getSourceField() { return sourceField; }
        public void setSourceField(String sourceField) { this.sourceField = sourceField; }
        
        public String getTargetField() { return targetField; }
        public void setTargetField(String targetField) { this.targetField = targetField; }
        
        public double getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        
        public String getSuggestedTransformation() { return suggestedTransformation; }
        public void setSuggestedTransformation(String suggestedTransformation) { this.suggestedTransformation = suggestedTransformation; }
        
        public List<String> getAlternativeTargets() { return alternativeTargets; }
        public void setAlternativeTargets(List<String> alternativeTargets) { this.alternativeTargets = alternativeTargets; }
    }
    
    // Complete field discovery response
    public static class FieldDiscoveryResponse {
        private List<SourceField> sourceFields;
        private List<TargetField> targetFields;
        private List<MappingSuggestion> aiSuggestions;
        private Map<String, Object> metadata;
        
        // Constructors
        public FieldDiscoveryResponse() {}
        
        // Getters and Setters
        public List<SourceField> getSourceFields() { return sourceFields; }
        public void setSourceFields(List<SourceField> sourceFields) { this.sourceFields = sourceFields; }
        
        public List<TargetField> getTargetFields() { return targetFields; }
        public void setTargetFields(List<TargetField> targetFields) { this.targetFields = targetFields; }
        
        public List<MappingSuggestion> getAiSuggestions() { return aiSuggestions; }
        public void setAiSuggestions(List<MappingSuggestion> aiSuggestions) { this.aiSuggestions = aiSuggestions; }
        
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }
}
