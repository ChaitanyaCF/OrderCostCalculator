# Order Cost Calculator & Email-Driven Order Management Platform

This project contains a comprehensive multi-component application for calculating order costs and managing email-driven enquiries, quotes, and orders with:
1. A Java Spring Boot backend
2. A React/TypeScript frontend
3. **NEW**: Email-driven workflow with Zapier MCP integration for Outlook

## 🎯 **Key Features**

### Original Features
- Order cost calculation based on multiple parameters
- User authentication and authorization
- Product selection and pricing
- Cost estimation for different packaging and transport options
- Factory rate card management with persistent storage

### **🆕 NEW: Email-Driven Order Management**
- **📧 Outlook Email Integration**: Automatically process enquiry emails via Zapier MCP
- **🤖 AI-Powered Email Parsing**: Extract product requirements, quantities, and specifications from emails
- **💼 Multi-SKU Quote Generation**: Generate detailed quotes for multiple products in a single enquiry
- **📨 Automated Email Responses**: Send professional quotes directly to customers
- **🔄 Quote-to-Order Conversion**: Automatically convert accepted quotes to orders
- **👥 Customer Management**: Email-based customer profiles with communication history
- **📊 Comprehensive Dashboard**: Track enquiries, quotes, orders, and customer interactions

## Setup Instructions

### Prerequisites

- Java JDK 11 or higher
- Maven
- Node.js and npm
- **For Email Integration**: Zapier account and Outlook access

### Backend Setup (Java Spring Boot)

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Build the application:
   ```
   mvn clean install -DskipTests
   ```

3. Run the Spring Boot application:
   ```
   mvn spring-boot:run --server.port=8082
   ```
   
   The backend will start on http://localhost:8082

### Frontend Setup (React/TypeScript)

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   PORT=3001 npm start
   ```
   
   The frontend will start on http://localhost:3001

## 📧 **Email-Driven Workflow Setup with Zapier MCP**

### **Overview of the Email Workflow:**

```
1. Customer sends enquiry email → Outlook
2. Zapier MCP triggers → Sends email data to your webhook
3. AI parses email content → Extracts product requirements
4. System generates quote → Professional quote PDF/HTML
5. Zapier sends quote email → Customer receives quote
6. Customer accepts quote → Sends acceptance email
7. Zapier converts quote → Creates order automatically
8. Team gets notifications → Slack/Teams integration
```

### **Step 1: Set Up Zapier MCP**

1. **Install Zapier MCP** (if using Cursor or Claude Desktop):
   ```bash
   # In Cursor, go to Settings > MCP
   # Add new MCP server with Zapier endpoint
   ```

2. **Get Zapier MCP Server Endpoint**:
   - Visit the Zapier MCP documentation
   - Generate your unique MCP server endpoint
   - Keep this URL secure (treat it like a password)

### **Step 2: Configure Outlook Email Triggers**

Create the following Zapier workflows:

#### **Zap 1: Email Enquiry Processing**
```yaml
Trigger: Outlook - New Email in Folder
  - Folder: "Enquiries" (create this folder in Outlook)
  - Filters: Subject contains "enquiry" OR "quote request" OR "order"

Action 1: Webhook - POST Request
  - URL: http://localhost:8082/webhooks/zapier/email-received
  - Method: POST
  - Data:
    fromEmail: {{trigger.from_email}}
    subject: {{trigger.subject}}
    emailBody: {{trigger.body_plain}}
    messageId: {{trigger.message_id}}
    receivedAt: {{trigger.date_received}}

Action 2: Delay - 5 minutes
  - Allow AI processing time

Action 3: Webhook - Generate Quote
  - URL: http://localhost:8082/webhooks/zapier/send-quote/{{step1.enquiry_id}}
  - Method: POST

Action 4: Outlook - Send Email
  - To: {{step1.customer_email}}
  - Subject: Quote {{step3.quote_number}} - {{step1.customer_name}}
  - Body: {{step3.quote_html}}
  - Attachments: {{step3.quote_pdf_url}}

Action 5: Slack - Send Message (Optional)
  - Channel: #sales
  - Message: "New quote {{step3.quote_number}} sent to {{step1.customer_name}}"
```

#### **Zap 2: Quote Acceptance Processing**
```yaml
Trigger: Outlook - New Email in Folder
  - Folder: "Quote Responses"
  - Filters: Body contains "accept" OR "approved" OR "QUO-"

Action 1: Webhook - Process Acceptance
  - URL: http://localhost:8082/webhooks/zapier/quote-accepted
  - Method: POST
  - Data:
    fromEmail: {{trigger.from_email}}
    subject: {{trigger.subject}}
    emailBody: {{trigger.body_plain}}

Action 2: Outlook - Send Confirmation
  - To: {{trigger.from_email}}
  - Subject: Order Confirmation - {{step1.order_number}}
  - Body: "Thank you! Your order {{step1.order_number}} has been confirmed."

Action 3: Create Task (Optional)
  - In Asana/Monday.com/Jira
  - Title: "Process Order {{step1.order_number}}"
  - Assignee: Production team
```

### **Step 3: Set Up Email Folders in Outlook**

1. Create these folders in your Outlook:
   ```
   📁 Enquiries          (incoming customer requests)
   📁 Quote Responses    (customer replies to quotes)
   📁 Processed          (move emails after processing)
   ```

2. **Set up Email Rules** (optional):
   - Auto-move emails containing "quote request" to Enquiries folder
   - Auto-move emails containing "QUO-" to Quote Responses folder

### **Step 4: Configure Webhook URLs**

Update your backend application.properties:
```properties
# Email Integration Settings
zapier.webhook.base-url=http://localhost:8082/webhooks/zapier
zapier.webhook.secret=your-secret-key-here

# Email Processing Settings
email.processing.ai-enabled=true
email.processing.confidence-threshold=0.7
email.processing.auto-quote-generation=true
```

### **Step 5: Test the Integration**

1. **Test Email Processing**:
   ```
   Send a test email to your monitored address:
   
   Subject: "Salmon Fillet Enquiry - Urgent"
   Body: "Hi, we need 500kg of fresh salmon fillets for next week delivery. 
          Please provide quote for:
          - Product: Salmon Fillets
          - Quantity: 500kg
          - Delivery: Next Wednesday
          - Quality: Premium grade"
   ```

2. **Check the Flow**:
   - Email should trigger Zapier → Webhook → AI Processing
   - Quote should be generated and emailed back
   - Check logs in the Email Dashboard

3. **Test Quote Acceptance**:
   ```
   Reply to the quote email with:
   
   Subject: "RE: Quote QUO-2024-001 - ACCEPTED"
   Body: "We accept quote QUO-2024-001. Please proceed with the order."
   ```

## 🎛️ **Email Dashboard Features**

Access the Email Dashboard at: http://localhost:3001/email-enquiry-dashboard

### **Dashboard Sections:**
1. **📊 Statistics Overview**: Total enquiries, pending quotes, active orders
2. **📧 Email Enquiries**: AI-processed enquiries with confidence scores
3. **💼 Quotes Management**: Track quote status and customer responses
4. **🚚 Orders Management**: Monitor production and delivery status
5. **👥 Customer Management**: Email-based customer profiles
6. **⚡ Recent Activity**: Real-time workflow events

### **Key Actions:**
- **Test Email Processing**: Simulate incoming emails
- **Manual Quote Creation**: Create quotes outside the email workflow
- **Sync with Zapier**: Force refresh of webhook data
- **Customer Communication**: View email history per customer

## 🔒 **Security & Authentication**

### **Webhook Security:**
- All webhook endpoints require JWT authentication
- Use HTTPS in production
- Implement rate limiting (configured in application.properties)
- Store Zapier MCP endpoint securely

### **Email Security:**
- Validate sender email addresses
- Sanitize email content before processing
- Log all email processing activities
- Implement spam detection

## 📈 **Monitoring & Analytics**

### **Backend Logs:**
```bash
# Monitor email processing
tail -f backend/logs/email-processing.log

# Monitor webhook calls
tail -f backend/logs/zapier-webhooks.log
```

### **Dashboard Metrics:**
- Email processing success rate
- Quote conversion rate
- Average response time
- Customer engagement metrics

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Emails not triggering webhooks**:
   - Check Zapier Zap is enabled
   - Verify webhook URL is accessible
   - Check email folder filters

2. **AI processing failures**:
   - Check email content complexity
   - Verify product mapping configuration
   - Review confidence threshold settings

3. **Quote generation errors**:
   - Check factory rate card data
   - Verify pricing calculation logic
   - Review template configuration

4. **Authentication errors**:
   - Refresh JWT tokens
   - Check user permissions
   - Verify admin access for email dashboard

### **Debug Commands:**
```bash
# Test webhook directly
curl -X POST http://localhost:8082/webhooks/zapier/email-received \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"fromEmail":"test@example.com","subject":"Test","emailBody":"Test enquiry"}'

# Check application logs
tail -f backend/logs/application.log

# Verify database content
# Access H2 console: http://localhost:8082/h2-console
```

## 🚀 **Production Deployment**

### **Backend Deployment:**
1. Build production JAR:
   ```bash
   mvn clean package -DskipTests
   ```

2. Deploy with environment variables:
   ```bash
   java -jar target/procost-api-0.0.1-SNAPSHOT.jar \
     --server.port=8082 \
     --spring.profiles.active=prod
   ```

### **Frontend Deployment:**
1. Build production assets:
   ```bash
   npm run build
   ```

2. Deploy to web server (nginx/Apache)

### **Zapier MCP Production:**
- Update webhook URLs to production endpoints
- Set up SSL certificates
- Configure production email accounts
- Set up monitoring and alerts

## 📋 **API Documentation**

### **Email Webhook Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhooks/zapier/email-received` | POST | Process incoming enquiry emails |
| `/webhooks/zapier/send-quote/{enquiryId}` | POST | Generate and return quote data |
| `/webhooks/zapier/quote-accepted` | POST | Process quote acceptance emails |
| `/webhooks/zapier/order-status-update` | POST | Update order status from external systems |

### **Email Management API:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/email-enquiries` | GET | Get all email enquiries |
| `/api/email-enquiries/{id}` | GET | Get specific enquiry |
| `/api/quotes` | GET | Get all quotes |
| `/api/quotes/{id}/send` | POST | Send quote via email |
| `/api/orders` | GET | Get all orders |
| `/api/customers` | GET | Get all customers |

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Add email workflow tests
4. Update documentation
5. Submit a pull request

## 📞 **Support**

For email integration support:
- Check Zapier MCP documentation
- Review webhook logs
- Test individual Zap steps
- Contact support with specific error messages

---

## 🎉 **Conclusion**

You now have a comprehensive **Email-Driven Order Management Platform** that:

✅ **Automatically processes customer emails** via Outlook + Zapier MCP  
✅ **Uses AI to extract product requirements** from unstructured emails  
✅ **Generates professional quotes** for multiple SKUs  
✅ **Converts accepted quotes to orders** automatically  
✅ **Manages the entire customer lifecycle** from email to delivery  
✅ **Provides real-time dashboards** for monitoring and management  

This transforms your order management from manual processes to a fully automated, intelligent system that scales with your business! 🚀

Happy order processing! 📧➡️💼➡️🚚 