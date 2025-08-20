package com.procost.api.controller;

import com.procost.api.model.*;
import com.procost.api.repository.CustomerRepository;
import com.procost.api.repository.EmailEnquiryRepository;
import com.procost.api.repository.EmailRepository;
import com.procost.api.service.EmailContentProcessor;
import com.procost.api.service.HybridEmailProcessor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.Arrays;

@RestController
@RequestMapping("/api/zapier")
@CrossOrigin(originPatterns = "*", allowCredentials = "false")
public class ZapierDataController {
    
    private static final Logger logger = LoggerFactory.getLogger(ZapierDataController.class);
    
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
        logger.info("🔥 ===== ZAPIER EMAIL RECEIVED =====");
        logger.info("📧 Raw email data keys: {}", emailData.keySet());
        
        String fromEmail = (String) emailData.get("fromEmail");
        String subject = (String) emailData.get("subject");
        String rawEmailBody = (String) emailData.get("emailBody");
        String toEmails = (String) emailData.get("toEmail");
        
        logger.info("📨 FROM: {}", fromEmail);
        logger.info("📝 SUBJECT: {}", subject);
        logger.info("📄 BODY LENGTH: {} chars", rawEmailBody != null ? rawEmailBody.length() : 0);
        
        // Handle multiple recipients
        if (toEmails != null) {
            String[] recipients = parseMultipleRecipients(toEmails);
            logger.info("📧 TO: {} recipient(s)", recipients.length);
            for (int i = 0; i < recipients.length; i++) {
                logger.info("   [{}] {}", i + 1, recipients[i]);
            }
            if (hasMultipleRecipients(toEmails)) {
                logger.info("🔄 Multiple recipients detected - processing as single enquiry with primary recipient: {}", getPrimaryRecipient(toEmails));
            }
        }
        
        // Process email content (HTML to text if needed)
        String emailBody = emailContentProcessor.processEmailContent(rawEmailBody);
        String messageId = (String) emailData.get("messageId");
        String threadId = (String) emailData.get("threadId");
        String inReplyTo = (String) emailData.get("inReplyTo");
        String conversationId = (String) emailData.get("conversationId");
        String receivedAt = (String) emailData.get("receivedAt");
        
        logger.info("🔗 THREADING INFO:");
        logger.info("   messageId: {}", messageId);
        logger.info("   threadId: {}", threadId);
        logger.info("   conversationId: {}", conversationId);
        logger.info("   inReplyTo: {}", inReplyTo);
        logger.info("   receivedAt: {}", receivedAt);
        
        // Generate or extract thread identifier
        String emailThreadId = generateEmailThreadId(messageId, threadId, conversationId, inReplyTo, subject);
        logger.info("🎯 GENERATED THREAD ID: {}", emailThreadId);
        
        // Determine email type and stage
        EmailType emailType = classifyEmailType(subject, emailBody);
        EmailStage emailStage = determineEmailStage(subject, emailBody, emailType);
        
        logger.info("🤖 AI CLASSIFICATION:");
        logger.info("   emailType: {}", emailType);
        logger.info("   emailStage: {}", emailStage);
        
        // Extract any reference numbers from previous emails
        String quoteReference = extractQuoteReference(emailBody, subject);
        String orderReference = extractOrderReference(emailBody, subject);
        
        logger.info("🔍 REFERENCE EXTRACTION:");
        logger.info("   quoteReference: {}", quoteReference);
        logger.info("   orderReference: {}", orderReference);
        
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
        
        // Handle conversation progression using existing thread infrastructure
        EmailEnquiry enquiry = null;
        
        logger.info("🔍 CONVERSATION PROGRESSION CHECK:");
        logger.info("   Looking for existing enquiries with threadId: {}", emailThreadId);
        
        // First, check if this is part of an existing conversation using conversationId
        List<EmailEnquiry> existingEnquiries = emailEnquiryRepository
            .findByOriginalEmailIdOrderByReceivedAtDesc(emailThreadId);
        
        logger.info("   Found {} existing enquiries for this thread", existingEnquiries.size());
        
        if (!existingEnquiries.isEmpty()) {
            // This is a continuation of an existing conversation
            enquiry = existingEnquiries.get(0); // Get the most recent enquiry in this thread
            logger.info("✅ EXISTING CONVERSATION FOUND:");
            logger.info("   EnquiryId: {}", enquiry.getEnquiryId());
            logger.info("   Current Status: {}", enquiry.getStatus());
            logger.info("   Previous emails in thread: {}", existingEnquiries.size());
            
            // Update the enquiry based on the email stage
            logger.info("🔄 UPDATING ENQUIRY PROGRESSION: {} -> {}", enquiry.getStatus(), emailStage);
            enquiry = updateEnquiryProgression(enquiry, emailStage, emailBody, subject);
            
            // Link this email to the existing enquiry
            email.setEnquiryId(enquiry.getEnquiryId());
            email.setProcessed(true);
            logger.info("🔗 Email linked to existing enquiry: {}", enquiry.getEnquiryId());
            
        } else if (emailStage == EmailStage.INITIAL_ENQUIRY) {
            // This is a brand new conversation
            logger.info("🆕 CREATING NEW CONVERSATION:");
            logger.info("   ThreadId: {}", emailThreadId);
            logger.info("   EmailStage: {}", emailStage);
            
            enquiry = createEmailEnquiry(customer, subject, emailBody, emailThreadId, receivedAt,
                                             messageId, threadId, conversationId, inReplyTo);
            if (enquiry != null) {
                email.setEnquiryId(enquiry.getEnquiryId());
                email.setProcessed(true);
                logger.info("✅ NEW ENQUIRY CREATED: {}", enquiry.getEnquiryId());
            } else {
                logger.error("❌ FAILED TO CREATE NEW ENQUIRY");
            }
        } else {
            // Email stage suggests this should be linked but no thread found
            logger.warn("⚠️  ORPHANED EMAIL DETECTED:");
            logger.warn("   EmailStage '{}' suggests continuation but no existing thread found", emailStage);
            logger.warn("   ThreadId: {}", emailThreadId);
            logger.warn("   This email will be stored but not processed as enquiry");
        }
        
        emailRepository.save(email);
        
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
        
        logger.info("📤 WEBHOOK RESPONSE:");
        logger.info("   success: {}", response.get("success"));
        logger.info("   enquiryId: {}", response.get("enquiryId"));
        logger.info("   enquiryStatus: {}", response.get("enquiryStatus"));
        logger.info("   emailStage: {}", response.get("emailStage"));
        logger.info("   suggestedAction: {}", response.get("suggestedAction"));
        logger.info("🔥 ===== END EMAIL PROCESSING =====");
        
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
     * Determine the stage in the customer journey - Enhanced for conversation progression
     */
    private EmailStage determineEmailStage(String subject, String emailBody, EmailType emailType) {
        String text = (subject + " " + emailBody).toLowerCase();
        
        // Enhanced conversation progression detection
        
        // ORDER PLACEMENT/CONFIRMATION patterns
        if (text.contains("proceed with") || text.contains("place order") || text.contains("place the order") ||
            text.contains("go ahead") || text.contains("move forward") || text.contains("confirm order")) {
            return EmailStage.ORDER_PLACEMENT;
        }
        
        // ORDER CONFIRMED patterns  
        if (text.contains("order confirmed") || text.contains("order placed") || 
            text.contains("order number") || text.contains("purchase order")) {
            return EmailStage.ORDER_CONFIRMED;
        }
        
        // QUOTE ACCEPTANCE patterns
        if ((text.contains("quote") || text.contains("pricing")) && 
            (text.contains("accept") || text.contains("approve") || text.contains("good") || 
             text.contains("looks good") || text.contains("acceptable") || text.contains("agree"))) {
            return EmailStage.ORDER_PLACEMENT;
        }
        
        // QUOTE SENT patterns (when we send quotes)
        if (text.contains("quote attached") || text.contains("pricing below") || 
            text.contains("quotation") || (text.contains("quote") && text.contains("price"))) {
            return EmailStage.QUOTE_SENT;
        }
        
        // ENQUIRY CLOSED/REJECTED patterns
        if (text.contains("cancel") || text.contains("not interested") || text.contains("too expensive") ||
            text.contains("reject") || text.contains("decline") || text.contains("no longer need")) {
            return EmailStage.ENQUIRY_CLOSED;
        }
        
        // INITIAL ENQUIRY patterns (check FIRST - higher priority)
        if (text.contains("need") || text.contains("require") || text.contains("looking for") ||
            text.contains("inquiry") || text.contains("enquiry") || text.contains("quote request") ||
            text.contains("price") || text.contains("cost") || text.contains("interested in") ||
            text.contains("tons") || text.contains("volume") || text.contains("processing") ||
            text.contains("quote") || text.contains("estimate") || text.contains("pricing")) {
            return EmailStage.INITIAL_ENQUIRY;
        }
        
        // FOLLOW UP patterns (check SECOND - lower priority)
        if (text.contains("question") || text.contains("clarification") || text.contains("modify") ||
            text.contains("change") || text.contains("update") || text.contains("when") ||
            text.contains("how") || text.contains("what about") || text.contains("also")) {
            return EmailStage.FOLLOW_UP;
        }
        
        // Fallback to EmailType-based classification
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
        
        // Thread tracking handled via originalEmailId field above
        
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
     * Update enquiry progression based on conversation flow
     */
    private EmailEnquiry updateEnquiryProgression(EmailEnquiry enquiry, EmailStage emailStage, 
                                                String emailBody, String subject) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        String currentNotes = enquiry.getProcessingNotes() != null ? enquiry.getProcessingNotes() : "";
        
        logger.info("🔄 ===== ENQUIRY PROGRESSION UPDATE =====");
        logger.info("📋 EnquiryId: {}", enquiry.getEnquiryId());
        logger.info("📊 Current Status: {}", enquiry.getStatus());
        logger.info("🎯 EmailStage: {}", emailStage);
        logger.info("📝 Subject: {}", subject);
        
        switch (emailStage) {
            case ORDER_PLACEMENT:
            case ORDER_CONFIRMED:
                // Customer has confirmed/placed an order
                logger.info("🛒 CONVERTING TO ORDER: {} -> CONVERTED", enquiry.getStatus());
                enquiry.setStatus(EnquiryStatus.CONVERTED);
                enquiry.setProcessingNotes(currentNotes + "\n[" + timestamp + "] ORDER CONFIRMED: " + subject);
                logger.info("✅ Enquiry {} converted to order", enquiry.getEnquiryId());
                break;
                
            case QUOTE_SENT:
                // Quote has been sent to customer
                if (enquiry.getStatus() == EnquiryStatus.RECEIVED || enquiry.getStatus() == EnquiryStatus.PROCESSING) {
                    enquiry.setStatus(EnquiryStatus.QUOTED);
                }
                enquiry.setProcessingNotes(currentNotes + "\n[" + timestamp + "] QUOTE SENT: " + subject);
                logger.info("Quote sent for enquiry {}", enquiry.getEnquiryId());
                break;
                
            case FOLLOW_UP:
                // Keep existing status, just add conversation history
                enquiry.setProcessingNotes(currentNotes + "\n[" + timestamp + "] FOLLOW-UP: " + subject);
                break;
                
            case ENQUIRY_CLOSED:
                // Enquiry has been closed/cancelled
                enquiry.setStatus(EnquiryStatus.CANCELLED);
                enquiry.setProcessingNotes(currentNotes + "\n[" + timestamp + "] ENQUIRY CLOSED: " + subject);
                break;
                
            default:
                // Add to conversation history without changing status
                enquiry.setProcessingNotes(currentNotes + "\n[" + timestamp + "] EMAIL (" + emailStage + "): " + subject);
        }
        
        // Extract any additional requirements from the follow-up email
        if (emailStage != EmailStage.INITIAL_ENQUIRY) {
            List<EnquiryItem> additionalItems = hybridEmailProcessor.parseProductRequirements(emailBody);
            if (!additionalItems.isEmpty()) {
                logger.info("Found {} additional items in follow-up email", additionalItems.size());
                // Link new items to the existing enquiry
                for (EnquiryItem item : additionalItems) {
                    item.setEmailEnquiry(enquiry);
                    enquiry.getEnquiryItems().add(item);
                }
                enquiry.setProcessingNotes(currentNotes + "\n[" + timestamp + "] ADDITIONAL ITEMS EXTRACTED: " + additionalItems.size() + " items");
            }
        }
        
        EmailEnquiry savedEnquiry = emailEnquiryRepository.save(enquiry);
        
        logger.info("💾 ENQUIRY PROGRESSION COMPLETED:");
        logger.info("   EnquiryId: {}", savedEnquiry.getEnquiryId());
        logger.info("   Final Status: {}", savedEnquiry.getStatus());
        logger.info("   Items Count: {}", savedEnquiry.getEnquiryItems().size());
        logger.info("🔥 ===== END PROGRESSION UPDATE =====");
        
        return savedEnquiry;
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
    
    /**
     * Parse multiple recipients from comma-separated string
     * Example: "odd.medhus@cftsolutions.eu,henriktp@skagerakprocessing.dk,jens@skagerakprocessing.dk"
     */
    private String[] parseMultipleRecipients(String recipients) {
        if (recipients == null || recipients.trim().isEmpty()) {
            return new String[0];
        }
        
        String[] rawRecipients = recipients.split(",");
        List<String> cleanRecipients = new ArrayList<>();
        
        for (String email : rawRecipients) {
            String trimmedEmail = email.trim();
            if (!trimmedEmail.isEmpty()) {
                cleanRecipients.add(trimmedEmail);
            }
        }
        
        return cleanRecipients.toArray(new String[0]);
    }
    
    /**
     * Get primary recipient (first email in the list)
     */
    private String getPrimaryRecipient(String recipients) {
        String[] recipientArray = parseMultipleRecipients(recipients);
        return recipientArray.length > 0 ? recipientArray[0] : null;
    }
    
    /**
     * Check if email is sent to multiple recipients
     */
    private boolean hasMultipleRecipients(String recipients) {
        return parseMultipleRecipients(recipients).length > 1;
    }
    
    // Enums for classification
    enum EmailType {
        ENQUIRY, QUOTE_ACCEPTANCE, QUOTE_REJECTION, ORDER_CONFIRMATION, GENERAL
    }
    
    enum EmailStage {
        INITIAL_ENQUIRY, QUOTE_SENT, ORDER_PLACEMENT, ORDER_CONFIRMED, ENQUIRY_CLOSED, FOLLOW_UP
    }
} 