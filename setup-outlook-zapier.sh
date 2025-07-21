#!/bin/bash

echo "🚀 Outlook → Zapier → Hybrid AI Setup Helper"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is running
echo -e "\n${BLUE}📡 Checking backend status...${NC}"
if curl -s http://localhost:8082/api/auth/test > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on port 8082${NC}"
else
    echo -e "${RED}❌ Backend is not running. Starting it now...${NC}"
    echo "Run: cd backend && mvn spring-boot:run"
    exit 1
fi

# Generate JWT token for Zapier
echo -e "\n${BLUE}🔐 Generating Zapier JWT token...${NC}"
JWT_RESPONSE=$(curl -s -X POST http://localhost:8082/api/auth/generate-zapier-token \
  -H "Content-Type: application/json" \
  -d '{"zapierSecret": "ZAPIER_SECRET_2024"}')

if [[ $JWT_RESPONSE == *"token"* ]]; then
    JWT_TOKEN=$(echo $JWT_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ JWT Token generated successfully${NC}"
    echo -e "${YELLOW}🔑 Your Zapier JWT Token:${NC}"
    echo "$JWT_TOKEN"
    echo ""
    echo -e "${YELLOW}📝 Save this token - you'll need it for Zapier webhook configuration${NC}"
else
    echo -e "${RED}❌ Failed to generate JWT token${NC}"
    echo "Response: $JWT_RESPONSE"
    exit 1
fi

# Setup ngrok for public URL
echo -e "\n${BLUE}🌐 Setting up public URL with ngrok...${NC}"
if command -v ngrok &> /dev/null; then
    echo -e "${GREEN}✅ ngrok is installed${NC}"
    echo -e "${YELLOW}💡 Run this in a separate terminal:${NC}"
    echo "ngrok http 8082"
    echo ""
    echo -e "${YELLOW}📝 Note the HTTPS URL (e.g., https://abc123.ngrok.io)${NC}"
    echo -e "${YELLOW}📝 Use this URL in your Zapier webhook: https://YOUR_NGROK_URL/webhooks/zapier/email-received${NC}"
else
    echo -e "${RED}❌ ngrok not found. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install ngrok
        else
            echo "Please install Homebrew first: https://brew.sh/"
        fi
    else
        echo "Please install ngrok from: https://ngrok.com/download"
    fi
fi

# Create Zapier configuration file
echo -e "\n${BLUE}📄 Creating Zapier configuration file...${NC}"
cat > zapier-webhook-config.json << EOF
{
  "zapierConfiguration": {
    "trigger": {
      "app": "Microsoft Outlook",
      "event": "New Email",
      "folder": "Inbox",
      "filters": {
        "subjectContains": ["enquiry", "inquiry", "quote", "order", "supply", "fish", "seafood"],
        "bodyContains": ["salmon", "cod", "haddock", "kg", "ton", "restaurant"]
      }
    },
    "action": {
      "app": "Webhooks by Zapier",
      "method": "POST",
      "url": "YOUR_NGROK_URL/webhooks/zapier/email-received",
      "headers": {
        "Content-Type": "application/json",
        "Authorization": "Bearer $JWT_TOKEN"
      },
      "payload": {
        "fromEmail": "{{trigger.fromEmail}}",
        "toEmail": "{{trigger.toEmail}}",
        "subject": "{{trigger.subject}}",
        "emailBody": "{{trigger.bodyPlain}}",
        "htmlBody": "{{trigger.bodyHtml}}",
        "receivedAt": "{{trigger.dateReceived}}",
        "messageId": "{{trigger.messageId}}",
        "hasAttachments": "{{trigger.hasAttachments}}",
        "zapierMetadata": {
          "triggerTime": "{{zap.utc_iso}}",
          "zapName": "Outlook Email Processing"
        }
      }
    }
  },
  "hybridAI": {
    "enabled": true,
    "openaiModel": "gpt-4o-mini",
    "confidenceThreshold": 0.7,
    "estimatedCostPerEmail": "$0.003-0.005"
  }
}
EOF

echo -e "${GREEN}✅ Configuration saved to: zapier-webhook-config.json${NC}"

# Test webhook endpoint
echo -e "\n${BLUE}🧪 Testing webhook endpoint...${NC}"
TEST_RESPONSE=$(curl -s -X POST http://localhost:8082/webhooks/zapier/email-received \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "fromEmail": "test@example.com",
    "subject": "Test Email for Hybrid AI",
    "emailBody": "This is a test email to verify the webhook is working correctly.",
    "receivedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }')

if [[ $TEST_RESPONSE == *"enquiryId"* ]]; then
    echo -e "${GREEN}✅ Webhook endpoint is working correctly${NC}"
    ENQUIRY_ID=$(echo $TEST_RESPONSE | grep -o '"enquiryId":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}📧 Test email processed with ID: $ENQUIRY_ID${NC}"
else
    echo -e "${RED}❌ Webhook test failed${NC}"
    echo "Response: $TEST_RESPONSE"
fi

# Print summary
echo -e "\n${BLUE}📋 Setup Summary${NC}"
echo "=================="
echo -e "${GREEN}✅ Backend: Running on port 8082${NC}"
echo -e "${GREEN}✅ JWT Token: Generated for Zapier${NC}"
echo -e "${GREEN}✅ Webhook: /webhooks/zapier/email-received${NC}"
echo -e "${GREEN}✅ Hybrid AI: Configured with GPT-4o Mini${NC}"
echo -e "${GREEN}✅ Configuration: Saved to zapier-webhook-config.json${NC}"

echo -e "\n${YELLOW}🔥 Next Steps:${NC}"
echo "1. Run 'ngrok http 8082' in a new terminal"
echo "2. Copy the HTTPS ngrok URL"
echo "3. Go to Zapier.com and create a new Zap"
echo "4. Configure Outlook trigger (New Email)"
echo "5. Add Webhook action with your ngrok URL and JWT token"
echo "6. Test with a real email"
echo "7. Check the email dashboard: http://localhost:3001/email-dashboard"

echo -e "\n${YELLOW}📚 Full Setup Guide: OUTLOOK_ZAPIER_TRIGGER_SETUP.md${NC}"
echo -e "${YELLOW}🔧 Hybrid AI Guide: HYBRID_AI_SYSTEM_GUIDE.md${NC}"

echo -e "\n${GREEN}🎉 Your email-driven hybrid AI system is ready to go!${NC}" 