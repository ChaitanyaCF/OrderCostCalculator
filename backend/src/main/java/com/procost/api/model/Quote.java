package com.procost.api.model;

import javax.persistence.*;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "quotes")
public class Quote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    @Size(max = 50)
    private String quoteNumber; // QUO-2024-001
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "email_enquiry_id", nullable = false)
    private EmailEnquiry emailEnquiry;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
    
    @Enumerated(EnumType.STRING)
    private QuoteStatus status = QuoteStatus.DRAFT; // DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
    
    @OneToMany(mappedBy = "quote", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QuoteItem> quoteItems = new ArrayList<>();
    
    private Double totalAmount;
    
    @Size(max = 3)
    private String currency = "USD";
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    private LocalDateTime sentAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime expiresAt;
    
    @Size(max = 100)
    private String validityPeriod = "30 days";
    
    @Size(max = 255)
    private String paymentTerms;
    
    @Size(max = 255)
    private String deliveryTerms;
    
    @Lob
    private String specialInstructions;
    
    // One-to-one relationship with Order when quote is accepted
    @OneToOne(mappedBy = "quote", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Order order;
    
    // Constructors
    public Quote() {}
    
    public Quote(EmailEnquiry emailEnquiry, Customer customer, String quoteNumber) {
        this.emailEnquiry = emailEnquiry;
        this.customer = customer;
        this.quoteNumber = quoteNumber;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getQuoteNumber() {
        return quoteNumber;
    }
    
    public void setQuoteNumber(String quoteNumber) {
        this.quoteNumber = quoteNumber;
    }
    
    public EmailEnquiry getEmailEnquiry() {
        return emailEnquiry;
    }
    
    public void setEmailEnquiry(EmailEnquiry emailEnquiry) {
        this.emailEnquiry = emailEnquiry;
    }
    
    public Customer getCustomer() {
        return customer;
    }
    
    public void setCustomer(Customer customer) {
        this.customer = customer;
    }
    
    public QuoteStatus getStatus() {
        return status;
    }
    
    public void setStatus(QuoteStatus status) {
        this.status = status;
    }
    
    public List<QuoteItem> getQuoteItems() {
        return quoteItems;
    }
    
    public void setQuoteItems(List<QuoteItem> quoteItems) {
        this.quoteItems = quoteItems;
    }
    
    public Double getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    public String getCurrency() {
        return currency;
    }
    
    public void setCurrency(String currency) {
        this.currency = currency;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getSentAt() {
        return sentAt;
    }
    
    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }
    
    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }
    
    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }
    
    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }
    
    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }
    
    public String getValidityPeriod() {
        return validityPeriod;
    }
    
    public void setValidityPeriod(String validityPeriod) {
        this.validityPeriod = validityPeriod;
    }
    
    public String getPaymentTerms() {
        return paymentTerms;
    }
    
    public void setPaymentTerms(String paymentTerms) {
        this.paymentTerms = paymentTerms;
    }
    
    public String getDeliveryTerms() {
        return deliveryTerms;
    }
    
    public void setDeliveryTerms(String deliveryTerms) {
        this.deliveryTerms = deliveryTerms;
    }
    
    public String getSpecialInstructions() {
        return specialInstructions;
    }
    
    public void setSpecialInstructions(String specialInstructions) {
        this.specialInstructions = specialInstructions;
    }
    
    public Order getOrder() {
        return order;
    }
    
    public void setOrder(Order order) {
        this.order = order;
    }
} 