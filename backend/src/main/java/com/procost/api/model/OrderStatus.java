package com.procost.api.model;

public enum OrderStatus {
    CONFIRMED("Order confirmed and accepted"),
    IN_PRODUCTION("Order in production"),
    READY_TO_SHIP("Order ready for shipping"),
    SHIPPED("Order shipped"),
    DELIVERED("Order delivered"),
    CANCELLED("Order cancelled");
    
    private final String description;
    
    OrderStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
} 