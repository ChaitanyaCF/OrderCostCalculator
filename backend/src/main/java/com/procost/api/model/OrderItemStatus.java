package com.procost.api.model;

public enum OrderItemStatus {
    PENDING("Item pending production"),
    IN_PRODUCTION("Item currently in production"),
    QUALITY_CHECK("Item undergoing quality check"),
    COMPLETED("Item production completed"),
    SHIPPED("Item shipped");
    
    private final String description;
    
    OrderItemStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
} 