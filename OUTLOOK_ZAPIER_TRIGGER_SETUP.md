# 📧 **Outlook → Zapier → Hybrid AI System Setup**

## 🎯 **Complete Email Processing Pipeline**

```
📧 Outlook Email → 🔄 Zapier Trigger → 🤖 Hybrid AI Backend → 📊 Dashboard
```

## ⚙️ **Step-by-Step Outlook Trigger Setup**

### **Phase 1: Prepare Your Backend**

#### 1. **Get Your JWT Token**
```bash
# First, start your backend
cd backend && mvn spring-boot:run

# Then get your Zapier JWT token
curl -X POST http://localhost:8082/api/auth/generate-zapier-token \
  -H "Content-Type: application/json" \
  -d '{"zapierSecret": "ZAPIER_SECRET_2024"}'

# Save the returned token - you'll need it for Zapier
```

#### 2. **Expose Backend Publicly**
```bash
# Option A: Using ngrok (for testing)
ngrok http 8082
# Note the HTTPS URL: https://abc123.ngrok.io

# Option B: Deploy to cloud (production)
# AWS, Heroku, DigitalOcean, etc.
```

### **Phase 2: Zapier Workflow Creation**

#### **Step 1: Create New Zap**
1. Go to [Zapier.com](https://zapier.com)
2. Click **"Create Zap"**
3. Name it: **"Outlook Email → Hybrid AI Processing"**

#### **Step 2: Configure Outlook Trigger**

##### **Trigger Selection**
- **App**: Microsoft Outlook
- **Event**: **"New Email"** 
- **Account**: Connect your Outlook account

##### **Trigger Configuration**
```
📧 Folder: "Inbox" (or create "Enquiries" folder)
📧 Include Folders: ["Inbox", "Enquiries"]
📧 Exclude Folders: ["Spam", "Deleted Items"]

🔍 FILTERS (Optional but Recommended):
Subject Contains Any: enquiry, inquiry, quote, order, supply, fish, seafood
OR
From Email Contains: your-customer-domains.com
OR  
Body Contains: salmon, cod, haddock, kg, ton, restaurant
```

##### **Advanced Trigger Settings**
```
⏱️ Polling Frequency: Every 1 minute (paid) or 15 minutes (free)
📎 Include Attachments: Yes
🔄 Skip Emails Older Than: 1 hour (avoid processing old emails)
```

#### **Step 3: Configure Webhook Action**

##### **Action Selection**
- **App**: Webhooks by Zapier
- **Event**: **"POST"**

##### **Webhook Configuration**
```
🌐 URL: YOUR_NGROK_URL/webhooks/zapier/email-received
📝 Method: POST
🔐 Headers:
   Content-Type: application/json
   Authorization: Bearer YOUR_JWT_TOKEN

📦 Data (Raw JSON):
{
  "fromEmail": "{{trigger.fromEmail}}",
  "toEmail": "{{trigger.toEmail}}",
  "subject": "{{trigger.subject}}",
  "emailBody": "{{trigger.bodyPlain}}",
  "htmlBody": "{{trigger.bodyHtml}}",
  "receivedAt": "{{trigger.dateReceived}}",
  "messageId": "{{trigger.messageId}}",
  "hasAttachments": "{{trigger.hasAttachments}}",
  "attachmentCount": "{{trigger.attachmentCount}}",
  "cc": "{{trigger.cc}}",
  "bcc": "{{trigger.bcc}}",
  "priority": "{{trigger.importance}}",
  "zapierMetadata": {
    "triggerTime": "{{zap.utc_iso}}",
    "zapName": "Outlook Email Processing",
    "zapId": "{{zap.id}}"
  }
}
```

### **Phase 3: Testing Your Setup**

#### **Test 1: Send Test Email**
```
To: your-outlook-email@domain.com
Subject: Salmon Fillet Enquiry Test

Body:
We need a quote for:
- 500kg salmon fillets, skinless
- 200kg cod steaks

Best regards,
John Smith
ABC Seafood Ltd
Phone: +1234567890
```

#### **Test 2: Check Zapier Logs**
1. Go to Zapier Dashboard
2. Click your Zap → **"Task History"**
3. Look for successful runs
4. Check webhook response: **200 OK**

#### **Test 3: Verify Backend Processing**
```bash
# Check backend logs
tail -f backend.log

# Look for these messages:
🔄 Starting hybrid email classification for: Salmon Fillet Enquiry Test
📊 Pattern classification: ENQUIRY (confidence: 0.95)
✅ Using pattern classification result: ENQUIRY
📈 AI Usage: operation=classification, result=pattern_sufficient, textLength=0
```

#### **Test 4: Check Dashboard**
1. Open: http://localhost:3001/email-dashboard
2. Verify the test email appears
3. Check AI processing status
4. Confirm customer and product extraction

### **Phase 4: Advanced Outlook Configurations**

#### **Smart Folder Setup** (Recommended)
Create these Outlook folders for better organization:

```
📁 Enquiries (for product quotes)
  └── 📧 Triggers: subject contains "enquiry", "quote", "price"

📁 Orders (for confirmed orders)  
  └── 📧 Triggers: subject contains "order", "purchase", "confirm"

📁 Complaints (for issues)
  └── 📧 Triggers: subject contains "complaint", "issue", "problem"

📁 AI-Processing (auto-move processed emails)
  └── 📧 Zapier moves emails here after processing
```

#### **Email Rules in Outlook**
Set up rules to auto-sort incoming emails:

1. **Go to Outlook → File → Rules → Manage Rules**
2. **Create Rule**: "Customer Enquiries"
   ```
   IF: Subject contains "enquiry" OR "quote" OR "fish" OR "seafood"
   AND: From contains customer domains
   THEN: Move to "Enquiries" folder
   AND: Mark as important
   ```

#### **VIP Customer Priority**
```json
{
  "vipCustomers": [
    "bigrestaurant@domain.com",
    "important-client@company.com"
  ],
  "priority": "HIGH",
  "aiProcessing": "ALWAYS",
  "notification": "IMMEDIATE"
}
```

### **Phase 5: Multiple Email Scenarios**

#### **Scenario 1: Simple Business Enquiry** (Pattern AI)
```
Subject: Salmon Fillet Quote Request
From: buyer@seafoodcompany.com

We need pricing for:
- 1000kg Atlantic Salmon Fillets
- Delivery to Norway
- Required by March 15th

Contact: Lars Hansen
Phone: +47 123 456 789

Expected Result:
✅ Pattern confidence: 90%+ 
✅ Cost: $0 (no OpenAI call)
✅ Processing time: <1 second
```

#### **Scenario 2: Complex Restaurant Enquiry** (Hybrid AI)
```
Subject: Weekly Supply for Restaurant Chain
From: chef@oceanstable.com

Hi! We run 5 seafood restaurants and need regular supply. 
We serve about 200+ customers daily and go through roughly 
half a ton of white fish weekly for our fish and chips. 
Also looking for premium salmon for weekend specials. 
Can you help with sustainable sourcing?

Expected Result:
✅ Pattern confidence: 30% → Triggers OpenAI
✅ AI extracts: COD, SALMON, ~500kg weekly
✅ Cost: ~$0.006 (2 OpenAI calls)
✅ Processing time: 2-3 seconds
```

#### **Scenario 3: Order Confirmation** (Pattern AI)
```
Subject: Order Confirmation - 300kg Haddock
From: orders@fishmarket.com

Please confirm our order:
- Product: Haddock Fillets
- Quantity: 300kg
- Delivery: Next Tuesday
- Reference: ORD-2024-001

Expected Result:
✅ Pattern confidence: 95%
✅ Classification: ORDER
✅ Cost: $0
✅ Status: PROCESSING
```

### **Phase 6: Monitoring & Optimization**

#### **Daily Monitoring Checklist**
```
□ Check Zapier task history (any failures?)
□ Verify backend logs (AI usage patterns?)
□ Monitor email dashboard (all emails processed?)
□ Check OpenAI costs (within budget?)
□ Review pattern confidence scores (need improvements?)
```

#### **Weekly Optimization**
```
□ Analyze AI usage patterns
□ Identify emails that could use better patterns
□ Adjust confidence thresholds if needed
□ Add new product patterns for common requests
□ Review customer extraction accuracy
```

#### **Cost Optimization Tips**
```
✅ Increase confidence thresholds → Less AI usage
✅ Add specific patterns for your common email types
✅ Use Outlook rules to pre-filter relevant emails
✅ Set up VIP customer handling (worth the AI cost)
✅ Monitor daily OpenAI usage and costs
```

### **Phase 7: Error Handling & Troubleshooting**

#### **Common Issues & Solutions**

##### **Issue 1: Emails Not Triggering**
```
Problem: Zapier not detecting new emails
Solutions:
□ Check Outlook folder permissions
□ Verify trigger filters aren't too restrictive  
□ Test with simple subject lines
□ Check Zapier task history for errors
```

##### **Issue 2: Webhook Failures**
```
Problem: 404/500 errors on webhook calls
Solutions:
□ Verify ngrok URL is still active
□ Check JWT token hasn't expired
□ Ensure backend is running on port 8082
□ Test webhook manually with curl
```

##### **Issue 3: AI Processing Failures**
```
Problem: OpenAI calls failing
Solutions:
□ Verify API key is correct
□ Check OpenAI account credits/limits
□ System automatically falls back to patterns
□ Review error logs for specific issues
```

##### **Issue 4: High AI Costs**
```
Problem: Too many OpenAI calls
Solutions:
□ Increase ai.confidence.threshold to 0.8+
□ Add more specific patterns for your emails
□ Filter out non-business emails in Zapier
□ Review which emails really need AI
```

### **Phase 8: Production Deployment**

#### **Before Going Live**
```
□ Deploy backend to production server
□ Set up SSL certificate
□ Update Zapier webhook URL to production
□ Test with real customer emails
□ Set up monitoring alerts
□ Configure backup email processing
```

#### **Production Configuration**
```properties
# Production application.properties
openai.api.key=your-production-key
ai.confidence.threshold=0.75
ai.max.daily.requests=5000
ai.cost.alert.threshold=25.00
```

## 🎉 **Success Metrics**

After setup, you should see:

### **Week 1:**
- ✅ 90%+ emails processed automatically
- ✅ 70-80% pattern-only processing (free)
- ✅ 20-30% AI fallback (small cost)
- ✅ <5 second average processing time

### **Month 1:**
- ✅ 95%+ accuracy in email classification
- ✅ 80%+ accuracy in product extraction
- ✅ 90%+ accuracy in customer details
- ✅ Monthly cost: $3-10 for 1000+ emails

### **Month 3:**
- ✅ Custom patterns for your email types
- ✅ 85%+ pattern success rate
- ✅ 15% AI usage rate
- ✅ <$5/month costs for high volume

**Your email-driven order management system is now fully automated! 🚀** 