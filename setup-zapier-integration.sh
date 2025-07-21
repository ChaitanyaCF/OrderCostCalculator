#!/bin/bash

echo "🚀 Setting up Zapier MCP Integration for Email-Driven Order Management"
echo "================================================================="

# Check if backend is running
echo "1️⃣ Checking if backend is running on port 8082..."
if curl -s http://localhost:8082/actuator/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running on port 8082"
    echo "Please start the backend first: cd backend && java -jar target/procost-api-0.0.1-SNAPSHOT.jar"
    exit 1
fi

# Check if frontend is running
echo "2️⃣ Checking if frontend is running on port 3001..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not running on port 3001"
    echo "Please start the frontend first: cd frontend && npm start"
    exit 1
fi

# Generate Zapier JWT token
echo "3️⃣ Generating JWT token for Zapier integration..."
ZAPIER_TOKEN=$(curl -s -X POST http://localhost:8082/auth/generate-zapier-token \
  -H "Content-Type: application/json" \
  -d '{"zapierSecret": "ZAPIER_SECRET_2024"}' | \
  grep -o '"token":"[^"]*"' | \
  cut -d'"' -f4)

if [ -n "$ZAPIER_TOKEN" ]; then
    echo "✅ JWT Token generated successfully!"
    echo ""
    echo "🔑 Your Zapier JWT Token:"
    echo "Bearer $ZAPIER_TOKEN"
    echo ""
    echo "📋 Copy this token and use it in your Zapier webhook configuration"
else
    echo "❌ Failed to generate JWT token"
    echo "Please check if the backend is running and try again"
    exit 1
fi

# Setup ngrok for public URL
echo "4️⃣ Setting up ngrok for public webhook URL..."
if command -v ngrok >/dev/null 2>&1; then
    echo "✅ ngrok is installed"
    
    # Check if ngrok is already running on port 8082
    if pgrep -f "ngrok.*8082" > /dev/null; then
        echo "⚠️ ngrok is already running on port 8082"
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | cut -d'"' -f4 | head -1)
        if [ -n "$NGROK_URL" ]; then
            echo "🌐 Current ngrok URL: $NGROK_URL"
        fi
    else
        echo "🌐 Starting ngrok tunnel for port 8082..."
        ngrok http 8082 > /dev/null 2>&1 &
        sleep 3
        
        # Get the public URL
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | cut -d'"' -f4 | head -1)
        if [ -n "$NGROK_URL" ]; then
            echo "✅ ngrok tunnel created: $NGROK_URL"
        else
            echo "❌ Failed to create ngrok tunnel"
        fi
    fi
else
    echo "⚠️ ngrok is not installed"
    echo "Please install ngrok: brew install ngrok (macOS) or visit https://ngrok.com/"
    echo "Then run: ngrok http 8082"
    NGROK_URL="https://YOUR_NGROK_URL.ngrok.io"
fi

# Display setup summary
echo ""
echo "🎯 ZAPIER MCP INTEGRATION SETUP COMPLETE!"
echo "========================================="
echo ""
echo "📧 Webhook Endpoints:"
echo "   Email Processing: $NGROK_URL/webhooks/zapier/email-received"
echo "   Quote Generation: $NGROK_URL/webhooks/zapier/send-quote/{enquiryId}"
echo "   Quote Acceptance: $NGROK_URL/webhooks/zapier/quote-accepted"
echo "   Order Updates:    $NGROK_URL/webhooks/zapier/order-status-update"
echo ""
echo "🔐 Authentication:"
echo "   Authorization Header: Bearer $ZAPIER_TOKEN"
echo ""
echo "🌐 Dashboard URLs:"
echo "   Email Dashboard: http://localhost:3001/email-dashboard"
echo "   Main Dashboard:  http://localhost:3001/dashboard"
echo "   Backend Health:  http://localhost:8082/actuator/health"
echo ""
echo "📖 Next Steps:"
echo "   1. Copy the JWT token above"
echo "   2. Open Zapier and create a new Zap"
echo "   3. Choose Microsoft Outlook as trigger"
echo "   4. Add Webhook action with the endpoints above"
echo "   5. Add the Authorization header with the Bearer token"
echo "   6. Test with a sample email to your Outlook account"
echo ""
echo "📚 Full documentation: See ZAPIER_MCP_INTEGRATION.md"
echo ""
echo "🎉 Happy automating with Zapier MCP!" 