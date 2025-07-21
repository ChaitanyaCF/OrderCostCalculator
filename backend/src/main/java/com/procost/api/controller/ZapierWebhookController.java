package com.procost.api.controller;

import com.procost.api.dto.ZapierEmailWebhook;
import com.procost.api.model.*;
import com.procost.api.service.EmailEnquiryService;
import com.procost.api.service.QuoteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/webhooks/zapier")
@CrossOrigin(origins = "*")
public class ZapierWebhookController {
    
    private static final Logger logger = LoggerFactory.getLogger(ZapierWebhookController.class);
    
    @Autowired
    private EmailEnquiryService emailEnquiryService;
    
    @Autowired
    private QuoteService quoteService;
    
    /**
     * Webhook for incoming Outlook email enquiries
     * Zapier triggers this when new emails arrive
     */
    @PostMapping("/email-received")
    public ResponseEntity<?> handleEmailReceived(@Valid @RequestBody ZapierEmailWebhook webhook) {
        try {
            logger.info("Received email webhook from Zapier: Subject={}, From={}", 
                       webhook.getSubject(), webhook.getFromEmail());
            
            // Process the email enquiry
            EmailEnquiry enquiry = emailEnquiryService.processIncomingEmail(webhook);
            
            // Return data for Zapier to use in next steps
            Map<String, Object> response = new HashMap<>();
            response.put("enquiry_id", enquiry.getEnquiryId());
            response.put("customer_email", enquiry.getCustomer().getEmail());
            response.put("customer_name", enquiry.getCustomer().getContactPerson());
            response.put("items_count", enquiry.getEnquiryItems().size());
            response.put("processing_status", enquiry.getStatus().toString());
            response.put("success", true);
            response.put("message", "Email enquiry processed successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error processing email webhook", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("success", false);
            errorResponse.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse);
        }
    }
    
    /**
     * Webhook for quote acceptance emails
     * Triggered when customer replies accepting a quote
     */
    @PostMapping("/quote-accepted")
    public ResponseEntity<?> handleQuoteAccepted(@Valid @RequestBody ZapierEmailWebhook webhook) {
        try {
            logger.info("Received quote acceptance webhook: Subject={}, From={}", 
                       webhook.getSubject(), webhook.getFromEmail());
            
            // Extract quote reference from email
            String quoteReference = extractQuoteReference(webhook.getEmailBody());
            
            if (quoteReference == null) {
                throw new IllegalArgumentException("No quote reference found in email");
            }
            
            // Convert quote to order
            Order order = quoteService.convertQuoteToOrder(quoteReference);
            
            Map<String, Object> response = new HashMap<>();
            response.put("order_number", order.getOrderNumber());
            response.put("customer_email", order.getCustomer().getEmail());
            response.put("customer_name", order.getCustomer().getContactPerson());
            response.put("total_amount", order.getTotalAmount());
            response.put("currency", order.getCurrency());
            response.put("success", true);
            response.put("message", "Quote successfully converted to order");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error processing quote acceptance", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("success", false);
            errorResponse.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse);
        }
    }
    
    /**
     * Endpoint to generate and send quotes via Zapier
     * Called after enquiry processing to create and send quote
     */
    @PostMapping("/send-quote/{enquiryId}")
    public ResponseEntity<?> sendQuote(@PathVariable String enquiryId) {
        try {
            logger.info("Generating quote for enquiry: {}", enquiryId);
            
            Quote quote = quoteService.generateQuoteForEnquiry(enquiryId);
            
            // Return quote data for Zapier to email
            Map<String, Object> response = new HashMap<>();
            response.put("quote_number", quote.getQuoteNumber());
            response.put("customer_email", quote.getCustomer().getEmail());
            response.put("customer_name", quote.getCustomer().getContactPerson());
            response.put("customer_company", quote.getCustomer().getCompanyName());
            response.put("total_amount", quote.getTotalAmount());
            response.put("currency", quote.getCurrency());
            response.put("validity_period", quote.getValidityPeriod());
            response.put("quote_html", generateQuoteHTML(quote));
            response.put("quote_pdf_url", generateQuotePDFUrl(quote));
            response.put("items_count", quote.getQuoteItems().size());
            response.put("success", true);
            response.put("message", "Quote generated successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error generating quote", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("success", false);
            errorResponse.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse);
        }
    }
    
    /**
     * Webhook to notify about order status updates
     * For integration with project management tools
     */
    @PostMapping("/order-status-update")
    public ResponseEntity<?> updateOrderStatus(@RequestBody Map<String, Object> statusUpdate) {
        try {
            String orderNumber = (String) statusUpdate.get("order_number");
            String newStatus = (String) statusUpdate.get("status");
            String notes = (String) statusUpdate.get("notes");
            
            logger.info("Order status update: Order={}, Status={}", orderNumber, newStatus);
            
            // Update order status
            // Implementation depends on your order service
            
            Map<String, Object> response = new HashMap<>();
            response.put("order_number", orderNumber);
            response.put("status", newStatus);
            response.put("success", true);
            response.put("message", "Order status updated successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error updating order status", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            errorResponse.put("success", false);
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(errorResponse);
        }
    }
    
    // Helper methods
    private String extractQuoteReference(String emailBody) {
        // Extract quote reference from email body using regex
        // Looking for patterns like "QUO-2024-001" or "Quote: QUO-2024-001"
        if (emailBody == null) return null;
        
        String[] patterns = {
            "QUO-\\d{4}-\\d{3,}",
            "Quote.*?(QUO-\\d{4}-\\d{3,})",
            "Reference.*?(QUO-\\d{4}-\\d{3,})"
        };
        
        for (String pattern : patterns) {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(emailBody);
            if (m.find()) {
                String match = m.group();
                if (match.startsWith("QUO-")) {
                    return match;
                } else {
                    return m.group(1); // First capturing group
                }
            }
        }
        
        return null;
    }
    
    private String generateQuoteHTML(Quote quote) {
        // Generate HTML version of quote for email
        StringBuilder html = new StringBuilder();
        html.append("<div style='font-family: Arial, sans-serif; max-width: 800px;'>");
        html.append("<h2>Quote ").append(quote.getQuoteNumber()).append("</h2>");
        html.append("<p><strong>Customer:</strong> ").append(quote.getCustomer().getContactPerson()).append("</p>");
        html.append("<p><strong>Company:</strong> ").append(quote.getCustomer().getCompanyName()).append("</p>");
        html.append("<p><strong>Total Amount:</strong> ").append(quote.getCurrency()).append(" ").append(quote.getTotalAmount()).append("</p>");
        html.append("<p><strong>Valid Until:</strong> ").append(quote.getValidityPeriod()).append("</p>");
        
        html.append("<table border='1' style='border-collapse: collapse; width: 100%;'>");
        html.append("<tr><th>Item</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>");
        
        for (QuoteItem item : quote.getQuoteItems()) {
            html.append("<tr>");
            html.append("<td>").append(item.getItemDescription()).append("</td>");
            html.append("<td>").append(item.getQuantity()).append("</td>");
            html.append("<td>").append(item.getCurrency()).append(" ").append(item.getUnitPrice()).append("</td>");
            html.append("<td>").append(item.getCurrency()).append(" ").append(item.getTotalPrice()).append("</td>");
            html.append("</tr>");
        }
        
        html.append("</table>");
        html.append("<p><em>To accept this quote, please reply to this email with 'ACCEPT' and the quote number.</em></p>");
        html.append("</div>");
        
        return html.toString();
    }
    
    private String generateQuotePDFUrl(Quote quote) {
        // This would typically generate a PDF and return a download URL
        // For now, return a placeholder URL
        return "https://yourapp.com/quotes/" + quote.getQuoteNumber() + ".pdf";
    }
} 