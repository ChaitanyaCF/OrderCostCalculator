package com.procost.api.service;

import com.procost.api.model.*;
import com.procost.api.repository.QuoteRepository;
import com.procost.api.repository.EmailEnquiryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class QuoteService {
    
    private static final Logger logger = LoggerFactory.getLogger(QuoteService.class);
    
    @Autowired
    private QuoteRepository quoteRepository;
    
    @Autowired
    private EmailEnquiryRepository emailEnquiryRepository;
    
    @Autowired
    private IntegrationService integrationService;
    
    public Quote generateQuoteForEnquiry(String enquiryId, List<Map<String, Object>> skuForms) {
        logger.info("Generating quote for enquiry: {}", enquiryId);
        
        try {
            // Find enquiry by enquiry ID string (e.g., "ENQ-1755684804406")
            EmailEnquiry emailEnquiry = emailEnquiryRepository.findByEnquiryId(enquiryId)
                .orElseThrow(() -> new RuntimeException("Enquiry not found with ID: " + enquiryId));
            
            // Create and populate quote
            Quote quote = new Quote();
            quote.setQuoteNumber(generateQuoteNumber());
            quote.setStatus(QuoteStatus.DRAFT);
            quote.setCreatedAt(LocalDateTime.now());
            quote.setValidityPeriod("30 days"); // 30 days validity
            quote.setCurrency("DKK"); // Default currency
            
            // Set relationships - both are required fields
            quote.setEmailEnquiry(emailEnquiry);
            quote.setCustomer(emailEnquiry.getCustomer());
            
            // Calculate total amount from SKU forms data
            double totalAmount = 0.0;
            if (skuForms != null && !skuForms.isEmpty()) {
                totalAmount = skuForms.stream()
                    .mapToDouble(skuForm -> {
                        Object totalCostObj = skuForm.get("totalCost");
                        if (totalCostObj instanceof Number) {
                            return ((Number) totalCostObj).doubleValue();
                        }
                        return 0.0;
                    })
                    .sum();
            } else {
                // Fallback to enquiry items if no SKU forms provided
                totalAmount = emailEnquiry.getEnquiryItems().stream()
                    .mapToDouble(item -> {
                        double quantity = item.getRequestedQuantity() != null ? item.getRequestedQuantity() : 0;
                        double rate = 5.0; // Default rate per kg (DKK)
                        return quantity * rate;
                    })
                    .sum();
            }
            
            quote.setTotalAmount(totalAmount);
            
            // Save the quote to database first
            Quote savedQuote = quoteRepository.save(quote);
            logger.info("Quote {} saved successfully with total amount: {} {}", 
                savedQuote.getQuoteNumber(), savedQuote.getTotalAmount(), savedQuote.getCurrency());
            
            // Create quote items from SKU forms data or fallback to enquiry items
            if (skuForms != null && !skuForms.isEmpty()) {
                // Use SKU forms data with calculated pricing
                List<EnquiryItem> enquiryItems = emailEnquiry.getEnquiryItems();
                
                for (int i = 0; i < skuForms.size() && i < enquiryItems.size(); i++) {
                    Map<String, Object> skuForm = skuForms.get(i);
                    EnquiryItem enquiryItem = enquiryItems.get(i);
                    
                    QuoteItem quoteItem = new QuoteItem();
                    quoteItem.setQuote(savedQuote);
                    quoteItem.setEnquiryItem(enquiryItem);
                    
                    // Use data from SKU form
                    String productDescription = (String) skuForm.get("productDescription");
                    quoteItem.setItemDescription(productDescription != null ? productDescription : enquiryItem.getProductDescription());
                    
                    // Get quantity from SKU form
                    Object quantityObj = skuForm.get("quantity");
                    Integer quantity = 0;
                    if (quantityObj instanceof Number) {
                        quantity = ((Number) quantityObj).intValue();
                    }
                    quoteItem.setQuantity(quantity);
                    
                    // Get total cost from SKU form
                    Object totalCostObj = skuForm.get("totalCost");
                    double totalCost = 0.0;
                    if (totalCostObj instanceof Number) {
                        totalCost = ((Number) totalCostObj).doubleValue();
                    }
                    
                    // Calculate unit price from total cost and quantity
                    double unitPrice = quantity > 0 ? totalCost / quantity : 0.0;
                    
                    quoteItem.setUnitPrice(unitPrice);
                    quoteItem.setTotalPrice(totalCost);
                    quoteItem.setCurrency("DKK");
                    
                    // Add product specifications as notes
                    StringBuilder notes = new StringBuilder();
                    String product = (String) skuForm.get("product");
                    String trimType = (String) skuForm.get("trimType");
                    String rmSpec = (String) skuForm.get("rmSpec");
                    String productType = (String) skuForm.get("productType");
                    String packagingType = (String) skuForm.get("packagingType");
                    
                    if (product != null) notes.append("Product: ").append(product).append("; ");
                    if (trimType != null) notes.append("Trim: ").append(trimType).append("; ");
                    if (rmSpec != null) notes.append("RM Spec: ").append(rmSpec).append("; ");
                    if (productType != null) notes.append("Type: ").append(productType).append("; ");
                    if (packagingType != null) notes.append("Packaging: ").append(packagingType).append("; ");
                    
                    if (enquiryItem.getSpecialInstructions() != null) {
                        notes.append("Instructions: ").append(enquiryItem.getSpecialInstructions());
                    }
                    
                    quoteItem.setNotes(notes.toString());
                    
                    // Add to quote's items list
                    savedQuote.getQuoteItems().add(quoteItem);
                }
            } else {
                // Fallback: Create quote items from enquiry items with default pricing
                for (EnquiryItem enquiryItem : emailEnquiry.getEnquiryItems()) {
                    QuoteItem quoteItem = new QuoteItem();
                    quoteItem.setQuote(savedQuote);
                    quoteItem.setEnquiryItem(enquiryItem);
                    quoteItem.setItemDescription(enquiryItem.getProductDescription());
                    quoteItem.setQuantity(enquiryItem.getRequestedQuantity());
                    
                    // Calculate pricing with default rate
                    double quantity = enquiryItem.getRequestedQuantity() != null ? enquiryItem.getRequestedQuantity() : 0;
                    double unitPrice = 5.0; // Default rate per kg (DKK)
                    double totalPrice = quantity * unitPrice;
                    
                    quoteItem.setUnitPrice(unitPrice);
                    quoteItem.setTotalPrice(totalPrice);
                    quoteItem.setCurrency("DKK");
                    
                    // Add notes if available
                    if (enquiryItem.getSpecialInstructions() != null) {
                        quoteItem.setNotes(enquiryItem.getSpecialInstructions());
                    }
                    
                    // Add to quote's items list
                    savedQuote.getQuoteItems().add(quoteItem);
                }
            }
            
            // Save the quote again to persist the quote items
            savedQuote = quoteRepository.save(savedQuote);
            logger.info("Created {} quote items for quote {}", 
                savedQuote.getQuoteItems().size(), savedQuote.getQuoteNumber());
            
            // Update enquiry status to QUOTED
            emailEnquiry.setStatus(EnquiryStatus.QUOTED);
            emailEnquiryRepository.save(emailEnquiry);
            logger.info("Updated enquiry {} status to QUOTED", enquiryId);
            
            // Trigger integration webhooks for quote creation
            try {
                integrationService.pushDataToIntegrations("QUOTE", savedQuote, savedQuote.getId());
                logger.info("Quote integration webhooks triggered successfully for quote: {}", savedQuote.getQuoteNumber());
            } catch (Exception e) {
                logger.warn("Failed to trigger integration webhooks for quote: {} - {}", savedQuote.getQuoteNumber(), e.getMessage());
                // Don't fail the quote creation if webhook fails
            }
            
            return savedQuote;
            
        } catch (NumberFormatException e) {
            logger.error("Invalid enquiry ID format: {}", enquiryId);
            throw new RuntimeException("Invalid enquiry ID format: " + enquiryId);
        } catch (Exception e) {
            logger.error("Error generating quote for enquiry {}: {}", enquiryId, e.getMessage());
            throw new RuntimeException("Failed to generate quote: " + e.getMessage());
        }
    }
    
    public Order convertQuoteToOrder(String quoteReference) {
        logger.info("Converting quote to order: {}", quoteReference);
        
        // TODO: Implement quote to order conversion
        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setStatus(OrderStatus.CONFIRMED);
        order.setTotalAmount(1000.0);
        order.setCurrency("USD");
        order.setCreatedAt(LocalDateTime.now());
        order.setConfirmedAt(LocalDateTime.now());
        
        return order;
    }
    
    private String generateQuoteNumber() {
        String year = String.valueOf(LocalDate.now().getYear());
        String sequence = String.format("%04d", System.currentTimeMillis() % 10000);
        return "QUO-" + year + "-" + sequence;
    }
    
    private String generateOrderNumber() {
        String year = String.valueOf(LocalDate.now().getYear());
        String sequence = String.format("%04d", System.currentTimeMillis() % 10000);
        return "ORD-" + year + "-" + sequence;
    }
} 