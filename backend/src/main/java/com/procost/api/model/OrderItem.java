package com.procost.api.model;

import javax.persistence.*;
import javax.validation.constraints.Size;

@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quote_item_id")
    private QuoteItem quoteItem;
    
    @Lob
    private String itemDescription;
    
    private Integer quantity;
    private Double unitPrice;
    private Double totalPrice;
    
    @Size(max = 3)
    private String currency = "USD";
    
    @Enumerated(EnumType.STRING)
    private OrderItemStatus status = OrderItemStatus.PENDING; // PENDING, IN_PRODUCTION, COMPLETED
    
    @Lob
    private String productionNotes;
    
    // Constructors
    public OrderItem() {}
    
    public OrderItem(Order order, QuoteItem quoteItem) {
        this.order = order;
        this.quoteItem = quoteItem;
        this.itemDescription = quoteItem.getItemDescription();
        this.quantity = quoteItem.getQuantity();
        this.unitPrice = quoteItem.getUnitPrice();
        this.totalPrice = quoteItem.getTotalPrice();
        this.currency = quoteItem.getCurrency();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Order getOrder() {
        return order;
    }
    
    public void setOrder(Order order) {
        this.order = order;
    }
    
    public QuoteItem getQuoteItem() {
        return quoteItem;
    }
    
    public void setQuoteItem(QuoteItem quoteItem) {
        this.quoteItem = quoteItem;
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
    
    public OrderItemStatus getStatus() {
        return status;
    }
    
    public void setStatus(OrderItemStatus status) {
        this.status = status;
    }
    
    public String getProductionNotes() {
        return productionNotes;
    }
    
    public void setProductionNotes(String productionNotes) {
        this.productionNotes = productionNotes;
    }
    
    // Helper method to update total price
    private void updateTotalPrice() {
        if (quantity != null && unitPrice != null) {
            this.totalPrice = quantity * unitPrice;
        }
    }
} 