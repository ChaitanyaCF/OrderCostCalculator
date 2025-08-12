package com.procost.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/extraction")
@CrossOrigin(originPatterns = "*", allowCredentials = "false")
public class EmailExtractionController {
    
    /**
     * Step 2: Extract customer and product info from email
     * Simple pattern-based extraction
     */
    @PostMapping("/extract-info")
    public ResponseEntity<Map<String, Object>> extractEmailInfo(@RequestBody Map<String, Object> emailData) {
        String fromEmail = (String) emailData.get("fromEmail");
        String subject = (String) emailData.get("subject");
        String emailBody = (String) emailData.get("emailBody");
        
        // Extract customer info
        Map<String, Object> customerInfo = extractCustomerInfo(fromEmail, emailBody);
        
        // Extract product requirements
        Map<String, Object> productInfo = extractProductInfo(subject, emailBody);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("customer", customerInfo);
        response.put("products", productInfo);
        response.put("confidence", calculateConfidence(customerInfo, productInfo));
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
    
    private Map<String, Object> extractCustomerInfo(String fromEmail, String emailBody) {
        Map<String, Object> customer = new HashMap<>();
        
        // Extract email domain for company
        String domain = fromEmail.contains("@") ? 
            fromEmail.substring(fromEmail.indexOf("@") + 1) : "unknown";
        
        // Simple company name extraction from domain
        String companyName = domain.contains(".") ? 
            domain.substring(0, domain.indexOf(".")) : domain;
        companyName = companyName.substring(0, 1).toUpperCase() + 
                     companyName.substring(1).toLowerCase();
        
        // Try to extract name from email body
        String contactPerson = extractNameFromBody(emailBody);
        if (contactPerson == null) {
            contactPerson = fromEmail.contains("@") ? 
                fromEmail.substring(0, fromEmail.indexOf("@")) : "Unknown";
        }
        
        customer.put("email", fromEmail);
        customer.put("companyName", companyName + " Corp");
        customer.put("contactPerson", contactPerson);
        customer.put("extractionMethod", "pattern");
        
        return customer;
    }
    
    private Map<String, Object> extractProductInfo(String subject, String emailBody) {
        Map<String, Object> productInfo = new HashMap<>();
        
        // Extract quantity (look for numbers followed by kg, tons, etc.)
        Pattern quantityPattern = Pattern.compile("(\\d+)\\s*(kg|kgs|tons?|tonnes?)", Pattern.CASE_INSENSITIVE);
        Matcher quantityMatcher = quantityPattern.matcher(emailBody + " " + subject);
        
        String quantity = "Not specified";
        String unit = "kg";
        if (quantityMatcher.find()) {
            quantity = quantityMatcher.group(1);
            unit = quantityMatcher.group(2).toLowerCase();
        }
        
        // Extract product type
        String productType = "Not specified";
        String[] products = {"salmon", "tuna", "cod", "fillet", "fish", "seafood"};
        String lowerText = (emailBody + " " + subject).toLowerCase();
        
        for (String product : products) {
            if (lowerText.contains(product)) {
                productType = product.substring(0, 1).toUpperCase() + product.substring(1);
                break;
            }
        }
        
        // Check urgency
        boolean urgent = lowerText.contains("urgent") || lowerText.contains("asap") || 
                        lowerText.contains("rush") || lowerText.contains("immediate");
        
        productInfo.put("quantity", quantity);
        productInfo.put("unit", unit);
        productInfo.put("productType", productType);
        productInfo.put("urgent", urgent);
        productInfo.put("extractionMethod", "pattern");
        
        return productInfo;
    }
    
    private String extractNameFromBody(String emailBody) {
        // Look for common name patterns
        Pattern namePattern = Pattern.compile("(Thanks,|Regards,|Best,|From,)\\s*([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)", Pattern.CASE_INSENSITIVE);
        Matcher nameMatcher = namePattern.matcher(emailBody);
        
        if (nameMatcher.find()) {
            return nameMatcher.group(2).trim();
        }
        return null;
    }
    
    private double calculateConfidence(Map<String, Object> customerInfo, Map<String, Object> productInfo) {
        double confidence = 0.5; // Base confidence
        
        if (!"Not specified".equals(productInfo.get("quantity"))) confidence += 0.2;
        if (!"Not specified".equals(productInfo.get("productType"))) confidence += 0.2;
        if (customerInfo.get("contactPerson") != null && 
            !customerInfo.get("contactPerson").toString().contains("@")) confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }
} 