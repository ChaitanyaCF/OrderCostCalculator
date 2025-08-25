package com.procost.api.controller;

import com.procost.api.model.*;
import com.procost.api.repository.*;
import com.procost.api.service.IntegrationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * External API endpoints for ERP systems to access data
 * These endpoints are designed for external system integration
 * Authentication should be handled via API keys or tokens
 */
@RestController
@RequestMapping("/api/external/v1")
@CrossOrigin(origins = "*")
public class ExternalApiController {
    
    private static final Logger logger = LoggerFactory.getLogger(ExternalApiController.class);
    
    @Autowired
    private EmailEnquiryRepository emailEnquiryRepository;
    
    @Autowired
    private QuoteRepository quoteRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private IntegrationService integrationService;
    
    /**
     * Get all enquiries with pagination and filtering
     */
    @GetMapping("/enquiries")
    public ResponseEntity<Map<String, Object>> getEnquiries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since,
            @RequestParam(required = false) String customerEmail) {
        
        logger.info("External API: Fetching enquiries - page: {}, size: {}, status: {}, since: {}, customer: {}", 
                   page, size, status, since, customerEmail);
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<EmailEnquiry> enquiriesPage;
            
            // Apply filters
            if (status != null && since != null && customerEmail != null) {
                enquiriesPage = emailEnquiryRepository.findByStatusAndCreatedAtAfterAndCustomerEmailContaining(
                    EnquiryStatus.valueOf(status.toUpperCase()), since, customerEmail, pageable);
            } else if (status != null && since != null) {
                enquiriesPage = emailEnquiryRepository.findByStatusAndCreatedAtAfter(
                    EnquiryStatus.valueOf(status.toUpperCase()), since, pageable);
            } else if (status != null) {
                enquiriesPage = emailEnquiryRepository.findByStatus(
                    EnquiryStatus.valueOf(status.toUpperCase()), pageable);
            } else if (since != null) {
                enquiriesPage = emailEnquiryRepository.findByCreatedAtAfter(since, pageable);
            } else if (customerEmail != null) {
                enquiriesPage = emailEnquiryRepository.findByCustomerEmailContaining(customerEmail, pageable);
            } else {
                enquiriesPage = emailEnquiryRepository.findAll(pageable);
            }
            
            // Convert to external API format
            List<Map<String, Object>> enquiries = enquiriesPage.getContent().stream()
                .map(this::convertEnquiryToExternalFormat)
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("data", enquiries);
            response.put("pagination", Map.of(
                "page", page,
                "size", size,
                "totalElements", enquiriesPage.getTotalElements(),
                "totalPages", enquiriesPage.getTotalPages(),
                "hasNext", enquiriesPage.hasNext(),
                "hasPrevious", enquiriesPage.hasPrevious()
            ));
            response.put("success", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching enquiries via external API", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Get specific enquiry by ID
     */
    @GetMapping("/enquiries/{enquiryId}")
    public ResponseEntity<Map<String, Object>> getEnquiry(@PathVariable String enquiryId) {
        logger.info("External API: Fetching enquiry: {}", enquiryId);
        
        try {
            Optional<EmailEnquiry> enquiryOpt = emailEnquiryRepository.findByEnquiryId(enquiryId);
            
            if (enquiryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("data", convertEnquiryToExternalFormat(enquiryOpt.get()));
            response.put("success", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching enquiry {} via external API", enquiryId, e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Get all quotes with pagination and filtering
     */
    @GetMapping("/quotes")
    public ResponseEntity<Map<String, Object>> getQuotes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since,
            @RequestParam(required = false) String customerEmail) {
        
        logger.info("External API: Fetching quotes - page: {}, size: {}, status: {}, since: {}, customer: {}", 
                   page, size, status, since, customerEmail);
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Quote> quotesPage;
            
            // Apply filters (simplified for now - can be enhanced with custom queries)
            if (since != null) {
                quotesPage = quoteRepository.findByCreatedAtAfter(since, pageable);
            } else {
                quotesPage = quoteRepository.findAll(pageable);
            }
            
            // Convert to external API format
            List<Map<String, Object>> quotes = quotesPage.getContent().stream()
                .map(this::convertQuoteToExternalFormat)
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("data", quotes);
            response.put("pagination", Map.of(
                "page", page,
                "size", size,
                "totalElements", quotesPage.getTotalElements(),
                "totalPages", quotesPage.getTotalPages(),
                "hasNext", quotesPage.hasNext(),
                "hasPrevious", quotesPage.hasPrevious()
            ));
            response.put("success", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching quotes via external API", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Get specific quote by quote number
     */
    @GetMapping("/quotes/{quoteNumber}")
    public ResponseEntity<Map<String, Object>> getQuote(@PathVariable String quoteNumber) {
        logger.info("External API: Fetching quote: {}", quoteNumber);
        
        try {
            Optional<Quote> quoteOpt = quoteRepository.findByQuoteNumber(quoteNumber);
            
            if (quoteOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("data", convertQuoteToExternalFormat(quoteOpt.get()));
            response.put("success", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching quote {} via external API", quoteNumber, e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Get all orders with pagination and filtering
     */
    @GetMapping("/orders")
    public ResponseEntity<Map<String, Object>> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since) {
        
        logger.info("External API: Fetching orders - page: {}, size: {}, status: {}, since: {}", 
                   page, size, status, since);
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("orderDate").descending());
            Page<Order> ordersPage;
            
            // Apply filters (simplified for now)
            if (since != null) {
                ordersPage = orderRepository.findByOrderDateAfter(since, pageable);
            } else {
                ordersPage = orderRepository.findAll(pageable);
            }
            
            // Convert to external API format
            List<Map<String, Object>> orders = ordersPage.getContent().stream()
                .map(this::convertOrderToExternalFormat)
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("data", orders);
            response.put("pagination", Map.of(
                "page", page,
                "size", size,
                "totalElements", ordersPage.getTotalElements(),
                "totalPages", ordersPage.getTotalPages(),
                "hasNext", ordersPage.hasNext(),
                "hasPrevious", ordersPage.hasPrevious()
            ));
            response.put("success", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching orders via external API", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Get specific order by order number
     */
    @GetMapping("/orders/{orderNumber}")
    public ResponseEntity<Map<String, Object>> getOrder(@PathVariable String orderNumber) {
        logger.info("External API: Fetching order: {}", orderNumber);
        
        try {
            Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNumber);
            
            if (orderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("data", convertOrderToExternalFormat(orderOpt.get()));
            response.put("success", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching order {} via external API", orderNumber, e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Get all customers with pagination
     */
    @GetMapping("/customers")
    public ResponseEntity<Map<String, Object>> getCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search) {
        
        logger.info("External API: Fetching customers - page: {}, size: {}, search: {}", page, size, search);
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("companyName").ascending());
            Page<Customer> customersPage;
            
            if (search != null && !search.trim().isEmpty()) {
                customersPage = customerRepository.findByCompanyNameContainingIgnoreCaseOrContactPersonContainingIgnoreCase(
                    search, search, pageable);
            } else {
                customersPage = customerRepository.findAll(pageable);
            }
            
            // Convert to external API format
            List<Map<String, Object>> customers = customersPage.getContent().stream()
                .map(this::convertCustomerToExternalFormat)
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("data", customers);
            response.put("pagination", Map.of(
                "page", page,
                "size", size,
                "totalElements", customersPage.getTotalElements(),
                "totalPages", customersPage.getTotalPages(),
                "hasNext", customersPage.hasNext(),
                "hasPrevious", customersPage.hasPrevious()
            ));
            response.put("success", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching customers via external API", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Create new order from external ERP system
     */
    @PostMapping("/orders")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> orderData) {
        logger.info("External API: Creating order from external system");
        
        try {
            // Validate required fields
            if (!orderData.containsKey("customerEmail") || !orderData.containsKey("items")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Missing required fields: customerEmail, items"
                ));
            }
            
            // Find or create customer
            String customerEmail = (String) orderData.get("customerEmail");
            Customer customer = customerRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found: " + customerEmail));
            
            // Create order
            Order order = new Order();
            order.setOrderNumber(generateOrderNumber());
            order.setCustomer(customer);
            order.setOrderDate(LocalDateTime.now());
            order.setOrderStatus(OrderStatus.PENDING);
            order.setPaymentStatus(PaymentStatus.PENDING);
            order.setCurrency((String) orderData.getOrDefault("currency", "DKK"));
            
            // Set optional fields
            if (orderData.containsKey("deliveryDate")) {
                order.setDeliveryDate(LocalDateTime.parse((String) orderData.get("deliveryDate")));
            }
            if (orderData.containsKey("shippingAddress")) {
                order.setShippingAddress((String) orderData.get("shippingAddress"));
            }
            if (orderData.containsKey("specialInstructions")) {
                order.setSpecialInstructions((String) orderData.get("specialInstructions"));
            }
            
            // Process order items
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) orderData.get("items");
            double totalAmount = 0.0;
            
            for (Map<String, Object> itemData : itemsData) {
                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(order);
                orderItem.setItemDescription((String) itemData.get("description"));
                orderItem.setQuantity(((Number) itemData.get("quantity")).doubleValue());
                orderItem.setUnitPrice(((Number) itemData.get("unitPrice")).doubleValue());
                orderItem.setTotalPrice(orderItem.getQuantity() * orderItem.getUnitPrice());
                orderItem.setCurrency(order.getCurrency());
                
                if (itemData.containsKey("productionNotes")) {
                    orderItem.setProductionNotes((String) itemData.get("productionNotes"));
                }
                
                order.getOrderItems().add(orderItem);
                totalAmount += orderItem.getTotalPrice();
            }
            
            order.setTotalAmount(totalAmount);
            
            // Save order
            Order savedOrder = orderRepository.save(order);
            
            // Trigger integration webhooks
            try {
                integrationService.pushDataToIntegrations("ORDER", savedOrder, savedOrder.getId());
                logger.info("Order integration webhooks triggered successfully for order: {}", savedOrder.getOrderNumber());
            } catch (Exception e) {
                logger.warn("Failed to trigger integration webhooks for order: {} - {}", savedOrder.getOrderNumber(), e.getMessage());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("data", convertOrderToExternalFormat(savedOrder));
            response.put("success", true);
            response.put("message", "Order created successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error creating order via external API", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Update order status from external ERP system
     */
    @PutMapping("/orders/{orderNumber}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(
            @PathVariable String orderNumber,
            @RequestBody Map<String, Object> statusUpdate) {
        
        logger.info("External API: Updating order status for: {}", orderNumber);
        
        try {
            Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNumber);
            
            if (orderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Order order = orderOpt.get();
            
            if (statusUpdate.containsKey("orderStatus")) {
                order.setOrderStatus(OrderStatus.valueOf(((String) statusUpdate.get("orderStatus")).toUpperCase()));
            }
            
            if (statusUpdate.containsKey("paymentStatus")) {
                order.setPaymentStatus(PaymentStatus.valueOf(((String) statusUpdate.get("paymentStatus")).toUpperCase()));
            }
            
            if (statusUpdate.containsKey("deliveryDate")) {
                order.setDeliveryDate(LocalDateTime.parse((String) statusUpdate.get("deliveryDate")));
            }
            
            Order savedOrder = orderRepository.save(order);
            
            // Trigger integration webhooks for status update
            try {
                integrationService.pushDataToIntegrations("ORDER", savedOrder, savedOrder.getId());
                logger.info("Order status update webhooks triggered for order: {}", savedOrder.getOrderNumber());
            } catch (Exception e) {
                logger.warn("Failed to trigger webhooks for order status update: {} - {}", savedOrder.getOrderNumber(), e.getMessage());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("data", convertOrderToExternalFormat(savedOrder));
            response.put("success", true);
            response.put("message", "Order status updated successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error updating order status via external API", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Get API schema/documentation
     */
    @GetMapping("/schema")
    public ResponseEntity<Map<String, Object>> getApiSchema() {
        Map<String, Object> schema = new HashMap<>();
        
        schema.put("version", "1.0");
        schema.put("description", "External API for ERP system integration");
        
        Map<String, Object> endpoints = new HashMap<>();
        endpoints.put("GET /enquiries", "List all enquiries with pagination and filtering");
        endpoints.put("GET /enquiries/{id}", "Get specific enquiry by ID");
        endpoints.put("GET /quotes", "List all quotes with pagination and filtering");
        endpoints.put("GET /quotes/{number}", "Get specific quote by quote number");
        endpoints.put("GET /orders", "List all orders with pagination and filtering");
        endpoints.put("GET /orders/{number}", "Get specific order by order number");
        endpoints.put("POST /orders", "Create new order from external system");
        endpoints.put("PUT /orders/{number}/status", "Update order status");
        endpoints.put("GET /customers", "List all customers with pagination and search");
        
        schema.put("endpoints", endpoints);
        
        Map<String, Object> authentication = new HashMap<>();
        authentication.put("type", "API Key");
        authentication.put("header", "X-API-Key");
        authentication.put("description", "Contact administrator for API key");
        
        schema.put("authentication", authentication);
        
        return ResponseEntity.ok(schema);
    }
    
    // Helper methods for data conversion
    
    private Map<String, Object> convertEnquiryToExternalFormat(EmailEnquiry enquiry) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", enquiry.getId());
        data.put("enquiryId", enquiry.getEnquiryId());
        data.put("subject", enquiry.getSubject());
        data.put("status", enquiry.getStatus().toString());
        data.put("fromEmail", enquiry.getFromEmail());
        data.put("receivedAt", enquiry.getReceivedAt());
        data.put("createdAt", enquiry.getCreatedAt());
        data.put("aiProcessed", enquiry.isAiProcessed());
        
        // Customer info
        if (enquiry.getCustomer() != null) {
            data.put("customer", convertCustomerToExternalFormat(enquiry.getCustomer()));
        }
        
        // Items
        List<Map<String, Object>> items = enquiry.getEnquiryItems().stream()
            .map(this::convertEnquiryItemToExternalFormat)
            .collect(Collectors.toList());
        data.put("items", items);
        
        return data;
    }
    
    private Map<String, Object> convertQuoteToExternalFormat(Quote quote) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", quote.getId());
        data.put("quoteNumber", quote.getQuoteNumber());
        data.put("status", quote.getStatus().toString());
        data.put("totalAmount", quote.getTotalAmount());
        data.put("currency", quote.getCurrency());
        data.put("validityPeriod", quote.getValidityPeriod());
        data.put("createdAt", quote.getCreatedAt());
        
        // Customer info
        if (quote.getCustomer() != null) {
            data.put("customer", convertCustomerToExternalFormat(quote.getCustomer()));
        }
        
        // Items
        List<Map<String, Object>> items = quote.getQuoteItems().stream()
            .map(this::convertQuoteItemToExternalFormat)
            .collect(Collectors.toList());
        data.put("items", items);
        
        return data;
    }
    
    private Map<String, Object> convertOrderToExternalFormat(Order order) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", order.getId());
        data.put("orderNumber", order.getOrderNumber());
        data.put("orderStatus", order.getOrderStatus().toString());
        data.put("paymentStatus", order.getPaymentStatus().toString());
        data.put("totalAmount", order.getTotalAmount());
        data.put("currency", order.getCurrency());
        data.put("orderDate", order.getOrderDate());
        data.put("deliveryDate", order.getDeliveryDate());
        data.put("shippingAddress", order.getShippingAddress());
        data.put("specialInstructions", order.getSpecialInstructions());
        
        // Customer info
        if (order.getCustomer() != null) {
            data.put("customer", convertCustomerToExternalFormat(order.getCustomer()));
        }
        
        // Items
        List<Map<String, Object>> items = order.getOrderItems().stream()
            .map(this::convertOrderItemToExternalFormat)
            .collect(Collectors.toList());
        data.put("items", items);
        
        return data;
    }
    
    private Map<String, Object> convertCustomerToExternalFormat(Customer customer) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", customer.getId());
        data.put("email", customer.getEmail());
        data.put("contactPerson", customer.getContactPerson());
        data.put("companyName", customer.getCompanyName());
        data.put("phone", customer.getPhone());
        data.put("address", customer.getAddress());
        data.put("country", customer.getCountry());
        return data;
    }
    
    private Map<String, Object> convertEnquiryItemToExternalFormat(EnquiryItem item) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", item.getId());
        data.put("product", item.getProduct());
        data.put("trimType", item.getTrimType());
        data.put("rmSpec", item.getRmSpec());
        data.put("requestedQuantity", item.getRequestedQuantity());
        data.put("packagingType", item.getPackagingType());
        data.put("boxQuantity", item.getBoxQuantity());
        data.put("productDescription", item.getProductDescription());
        data.put("specialInstructions", item.getSpecialInstructions());
        return data;
    }
    
    private Map<String, Object> convertQuoteItemToExternalFormat(QuoteItem item) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", item.getId());
        data.put("itemDescription", item.getItemDescription());
        data.put("quantity", item.getQuantity());
        data.put("unitPrice", item.getUnitPrice());
        data.put("totalPrice", item.getTotalPrice());
        data.put("currency", item.getCurrency());
        data.put("notes", item.getNotes());
        return data;
    }
    
    private Map<String, Object> convertOrderItemToExternalFormat(OrderItem item) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", item.getId());
        data.put("itemDescription", item.getItemDescription());
        data.put("quantity", item.getQuantity());
        data.put("unitPrice", item.getUnitPrice());
        data.put("totalPrice", item.getTotalPrice());
        data.put("currency", item.getCurrency());
        data.put("productionNotes", item.getProductionNotes());
        return data;
    }
    
    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis();
    }
}
