package com.procost.api.model;

public enum QuoteStatus {
    DRAFT("Quote being prepared"),
    SENT("Quote sent to customer"),
    ACCEPTED("Quote accepted by customer"),
    REJECTED("Quote rejected by customer"),
    EXPIRED("Quote expired without response"),
    CANCELLED("Quote cancelled");
    
    private final String description;
    
    QuoteStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
} 