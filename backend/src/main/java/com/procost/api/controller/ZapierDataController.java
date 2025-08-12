package com.procost.api.controller;

import com.procost.api.model.*;
import com.procost.api.repository.CustomerRepository;
import com.procost.api.repository.EmailEnquiryRepository;
import com.procost.api.repository.EmailRepository;
import com.procost.api.service.EmailContentProcessor;
import com.procost.api.service.HybridEmailProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/zapier")
@CrossOrigin(originPatterns = "*", allowCredentials = "false")
public class ZapierDataController {
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private EmailEnquiryRepository emailEnquiryRepository;
    
    @Autowired
    private EmailRepository emailRepository;
    
    @Autowired
    private EmailContentProcessor emailContentProcessor;
    
    @Autowired
    private HybridEmailProcessor hybridEmailProcessor;
    
    /**
     * Enhanced email reception with thread tracking and database storage
     * Tracks the complete customer journey: Enquiry → Quote → Order
     */
    @PostMapping("/receive-email")
    public ResponseEntity<Map<String, Object>> receiveEmail(@RequestBody Map<String, Object> emailData) {
        String fromEmail = (String) emailData.get("fromEmail");
        String subject = (String) emailData.get("subject");
        String rawEmailBody = (String) emailData.get("emailBody");
        
        // Process email content (HTML to text if needed)
        String emailBody = emailContentProcessor.processEmailContent(rawEmailBody);
        String messageId = (String) emailData.get("messageId");
        String threadId = (String) emailData.get("threadId");
        String inReplyTo = (String) emailData.get("inReplyTo");
        String conversationId = (String) emailData.get("conversationId");
        String receivedAt = (String) emailData.get("receivedAt");
        
        // Generate or extract thread identifier
        String emailThreadId = generateEmailThreadId(messageId, threadId, conversationId, inReplyTo, subject);
        
        // Determine email type and stage
        EmailType emailType = classifyEmailType(subject, emailBody);
        EmailStage emailStage = determineEmailStage(subject, emailBody, emailType);
        
        // Extract any reference numbers from previous emails
        String quoteReference = extractQuoteReference(emailBody, subject);
        String orderReference = extractOrderReference(emailBody, subject);
        
        // Create or find customer using enhanced AI extraction
        Customer customer = hybridEmailProcessor.extractCustomerInfo(fromEmail, emailBody, subject);
        
        // Save customer if new
        if (customer.getId() == null) {
            customer = customerRepository.save(customer);
        }
        
        // Save all emails to the Email table for manual classification
        Email email = new Email(fromEmail, subject, emailBody);
        email.setClassification(mapEmailStageToClassification(emailStage));
        email.setReceivedAt(parseReceivedAt(receivedAt));
        email = emailRepository.save(email);
        
        // Create EmailEnquiry if this is a new enquiry
        EmailEnquiry enquiry = null;
        if (emailStage == EmailStage.INITIAL_ENQUIRY) {
            enquiry = createEmailEnquiry(customer, subject, emailBody, emailThreadId, receivedAt,
                                             messageId, threadId, conversationId, inReplyTo);
            if (enquiry != null) {
                email.setEnquiryId(enquiry.getEnquiryId());
                email.setProcessed(true);
                emailRepository.save(email);
            }
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Email received, processed and stored");
        response.put("timestamp", System.currentTimeMillis());
        
        // Email details
        response.put("fromEmail", fromEmail);
        response.put("subject", subject);
        response.put("emailType", emailType.toString());
        response.put("emailStage", emailStage.toString());
        
        // Thread tracking
        response.put("emailThreadId", emailThreadId);
        response.put("messageId", messageId);
        response.put("threadId", threadId);
        response.put("conversationId", conversationId);
        
        // References
        response.put("quoteReference", quoteReference);
        response.put("orderReference", orderReference);
        
        // Database entities
        response.put("customerId", customer.getId());
        response.put("customerName", customer.getContactPerson());
        response.put("companyName", customer.getCompanyName());
        
        if (enquiry != null) {
            response.put("enquiryId", enquiry.getEnquiryId());
            response.put("enquiryStatus", enquiry.getStatus().toString());
            response.put("itemsCount", enquiry.getEnquiryItems().size());
        }
        
        // Next suggested action
        response.put("suggestedAction", getSuggestedAction(emailStage, emailType));
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Generate a unique thread identifier for email tracking
     */
    private String generateEmailThreadId(String messageId, String threadId, String conversationId, 
                                       String inReplyTo, String subject) {
        // Priority order: threadId > conversationId > inReplyTo > messageId > subject hash
        if (threadId != null && !threadId.isEmpty()) {
            return "THREAD_" + threadId;
        }
        if (conversationId != null && !conversationId.isEmpty()) {
            return "CONV_" + conversationId;
        }
        if (inReplyTo != null && !inReplyTo.isEmpty()) {
            return "REPLY_" + inReplyTo.hashCode();
        }
        if (messageId != null && !messageId.isEmpty()) {
            return "MSG_" + messageId.hashCode();
        }
        // Fallback: use subject hash
        return "SUBJ_" + Math.abs(subject.hashCode());
    }
    
    /**
     * Classify the type of email
     */
    private EmailType classifyEmailType(String subject, String emailBody) {
        String text = (subject + " " + emailBody).toLowerCase();
        
        if (text.contains("quote") && (text.contains("accept") || text.contains("approve") || text.contains("confirmed"))) {
            return EmailType.QUOTE_ACCEPTANCE;
        }
        if (text.contains("quote") && (text.contains("reject") || text.contains("decline"))) {
            return EmailType.QUOTE_REJECTION;
        }
        if (text.contains("order") && (text.contains("confirm") || text.contains("place"))) {
            return EmailType.ORDER_CONFIRMATION;
        }
        if (text.contains("inquiry") || text.contains("enquiry") || text.contains("quote request")) {
            return EmailType.ENQUIRY;
        }
        if (text.contains("need") || text.contains("require") || text.contains("looking for")) {
            return EmailType.ENQUIRY;
        }
        
        return EmailType.GENERAL;
    }
    
    /**
     * Determine the stage in the customer journey
     */
    private EmailStage determineEmailStage(String subject, String emailBody, EmailType emailType) {
        switch (emailType) {
            case ENQUIRY:
                return EmailStage.INITIAL_ENQUIRY;
            case QUOTE_ACCEPTANCE:
                return EmailStage.ORDER_PLACEMENT;
            case QUOTE_REJECTION:
                return EmailStage.ENQUIRY_CLOSED;
            case ORDER_CONFIRMATION:
                return EmailStage.ORDER_CONFIRMED;
            default:
                return EmailStage.FOLLOW_UP;
        }
    }
    
    /**
     * Extract quote reference from email content
     */
    private String extractQuoteReference(String emailBody, String subject) {
        Pattern quotePattern = Pattern.compile("(?:quote|ref|reference)\\s*[#:]?\\s*([QR]\\d+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = quotePattern.matcher(emailBody + " " + subject);
        return matcher.find() ? matcher.group(1) : null;
    }
    
    /**
     * Extract order reference from email content
     */
    private String extractOrderReference(String emailBody, String subject) {
        Pattern orderPattern = Pattern.compile("(?:order|po|purchase)\\s*[#:]?\\s*([OR]\\d+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = orderPattern.matcher(emailBody + " " + subject);
        return matcher.find() ? matcher.group(1) : null;
    }
    
    /**
     * Find existing customer or create new one
     */
    private Customer findOrCreateCustomer(String fromEmail, String emailBody) {
        // Try to find existing customer by email
        Optional<Customer> existingCustomer = customerRepository.findByEmail(fromEmail);
        if (existingCustomer.isPresent()) {
            return existingCustomer.get();
        }
        
        // Create new customer
        Customer newCustomer = new Customer();
        newCustomer.setEmail(fromEmail);
        
        // Extract company name from email domain
        String domain = fromEmail.contains("@") ? 
            fromEmail.substring(fromEmail.indexOf("@") + 1) : "unknown.com";
        String companyName = domain.contains(".") ? 
            domain.substring(0, domain.indexOf(".")) : domain;
        companyName = companyName.substring(0, 1).toUpperCase() + 
                     companyName.substring(1).toLowerCase();
        newCustomer.setCompanyName(companyName + " Corp");
        
        // Extract contact person name
        String contactPerson = extractContactPersonFromBody(emailBody);
        if (contactPerson == null) {
            contactPerson = fromEmail.contains("@") ? 
                fromEmail.substring(0, fromEmail.indexOf("@")) : "Unknown";
        }
        newCustomer.setContactPerson(contactPerson);
        
        // Set default values - only if the method exists
        newCustomer.setAddress("Not provided");
        
        return customerRepository.save(newCustomer);
    }
    
    /**
     * Create EmailEnquiry from Zapier webhook
     */
    private EmailEnquiry createEmailEnquiry(Customer customer, String subject, String emailBody, 
                                          String emailThreadId, String receivedAt,
                                          String messageId, String threadId, String conversationId, String inReplyTo) {
        EmailEnquiry enquiry = new EmailEnquiry();
        enquiry.setCustomer(customer);
        enquiry.setFromEmail(customer.getEmail());
        enquiry.setSubject(subject);
        enquiry.setEmailBody(emailBody);
        enquiry.setOriginalEmailId(emailThreadId); // Use originalEmailId for thread tracking
        
        // Set individual email metadata fields
        enquiry.setMessageId(messageId);
        enquiry.setThreadId(threadId);
        enquiry.setConversationId(conversationId);
        enquiry.setInReplyTo(inReplyTo);
        
        enquiry.setStatus(EnquiryStatus.RECEIVED);
        
        // Generate unique enquiry ID
        String enquiryId = "ENQ-" + System.currentTimeMillis();
        enquiry.setEnquiryId(enquiryId);
        
        // Parse received time or use current time
        if (receivedAt != null && !receivedAt.isEmpty()) {
            try {
                enquiry.setReceivedAt(LocalDateTime.parse(receivedAt.replace("Z", ""), 
                    DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            } catch (Exception e) {
                enquiry.setReceivedAt(LocalDateTime.now());
            }
        } else {
            enquiry.setReceivedAt(LocalDateTime.now());
        }
        
        // Set processing metadata
        enquiry.setAiProcessed(true);
        enquiry.setProcessedAt(LocalDateTime.now());
        enquiry.setProcessingNotes("AI-only processing via OpenAI from Outlook webhook");
        
        // Extract product requirements using enhanced AI system
        List<EnquiryItem> items = hybridEmailProcessor.parseProductRequirements(emailBody);
        enquiry.setEnquiryItems(items);
        
        // Set enquiry to items
        for (EnquiryItem item : items) {
            item.setEmailEnquiry(enquiry);
        }
        
        return emailEnquiryRepository.save(enquiry);
    }
    
    /**
     * Extract enquiry items from email content - ENHANCED for quote generation
     */
    private List<EnquiryItem> extractEnquiryItems(String emailBody, String subject) {
        List<EnquiryItem> items = new ArrayList<>();
        
        // Extract quantity and product type
        String text = emailBody + " " + subject;
        String lowerText = text.toLowerCase();
        
        // Extract quantity (look for numbers followed by kg, tons, etc.)
        Pattern quantityPattern = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(kg|kgs|tons?|tonnes?|lbs?|pounds?)", Pattern.CASE_INSENSITIVE);
        Matcher quantityMatcher = quantityPattern.matcher(text);
        
        Integer quantity = 1;
        String unit = "kg";
        if (quantityMatcher.find()) {
            double qty = Double.parseDouble(quantityMatcher.group(1));
            unit = quantityMatcher.group(2).toLowerCase();
            
            // Convert to kg if needed
            if (unit.contains("ton")) {
                qty = qty * 1000; // tons to kg
            } else if (unit.contains("lb") || unit.contains("pound")) {
                qty = qty * 0.453592; // pounds to kg
            }
            
            quantity = (int) Math.round(qty);
        }
        
        // Extract main product type (aligned with database enum)
        String product = extractProductType(lowerText);
        String trimType = extractTrimType(lowerText);
        String rmSpec = extractRmSpec(lowerText);
        String productType = extractProductionType(lowerText);
        String packagingType = extractPackagingType(lowerText);
        String transportMode = extractTransportMode(lowerText);
        
        // Create enquiry item using ALL required fields for quote generation
        EnquiryItem item = new EnquiryItem();
        
        // Core product info
        item.setProduct(product);  // SALMON, COD, HADDOCK, etc.
        item.setTrimType(trimType);  // FILLET, WHOLE, STEAK, etc.
        item.setRmSpec(rmSpec);  // Raw material specification
        item.setProductType(productType);  // Production type for packaging rates
        item.setPackagingType(packagingType);  // Packaging method
        item.setTransportMode(transportMode);  // Transport requirements
        
        // Quantity and descriptions
        item.setRequestedQuantity(quantity);
        item.setProductDescription(buildProductDescription(product, trimType, quantity, unit, rmSpec));
        item.setSpecialInstructions(extractSpecialRequirements(text));
        
        // Customer reference if mentioned
        item.setCustomerSkuReference(extractCustomerSku(text));
        
        // Delivery requirements
        item.setDeliveryRequirement(lowerText.contains("urgent") || lowerText.contains("asap") ? "URGENT" : "STANDARD");
        
        // AI processing metadata
        item.setAiMapped(true);
        item.setMappingConfidence(calculateMappingConfidence(product, trimType, rmSpec, quantity));
        item.setAiProcessingNotes("Enhanced extraction via Zapier webhook - ready for quote generation");
        item.setProcessedAt(LocalDateTime.now());
        
        items.add(item);
        return items;
    }
    
    /**
     * Extract product type aligned with database enums - NO HARDCODED DEFAULTS
     */
    private String extractProductType(String text) {
        // Priority order based on specificity
        if (text.contains("atlantic salmon") || text.contains("norwegian salmon")) return "SALMON";
        if (text.contains("salmon")) return "SALMON";
        if (text.contains("atlantic cod") || text.contains("pacific cod")) return "COD";
        if (text.contains("cod")) return "COD";
        if (text.contains("haddock")) return "HADDOCK";
        if (text.contains("pollock") || text.contains("alaska pollock")) return "POLLOCK";
        if (text.contains("mackerel")) return "MACKEREL";
        if (text.contains("herring")) return "HERRING";
        
        // Generic seafood terms - but don't assume COD
        if (text.contains("whitefish") || text.contains("white fish")) return "WHITEFISH";
        if (text.contains("fish") || text.contains("seafood")) return "UNKNOWN"; // Don't assume COD
        
        return "UNKNOWN"; // Don't default to any specific fish
    }
    
    /**
     * Extract trim type for rate calculation
     */
    private String extractTrimType(String text) {
        if (text.contains("fillet") || text.contains("filet")) return "FILLET";
        if (text.contains("whole fish") || text.contains("whole")) return "WHOLE";
        if (text.contains("steak")) return "STEAK";
        if (text.contains("loin")) return "LOIN";
        if (text.contains("tail")) return "TAIL";
        
        return "FILLET"; // Most common default
    }
    
    /**
     * Extract raw material specification
     */
    private String extractRmSpec(String text) {
        if (text.contains("fresh")) return "FRESH";
        if (text.contains("frozen")) return "FROZEN";
        if (text.contains("iqf") || text.contains("individually quick frozen")) return "IQF";
        if (text.contains("block frozen")) return "BLOCK_FROZEN";
        
        return "FRESH"; // Default
    }
    
    /**
     * Extract production type for packaging rates
     */
    private String extractProductionType(String text) {
        if (text.contains("premium") || text.contains("grade a")) return "PREMIUM";
        if (text.contains("standard") || text.contains("grade b")) return "STANDARD";
        if (text.contains("economy") || text.contains("grade c")) return "ECONOMY";
        if (text.contains("organic")) return "ORGANIC";
        
        return "STANDARD"; // Default
    }
    
    /**
     * Extract packaging type
     */
    private String extractPackagingType(String text) {
        if (text.contains("vacuum pack") || text.contains("vacuum sealed")) return "VACUUM";
        if (text.contains("ice pack") || text.contains("on ice")) return "ICE_PACK";
        if (text.contains("bulk")) return "BULK";
        if (text.contains("retail pack") || text.contains("consumer pack")) return "RETAIL";
        if (text.contains("box") || text.contains("carton")) return "BOX";
        
        return "BOX"; // Default
    }
    
    /**
     * Extract transport mode
     */
    private String extractTransportMode(String text) {
        if (text.contains("air freight") || text.contains("by air")) return "AIR";
        if (text.contains("sea freight") || text.contains("by sea")) return "SEA";
        if (text.contains("road transport") || text.contains("by truck")) return "ROAD";
        if (text.contains("express") || text.contains("expedited")) return "EXPRESS";
        
        return "ROAD"; // Default
    }
    
    /**
     * Build comprehensive product description
     */
    private String buildProductDescription(String product, String trimType, Integer quantity, String unit, String rmSpec) {
        return String.format("%s %s (%s) - %d %s", 
            product, trimType, rmSpec, quantity, unit);
    }
    
    /**
     * Extract customer SKU/reference
     */
    private String extractCustomerSku(String text) {
        // Look for patterns like SKU123, REF-456, Item #789
        Pattern skuPattern = Pattern.compile("(?:sku|ref|item|code)[\\s#:-]*([a-z0-9-]+)", Pattern.CASE_INSENSITIVE);
        Matcher skuMatcher = skuPattern.matcher(text);
        
        if (skuMatcher.find()) {
            return skuMatcher.group(1).toUpperCase();
        }
        
        return null;
    }
    
    /**
     * Calculate mapping confidence based on extracted fields
     */
    private String calculateMappingConfidence(String product, String trimType, String rmSpec, Integer quantity) {
        int score = 0;
        
        // Product identified and specific (not unknown/default)
        if (!product.equals("UNKNOWN") && !product.equals("COD")) score += 30;
        if (product.equals("SALMON") || product.equals("HADDOCK") || product.equals("POLLOCK")) score += 40;
        
        // Trim type identified and specific
        if (!trimType.equals("FILLET") && !trimType.equals("UNKNOWN")) score += 25;
        
        // RM Spec identified and specific
        if (!rmSpec.equals("FRESH") && !rmSpec.equals("UNKNOWN")) score += 20;
        
        // Quantity is reasonable and specific
        if (quantity > 1 && quantity < 100000) score += 25;
        
        // Penalty for unknown values
        if (product.equals("UNKNOWN")) score -= 30;
        if (trimType.equals("UNKNOWN")) score -= 20;
        if (rmSpec.equals("UNKNOWN")) score -= 15;
        
        if (score >= 80) return "HIGH";
        if (score >= 50) return "MEDIUM";
        return "LOW";
    }
    
    /**
     * Extract special requirements from email
     */
    private String extractSpecialRequirements(String text) {
        if (text.toLowerCase().contains("fresh")) return "Fresh";
        if (text.toLowerCase().contains("frozen")) return "Frozen";
        if (text.toLowerCase().contains("organic")) return "Organic";
        return "Standard";
    }
    
    /**
     * Extract contact person name from email body
     */
    private String extractContactPersonFromBody(String emailBody) {
        Pattern namePattern = Pattern.compile("(Thanks,|Regards,|Best,|From,)\\s*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)", Pattern.CASE_INSENSITIVE);
        Matcher nameMatcher = namePattern.matcher(emailBody);
        
        if (nameMatcher.find()) {
            return nameMatcher.group(2).trim();
        }
        return null;
    }
    
    /**
     * Suggest next action based on email stage and type
     */
    private String getSuggestedAction(EmailStage stage, EmailType type) {
        switch (stage) {
            case INITIAL_ENQUIRY:
                return "EXTRACT_INFO_AND_GENERATE_QUOTE";
            case ORDER_PLACEMENT:
                return "CONVERT_QUOTE_TO_ORDER";
            case ORDER_CONFIRMED:
                return "PROCESS_ORDER";
            case ENQUIRY_CLOSED:
                return "ARCHIVE_THREAD";
            default:
                return "REVIEW_MANUALLY";
        }
    }
    
    /**
     * Test endpoint to verify controller is working
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> test() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Enhanced Zapier Data Controller with Thread Tracking!");
        response.put("timestamp", System.currentTimeMillis());
        response.put("features", new String[]{"Thread Tracking", "Email Classification", "Journey Mapping"});
        return ResponseEntity.ok(response);
    }
    
    /**
     * Super simple test without any parameters
     */
    @GetMapping("/simple")
    public String simpleTest() {
        return "Working with Thread Tracking!";
    }
    
    /**
     * Map EmailStage to Email.EmailClassification
     */
    private Email.EmailClassification mapEmailStageToClassification(EmailStage emailStage) {
        switch (emailStage) {
            case INITIAL_ENQUIRY:
                return Email.EmailClassification.INITIAL_ENQUIRY;
            case FOLLOW_UP:
                return Email.EmailClassification.FOLLOW_UP;
            case ORDER_PLACEMENT:
            case ORDER_CONFIRMED:
                return Email.EmailClassification.ORDER;
            default:
                return Email.EmailClassification.GENERAL;
        }
    }
    
    /**
     * Parse received date string to LocalDateTime
     */
    private LocalDateTime parseReceivedAt(String receivedAt) {
        try {
            if (receivedAt != null && !receivedAt.isEmpty()) {
                // Try parsing ISO format first
                return LocalDateTime.parse(receivedAt, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            }
        } catch (Exception e) {
            // If parsing fails, use current time
        }
        return LocalDateTime.now();
    }
    
    // Enums for classification
    enum EmailType {
        ENQUIRY, QUOTE_ACCEPTANCE, QUOTE_REJECTION, ORDER_CONFIRMATION, GENERAL
    }
    
    enum EmailStage {
        INITIAL_ENQUIRY, QUOTE_SENT, ORDER_PLACEMENT, ORDER_CONFIRMED, ENQUIRY_CLOSED, FOLLOW_UP
    }
} 