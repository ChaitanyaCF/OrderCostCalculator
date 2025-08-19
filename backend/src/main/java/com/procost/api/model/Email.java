package com.procost.api.model;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emails")
public class Email {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "from_email", nullable = false)
    private String fromEmail;
    
    @Column(name = "subject")
    private String subject;
    
    @Column(name = "email_body", columnDefinition = "TEXT")
    private String emailBody;
    
    @Column(name = "received_at", nullable = false)
    private LocalDateTime receivedAt;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "classification")
    private EmailClassification classification;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "manual_classification")
    private EmailClassification manualClassification;
    
    @Column(name = "processed")
    private Boolean processed = false;
    
    @Column(name = "enquiry_id")
    private String enquiryId;
    
    @Column(name = "order_id")
    private String orderId;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum EmailClassification {
        INITIAL_ENQUIRY,
        FOLLOW_UP,
        ORDER,
        GENERAL,
        UNCLASSIFIED
    }
    
    // Constructors
    public Email() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.receivedAt = LocalDateTime.now();
    }
    
    public Email(String fromEmail, String subject, String emailBody) {
        this();
        this.fromEmail = fromEmail;
        this.subject = subject;
        this.emailBody = emailBody;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getFromEmail() {
        return fromEmail;
    }
    
    public void setFromEmail(String fromEmail) {
        this.fromEmail = fromEmail;
    }
    
    public String getSubject() {
        return subject;
    }
    
    public void setSubject(String subject) {
        this.subject = subject;
    }
    
    public String getEmailBody() {
        return emailBody;
    }
    
    public void setEmailBody(String emailBody) {
        this.emailBody = emailBody;
    }
    
    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }
    
    public void setReceivedAt(LocalDateTime receivedAt) {
        this.receivedAt = receivedAt;
    }
    
    public EmailClassification getClassification() {
        return classification;
    }
    
    public void setClassification(EmailClassification classification) {
        this.classification = classification;
    }
    
    public EmailClassification getManualClassification() {
        return manualClassification;
    }
    
    public void setManualClassification(EmailClassification manualClassification) {
        this.manualClassification = manualClassification;
        this.updatedAt = LocalDateTime.now();
    }
    
    public Boolean getProcessed() {
        return processed;
    }
    
    public void setProcessed(Boolean processed) {
        this.processed = processed;
        this.updatedAt = LocalDateTime.now();
    }
    
    public String getEnquiryId() {
        return enquiryId;
    }
    
    public void setEnquiryId(String enquiryId) {
        this.enquiryId = enquiryId;
    }
    
    public String getOrderId() {
        return orderId;
    }
    
    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    // Helper methods
    public EmailClassification getEffectiveClassification() {
        return manualClassification != null ? manualClassification : classification;
    }
    
    public boolean isManuallyClassified() {
        return manualClassification != null;
    }
}