package com.procost.api.model;

import javax.persistence.*;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "enquiry_items")
public class EnquiryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "email_enquiry_id")
    private EmailEnquiry emailEnquiry;
    
    // Extracted from email
    @Size(max = 255)
    private String customerSkuReference;
    
    @Lob
    private String productDescription;
    
    private Integer requestedQuantity;
    
    @Size(max = 255)
    private String deliveryRequirement;
    
    @Lob
    private String specialInstructions;
    
    // Mapped to our system
    @Size(max = 100)
    private String product;
    
    @Size(max = 100)
    private String trimType;
    
    @Size(max = 100)
    private String rmSpec;
    
    @Size(max = 100)
    private String productType;
    
    @Size(max = 100)
    private String packagingType;
    
    @Size(max = 100)
    private String transportMode;
    
    // Calculated pricing
    private Double unitPrice;
    private Double totalPrice;
    
    @Size(max = 3)
    private String currency = "USD";
    
    // Quote item reference
    @OneToOne(mappedBy = "enquiryItem", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private QuoteItem quoteItem;
    
    // AI processing status
    @Column(nullable = false)
    private Boolean aiMapped = false;
    
    @Size(max = 20)
    private String mappingConfidence; // HIGH, MEDIUM, LOW, MANUAL_REVIEW
    
    @Lob
    private String aiProcessingNotes;
    
    private LocalDateTime processedAt;
    
    // Constructors
    public EnquiryItem() {}
    
    public EnquiryItem(EmailEnquiry emailEnquiry, String customerSkuReference, String productDescription, Integer requestedQuantity) {
        this.emailEnquiry = emailEnquiry;
        this.customerSkuReference = customerSkuReference;
        this.productDescription = productDescription;
        this.requestedQuantity = requestedQuantity;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public EmailEnquiry getEmailEnquiry() {
        return emailEnquiry;
    }
    
    public void setEmailEnquiry(EmailEnquiry emailEnquiry) {
        this.emailEnquiry = emailEnquiry;
    }
    
    public String getCustomerSkuReference() {
        return customerSkuReference;
    }
    
    public void setCustomerSkuReference(String customerSkuReference) {
        this.customerSkuReference = customerSkuReference;
    }
    
    public String getProductDescription() {
        return productDescription;
    }
    
    public void setProductDescription(String productDescription) {
        this.productDescription = productDescription;
    }
    
    public Integer getRequestedQuantity() {
        return requestedQuantity;
    }
    
    public void setRequestedQuantity(Integer requestedQuantity) {
        this.requestedQuantity = requestedQuantity;
    }
    
    public String getDeliveryRequirement() {
        return deliveryRequirement;
    }
    
    public void setDeliveryRequirement(String deliveryRequirement) {
        this.deliveryRequirement = deliveryRequirement;
    }
    
    public String getSpecialInstructions() {
        return specialInstructions;
    }
    
    public void setSpecialInstructions(String specialInstructions) {
        this.specialInstructions = specialInstructions;
    }
    
    public String getProduct() {
        return product;
    }
    
    public void setProduct(String product) {
        this.product = product;
    }
    
    public String getTrimType() {
        return trimType;
    }
    
    public void setTrimType(String trimType) {
        this.trimType = trimType;
    }
    
    public String getRmSpec() {
        return rmSpec;
    }
    
    public void setRmSpec(String rmSpec) {
        this.rmSpec = rmSpec;
    }
    
    public String getProductType() {
        return productType;
    }
    
    public void setProductType(String productType) {
        this.productType = productType;
    }
    
    public String getPackagingType() {
        return packagingType;
    }
    
    public void setPackagingType(String packagingType) {
        this.packagingType = packagingType;
    }
    
    public String getTransportMode() {
        return transportMode;
    }
    
    public void setTransportMode(String transportMode) {
        this.transportMode = transportMode;
    }
    
    public Double getUnitPrice() {
        return unitPrice;
    }
    
    public void setUnitPrice(Double unitPrice) {
        this.unitPrice = unitPrice;
    }
    
    public Double getTotalPrice() {
        return totalPrice;
    }
    
    public void setTotalPrice(Double totalPrice) {
        this.totalPrice = totalPrice;
    }
    
    public String getCurrency() {
        return currency;
    }
    
    public void setCurrency(String currency) {
        this.currency = currency;
    }
    
    public QuoteItem getQuoteItem() {
        return quoteItem;
    }
    
    public void setQuoteItem(QuoteItem quoteItem) {
        this.quoteItem = quoteItem;
    }
    
    public Boolean getAiMapped() {
        return aiMapped;
    }
    
    public void setAiMapped(Boolean aiMapped) {
        this.aiMapped = aiMapped;
    }
    
    public String getMappingConfidence() {
        return mappingConfidence;
    }
    
    public void setMappingConfidence(String mappingConfidence) {
        this.mappingConfidence = mappingConfidence;
    }
    
    public String getAiProcessingNotes() {
        return aiProcessingNotes;
    }
    
    public void setAiProcessingNotes(String aiProcessingNotes) {
        this.aiProcessingNotes = aiProcessingNotes;
    }
    
    public LocalDateTime getProcessedAt() {
        return processedAt;
    }
    
    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }
} 