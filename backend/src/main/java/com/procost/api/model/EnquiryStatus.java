package com.procost.api.model;

public enum EnquiryStatus {
    RECEIVED("Email enquiry received"),
    PROCESSING("AI processing the enquiry"),
    QUOTED("Quote generated and sent"),
    CONVERTED("Quote accepted and converted to order"),
    EXPIRED("Quote expired without response"),
    CANCELLED("Enquiry cancelled");
    
    private final String description;
    
    EnquiryStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
} 