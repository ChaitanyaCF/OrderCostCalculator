package com.procost.api.service;

import com.procost.api.dto.ZapierEmailWebhook;
import com.procost.api.model.*;
import com.procost.api.repository.CustomerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class EmailEnquiryService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailEnquiryService.class);
    
    @Autowired
    private HybridEmailProcessor hybridEmailProcessor;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    public EmailEnquiry processIncomingEmail(ZapierEmailWebhook webhook) {
        logger.info("Processing incoming email from: {}, Subject: {}", 
                   webhook.getFromEmail(), webhook.getSubject());
        
        try {
            // Classify the email type using hybrid AI (patterns + OpenAI fallback)
            String emailType = hybridEmailProcessor.classifyEmail(webhook.getSubject(), webhook.getEmailBody());
            logger.info("Email classified as: {}", emailType);
            
            // Create new email enquiry
            EmailEnquiry enquiry = new EmailEnquiry();
            enquiry.setEnquiryId(generateEnquiryId());
            enquiry.setFromEmail(webhook.getFromEmail());
            enquiry.setSubject(webhook.getSubject());
            enquiry.setEmailBody(webhook.getEmailBody());
            enquiry.setReceivedAt(webhook.getReceivedAt() != null ? 
                                  webhook.getReceivedAt() : LocalDateTime.now());
            
            // Extract customer information using hybrid AI (patterns + OpenAI fallback)
            Customer customer = hybridEmailProcessor.extractCustomerInfo(
                webhook.getFromEmail(), 
                webhook.getEmailBody(), 
                webhook.getSubject()
            );
            
            // Save customer if new
            if (customer.getId() == null) {
                customer = customerRepository.save(customer);
                logger.info("Created new customer: {} from {}", customer.getContactPerson(), customer.getCompanyName());
            }
            
            enquiry.setCustomer(customer);
            
            // Parse product requirements using hybrid AI (patterns + OpenAI fallback)
            List<EnquiryItem> enquiryItems = hybridEmailProcessor.parseProductRequirements(webhook.getEmailBody());
            
            if (enquiryItems.isEmpty()) {
                logger.warn("No products extracted from email, creating general enquiry");
            } else {
                logger.info("Extracted {} product items from email", enquiryItems.size());
            }
            
            // Add items to enquiry
            for (EnquiryItem item : enquiryItems) {
                enquiry.getEnquiryItems().add(item);
            }
            
            // Update status based on email classification and AI confidence
            if ("ORDER".equals(emailType)) {
                enquiry.setStatus(EnquiryStatus.PROCESSING);
            } else if ("QUOTE_RESPONSE".equals(emailType)) {
                enquiry.setStatus(EnquiryStatus.QUOTED);
            } else {
                enquiry.setStatus(EnquiryStatus.RECEIVED);
            }
            
            enquiry.setAiProcessed(true);
            enquiry.setProcessedAt(LocalDateTime.now());
            
            logger.info("Successfully processed AI-enhanced email enquiry: {} with {} items", 
                       enquiry.getEnquiryId(), enquiry.getEnquiryItems().size());
            
            return enquiry;
            
        } catch (Exception e) {
            logger.error("Error processing email enquiry", e);
            throw new RuntimeException("Failed to process email enquiry: " + e.getMessage(), e);
        }
    }
    
    private String generateEnquiryId() {
        String year = String.valueOf(LocalDate.now().getYear());
        String sequence = String.format("%04d", System.currentTimeMillis() % 10000);
        return "ENQ-" + year + "-" + sequence;
    }
} 