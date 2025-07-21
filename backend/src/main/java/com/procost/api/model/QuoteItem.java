package com.procost.api.model;

import javax.persistence.*;
import javax.validation.constraints.Size;

@Entity
@Table(name = "quote_items")
public class QuoteItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quote_id", nullable = false)
    private Quote quote;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enquiry_item_id")
    private EnquiryItem enquiryItem;
    
    @Lob
    private String itemDescription;
    
    private Integer quantity;
    private Double unitPrice;
    private Double totalPrice;
    
    @Size(max = 3)
    private String currency = "USD";
    
    @Lob
    private String notes;
    
    // Constructors
    public QuoteItem() {}
    
    public QuoteItem(Quote quote, EnquiryItem enquiryItem, String itemDescription, Integer quantity, Double unitPrice) {
        this.quote = quote;
        this.enquiryItem = enquiryItem;
        this.itemDescription = itemDescription;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = quantity * unitPrice;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Quote getQuote() {
        return quote;
    }
    
    public void setQuote(Quote quote) {
        this.quote = quote;
    }
    
    public EnquiryItem getEnquiryItem() {
        return enquiryItem;
    }
    
    public void setEnquiryItem(EnquiryItem enquiryItem) {
        this.enquiryItem = enquiryItem;
    }
    
    public String getItemDescription() {
        return itemDescription;
    }
    
    public void setItemDescription(String itemDescription) {
        this.itemDescription = itemDescription;
    }
    
    public Integer getQuantity() {
        return quantity;
    }
    
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
        updateTotalPrice();
    }
    
    public Double getUnitPrice() {
        return unitPrice;
    }
    
    public void setUnitPrice(Double unitPrice) {
        this.unitPrice = unitPrice;
        updateTotalPrice();
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
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    // Helper method to update total price
    private void updateTotalPrice() {
        if (quantity != null && unitPrice != null) {
            this.totalPrice = quantity * unitPrice;
        }
    }
} 