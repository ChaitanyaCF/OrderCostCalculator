package com.procost.api.model;

import javax.persistence.*;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "email_enquiries")
public class EmailEnquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    @Size(max = 50)
    private String enquiryId; // ENQ-2024-001
    
    // Email metadata
    @Size(max = 255)
    private String fromEmail;
    
    @Size(max = 500)
    private String subject;
    
    @Lob
    private String emailBody;
    
    @Size(max = 255)
    private String originalEmailId; // For threading
    
    // Customer information (extracted or matched)
    @ManyToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;
    
    // Enquiry status
    @Enumerated(EnumType.STRING)
    private EnquiryStatus status = EnquiryStatus.RECEIVED; // RECEIVED, PROCESSING, QUOTED, CONVERTED
    
    // Parsed enquiry items (multiple SKUs)
    @OneToMany(mappedBy = "emailEnquiry", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EnquiryItem> enquiryItems = new ArrayList<>();
    
    // Processing metadata
    @Column(nullable = false)
    private Boolean aiProcessed = false;
    
    @Lob
    private String processingNotes;
    
    private LocalDateTime processedAt;
    
    @CreationTimestamp
    private LocalDateTime receivedAt;
    
    // Constructors
    public EmailEnquiry() {}
    
    public EmailEnquiry(String fromEmail, String subject, String emailBody) {
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
    
    public String getEnquiryId() {
        return enquiryId;
    }
    
    public void setEnquiryId(String enquiryId) {
        this.enquiryId = enquiryId;
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
    
    public String getOriginalEmailId() {
        return originalEmailId;
    }
    
    public void setOriginalEmailId(String originalEmailId) {
        this.originalEmailId = originalEmailId;
    }
    
    public Customer getCustomer() {
        return customer;
    }
    
    public void setCustomer(Customer customer) {
        this.customer = customer;
    }
    
    public EnquiryStatus getStatus() {
        return status;
    }
    
    public void setStatus(EnquiryStatus status) {
        this.status = status;
    }
    
    public List<EnquiryItem> getEnquiryItems() {
        return enquiryItems;
    }
    
    public void setEnquiryItems(List<EnquiryItem> enquiryItems) {
        this.enquiryItems = enquiryItems;
    }
    
    public Boolean getAiProcessed() {
        return aiProcessed;
    }
    
    public void setAiProcessed(Boolean aiProcessed) {
        this.aiProcessed = aiProcessed;
    }
    
    public String getProcessingNotes() {
        return processingNotes;
    }
    
    public void setProcessingNotes(String processingNotes) {
        this.processingNotes = processingNotes;
    }
    
    public LocalDateTime getProcessedAt() {
        return processedAt;
    }
    
    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }
    
    public LocalDateTime getReceivedAt() {
        return receivedAt;
    }
    
    public void setReceivedAt(LocalDateTime receivedAt) {
        this.receivedAt = receivedAt;
    }
} 