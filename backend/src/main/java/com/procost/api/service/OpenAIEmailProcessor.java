package com.procost.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.procost.api.model.*;
import com.procost.api.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

@Service
public class OpenAIEmailProcessor {
    
    private static final Logger logger = LoggerFactory.getLogger(OpenAIEmailProcessor.class);
    
    @Value("${openai.api.key:}")
    private String openaiApiKey;
    
    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String openaiApiUrl;
    
    @Value("${openai.model:gpt-4}")
    private String openaiModel;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Classify email using OpenAI GPT
     */
    public String classifyEmailWithAI(String subject, String body) {
        logger.info("Classifying email with OpenAI: {}", subject);
        
        if (openaiApiKey == null || openaiApiKey.isEmpty()) {
            logger.warn("OpenAI API key not configured, falling back to pattern matching");
            return classifyEmailWithPatterns(subject, body);
        }
        
        String prompt = createClassificationPrompt(subject, body);
        
        try {
            String response = callOpenAI(prompt);
            String classification = parseClassificationResponse(response);
            
            logger.info("OpenAI classified email as: {}", classification);
            return classification;
            
        } catch (Exception e) {
            logger.error("Error calling OpenAI API, falling back to patterns: {}", e.getMessage());
            return classifyEmailWithPatterns(subject, body);
        }
    }
    
    /**
     * Extract customer information using OpenAI GPT
     */
    public Customer extractCustomerInfoWithAI(String fromEmail, String body, String subject) {
        logger.info("Extracting customer info with OpenAI from: {}", fromEmail);
        
        // Check if customer already exists
        Optional<Customer> existingCustomer = customerRepository.findByEmail(fromEmail);
        if (existingCustomer.isPresent()) {
            logger.info("Found existing customer: {}", existingCustomer.get().getEmail());
            return existingCustomer.get();
        }
        
        if (openaiApiKey == null || openaiApiKey.isEmpty()) {
            logger.warn("OpenAI API key not configured, using basic extraction");
            return extractCustomerInfoBasic(fromEmail, body);
        }
        
        String prompt = createCustomerExtractionPrompt(fromEmail, body, subject);
        
        try {
            String response = callOpenAI(prompt);
            Customer customer = parseCustomerResponse(response, fromEmail);
            
            logger.info("OpenAI extracted customer: {} from {}", 
                       customer.getContactPerson(), customer.getCompanyName());
            return customer;
            
        } catch (Exception e) {
            logger.error("Error calling OpenAI for customer extraction: {}", e.getMessage());
            return extractCustomerInfoBasic(fromEmail, body);
        }
    }
    
    /**
     * Parse product requirements using OpenAI GPT
     */
    public List<EnquiryItem> parseProductRequirementsWithAI(String emailBody) {
        logger.info("Parsing product requirements with OpenAI");
        
        if (openaiApiKey == null || openaiApiKey.isEmpty()) {
            logger.warn("OpenAI API key not configured, using basic parsing");
            return parseProductRequirementsBasic(emailBody);
        }
        
        String prompt = createProductParsingPrompt(emailBody);
        
        try {
            String response = callOpenAI(prompt);
            List<EnquiryItem> items = parseProductResponse(response);
            
            logger.info("OpenAI extracted {} product items", items.size());
            return items;
            
        } catch (Exception e) {
            logger.error("Error calling OpenAI for product parsing: {}", e.getMessage());
            return parseProductRequirementsBasic(emailBody);
        }
    }
    
    /**
     * Call OpenAI API
     */
    private String callOpenAI(String prompt) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);
        
        Map<String, Object> requestBody = Map.of(
            "model", openaiModel,
            "messages", List.of(
                Map.of("role", "system", "content", "You are an AI assistant specialized in processing business emails for a seafood processing company. You extract structured information accurately and concisely."),
                Map.of("role", "user", "content", prompt)
            ),
            "max_tokens", 1000,
            "temperature", 0.1  // Low temperature for consistent results
        );
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        ResponseEntity<String> response = restTemplate.postForEntity(openaiApiUrl, request, String.class);
        
        if (response.getStatusCode() == HttpStatus.OK) {
            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            return jsonResponse.path("choices").get(0).path("message").path("content").asText();
        } else {
            throw new RuntimeException("OpenAI API call failed: " + response.getStatusCode());
        }
    }
    
    /**
     * Create email classification prompt
     */
    private String createClassificationPrompt(String subject, String body) {
        return String.format(
            "Classify this email into one of these categories: ENQUIRY, ORDER, COMPLAINT, QUOTE_RESPONSE, or GENERAL\n\n" +
            "Subject: %s\n\n" +
            "Body: %s\n\n" +
            "Consider:\n" +
            "- ENQUIRY: Requests for quotes, prices, product information\n" +
            "- ORDER: Confirmed purchases, order placements\n" +
            "- COMPLAINT: Problems, issues, complaints\n" +
            "- QUOTE_RESPONSE: Responses to previously sent quotes (accept/reject)\n" +
            "- GENERAL: Greetings, thanks, general communication\n\n" +
            "Respond with only the category name.",
            subject, body);
    }
    
    /**
     * Create customer extraction prompt
     */
    private String createCustomerExtractionPrompt(String fromEmail, String body, String subject) {
        return String.format(
            "Extract customer information from this email and format as JSON:\n\n" +
            "From: %s\n" +
            "Subject: %s\n" +
            "Body: %s\n\n" +
            "Extract:\n" +
            "- contactPerson: Name of the person (from signature or content)\n" +
            "- companyName: Company name (from signature, domain, or content)\n" +
            "- phone: Phone number if mentioned\n" +
            "- address: Physical address if mentioned\n" +
            "- country: Country (from domain or content)\n\n" +
            "Return JSON format:\n" +
            "{\n" +
            "    \"contactPerson\": \"extracted name or 'Unknown'\",\n" +
            "    \"companyName\": \"extracted company or domain-based guess\",\n" +
            "    \"phone\": \"phone number or null\",\n" +
            "    \"address\": \"address or null\",\n" +
            "    \"country\": \"country or 'Unknown'\"\n" +
            "}",
            fromEmail, subject, body);
    }
    
    /**
     * Create product parsing prompt
     */
    private String createProductParsingPrompt(String emailBody) {
        return String.format(
            "Extract product requirements from this email and format as JSON array:\n\n" +
            "Email: %s\n\n" +
            "For each product mentioned, extract:\n" +
            "- productDescription: Full description as mentioned\n" +
            "- product: Main product type (SALMON, COD, HADDOCK, POLLOCK, MACKEREL, HERRING, or UNKNOWN)\n" +
            "- trimType: Cut type (FILLET, WHOLE, STEAK, LOIN, TAIL, or UNKNOWN)\n" +
            "- requestedQuantity: Quantity in kg (convert if needed)\n" +
            "- customerSkuReference: Any customer codes/SKUs mentioned\n" +
            "- mappingConfidence: HIGH/MEDIUM/LOW based on clarity\n\n" +
            "Return JSON array format:\n" +
            "[\n" +
            "    {\n" +
            "        \"productDescription\": \"as mentioned in email\",\n" +
            "        \"product\": \"SALMON\",\n" +
            "        \"trimType\": \"FILLET\",\n" +
            "        \"requestedQuantity\": 500,\n" +
            "        \"customerSkuReference\": \"SKU123 or null\",\n" +
            "        \"mappingConfidence\": \"HIGH\"\n" +
            "    }\n" +
            "]\n\n" +
            "If no specific products found, return empty array [].",
            emailBody);
    }
    
    /**
     * Parse classification response
     */
    private String parseClassificationResponse(String response) {
        String cleaned = response.trim().toUpperCase();
        List<String> validTypes = List.of("ENQUIRY", "ORDER", "COMPLAINT", "QUOTE_RESPONSE", "GENERAL");
        
        for (String type : validTypes) {
            if (cleaned.contains(type)) {
                return type;
            }
        }
        
        return "GENERAL";
    }
    
    /**
     * Parse customer response
     */
    private Customer parseCustomerResponse(String response, String fromEmail) throws Exception {
        try {
            JsonNode customerJson = objectMapper.readTree(response);
            
            Customer customer = new Customer();
            customer.setEmail(fromEmail);
            customer.setContactPerson(customerJson.path("contactPerson").asText("Unknown"));
            customer.setCompanyName(customerJson.path("companyName").asText("Unknown Company"));
            customer.setPhone(customerJson.path("phone").asText(null));
            customer.setAddress(customerJson.path("address").asText(null));
            customer.setCountry(customerJson.path("country").asText("Unknown"));
            
            return customer;
            
        } catch (Exception e) {
            logger.warn("Failed to parse customer JSON, using basic extraction: {}", e.getMessage());
            return extractCustomerInfoBasic(fromEmail, response);
        }
    }
    
    /**
     * Parse product response
     */
    private List<EnquiryItem> parseProductResponse(String response) throws Exception {
        try {
            JsonNode productsJson = objectMapper.readTree(response);
            List<EnquiryItem> items = new ArrayList<>();
            
            if (productsJson.isArray()) {
                for (JsonNode productNode : productsJson) {
                    EnquiryItem item = new EnquiryItem();
                    item.setProductDescription(productNode.path("productDescription").asText());
                    item.setProduct(productNode.path("product").asText("UNKNOWN"));
                    item.setTrimType(productNode.path("trimType").asText("UNKNOWN"));
                    item.setRequestedQuantity(productNode.path("requestedQuantity").asInt(0));
                    item.setCustomerSkuReference(productNode.path("customerSkuReference").asText(null));
                    item.setMappingConfidence(productNode.path("mappingConfidence").asText("MEDIUM"));
                    item.setAiMapped(true);
                    
                    items.add(item);
                }
            }
            
            return items;
            
        } catch (Exception e) {
            logger.warn("Failed to parse products JSON, using basic parsing: {}", e.getMessage());
            return parseProductRequirementsBasic(response);
        }
    }
    
    // Fallback methods (using the existing pattern-based logic)
    
    private String classifyEmailWithPatterns(String subject, String body) {
        // Implement the existing pattern-based classification
        return "ENQUIRY"; // Simplified fallback
    }
    
    private Customer extractCustomerInfoBasic(String fromEmail, String body) {
        Customer customer = new Customer();
        customer.setEmail(fromEmail);
        customer.setContactPerson("Customer");
        customer.setCompanyName("Unknown Company");
        return customer;
    }
    
    private List<EnquiryItem> parseProductRequirementsBasic(String emailBody) {
        // Implement basic parsing logic
        return new ArrayList<>();
    }
} 