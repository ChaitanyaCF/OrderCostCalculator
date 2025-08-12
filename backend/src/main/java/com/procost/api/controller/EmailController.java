package com.procost.api.controller;

import com.procost.api.model.Email;
import com.procost.api.model.Email.EmailClassification;
import com.procost.api.model.EmailEnquiry;
import com.procost.api.model.Customer;
import com.procost.api.model.EnquiryItem;
import com.procost.api.repository.EmailRepository;
import com.procost.api.service.HybridEmailProcessor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/emails")
@CrossOrigin(originPatterns = "*", allowCredentials = "false")
public class EmailController {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailController.class);
    
    @Autowired
    private EmailRepository emailRepository;
    
    @Autowired
    private HybridEmailProcessor hybridEmailProcessor;
    
    /**
     * Get all emails with their classification status
     */
    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllEmails() {
        try {
            List<Email> emails = emailRepository.findAllByOrderByReceivedAtDesc();
            
            List<Map<String, Object>> emailDtos = emails.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(emailDtos);
            
        } catch (Exception e) {
            logger.error("Error fetching all emails: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Get emails that need manual classification
     */
    @GetMapping("/needing-classification")
    public ResponseEntity<List<Map<String, Object>>> getEmailsNeedingClassification() {
        try {
            List<Email> emails = emailRepository.findEmailsNeedingClassification();
            
            List<Map<String, Object>> emailDtos = emails.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(emailDtos);
            
        } catch (Exception e) {
            logger.error("Error fetching emails needing classification: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Manually classify an email as Enquiry or Order
     */
    @PostMapping("/{emailId}/classify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> classifyEmail(
            @PathVariable Long emailId,
            @RequestBody Map<String, String> request) {
        
        try {
            String classificationType = request.get("classification");
            if (classificationType == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Classification type is required"));
            }
            
            Email email = emailRepository.findById(emailId).orElse(null);
            if (email == null) {
                return ResponseEntity.notFound().build();
            }
            
            EmailClassification classification;
            try {
                classification = EmailClassification.valueOf(classificationType.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid classification type. Must be one of: INITIAL_ENQUIRY, FOLLOW_UP, ORDER, GENERAL"));
            }
            
            // Set manual classification
            email.setManualClassification(classification);
            emailRepository.save(email);
            
            // If classified as INITIAL_ENQUIRY, process it as an enquiry
            if (classification == EmailClassification.INITIAL_ENQUIRY) {
                processAsEnquiry(email);
            }
            // TODO: Add order processing when order system is built
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Email classified successfully");
            response.put("email", convertToDto(email));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error classifying email {}: {}", emailId, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to classify email"));
        }
    }
    
    /**
     * Get classification statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getEmailStats() {
        try {
            long total = emailRepository.count();
            long needingClassification = emailRepository.countEmailsNeedingClassification();
            long enquiries = emailRepository.findByEffectiveClassification(EmailClassification.INITIAL_ENQUIRY).size();
            long orders = emailRepository.findByEffectiveClassification(EmailClassification.ORDER).size();
            long general = emailRepository.findByEffectiveClassification(EmailClassification.GENERAL).size();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalEmails", total);
            stats.put("needingClassification", needingClassification);
            stats.put("enquiries", enquiries);
            stats.put("orders", orders);
            stats.put("general", general);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            logger.error("Error fetching email stats: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Process email as enquiry (create EmailEnquiry record)
     */
    private void processAsEnquiry(Email email) {
        try {
            // Check if already processed as enquiry
            if (email.getEnquiryId() != null) {
                logger.info("Email {} already processed as enquiry {}", email.getId(), email.getEnquiryId());
                return;
            }
            
            // Extract customer info and parse products
            Customer customer = hybridEmailProcessor.extractCustomerInfo(
                email.getFromEmail(), email.getEmailBody(), email.getSubject());
            List<EnquiryItem> items = hybridEmailProcessor.parseProductRequirements(email.getEmailBody());
            
            if (!items.isEmpty()) {
                // Create EmailEnquiry (simplified version)
                EmailEnquiry enquiry = new EmailEnquiry();
                enquiry.setFromEmail(email.getFromEmail());
                enquiry.setSubject(email.getSubject());
                enquiry.setEmailBody(email.getEmailBody());
                enquiry.setCustomer(customer);
                enquiry.setEnquiryItems(items);
                
                // Save would require EmailEnquiryRepository - just set the processed status for now
                email.setProcessed(true);
                emailRepository.save(email);
                
                logger.info("Successfully marked email {} as processed enquiry", email.getId());
            }
            
        } catch (Exception e) {
            logger.error("Error processing email {} as enquiry: {}", email.getId(), e.getMessage(), e);
        }
    }
    
    /**
     * Convert Email entity to DTO
     */
    private Map<String, Object> convertToDto(Email email) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", email.getId());
        dto.put("fromEmail", email.getFromEmail());
        dto.put("subject", email.getSubject());
        dto.put("emailBody", email.getEmailBody());
        dto.put("receivedAt", email.getReceivedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        dto.put("classification", email.getClassification() != null ? email.getClassification().toString() : null);
        dto.put("manualClassification", email.getManualClassification() != null ? email.getManualClassification().toString() : null);
        dto.put("effectiveClassification", email.getEffectiveClassification() != null ? email.getEffectiveClassification().toString() : "UNCLASSIFIED");
        dto.put("processed", email.getProcessed());
        dto.put("enquiryId", email.getEnquiryId());
        dto.put("orderId", email.getOrderId());
        dto.put("isManuallyClassified", email.isManuallyClassified());
        dto.put("createdAt", email.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        dto.put("updatedAt", email.getUpdatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        
        return dto;
    }
}