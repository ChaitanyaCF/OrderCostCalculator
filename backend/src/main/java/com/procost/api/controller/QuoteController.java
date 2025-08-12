package com.procost.api.controller;

import com.procost.api.model.Quote;
import com.procost.api.model.QuoteStatus;
import com.procost.api.repository.QuoteRepository;
import com.procost.api.service.QuoteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quotes")
@CrossOrigin(originPatterns = "*", allowCredentials = "false")
public class QuoteController {
    
    private static final Logger logger = LoggerFactory.getLogger(QuoteController.class);
    
    @Autowired
    private QuoteService quoteService;
    
    @Autowired
    private QuoteRepository quoteRepository;
    
    /**
     * Generate a quote with custom SKU forms data
     */
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateQuote(@RequestBody Map<String, Object> requestData) {
        logger.info("Generating quote with custom SKU forms data");
        
        try {
            String enquiryId = (String) requestData.get("enquiryId");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> skuForms = (List<Map<String, Object>>) requestData.get("skuForms");
            
            Quote quote = quoteService.generateQuoteFromSkuForms(enquiryId, skuForms);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            // Create simplified quote data to avoid circular references
            Map<String, Object> quoteData = new HashMap<>();
            quoteData.put("id", quote.getId());
            quoteData.put("quoteNumber", quote.getQuoteNumber());
            quoteData.put("status", quote.getStatus());
            quoteData.put("totalAmount", quote.getTotalAmount());
            quoteData.put("currency", quote.getCurrency());
            quoteData.put("validityPeriod", quote.getValidityPeriod());
            quoteData.put("createdAt", quote.getCreatedAt());
            quoteData.put("itemsCount", quote.getQuoteItems().size());
            response.put("quote", quoteData);
            response.put("message", "Quote generated successfully");
            response.put("quoteNumber", quote.getQuoteNumber());
            response.put("totalAmount", quote.getTotalAmount());
            response.put("itemsCount", quote.getQuoteItems().size());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to generate quote: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Generate a quote from an enquiry
     */
    @PostMapping("/generate-from-enquiry/{enquiryId}")
    public ResponseEntity<Map<String, Object>> generateQuoteFromEnquiry(@PathVariable String enquiryId) {
        logger.info("Generating quote for enquiry: {}", enquiryId);
        
        try {
            Quote quote = quoteService.generateQuoteForEnquiry(enquiryId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("quote", quote);
            response.put("message", "Quote generated successfully");
            response.put("quoteNumber", quote.getQuoteNumber());
            response.put("totalAmount", quote.getTotalAmount());
            response.put("itemsCount", quote.getQuoteItems().size());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to generate quote for enquiry {}: {}", enquiryId, e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get all quotes
     */
    @GetMapping
    public ResponseEntity<List<Quote>> getAllQuotes() {
        logger.info("Fetching all quotes");
        List<Quote> quotes = quoteRepository.findAll();
        return ResponseEntity.ok(quotes);
    }
    
    /**
     * Get quote by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Quote> getQuoteById(@PathVariable Long id) {
        logger.info("Fetching quote with ID: {}", id);
        return quoteRepository.findById(id)
                .map(quote -> ResponseEntity.ok(quote))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Send quote to customer
     */
    @PutMapping("/{id}/send")
    public ResponseEntity<Map<String, Object>> sendQuote(@PathVariable Long id) {
        logger.info("Sending quote with ID: {}", id);
        
        try {
            Quote quote = quoteRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Quote not found with ID: " + id));
            
            quote.setStatus(QuoteStatus.SENT);
            quote.setSentAt(LocalDateTime.now());
            quoteRepository.save(quote);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Quote sent successfully");
            response.put("quoteNumber", quote.getQuoteNumber());
            response.put("sentAt", quote.getSentAt());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to send quote {}: {}", id, e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Accept quote
     */
    @PutMapping("/{id}/accept")
    public ResponseEntity<Map<String, Object>> acceptQuote(@PathVariable Long id) {
        logger.info("Accepting quote with ID: {}", id);
        
        try {
            Quote quote = quoteRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Quote not found with ID: " + id));
            
            quote.setStatus(QuoteStatus.ACCEPTED);
            quote.setAcceptedAt(LocalDateTime.now());
            quoteRepository.save(quote);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Quote accepted successfully");
            response.put("quoteNumber", quote.getQuoteNumber());
            response.put("acceptedAt", quote.getAcceptedAt());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to accept quote {}: {}", id, e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Reject quote
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectQuote(@PathVariable Long id) {
        logger.info("Rejecting quote with ID: {}", id);
        
        try {
            Quote quote = quoteRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Quote not found with ID: " + id));
            
            quote.setStatus(QuoteStatus.REJECTED);
            quoteRepository.save(quote);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Quote rejected");
            response.put("quoteNumber", quote.getQuoteNumber());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to reject quote {}: {}", id, e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
} 