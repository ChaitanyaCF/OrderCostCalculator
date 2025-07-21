package com.procost.api.service;

import com.procost.api.model.*;
import com.procost.api.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

@Service
public class HybridEmailProcessor {
    
    private static final Logger logger = LoggerFactory.getLogger(HybridEmailProcessor.class);
    
    @Autowired
    private AIEmailProcessor patternProcessor;
    
    @Autowired
    private OpenAIEmailProcessor openAIProcessor;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    @Value("${ai.hybrid.enabled:true}")
    private boolean hybridModeEnabled;
    
    @Value("${ai.openai.fallback.enabled:true}")
    private boolean openAIFallbackEnabled;
    
    @Value("${ai.confidence.threshold:0.7}")
    private double confidenceThreshold;
    
    /**
     * Hybrid email classification - tries patterns first, then AI
     */
    public String classifyEmail(String subject, String body) {
        logger.info("🔄 Starting hybrid email classification for: {}", subject);
        
        // Step 1: Try pattern-based classification
        String patternResult = patternProcessor.classifyEmail(subject, body);
        double patternConfidence = calculateClassificationConfidence(subject, body, patternResult);
        
        logger.info("📊 Pattern classification: {} (confidence: {:.2f})", patternResult, patternConfidence);
        
        // Step 2: Decide if we need AI fallback
        if (shouldUseAIFallback(patternResult, patternConfidence, subject, body)) {
            logger.info("🤖 Pattern confidence low, trying OpenAI classification...");
            
            try {
                String aiResult = openAIProcessor.classifyEmailWithAI(subject, body);
                logger.info("✅ OpenAI classification: {}", aiResult);
                
                // Track usage for analytics
                recordAIUsage("classification", "openai_used", subject.length() + body.length());
                
                return aiResult;
                
            } catch (Exception e) {
                logger.warn("❌ OpenAI classification failed, using pattern result: {}", e.getMessage());
                recordAIUsage("classification", "openai_failed", 0);
                return patternResult;
            }
        }
        
        logger.info("✅ Using pattern classification result: {}", patternResult);
        recordAIUsage("classification", "pattern_sufficient", 0);
        return patternResult;
    }
    
    /**
     * Hybrid customer extraction - tries patterns first, then AI
     */
    public Customer extractCustomerInfo(String fromEmail, String body, String subject) {
        logger.info("🔄 Starting hybrid customer extraction from: {}", fromEmail);
        
        // Check if customer already exists (skip processing if found)
        Optional<Customer> existingCustomer = customerRepository.findByEmail(fromEmail);
        if (existingCustomer.isPresent()) {
            logger.info("✅ Found existing customer, skipping extraction");
            return existingCustomer.get();
        }
        
        // Step 1: Try pattern-based extraction
        Customer patternCustomer = patternProcessor.extractCustomerInfo(fromEmail, body, subject);
        double extractionScore = calculateCustomerExtractionScore(patternCustomer);
        
        logger.info("📊 Pattern extraction score: {:.2f} for customer: {}", 
                   extractionScore, patternCustomer.getContactPerson());
        
        // Step 2: Decide if we need AI fallback
        if (shouldUseAIForCustomerExtraction(extractionScore, body)) {
            logger.info("🤖 Pattern extraction insufficient, trying OpenAI...");
            
            try {
                Customer aiCustomer = openAIProcessor.extractCustomerInfoWithAI(fromEmail, body, subject);
                logger.info("✅ OpenAI extracted customer: {} from {}", 
                           aiCustomer.getContactPerson(), aiCustomer.getCompanyName());
                
                recordAIUsage("customer_extraction", "openai_used", body.length());
                return aiCustomer;
                
            } catch (Exception e) {
                logger.warn("❌ OpenAI customer extraction failed, using pattern result: {}", e.getMessage());
                recordAIUsage("customer_extraction", "openai_failed", 0);
                return patternCustomer;
            }
        }
        
        logger.info("✅ Using pattern extraction result for: {}", patternCustomer.getContactPerson());
        recordAIUsage("customer_extraction", "pattern_sufficient", 0);
        return patternCustomer;
    }
    
    /**
     * Hybrid product parsing - tries patterns first, then AI
     */
    public List<EnquiryItem> parseProductRequirements(String emailBody) {
        logger.info("🔄 Starting hybrid product parsing");
        
        // Step 1: Try pattern-based parsing
        List<EnquiryItem> patternItems = patternProcessor.parseProductRequirements(emailBody);
        double parsingScore = calculateProductParsingScore(patternItems, emailBody);
        
        logger.info("📊 Pattern parsing score: {:.2f}, found {} items", parsingScore, patternItems.size());
        
        // Step 2: Decide if we need AI fallback
        if (shouldUseAIForProductParsing(parsingScore, patternItems, emailBody)) {
            logger.info("🤖 Pattern parsing insufficient, trying OpenAI...");
            
            try {
                List<EnquiryItem> aiItems = openAIProcessor.parseProductRequirementsWithAI(emailBody);
                logger.info("✅ OpenAI parsed {} product items", aiItems.size());
                
                recordAIUsage("product_parsing", "openai_used", emailBody.length());
                return aiItems;
                
            } catch (Exception e) {
                logger.warn("❌ OpenAI product parsing failed, using pattern result: {}", e.getMessage());
                recordAIUsage("product_parsing", "openai_failed", 0);
                return patternItems;
            }
        }
        
        logger.info("✅ Using pattern parsing result: {} items", patternItems.size());
        recordAIUsage("product_parsing", "pattern_sufficient", 0);
        return patternItems;
    }
    
    /**
     * Calculate confidence score for classification
     */
    private double calculateClassificationConfidence(String subject, String body, String classification) {
        String combinedText = (subject + " " + body).toLowerCase();
        
        // Count keyword matches for the classification
        Map<String, List<String>> patterns = Map.of(
            "ENQUIRY", Arrays.asList("enquiry", "inquiry", "quote", "price", "cost", "information", "details"),
            "ORDER", Arrays.asList("order", "purchase", "buy", "confirm", "proceed"),
            "COMPLAINT", Arrays.asList("complaint", "issue", "problem", "wrong", "error"),
            "QUOTE_RESPONSE", Arrays.asList("accept", "reject", "approve", "decline", "confirm quote"),
            "GENERAL", Arrays.asList("hello", "hi", "thanks", "information")
        );
        
        List<String> classificationPatterns = patterns.getOrDefault(classification, Collections.emptyList());
        int matches = 0;
        int totalWords = combinedText.split("\\s+").length;
        
        for (String pattern : classificationPatterns) {
            if (combinedText.contains(pattern)) {
                matches++;
            }
        }
        
        // Calculate confidence based on matches and text length
        double confidence = Math.min(1.0, (double) matches / Math.max(1, classificationPatterns.size()));
        
        // Boost confidence for shorter, focused emails
        if (totalWords < 50 && matches > 0) {
            confidence = Math.min(1.0, confidence + 0.2);
        }
        
        return confidence;
    }
    
    /**
     * Calculate customer extraction score
     */
    private double calculateCustomerExtractionScore(Customer customer) {
        double score = 0.0;
        
        // Contact person (30%)
        if (customer.getContactPerson() != null && !customer.getContactPerson().equals("Unknown")) {
            score += 0.3;
        }
        
        // Company name (25%)
        if (customer.getCompanyName() != null && !customer.getCompanyName().equals("Unknown Company")) {
            score += 0.25;
        }
        
        // Phone number (20%)
        if (customer.getPhone() != null && customer.getPhone().length() > 5) {
            score += 0.2;
        }
        
        // Address (15%)
        if (customer.getAddress() != null && customer.getAddress().length() > 5) {
            score += 0.15;
        }
        
        // Country (10%)
        if (customer.getCountry() != null && !customer.getCountry().equals("Unknown")) {
            score += 0.1;
        }
        
        return score;
    }
    
    /**
     * Calculate product parsing score
     */
    private double calculateProductParsingScore(List<EnquiryItem> items, String emailBody) {
        if (items.isEmpty()) {
            return 0.0;
        }
        
        double totalScore = 0.0;
        int validItems = 0;
        
        for (EnquiryItem item : items) {
            double itemScore = 0.0;
            
            // Product identified (40%)
            if (item.getProduct() != null && !item.getProduct().equals("UNKNOWN")) {
                itemScore += 0.4;
            }
            
            // Trim type identified (30%)
            if (item.getTrimType() != null && !item.getTrimType().equals("UNKNOWN")) {
                itemScore += 0.3;
            }
            
            // Quantity extracted (30%)
            if (item.getRequestedQuantity() > 0) {
                itemScore += 0.3;
            }
            
            totalScore += itemScore;
            validItems++;
        }
        
        // Average score across all items
        double averageScore = validItems > 0 ? totalScore / validItems : 0.0;
        
        // Penalty for very short emails with extraction (might be false positives)
        if (emailBody.length() < 100 && items.size() > 2) {
            averageScore *= 0.8;
        }
        
        return averageScore;
    }
    
    /**
     * Decide if AI fallback is needed for classification
     */
    private boolean shouldUseAIFallback(String classification, double confidence, String subject, String body) {
        if (!hybridModeEnabled || !openAIFallbackEnabled) {
            return false;
        }
        
        // Use AI if confidence is low
        if (confidence < confidenceThreshold) {
            return true;
        }
        
        // Use AI for "GENERAL" classification (often means unclear)
        if ("GENERAL".equals(classification)) {
            return true;
        }
        
        // Use AI for complex emails (long content, multiple sentences)
        if (isComplexEmail(subject, body)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Decide if AI is needed for customer extraction
     */
    private boolean shouldUseAIForCustomerExtraction(double extractionScore, String body) {
        if (!hybridModeEnabled || !openAIFallbackEnabled) {
            return false;
        }
        
        // Use AI if extraction score is low
        if (extractionScore < 0.5) {
            return true;
        }
        
        // Use AI for emails with no formal signature but rich content
        if (extractionScore < 0.7 && body.length() > 200) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Decide if AI is needed for product parsing
     */
    private boolean shouldUseAIForProductParsing(double parsingScore, List<EnquiryItem> items, String emailBody) {
        if (!hybridModeEnabled || !openAIFallbackEnabled) {
            return false;
        }
        
        // Use AI if no products found
        if (items.isEmpty()) {
            return true;
        }
        
        // Use AI if parsing score is low
        if (parsingScore < 0.6) {
            return true;
        }
        
        // Use AI for emails that seem to have product mentions but weren't extracted
        if (containsProductIndicators(emailBody) && items.size() < 2) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if email is complex (needs AI)
     */
    private boolean isComplexEmail(String subject, String body) {
        String combinedText = subject + " " + body;
        
        // Long emails
        if (combinedText.length() > 800) {
            return true;
        }
        
        // Multiple sentences
        int sentenceCount = combinedText.split("[.!?]+").length;
        if (sentenceCount > 5) {
            return true;
        }
        
        // Contains questions
        if (combinedText.toLowerCase().matches(".*\\b(how|what|when|where|why|can you|could you|would you)\\b.*")) {
            return true;
        }
        
        // Contains natural language quantities
        if (combinedText.toLowerCase().matches(".*(half|couple|several|many|few|some|about|approximately).*")) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if email contains product indicators
     */
    private boolean containsProductIndicators(String emailBody) {
        String lowerBody = emailBody.toLowerCase();
        
        // General food/fish terms
        String[] indicators = {
            "fish", "seafood", "food", "kg", "ton", "pound", "supply", "deliver",
            "fresh", "frozen", "quality", "grade", "restaurant", "kitchen"
        };
        
        int count = 0;
        for (String indicator : indicators) {
            if (lowerBody.contains(indicator)) {
                count++;
            }
        }
        
        return count >= 3; // If multiple indicators, likely contains products
    }
    
    /**
     * Record AI usage for analytics
     */
    private void recordAIUsage(String operation, String result, int textLength) {
        // Log for monitoring and cost tracking
        logger.info("📈 AI Usage: operation={}, result={}, textLength={}", operation, result, textLength);
        
        // TODO: Implement metrics collection
        // - Track cost per operation
        // - Monitor pattern vs AI success rates
        // - Alert on high AI usage
    }
    
    /**
     * Get processing statistics
     */
    public Map<String, Object> getProcessingStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("hybridModeEnabled", hybridModeEnabled);
        stats.put("openAIFallbackEnabled", openAIFallbackEnabled);
        stats.put("confidenceThreshold", confidenceThreshold);
        
        // TODO: Add real metrics from database/cache
        stats.put("patternSuccessRate", 0.75);
        stats.put("aiUsageRate", 0.25);
        stats.put("costSavings", "75%");
        
        return stats;
    }
} 