# Zapier MCP Integration Setup Guide

## 🎯 **Your Configuration Details**

### ✅ **Zapier MCP Server**
- **Server URL**: `https://mcp.zapier.com/api/mcp/mcp`
- **API Key**: `ZTkwOWQ4ZWYtYTQ0NC00YWUzLTk2NzktYjhkODFlMjQyYmFhOmNmOWY2MDUwLWY2MzYtNDAzNC1hM2ZhLTY5NGVlNmUxNjIwNQ==`
- **Authentication**: Bearer Token

### ✅ **Backend Integration**
- **Backend URL**: `http://localhost:8082`
- **JWT Token**: `eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ6YXBpZXItaW50ZWdyYXRpb24iLCJpYXQiOjE3NTMwODM4NzMsImV4cCI6MTc1MzE3MDI3M30.AtQmpVk8BQm1zJJng1UobVsR53bNvA2FHjzs2DomUGSLJKGKFv-XJNETPYxcqkiZgH-z1I65Wtlk6nK5U45HAQ`
- **Token Expires**: 24 hours from generation

## 🚀 **Step-by-Step Setup**

### Step 1: Expose Backend Publicly

Since the Zapier MCP server needs to call your backend webhooks, you need a public URL:

#### Option A: Using ngrok (Recommended for testing)
```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/

# Start ngrok tunnel
ngrok http 8082

# Copy the public URL (e.g., https://abc123.ngrok.io)
```

#### Option B: Production deployment
Deploy your backend to a cloud service with SSL.

### Step 2: Configure MCP Client

You can use the Zapier MCP server in several ways:

#### Option A: Direct MCP Protocol
```json
{
  "mcpServers": {
    "zapier": {
      "command": "mcp-server-zapier",
      "args": ["--api-key", "ZTkwOWQ4ZWYtYTQ0NC00YWUzLTk2NzktYjhkODFlMjQyYmFhOmNmOWY2MDUwLWY2MzYtNDAzNC1hM2ZhLTY5NGVlNmUxNjIwNQ=="],
      "env": {
        "ZAPIER_API_KEY": "ZTkwOWQ4ZWYtYTQ0NC00YWUzLTk2NzktYjhkODFlMjQyYmFhOmNmOWY2MDUwLWY2MzYtNDAzNC1hM2ZhLTY5NGVlNmUxNjIwNQ=="
      }
    }
  }
}
```

#### Option B: HTTP MCP Client
```python
import requests

# MCP client configuration
mcp_config = {
    "server_url": "https://mcp.zapier.com/api/mcp/mcp",
    "api_key": "ZTkwOWQ4ZWYtYTQ0NC00YWUzLTk2NzktYjhkODFlMjQyYmFhOmNmOWY2MDUwLWY2MzYtNDAzNC1hM2ZhLTY5NGVlNmUxNjIwNQ==",
    "headers": {
        "Authorization": "Bearer ZTkwOWQ4ZWYtYTQ0NC00YWUzLTk2NzktYjhkODFlMjQyYmFhOmNmOWY2MDUwLWY2MzYtNDAzNC1hM2ZhLTY5NGVlNmUxNjIwNQ==",
        "Content-Type": "application/json"
    }
}
```

### Step 3: Available MCP Tools

Your Zapier MCP server provides these tools (common ones):

1. **`outlook_send_email`** - Send emails via Outlook
2. **`outlook_get_emails`** - Get emails from Outlook
3. **`outlook_search_emails`** - Search emails by criteria
4. **`webhook_post`** - Make POST requests to webhooks
5. **`format_data`** - Format data for processing

### Step 4: Email Processing Workflow

Here's how to set up the email-to-order workflow using MCP:

#### MCP Workflow JSON:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "outlook_get_emails",
    "arguments": {
      "folder": "Inbox",
      "filter": {
        "subject_contains": ["enquiry", "quote", "order"],
        "unread": true
      },
      "limit": 10
    }
  }
}
```

#### Process Each Email:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "webhook_post",
    "arguments": {
      "url": "YOUR_NGROK_URL/webhooks/zapier/email-received",
      "headers": {
        "Authorization": "Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ6YXBpZXItaW50ZWdyYXRpb24iLCJpYXQiOjE3NTMwODM4NzMsImV4cCI6MTc1MzE3MDI3M30.AtQmpVk8BQm1zJJng1UobVsR53bNvA2FHjzs2DomUGSLJKGKFv-XJNETPYxcqkiZgH-z1I65Wtlk6nK5U45HAQ",
        "Content-Type": "application/json"
      },
      "data": {
        "fromEmail": "{{email.from}}",
        "subject": "{{email.subject}}",
        "body": "{{email.body}}",
        "receivedAt": "{{email.received_time}}"
      }
    }
  }
}
```

### Step 5: Test the Integration

#### Test 1: Manual MCP Call
```bash
curl -X POST https://mcp.zapier.com/api/mcp/mcp \
  -H "Authorization: Bearer ZTkwOWQ4ZWYtYTQ0NC00YWUzLTk2NzktYjhkODFlMjQyYmFhOmNmOWY2MDUwLWY2MzYtNDAzNC1hM2ZhLTY5NGVlNmUxNjIwNQ==" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

#### Test 2: Email Processing
Send a test email to your Outlook account:
```
Subject: Product Enquiry - Test
Body: 
Hello,

I would like to request a quote for:
- Test product, 100kg
- Delivery ASAP

Best regards,
Test Customer
```

#### Test 3: Webhook Call
```bash
curl -X POST YOUR_NGROK_URL/webhooks/zapier/email-received \
  -H "Authorization: Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ6YXBpZXItaW50ZWdyYXRpb24iLCJpYXQiOjE3NTMwODM4NzMsImV4cCI6MTc1MzE3MDI3M30.AtQmpVk8BQm1zJJng1UobVsR53bNvA2FHjzs2DomUGSLJKGKFv-XJNETPYxcqkiZgH-z1I65Wtlk6nK5U45HAQ" \
  -H "Content-Type: application/json" \
  -d '{
    "fromEmail": "test@example.com",
    "subject": "Test Enquiry",
    "body": "Test email body",
    "receivedAt": "2024-07-21T12:00:00Z"
  }'
```

## 🔧 **Advanced Configuration**

### Automated Email Processing Script

Create a Python script to automate the email processing:

```python
#!/usr/bin/env python3
import requests
import time
import json

class ZapierMCPProcessor:
    def __init__(self):
        self.mcp_url = "https://mcp.zapier.com/api/mcp/mcp"
        self.mcp_key = "ZTkwOWQ4ZWYtYTQ0NC00YWUzLTk2NzktYjhkODFlMjQyYmFhOmNmOWY2MDUwLWY2MzYtNDAzNC1hM2ZhLTY5NGVlNmUxNjIwNQ=="
        self.backend_url = "YOUR_NGROK_URL"
        self.jwt_token = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ6YXBpZXItaW50ZWdyYXRpb24iLCJpYXQiOjE3NTMwODM4NzMsImV4cCI6MTc1MzE3MDI3M30.AtQmpVk8BQm1zJJng1UobVsR53bNvA2FHjzs2DomUGSLJKGKFv-XJNETPYxcqkiZgH-z1I65Wtlk6nK5U45HAQ"
    
    def get_new_emails(self):
        """Get new emails from Outlook via MCP"""
        headers = {
            "Authorization": f"Bearer {self.mcp_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/call",
            "params": {
                "name": "outlook_get_emails",
                "arguments": {
                    "folder": "Inbox",
                    "filter": {"unread": True},
                    "limit": 10
                }
            }
        }
        
        response = requests.post(self.mcp_url, headers=headers, json=payload)
        return response.json()
    
    def process_email(self, email):
        """Process email through our backend"""
        headers = {
            "Authorization": f"Bearer {self.jwt_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "fromEmail": email.get("from"),
            "subject": email.get("subject"),
            "body": email.get("body"),
            "receivedAt": email.get("received_time")
        }
        
        response = requests.post(
            f"{self.backend_url}/webhooks/zapier/email-received",
            headers=headers,
            json=payload
        )
        return response.json()
    
    def run_continuous(self):
        """Run continuous email processing"""
        while True:
            try:
                emails = self.get_new_emails()
                for email in emails.get("result", {}).get("emails", []):
                    result = self.process_email(email)
                    print(f"Processed email: {result}")
                
                time.sleep(30)  # Check every 30 seconds
            except Exception as e:
                print(f"Error: {e}")
                time.sleep(60)

# Run the processor
if __name__ == "__main__":
    processor = ZapierMCPProcessor()
    processor.run_continuous()
```

## 📊 **Monitoring and Troubleshooting**

### Dashboard URLs
- **Email Dashboard**: http://localhost:3001/email-dashboard
- **Main Dashboard**: http://localhost:3001/dashboard
- **Backend Logs**: Check `backend.log` file

### Common Issues

1. **JWT Token Expired**
   - Generate new token: `curl -X POST http://localhost:8082/auth/generate-zapier-token -H "Content-Type: application/json" -d '{"zapierSecret": "ZAPIER_SECRET_2024"}'`

2. **MCP Connection Failed**
   - Verify API key is correct
   - Check network connectivity
   - Ensure Zapier account has proper permissions

3. **Webhook Errors**
   - Verify ngrok tunnel is running
   - Check firewall settings
   - Validate JWT token format

### Log Monitoring
```bash
# Backend logs
tail -f backend/backend.log

# Ngrok logs
curl http://localhost:4040/api/requests/http
```

## 🎉 **Success Checklist**

- [ ] Backend running on port 8082
- [ ] Frontend running on port 3001
- [ ] Ngrok tunnel active
- [ ] JWT token generated
- [ ] MCP server accessible
- [ ] Test email processed
- [ ] Enquiry appears in dashboard

## 🚀 **Next Steps**

1. **Production Deployment**: Move to cloud hosting
2. **Advanced AI Processing**: Integrate with GPT-4/Claude
3. **Email Templates**: Create professional quote templates
4. **Customer Portal**: Build customer-facing portal
5. **Analytics**: Add business intelligence dashboard

---

🎯 **Your integration is ready!** Use the configuration above to connect Zapier MCP with your email-driven order management system. 