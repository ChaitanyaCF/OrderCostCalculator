package com.procost.api.service;

import com.procost.api.dto.ZapierEmailWebhook;
import com.procost.api.model.*;
import com.procost.api.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AIEmailProcessor {
    
    private static final Logger logger = LoggerFactory.getLogger(AIEmailProcessor.class);
    
    @Autowired
    private CustomerRepository customerRepository;
    
    // Email classification patterns
    private static final Map<String, List<String>> CLASSIFICATION_PATTERNS = Map.of(
        "ENQUIRY", Arrays.asList("enquiry", "inquiry", "quote", "price", "cost", "information", "details"),
        "ORDER", Arrays.asList("order", "purchase", "buy", "confirm", "proceed"),
        "COMPLAINT", Arrays.asList("complaint", "issue", "problem", "wrong", "error"),
        "QUOTE_RESPONSE", Arrays.asList("accept", "reject", "approve", "decline", "confirm quote"),
        "GENERAL", Arrays.asList("hello", "hi", "thanks", "information")
    );
    
    // Product mapping patterns
    private static final Map<String, List<String>> PRODUCT_PATTERNS = Map.of(
        "SALMON", Arrays.asList("salmon", "atlantic salmon", "norwegian salmon", "farmed salmon"),
        "COD", Arrays.asList("cod", "atlantic cod", "pacific cod", "gadus"),
        "HADDOCK", Arrays.asList("haddock", "melanogrammus"),
        "POLLOCK", Arrays.asList("pollock", "alaska pollock", "pollachius"),
        "MACKEREL", Arrays.asList("mackerel", "scomber", "atlantic mackerel"),
        "HERRING", Arrays.asList("herring", "clupea", "atlantic herring")
    );
    
    // Trim type patterns
    private static final Map<String, List<String>> TRIM_PATTERNS = Map.of(
        "FILLET", Arrays.asList("fillet", "fillets", "skinless", "boneless"),
        "WHOLE", Arrays.asList("whole", "round", "gutted", "h&g"),
        "STEAK", Arrays.asList("steak", "steaks", "portion", "portions"),
        "LOIN", Arrays.asList("loin", "loins", "supreme"),
        "TAIL", Arrays.asList("tail", "tails", "collar")
    );
    
    /**
     * Classify the email type based on subject and content
     */
    public String classifyEmail(String subject, String body) {
        logger.info("Classifying email with subject: {}", subject);
        
        String combinedText = (subject + " " + body).toLowerCase();
        Map<String, Integer> scores = new HashMap<>();
        
        for (Map.Entry<String, List<String>> entry : CLASSIFICATION_PATTERNS.entrySet()) {
            String classification = entry.getKey();
            List<String> patterns = entry.getValue();
            
            int score = 0;
            for (String pattern : patterns) {
                score += countOccurrences(combinedText, pattern);
            }
            scores.put(classification, score);
        }
        
        String classification = scores.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse("GENERAL");
            
        logger.info("Email classified as: {} with scores: {}", classification, scores);
        return classification;
    }
    
    /**
     * Extract customer information from email
     */
    public Customer extractCustomerInfo(String fromEmail, String body, String subject) {
        logger.info("Extracting customer info from email: {}", fromEmail);
        
        // Check if customer already exists
        Optional<Customer> existingCustomer = customerRepository.findByEmail(fromEmail);
        if (existingCustomer.isPresent()) {
            logger.info("Found existing customer: {}", existingCustomer.get().getEmail());
            return existingCustomer.get();
        }
        
        // Create new customer
        Customer customer = new Customer();
        customer.setEmail(fromEmail);
        
        // Extract contact person name from email signature
        String contactPerson = extractContactPerson(body);
        customer.setContactPerson(contactPerson);
        
        // Extract company name
        String companyName = extractCompanyName(body, fromEmail);
        customer.setCompanyName(companyName);
        
        // Extract phone number
        String phone = extractPhoneNumber(body);
        customer.setPhone(phone);
        
        // Extract address
        String address = extractAddress(body);
        customer.setAddress(address);
        
        // Extract country from email domain or content
        String country = extractCountry(fromEmail, body);
        customer.setCountry(country);
        
        logger.info("Created new customer profile: {} from {}", contactPerson, companyName);
        return customer;
    }
    
    /**
     * Parse product requirements from email content
     */
    public List<EnquiryItem> parseProductRequirements(String emailBody) {
        logger.info("Parsing product requirements from email");
        
        List<EnquiryItem> items = new ArrayList<>();
        String[] lines = emailBody.split("\n");
        
        for (String line : lines) {
            line = line.trim();
            
            // Skip empty lines and headers
            if (line.isEmpty() || line.length() < 10) continue;
            
            // Look for product mention patterns
            if (containsProductMention(line)) {
                EnquiryItem item = parseProductLine(line);
                if (item != null) {
                    items.add(item);
                    logger.info("Parsed product: {} - {} - {}kg", 
                        item.getProduct(), item.getTrimType(), item.getRequestedQuantity());
                }
            }
        }
        
        // If no structured products found, create a general item
        if (items.isEmpty()) {
            EnquiryItem generalItem = createGeneralEnquiryItem(emailBody);
            if (generalItem != null) {
                items.add(generalItem);
            }
        }
        
        logger.info("Extracted {} product items from email", items.size());
        return items;
    }
    
    /**
     * Parse individual product line
     */
    private EnquiryItem parseProductLine(String line) {
        EnquiryItem item = new EnquiryItem();
        
        // Extract quantity (look for numbers followed by kg, tons, etc.)
        Double quantity = extractQuantity(line);
        item.setRequestedQuantity(quantity != null ? quantity.intValue() : 0);
        
        // Extract product type
        String product = extractProduct(line);
        item.setProduct(product);
        
        // Extract trim type
        String trimType = extractTrimType(line);
        item.setTrimType(trimType);
        
        // Extract customer SKU reference
        String customerSku = extractCustomerSku(line);
        item.setCustomerSkuReference(customerSku);
        
        // Set product description as the original line
        item.setProductDescription(line);
        
        // Determine mapping confidence
        item.setMappingConfidence(calculateMappingConfidence(product, trimType, quantity));
        item.setAiMapped(true);
        
        return item;
    }
    
    /**
     * Extract contact person name from email body
     */
    private String extractContactPerson(String body) {
        // Look for signature patterns
        String[] signaturePatterns = {
            "(?i)best regards,\\s*([^\\n]+)",
            "(?i)regards,\\s*([^\\n]+)",
            "(?i)sincerely,\\s*([^\\n]+)",
            "(?i)kind regards,\\s*([^\\n]+)",
            "(?i)from[:\\s]+([^\\n]+)"
        };
        
        for (String pattern : signaturePatterns) {
            Pattern p = Pattern.compile(pattern);
            Matcher m = p.matcher(body);
            if (m.find()) {
                String name = m.group(1).trim();
                // Clean up the name (remove extra info)
                name = name.split("\\n")[0].split("\\|")[0].trim();
                if (name.length() > 2 && name.length() < 50) {
                    return name;
                }
            }
        }
        
        return "Unknown";
    }
    
    /**
     * Extract company name from email body or domain
     */
    private String extractCompanyName(String body, String email) {
        // Try to extract from email domain first
        if (email.contains("@")) {
            String domain = email.split("@")[1];
            if (!domain.contains("gmail") && !domain.contains("yahoo") && !domain.contains("hotmail")) {
                String company = domain.split("\\.")[0];
                return capitalize(company);
            }
        }
        
        // Look for company patterns in body
        String[] companyPatterns = {
            "(?i)([A-Z][a-z]+\\s*(?:Ltd|Limited|Inc|Corporation|Corp|Company|Co))",
            "(?i)([A-Z][a-z]+\\s*(?:AS|AB|GmbH|S\\.A|B\\.V))",
            "(?i)company[:\\s]+([^\\n]+)",
            "(?i)from[:\\s]+([^\\n]+(?:Ltd|Limited|Inc|Corp))"
        };
        
        for (String pattern : companyPatterns) {
            Pattern p = Pattern.compile(pattern);
            Matcher m = p.matcher(body);
            if (m.find()) {
                return m.group(1).trim();
            }
        }
        
        return "Unknown Company";
    }
    
    /**
     * Extract phone number from email body
     */
    private String extractPhoneNumber(String body) {
        String[] phonePatterns = {
            "(?i)phone[:\\s]+(\\+?[\\d\\s\\-\\(\\)]{8,})",
            "(?i)tel[:\\s]+(\\+?[\\d\\s\\-\\(\\)]{8,})",
            "(?i)mobile[:\\s]+(\\+?[\\d\\s\\-\\(\\)]{8,})",
            "(\\+\\d{1,3}[\\s\\-]?\\d{1,4}[\\s\\-]?\\d{1,4}[\\s\\-]?\\d{1,9})"
        };
        
        for (String pattern : phonePatterns) {
            Pattern p = Pattern.compile(pattern);
            Matcher m = p.matcher(body);
            if (m.find()) {
                return m.group(1).trim();
            }
        }
        
        return null;
    }
    
    /**
     * Extract address from email body
     */
    private String extractAddress(String body) {
        String[] addressPatterns = {
            "(?i)address[:\\s]+([^\\n]+)",
            "(?i)location[:\\s]+([^\\n]+)",
            "(?i)\\d+\\s+[A-Za-z\\s]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln)[^\\n]*"
        };
        
        for (String pattern : addressPatterns) {
            Pattern p = Pattern.compile(pattern);
            Matcher m = p.matcher(body);
            if (m.find()) {
                return m.group(1).trim();
            }
        }
        
        return null;
    }
    
    /**
     * Extract country from email or content
     */
    private String extractCountry(String email, String body) {
        // Country codes from email domain
        Map<String, String> countryDomains = Map.of(
            ".no", "Norway",
            ".dk", "Denmark",
            ".se", "Sweden",
            ".fi", "Finland",
            ".uk", "United Kingdom",
            ".de", "Germany",
            ".fr", "France",
            ".es", "Spain",
            ".it", "Italy"
        );
        
        for (Map.Entry<String, String> entry : countryDomains.entrySet()) {
            if (email.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        
        // Look for country mentions in body
        String[] countries = {"Norway", "Denmark", "Sweden", "Finland", "Germany", "France", "Spain", "Italy", "UK", "United Kingdom"};
        String lowerBody = body.toLowerCase();
        
        for (String country : countries) {
            if (lowerBody.contains(country.toLowerCase())) {
                return country;
            }
        }
        
        return "Unknown";
    }
    
    /**
     * Check if line contains product mention
     */
    private boolean containsProductMention(String line) {
        String lowerLine = line.toLowerCase();
        
        // Check for product keywords
        for (List<String> products : PRODUCT_PATTERNS.values()) {
            for (String product : products) {
                if (lowerLine.contains(product)) return true;
            }
        }
        
        // Check for quantity indicators
        if (lowerLine.matches(".*\\d+\\s*(kg|ton|tons|pound|lbs|pieces?).*")) {
            return true;
        }
        
        // Check for bullet points or list indicators
        if (line.startsWith("-") || line.startsWith("•") || line.startsWith("*")) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Extract quantity from text
     */
    private Double extractQuantity(String text) {
        Pattern pattern = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:kg|ton|tons|pound|lbs)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        
        if (matcher.find()) {
            return Double.parseDouble(matcher.group(1));
        }
        
        return null;
    }
    
    /**
     * Extract product type from text
     */
    private String extractProduct(String text) {
        String lowerText = text.toLowerCase();
        
        for (Map.Entry<String, List<String>> entry : PRODUCT_PATTERNS.entrySet()) {
            for (String pattern : entry.getValue()) {
                if (lowerText.contains(pattern)) {
                    return entry.getKey();
                }
            }
        }
        
        return "UNKNOWN";
    }
    
    /**
     * Extract trim type from text
     */
    private String extractTrimType(String text) {
        String lowerText = text.toLowerCase();
        
        for (Map.Entry<String, List<String>> entry : TRIM_PATTERNS.entrySet()) {
            for (String pattern : entry.getValue()) {
                if (lowerText.contains(pattern)) {
                    return entry.getKey();
                }
            }
        }
        
        return "UNKNOWN";
    }
    
    /**
     * Extract customer SKU reference
     */
    private String extractCustomerSku(String text) {
        Pattern pattern = Pattern.compile("(?i)(?:sku|item|code|ref)[:\\s#]+(\\w+)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        
        if (matcher.find()) {
            return matcher.group(1);
        }
        
        return null;
    }
    
    /**
     * Calculate mapping confidence based on extracted information
     */
    private String calculateMappingConfidence(String product, String trimType, Double quantity) {
        int confidence = 0;
        
        if (product != null && !product.equals("UNKNOWN")) confidence += 40;
        if (trimType != null && !trimType.equals("UNKNOWN")) confidence += 30;
        if (quantity != null && quantity > 0) confidence += 30;
        
        if (confidence >= 80) return "HIGH";
        if (confidence >= 50) return "MEDIUM";
        return "LOW";
    }
    
    /**
     * Create general enquiry item when no specific products found
     */
    private EnquiryItem createGeneralEnquiryItem(String emailBody) {
        EnquiryItem item = new EnquiryItem();
        item.setProductDescription("General enquiry - " + emailBody.substring(0, Math.min(100, emailBody.length())));
        item.setProduct("GENERAL");
        item.setTrimType("UNKNOWN");
        item.setRequestedQuantity(0);
        item.setMappingConfidence("MANUAL_REVIEW");
        item.setAiMapped(false);
        
        return item;
    }
    
    /**
     * Count occurrences of pattern in text
     */
    private int countOccurrences(String text, String pattern) {
        return (text.length() - text.replace(pattern, "").length()) / pattern.length();
    }
    
    /**
     * Capitalize first letter of string
     */
    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
} 