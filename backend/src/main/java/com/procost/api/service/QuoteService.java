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

@Service
public class QuoteService {
    
    private static final Logger logger = LoggerFactory.getLogger(QuoteService.class);
    
    @Autowired
    private QuoteRepository quoteRepository;
    
    @Autowired
    private EmailEnquiryRepository emailEnquiryRepository;
    
    public Quote generateQuoteForEnquiry(String enquiryId) {
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
            
            // Calculate total amount from enquiry items
            double totalAmount = emailEnquiry.getEnquiryItems().stream()
                .mapToDouble(item -> {
                    // Use a default rate if no specific calculation is available
                    double quantity = item.getRequestedQuantity() != null ? item.getRequestedQuantity() : 0;
                    double rate = 5.0; // Default rate per kg (DKK)
                    return quantity * rate;
                })
                .sum();
            
            quote.setTotalAmount(totalAmount);
            
            // Save the quote to database
            Quote savedQuote = quoteRepository.save(quote);
            logger.info("Quote {} saved successfully with total amount: {} {}", 
                savedQuote.getQuoteNumber(), savedQuote.getTotalAmount(), savedQuote.getCurrency());
            
            // Update enquiry status to QUOTED
            emailEnquiry.setStatus(EnquiryStatus.QUOTED);
            emailEnquiryRepository.save(emailEnquiry);
            logger.info("Updated enquiry {} status to QUOTED", enquiryId);
            
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