package com.procost.api.service;

import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatCompletionResult;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import com.procost.api.model.EnquiryItem;
import com.procost.api.model.Customer;
import com.procost.api.repository.CustomerRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.*;

@Service
public class OpenAIService {
    
    private static final Logger logger = LoggerFactory.getLogger(OpenAIService.class);
    
    @Value("${openai.api.key:}")
    private String openaiApiKey;
    
    @Value("${openai.model:gpt-4.1-mini}")
    private String openaiModel;
    
    @Value("${ai.request.timeout:120000}")
    private long requestTimeout;
    
    @Autowired
    private CustomerRepository customerRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Parse product requirements using OpenAI SDK
     */
    public List<EnquiryItem> parseProductRequirements(String emailBody) {
        logger.info("🤖 Using OpenAI to parse products from email (length: {})", emailBody.length());
        
        if (openaiApiKey == null || openaiApiKey.isEmpty()) {
            logger.warn("❌ OpenAI API key not configured");
            return new ArrayList<>();
        }
        
        try {
            // Create OpenAI service with configurable timeout
            OpenAiService service = new OpenAiService(openaiApiKey, Duration.ofMillis(requestTimeout));
            
            // 🌍 Step 1: Translate to English if needed
            String translatedEmailBody = translateToEnglish(service, emailBody);
            
            // Create comprehensive prompt
            String prompt = createProductParsingPrompt(translatedEmailBody);
            logger.info("📝 Sending prompt to OpenAI (length: {} chars)", prompt.length());
            
            // Create chat completion request
            ChatCompletionRequest chatRequest = ChatCompletionRequest.builder()
                    .model(openaiModel)
                    .messages(Arrays.asList(
                            new ChatMessage(ChatMessageRole.SYSTEM.value(), 
                                "You are an expert seafood industry analyst. Extract structured product data from emails and return only valid JSON."),
                            new ChatMessage(ChatMessageRole.USER.value(), prompt)
                    ))
                    .maxTokens(7283)
                    .temperature(0.1)
                    .build();
            
            // Call OpenAI
            logger.info("🔗 Making OpenAI API call...");
            ChatCompletionResult result = service.createChatCompletion(chatRequest);
            
            // Get response
            String response = result.getChoices().get(0).getMessage().getContent();
            logger.info("✅ OpenAI response received (length: {})", response.length());
            
            // 🔍 LOG THE COMPLETE RAW JSON RESPONSE
            logger.info("📋 RAW OPENAI JSON RESPONSE:");
            logger.info("=" + "=".repeat(80));
            logger.info(response);
            logger.info("=" + "=".repeat(80));
            
            // Parse response
            List<EnquiryItem> items = parseProductResponse(response);
            logger.info("🎯 Successfully extracted {} items", items.size());
            
            return items;
            
        } catch (Exception e) {
            logger.error("❌ OpenAI call failed: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Extract customer information using OpenAI
     */
    public Customer extractCustomerInfo(String fromEmail, String emailBody, String subject) {
        logger.info("👤 Extracting customer info from: {}", fromEmail);
        
        // Check if customer already exists
        Optional<Customer> existingCustomer = customerRepository.findByEmail(fromEmail);
        if (existingCustomer.isPresent()) {
            logger.info("✅ Found existing customer: {}", existingCustomer.get().getCompanyName());
            return existingCustomer.get();
        }
        
        if (openaiApiKey == null || openaiApiKey.isEmpty()) {
            logger.warn("❌ OpenAI API key not configured, using basic extraction");
            return createBasicCustomer(fromEmail);
        }
        
        try {
            OpenAiService service = new OpenAiService(openaiApiKey, Duration.ofSeconds(40));
            
            // 🌍 Translate email content if needed
            String translatedEmailBody = translateToEnglish(service, emailBody);
            String translatedSubject = translateToEnglish(service, subject);
            
            String prompt = createCustomerExtractionPrompt(fromEmail, translatedEmailBody, translatedSubject);
            
            ChatCompletionRequest chatRequest = ChatCompletionRequest.builder()
                    .model(openaiModel)
                    .messages(Arrays.asList(
                            new ChatMessage(ChatMessageRole.SYSTEM.value(), 
                                "You are an expert at extracting customer information from business emails. Return only valid JSON."),
                            new ChatMessage(ChatMessageRole.USER.value(), prompt)
                    ))
                    .maxTokens(500)
                    .temperature(0.1)
                    .build();
            
            ChatCompletionResult result = service.createChatCompletion(chatRequest);
            String response = result.getChoices().get(0).getMessage().getContent();
            
            // 🔍 LOG THE COMPLETE RAW CUSTOMER JSON RESPONSE
            logger.info("👤 RAW CUSTOMER OPENAI JSON RESPONSE:");
            logger.info("=" + "=".repeat(80));
            logger.info(response);
            logger.info("=" + "=".repeat(80));
            
            Customer customer = parseCustomerResponse(response, fromEmail);
            logger.info("✅ Extracted customer: {} from {}", customer.getContactPerson(), customer.getCompanyName());
            
            return customer;
            
        } catch (Exception e) {
            logger.error("❌ Customer extraction failed: {}", e.getMessage());
            return createBasicCustomer(fromEmail);
        }
    }
    
    /**
     * Classify email type using OpenAI
     */
    public String classifyEmail(String subject, String emailBody) {
        logger.info("📧 Classifying email with subject: {}", subject);
        
        if (openaiApiKey == null || openaiApiKey.isEmpty()) {
            logger.warn("❌ OpenAI API key not configured, using basic classification");
            return classifyEmailBasic(subject, emailBody);
        }
        
        try {
            OpenAiService service = new OpenAiService(openaiApiKey, Duration.ofSeconds(40));
            
            // 🌍 Translate content before classification
            String translatedSubject = translateToEnglish(service, subject);
            String translatedEmailBody = translateToEnglish(service, emailBody);
            
            String prompt = createClassificationPrompt(translatedSubject, translatedEmailBody);
            
            ChatCompletionRequest chatRequest = ChatCompletionRequest.builder()
                    .model(openaiModel)
                    .messages(Arrays.asList(
                            new ChatMessage(ChatMessageRole.SYSTEM.value(), 
                                "You are an email classifier. Classify business emails into categories and return only the category name."),
                            new ChatMessage(ChatMessageRole.USER.value(), prompt)
                    ))
                    .maxTokens(50)
                    .temperature(0.1)
                    .build();
            
            ChatCompletionResult result = service.createChatCompletion(chatRequest);
            String response = result.getChoices().get(0).getMessage().getContent().trim().toUpperCase();
            
            // 🔍 LOG THE COMPLETE RAW CLASSIFICATION RESPONSE
            logger.info("📧 RAW CLASSIFICATION OPENAI RESPONSE:");
            logger.info("=" + "=".repeat(80));
            logger.info(response);
            logger.info("=" + "=".repeat(80));
            
            // Validate response
            List<String> validTypes = Arrays.asList("ENQUIRY", "ORDER", "COMPLAINT", "QUOTE_RESPONSE", "GENERAL");
            if (validTypes.contains(response)) {
                logger.info("✅ Email classified as: {}", response);
                return response;
            } else {
                logger.warn("❌ Invalid classification '{}', using basic classification", response);
                return classifyEmailBasic(subject, emailBody);
            }
            
        } catch (Exception e) {
            logger.error("❌ Email classification failed: {}", e.getMessage());
            return classifyEmailBasic(subject, emailBody);
        }
    }
    
    /**
     * Create comprehensive product extraction prompt
     */
    private String createProductParsingPrompt(String emailBody) {
        return String.format(
            "Carefully analyze the email content to identify each separate product or SKU discussed.\n\n" +
            "For every SKU mentioned, extract its corresponding data fields: product_type, Trim, product_cut ,rm_spec/size,Quality, pack_type, pack_material, qty, qty_unit, delivery_date, transport_mode, and special_notes. If the email mentions multiple rm_spec/size options or multiple packaging types for a product group without specifying quantities per variant, treat each rm_spec/pack_type combination as a separate SKU. Add same qty and qty_unit for each variation unless qty for any variation is explicitly mentioned.\n\n" +
            "Do not combine or merge data from multiple SKUs. Instead, return a JSON object with the key \"products\" whose value is a list of objects, each representing a single SKU with these fields.\n\n" +
            "If any field is missing for a SKU, return null for that field.\n\n" +
            "Include the overall customer_name once per email.\n\n" +
            "Provide a separate top-level special_notes field summarizing any general instructions or special conditions applying across products.\n\n" +
            "Format date fields (delivery_date) strictly as YYYY-MM-DD or as a date range if the information implies a period. Extract year from email content don't assume years, if date, month or year is missing show null for that field\n\n" +
            "Think step-by-step to identify and extract each required field from the email body before listing the final results. Continue this process for all target fields and persist until the objective is complete.\n\n" +
            "EMAIL:\n%s\n\n" +
            "Provide your output as a JSON object with the following keys:\n" +
            "- customer_name\n" +
            "- product_type (fresh or frozen)\n" +
            "-Trim (A,B,C,D,E etc)\n" +
            "- product_cut (Fillet, Portion and HOG Frozen)\n" +
            "-rm_spec/size (1-2 kg, 3-4 kg etc, do not add attributes such as 2x125 in rm_spec they are pack_type attributes )\n" +
            "-Quality (if no explicit mention, assume Superior grade quality. If mentioned extract)\n" +
            "- pack_type (2x125, VAC, Chainpack etc)\n" +
            "- pack_material (Corrugated Box, Solid Box, Retail Box, etc)\n" +
            "- box_qty (5kg, 8kg, 10kg,20kg, etc)\n"+
            "- qty\n" +
            "- qty_unit\n" +
            "- delivery_date (YYYY-MM-DD)\n" +
            "- transport_mode (Air, Regular, etc)\n" +
            "- special_notes (neck part cut, tails in/splited, 3cm brown meat, etc)\n\n" +
            "There might be multiple products being discussed in the email look out for that\n\n" +
            "Hard rules:\n" +
            "- Extract ONLY what's written - no assumptions except for quality grade\n" +
            "- Convert units consistently (1 ton = 1000 kg)\n" +
            "- Return only valid JSON, no markdown or comments",
            emailBody
        );
    }
    
    
    /**
     * Create customer extraction prompt
     */
    private String createCustomerExtractionPrompt(String fromEmail, String emailBody, String subject) {
        return String.format(
            "Extract customer information from this email:\n\n" +
            "From: %s\nSubject: %s\nBody: %s\n\n" +
            "Return JSON with:\n" +
            "{\n" +
            "  \"contactPerson\": \"person name or Unknown\",\n" +
            "  \"companyName\": \"company name or derive from email domain\",\n" +
            "  \"phone\": \"phone number or null\",\n" +
            "  \"country\": \"country or Unknown\"\n" +
            "}\n\n" +
            "Return only valid JSON, no markdown.",
            fromEmail, subject, emailBody
        );
    }
    
    /**
     * Create email classification prompt
     */
    private String createClassificationPrompt(String subject, String emailBody) {
        return String.format(
            "Classify this email into one of these categories: ENQUIRY, ORDER, COMPLAINT, QUOTE_RESPONSE, GENERAL\n\n" +
            "Subject: %s\n" +
            "Body: %s\n\n" +
            "Categories:\n" +
            "- ENQUIRY: Requests for quotes, prices, product information, tenders, volumes, estimations, pricing needs\n" +
            "- ORDER: Confirmed purchases, order placements, confirmed delivery\n" +
            "- COMPLAINT: Problems, issues, complaints, errors\n" +
            "-STOCK CHECK: Asking for details of stock at the factory\n"+
            "- QUOTE_RESPONSE: Responses to quotes (accept/reject/approve)\n" +
            "- GENERAL: Simple greetings, thanks only, general communication\n\n" +
            "IMPORTANT: If the email mentions prices, quotes, tenders, volumes, estimations, or product specifications, classify as ENQUIRY.\n\n" +
            "Return only the category name.",
            subject, emailBody
        );
    }
    
    /**
     * Basic email classification fallback
     */
    private String classifyEmailBasic(String subject, String emailBody) {
        String combined = (subject + " " + emailBody).toLowerCase();
        
        if (combined.contains("quote") || combined.contains("price") || combined.contains("cost") || 
            combined.contains("enquiry") || combined.contains("inquiry")) {
            return "ENQUIRY";
        } else if (combined.contains("order") || combined.contains("purchase") || combined.contains("buy")) {
            return "ORDER";
        } else if (combined.contains("complaint") || combined.contains("problem") || combined.contains("issue")) {
            return "COMPLAINT";
        } else if (combined.contains("accept") || combined.contains("reject") || combined.contains("approve")) {
            return "QUOTE_RESPONSE";
        } else {
            return "GENERAL";
        }
    }
    
    /**
     * Parse product response with markdown cleaning
     */
    private List<EnquiryItem> parseProductResponse(String response) {
        try {
            // Clean markdown formatting
            String cleanedResponse = cleanMarkdownResponse(response);
            logger.info("🧹 Cleaned response for parsing");
            
            JsonNode jsonNode = objectMapper.readTree(cleanedResponse);
            List<EnquiryItem> items = new ArrayList<>();
            
            // Handle new JSON structure with "products" array
            if (jsonNode.has("products") && jsonNode.get("products").isArray()) {
                JsonNode productsArray = jsonNode.get("products");
                logger.info("✅ Processing new JSON structure with {} products", productsArray.size());
                
                for (JsonNode productNode : productsArray) {
                    EnquiryItem item = createEnquiryItem(productNode);
                    items.add(item);
                    logger.info("📦 Created: {} {} - {} {}", 
                              item.getProduct(), item.getTrimType(), 
                              item.getRequestedQuantity(), item.getBoxQuantity());
                }
            } else if (jsonNode.isArray()) {
                // Fallback for old format
                logger.info("✅ Processing legacy JSON array with {} elements", jsonNode.size());
                for (JsonNode productNode : jsonNode) {
                    EnquiryItem item = createEnquiryItem(productNode);
                    items.add(item);
                    logger.info("📦 Created: {} {} - {} kg", item.getProduct(), item.getTrimType(), item.getRequestedQuantity());
                }
            }
            
            return items;
            
        } catch (Exception e) {
            logger.error("❌ Failed to parse product response: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
    
    /**
     * Parse customer response
     */
    private Customer parseCustomerResponse(String response, String fromEmail) {
        try {
            String cleanedResponse = cleanMarkdownResponse(response);
            JsonNode customerJson = objectMapper.readTree(cleanedResponse);
            
            Customer customer = new Customer();
            customer.setEmail(fromEmail);
            customer.setContactPerson(customerJson.path("contactPerson").asText("Unknown"));
            customer.setCompanyName(customerJson.path("companyName").asText(deriveCompanyFromEmail(fromEmail)));
            customer.setPhone(customerJson.path("phone").asText(null));
            customer.setCountry(customerJson.path("country").asText("Unknown"));
            customer.setAddress("Not provided");
            
            return customer;
            
        } catch (Exception e) {
            logger.warn("Failed to parse customer JSON: {}", e.getMessage());
            return createBasicCustomer(fromEmail);
        }
    }
    
    /**
     * Create EnquiryItem from JSON node
     */
    private EnquiryItem createEnquiryItem(JsonNode productNode) {
        EnquiryItem item = new EnquiryItem();
        
        // Map new JSON structure fields - handle both case variations
        String productCut = productNode.path("product_cut").asText(productNode.path("product").asText("UNKNOWN"));
        String trim = productNode.path("Trim").asText(productNode.path("trim").asText(productNode.path("trimType").asText("UNKNOWN")));
        String productType = productNode.path("product_type").asText(productNode.path("productType").asText("UNKNOWN"));
        String rmSpec = productNode.path("rm_spec/size").asText(productNode.path("rm_spec").asText("N/A"));
        String quality = productNode.path("Quality").asText(productNode.path("quality").asText("superior grade quality"));
        String packType = productNode.path("pack_type").asText(productNode.path("packagingType").asText("UNKNOWN"));
        String packMaterial = productNode.path("pack_material").asText("N/A");
        String boxQty = productNode.path("box_qty").asText("Not specified");
        String qtyUnit = productNode.path("qty_unit").asText("kg");
        String deliveryDate = productNode.path("delivery_date").asText("TBD");
        String transportMode = productNode.path("transport_mode").asText(productNode.path("transportMode").asText("TBD"));
        String specialNotes = productNode.path("special_notes").asText(productNode.path("description").asText(""));
        
        // Parse quantity - handle both "qty" and legacy "quantity"
        int quantity = 0;
        if (productNode.has("qty")) {
            quantity = productNode.path("qty").asInt(0);
        } else if (productNode.has("quantity")) {
            quantity = productNode.path("quantity").asInt(0);
        }
        
        // Convert units if needed
        if ("tons".equalsIgnoreCase(qtyUnit) || "ton".equalsIgnoreCase(qtyUnit)) {
            quantity = quantity * 1000; // Convert tons to kg
            qtyUnit = "kg";
        }
        
        // Set mapped fields
        item.setProduct(productCut); // Keep exact product cut (Fillet/Portion)
        item.setRequestedQuantity(quantity);
        item.setTrimType(trim.equals("UNKNOWN") ? rmSpec : trim); // Use rmSpec if trim is unknown
        item.setProductDescription(productCut + " " + rmSpec + " " + productType + " " + packType + " " + packMaterial + " " + boxQty + " - " + specialNotes);
        item.setPackagingType(packType);
        logger.info("🔍 DEBUG pack_material mapping: raw='{}', final='{}'", packMaterial, 
                   packMaterial.equals("N/A") || packMaterial.isEmpty() ? "Not specified" : packMaterial);
        item.setPackMaterial(packMaterial.equals("N/A") || packMaterial.isEmpty() ? "Not specified" : packMaterial);
        item.setBoxQuantity(boxQty.equals("Not specified") || boxQty.isEmpty() ? "Not specified" : boxQty);
        item.setTransportMode(transportMode.equals("UNKNOWN") ? "Not specified" : transportMode);
        
        // Set new detailed fields
        item.setRmSpec(rmSpec);
        item.setProductType(productType.toUpperCase());
        item.setDeliveryRequirement(deliveryDate);
        item.setSpecialInstructions(specialNotes.isEmpty() ? quality : quality + " - " + specialNotes);
        
        // Set processing metadata
        item.setMappingConfidence("HIGH");
        item.setAiMapped(true);
        item.setAiProcessingNotes("Extracted using enhanced OpenAI prompt with detailed field mapping");
        
        return item;
    }
    
    /**
     * Clean markdown formatting from OpenAI response
     */
    private String cleanMarkdownResponse(String response) {
        String cleaned = response.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        }
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }
    
    /**
     * Create basic customer from email
     */
    private Customer createBasicCustomer(String fromEmail) {
        Customer customer = new Customer();
        customer.setEmail(fromEmail);
        customer.setContactPerson("Customer");
        customer.setCompanyName(deriveCompanyFromEmail(fromEmail));
        customer.setAddress("Not provided");
        customer.setCountry("Unknown");
        return customer;
    }
    
    /**
     * Derive company name from email domain
     */
    private String deriveCompanyFromEmail(String email) {
        if (email.contains("@")) {
            String domain = email.substring(email.indexOf("@") + 1);
            if (domain.contains(".")) {
                String company = domain.substring(0, domain.indexOf("."));
                return company.substring(0, 1).toUpperCase() + company.substring(1).toLowerCase() + " Corp";
            }
        }
        return "Unknown Company";
    }
    
    /**
     * Translate email to English if needed
     */
    private String translateToEnglish(OpenAiService service, String emailBody) {
        logger.info("🌍 Checking if translation is needed...");
        
        try {
            // First, detect if email is in English
            String detectionPrompt = String.format(
                "Analyze this email and respond with just 'ENGLISH' if it's primarily in English, " +
                "or the language name (e.g., 'SPANISH', 'FRENCH', 'GERMAN', 'DANISH',etc) if it's in another language:\n\n%s",
                emailBody.length() > 500 ? emailBody.substring(0, 500) + "..." : emailBody
            );
            
            ChatCompletionRequest detectionRequest = ChatCompletionRequest.builder()
                    .model(openaiModel)
                    .messages(Arrays.asList(
                            new ChatMessage(ChatMessageRole.USER.value(), detectionPrompt)
                    ))
                    .maxTokens(50)
                    .temperature(0.1)
                    .build();
            
            ChatCompletionResult detectionResult = service.createChatCompletion(detectionRequest);
            String detectedLanguage = detectionResult.getChoices().get(0).getMessage().getContent().trim().toUpperCase();
            
            logger.info("🗣️ Detected language: {}", detectedLanguage);
            
            // If already in English, return as-is
            if ("ENGLISH".equals(detectedLanguage)) {
                logger.info("✅ Email is already in English, no translation needed");
                return emailBody;
            }
            
            // Translate to English
            logger.info("🔄 Translating from {} to English...", detectedLanguage);
            
            String translationPrompt = String.format(
                "Translate this email to English. Preserve all product names, quantities, dates, and technical terms exactly. " +
                "Maintain the structure and formatting. Do not add explanations, just provide the translation:\n\n%s",
                emailBody
            );
            
            ChatCompletionRequest translationRequest = ChatCompletionRequest.builder()
                    .model(openaiModel)
                    .messages(Arrays.asList(
                            new ChatMessage(ChatMessageRole.SYSTEM.value(), 
                                "You are a professional translator specializing in business communications. " +
                                "Translate accurately while preserving technical terms, product specifications, and quantities."),
                            new ChatMessage(ChatMessageRole.USER.value(), translationPrompt)
                    ))
                    .maxTokens(2000)
                    .temperature(0.1)
                    .build();
            
            ChatCompletionResult translationResult = service.createChatCompletion(translationRequest);
            String translatedText = translationResult.getChoices().get(0).getMessage().getContent().trim();
            
            // 📋 LOG TRANSLATION DETAILS
            logger.info("🌍 TRANSLATION COMPLETED:");
            logger.info("Original Language: {}", detectedLanguage);
            logger.info("Original Text (first 200 chars): {}", 
                       emailBody.length() > 200 ? emailBody.substring(0, 200) + "..." : emailBody);
            logger.info("Translated Text (first 200 chars): {}", 
                       translatedText.length() > 200 ? translatedText.substring(0, 200) + "..." : translatedText);
            
            return translatedText;
            
        } catch (Exception e) {
            logger.warn("❌ Translation failed, using original text: {}", e.getMessage());
            return emailBody;
        }
    }
}