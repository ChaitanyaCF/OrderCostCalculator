package com.procost.api.model;

import javax.persistence.*;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    @Size(max = 50)
    private String orderNumber; // ORD-2024-001
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quote_id", nullable = false)
    private Quote quote;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
    
    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.CONFIRMED; // CONFIRMED, IN_PRODUCTION, SHIPPED, DELIVERED, CANCELLED
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> orderItems = new ArrayList<>();
    
    private Double totalAmount;
    
    @Size(max = 3)
    private String currency = "USD";
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    private LocalDateTime confirmedAt;
    private LocalDateTime expectedDelivery;
    private LocalDateTime deliveredAt;
    
    @Lob
    private String shippingAddress;
    
    @Lob
    private String specialInstructions;
    
    // Constructors
    public Order() {}
    
    public Order(Quote quote, String orderNumber) {
        this.quote = quote;
        this.customer = quote.getCustomer();
        this.orderNumber = orderNumber;
        this.totalAmount = quote.getTotalAmount();
        this.currency = quote.getCurrency();
        this.confirmedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getOrderNumber() {
        return orderNumber;
    }
    
    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }
    
    public Quote getQuote() {
        return quote;
    }
    
    public void setQuote(Quote quote) {
        this.quote = quote;
    }
    
    public Customer getCustomer() {
        return customer;
    }
    
    public void setCustomer(Customer customer) {
        this.customer = customer;
    }
    
    public OrderStatus getStatus() {
        return status;
    }
    
    public void setStatus(OrderStatus status) {
        this.status = status;
    }
    
    public List<OrderItem> getOrderItems() {
        return orderItems;
    }
    
    public void setOrderItems(List<OrderItem> orderItems) {
        this.orderItems = orderItems;
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
    
    public LocalDateTime getConfirmedAt() {
        return confirmedAt;
    }
    
    public void setConfirmedAt(LocalDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }
    
    public LocalDateTime getExpectedDelivery() {
        return expectedDelivery;
    }
    
    public void setExpectedDelivery(LocalDateTime expectedDelivery) {
        this.expectedDelivery = expectedDelivery;
    }
    
    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }
    
    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
    
    public String getShippingAddress() {
        return shippingAddress;
    }
    
    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }
    
    public String getSpecialInstructions() {
        return specialInstructions;
    }
    
    public void setSpecialInstructions(String specialInstructions) {
        this.specialInstructions = specialInstructions;
    }
} 