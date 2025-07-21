# Zapier MCP Integration Guide for Email-Driven Order Management

## Overview
This guide shows how to connect your Outlook email to the OrderCostCalculator backend using Zapier MCP (Model Context Protocol) for automated email enquiry processing.

## Prerequisites
- ✅ Backend running on port 8082 with webhook endpoints
- ✅ Frontend running on port 3001 with Email Dashboard
- 📧 Outlook email account (business or personal)
- 🔧 Zapier account (free or paid)
- 🌐 Public URL for webhooks (ngrok, production server, etc.)

## Step 1: Expose Backend Webhooks Publicly

### Option A: Using ngrok (for testing)
```bash
# Install ngrok if you haven't already
brew install ngrok  # macOS
# or download from https://ngrok.com/

# Expose your backend
ngrok http 8082

# Note the public URL (e.g., https://abc123.ngrok.io)
```

### Option B: Production Deployment
Deploy your backend to a cloud service (AWS, Heroku, DigitalOcean, etc.) with SSL.

## Step 2: Zapier Workflow Configuration

### Workflow 1: Email Enquiry Processing

#### Trigger: New Email in Outlook
1. **Go to Zapier** → Create New Zap
2. **Choose Trigger**: Microsoft Outlook → "New Email"
3. **Configure Trigger**:
   - Connect your Outlook account
   - Choose folder: "Inbox" or create "Enquiries" folder
   - Set filters (optional):
     - Subject contains: "enquiry", "quote", "order"
     - From domain: specific customers
     - Has attachments: Yes/No

#### Action 1: Webhook POST to Backend
1. **Choose Action**: Webhooks by Zapier → "POST"
2. **Configure Webhook**:
   ```
   URL: YOUR_PUBLIC_URL/webhooks/zapier/email-received
   Method: POST
   Headers:
     Authorization: Bearer YOUR_JWT_TOKEN
     Content-Type: application/json
   
   Data (JSON):
   {
     "fromEmail": "{{from__email}}",
     "toEmail": "{{to__email}}",
     "subject": "{{subject}}",
     "body": "{{body_plain}}",
     "bodyHtml": "{{body_html}}",
     "receivedAt": "{{date_time_received}}",
     "attachments": [
       {
         "filename": "{{attachments__0__name}}",
         "downloadUrl": "{{attachments__0__download_url}}"
       }
     ]
   }
   ```

#### Action 2: Create Enquiry Folder (Optional)
1. **Choose Action**: Microsoft Outlook → "Create Folder"
2. **Configure**:
   - Parent Folder: Inbox
   - Folder Name: "Processed-{{date}}"

#### Action 3: Move Email to Processed Folder
1. **Choose Action**: Microsoft Outlook → "Move Email"
2. **Configure**:
   - Email: Use email from trigger
   - Destination Folder: "Processed" or created folder

### Workflow 2: Quote Acceptance Processing

#### Trigger: New Email with Quote Acceptance
1. **Choose Trigger**: Microsoft Outlook → "New Email"
2. **Set Filters**:
   - Subject contains: "accept", "approved", "confirmed"
   - OR Body contains: "quote accepted", "approve quote"

#### Action: Webhook for Quote Acceptance
```
URL: YOUR_PUBLIC_URL/webhooks/zapier/quote-accepted
Method: POST
Data:
{
  "fromEmail": "{{from__email}}",
  "subject": "{{subject}}",
  "body": "{{body_plain}}",
  "quoteNumber": "{{extract_quote_number}}",
  "acceptedAt": "{{date_time_received}}"
}
```

## Step 3: Authentication Setup

### JWT Token Generation
Your backend needs to generate JWT tokens for Zapier authentication:

```java
// Add to your AuthController or create a dedicated endpoint
@PostMapping("/generate-zapier-token")
public ResponseEntity<?> generateZapierToken(@RequestBody Map<String, String> request) {
    String zapierSecret = request.get("zapierSecret");
    
    if (!"YOUR_ZAPIER_SECRET".equals(zapierSecret)) {
        return ResponseEntity.status(401).body("Invalid Zapier secret");
    }
    
    // Generate long-lived JWT token for Zapier
    String token = jwtUtils.generateZapierToken("zapier-integration");
    return ResponseEntity.ok(Map.of("token", token));
}
```

### Get Your JWT Token
```bash
curl -X POST http://localhost:8082/auth/generate-zapier-token \
  -H "Content-Type: application/json" \
  -d '{"zapierSecret": "YOUR_ZAPIER_SECRET"}'
```

## Step 4: Email Processing Configuration

### Outlook Email Rules (Optional but Recommended)
1. **Create Email Rules** in Outlook:
   - Rule 1: Move enquiry emails to "Enquiries" folder
   - Rule 2: Forward specific emails to processing address
   - Rule 3: Flag emails from known customers

### Email Folder Structure
```
📧 Inbox
├── 📁 Enquiries (for new enquiries)
├── 📁 Quotes (for quote responses)
├── 📁 Orders (for order confirmations)
└── 📁 Processed (for completed workflows)
```

## Step 5: AI Processing Setup

### Configure AI Email Parsing
The backend uses AI to parse emails. Ensure your webhook handles:

```json
{
  "aiProcessingEnabled": true,
  "extractCustomerInfo": true,
  "parseProductRequirements": true,
  "confidenceThreshold": 0.8,
  "fallbackToManualReview": true
}
```

### Product Mapping Configuration
Update your product mapping in the backend:

```java
@Service
public class AIEmailProcessor {
    
    public EmailEnquiry processEmail(ZapierEmailWebhook webhook) {
        // Extract customer information
        Customer customer = extractCustomerInfo(webhook.getFromEmail(), webhook.getBody());
        
        // Parse product requirements
        List<EnquiryItem> items = parseProductRequirements(webhook.getBody());
        
        // Create enquiry
        EmailEnquiry enquiry = new EmailEnquiry();
        enquiry.setFromEmail(webhook.getFromEmail());
        enquiry.setSubject(webhook.getSubject());
        enquiry.setEmailBody(webhook.getBody());
        enquiry.setCustomer(customer);
        enquiry.setEnquiryItems(items);
        
        return enquiry;
    }
}
```

## Step 6: Testing the Integration

### Test Workflow 1: Send Test Email
1. **Send email** to your Outlook address:
   ```
   Subject: Product Enquiry - Salmon Fillets
   Body: 
   Hello,
   
   We would like to request a quote for:
   - Salmon fillets, skinless, 500kg
   - Atlantic salmon, premium grade
   - Delivery required by end of month
   
   Please send quote to: customer@example.com
   
   Best regards,
   John Smith
   ABC Seafood Ltd
   ```

2. **Check Zapier Dashboard** for workflow execution
3. **Verify Backend Logs** for webhook calls
4. **Check Email Dashboard** for new enquiry

### Test Workflow 2: Quote Acceptance
1. **Send acceptance email**:
   ```
   Subject: Re: Quote QUO-2024-001 - ACCEPTED
   Body: We accept quote QUO-2024-001. Please proceed with order.
   ```

2. **Verify** order creation in dashboard

## Step 7: Production Deployment

### Security Considerations
```yaml
# Environment Variables
ZAPIER_WEBHOOK_SECRET: "your-secret-key"
JWT_SECRET: "your-jwt-secret"
EMAIL_PROCESSING_API_KEY: "your-ai-api-key"
DATABASE_URL: "your-production-db-url"
```

### Rate Limiting
```java
@RateLimiter(name = "zapier-webhooks", fallbackMethod = "rateLimitFallback")
@PostMapping("/webhooks/zapier/email-received")
public ResponseEntity<?> handleEmailReceived(@RequestBody ZapierEmailWebhook webhook) {
    // Implementation
}
```

### Monitoring and Logging
```java
@EventListener
public void handleEmailProcessed(EmailProcessedEvent event) {
    logger.info("Email processed: enquiry={}, customer={}, items={}", 
                event.getEnquiryId(), 
                event.getCustomerEmail(), 
                event.getItemCount());
}
```

## Step 8: Advanced Features

### Multi-Language Support
```java
@Service
public class EmailLanguageDetector {
    public String detectLanguage(String emailBody) {
        // Implement language detection
        return "en"; // Default to English
    }
}
```

### Custom Email Templates
```html
<!-- Quote Email Template -->
<html>
<body>
  <h2>Quote {{quoteNumber}}</h2>
  <p>Dear {{customerName}},</p>
  <p>Thank you for your enquiry. Please find your quote below:</p>
  
  <table>
    {{#items}}
    <tr>
      <td>{{description}}</td>
      <td>{{quantity}}</td>
      <td>{{unitPrice}}</td>
      <td>{{totalPrice}}</td>
    </tr>
    {{/items}}
  </table>
  
  <p><strong>Total: {{totalAmount}} {{currency}}</strong></p>
  
  <p>To accept this quote, simply reply to this email with "ACCEPTED".</p>
</body>
</html>
```

### Webhook Response Handling
```java
@PostMapping("/webhooks/zapier/email-received")
public ResponseEntity<Map<String, Object>> handleEmailReceived(
    @RequestBody ZapierEmailWebhook webhook) {
    
    try {
        EmailEnquiry enquiry = emailEnquiryService.processEmail(webhook);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "enquiryId", enquiry.getEnquiryId(),
            "status", enquiry.getStatus(),
            "message", "Email processed successfully"
        ));
        
    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of(
            "success", false,
            "error", e.getMessage(),
            "message", "Email processing failed"
        ));
    }
}
```

## Troubleshooting

### Common Issues

1. **Webhook Not Triggered**
   - Check Zapier workflow is enabled
   - Verify public URL is accessible
   - Check email filters in trigger

2. **Authentication Errors**
   - Verify JWT token is valid
   - Check Authorization header format
   - Ensure backend security is properly configured

3. **Email Parsing Issues**
   - Check AI processing logs
   - Verify email content format
   - Review product mapping configuration

4. **Database Connection Issues**
   - Check database credentials
   - Verify connection pool settings
   - Monitor database logs

### Monitoring Dashboard URLs
- **Zapier Dashboard**: https://zapier.com/app/dashboard
- **Backend Health**: http://localhost:8082/actuator/health
- **Email Dashboard**: http://localhost:3001/email-dashboard
- **API Documentation**: http://localhost:8082/swagger-ui.html

## Next Steps

1. **Deploy to Production**: Use cloud hosting with SSL
2. **Scale Processing**: Add message queues for high volume
3. **Advanced AI**: Integrate with GPT-4 or Claude for better parsing
4. **Mobile App**: Create mobile app for order management
5. **Analytics**: Add business intelligence dashboard
6. **Multi-tenant**: Support multiple companies/factories

## Support

For issues with this integration:
1. Check Zapier workflow execution logs
2. Review backend application logs
3. Test webhooks manually with curl/Postman
4. Verify email content and formatting

---

🎉 **Congratulations!** Your email-driven order management system is now fully integrated with Zapier MCP for automated Outlook email processing! 