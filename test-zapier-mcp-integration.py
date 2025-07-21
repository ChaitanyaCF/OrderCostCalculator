#!/usr/bin/env python3
"""
Zapier MCP Integration Test Script
Tests the connection between Zapier MCP server and our backend
"""

import json
import requests
import base64
import time
from datetime import datetime

# Configuration
ZAPIER_MCP_SERVER = "https://mcp.zapier.com/api/mcp/mcp"
ZAPIER_API_KEY = "ZTkwOWQ4ZWYtYTQ0NC00YWUzLTk2NzktYjhkODFlMjQyYmFhOmNmOWY2MDUwLWY2MzYtNDAzNC1hM2ZhLTY5NGVlNmUxNjIwNQ=="
BACKEND_URL = "http://localhost:8082"

def test_zapier_mcp_connection():
    """Test connection to Zapier MCP server"""
    print("🔍 Testing Zapier MCP Connection...")
    
    headers = {
        "Authorization": f"Bearer {ZAPIER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Test MCP server connectivity
    try:
        response = requests.get(f"{ZAPIER_MCP_SERVER}/health", headers=headers, timeout=10)
        if response.status_code == 200:
            print("✅ Zapier MCP Server connection successful")
            return True
        else:
            print(f"❌ Zapier MCP Server error: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Zapier MCP Server connection failed: {e}")
        return False

def get_available_tools():
    """Get available MCP tools from Zapier"""
    print("🛠️ Getting available Zapier MCP tools...")
    
    headers = {
        "Authorization": f"Bearer {ZAPIER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{ZAPIER_MCP_SERVER}", 
                               headers=headers,
                               json={
                                   "jsonrpc": "2.0",
                                   "id": 1,
                                   "method": "tools/list",
                                   "params": {}
                               })
        
        if response.status_code == 200:
            tools = response.json().get("result", {}).get("tools", [])
            print(f"✅ Found {len(tools)} available tools:")
            for tool in tools[:5]:  # Show first 5 tools
                print(f"   - {tool.get('name', 'Unknown')}: {tool.get('description', 'No description')}")
            return tools
        else:
            print(f"❌ Failed to get tools: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error getting tools: {e}")
        return []

def test_backend_connection():
    """Test connection to our backend"""
    print("🔍 Testing Backend Connection...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/actuator/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend connection successful")
            return True
        else:
            print(f"❌ Backend error: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def generate_jwt_token():
    """Generate JWT token for backend authentication"""
    print("🔑 Generating JWT token for backend...")
    
    try:
        response = requests.post(f"{BACKEND_URL}/auth/generate-zapier-token",
                               headers={"Content-Type": "application/json"},
                               json={"zapierSecret": "ZAPIER_SECRET_2024"})
        
        if response.status_code == 200:
            token = response.json().get("token")
            print("✅ JWT token generated successfully")
            return token
        else:
            print(f"❌ Failed to generate JWT token: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error generating JWT token: {e}")
        return None

def test_email_webhook():
    """Test email processing webhook"""
    print("📧 Testing email webhook...")
    
    jwt_token = generate_jwt_token()
    if not jwt_token:
        return False
    
    # Mock email data
    mock_email = {
        "fromEmail": "customer@example.com",
        "toEmail": "sales@yourcompany.com",
        "subject": "Product Enquiry - Salmon Fillets",
        "body": """Hello,

We would like to request a quote for:
- Salmon fillets, skinless, 500kg
- Atlantic salmon, premium grade  
- Delivery required by end of month

Please send quote to: customer@example.com

Best regards,
John Smith
ABC Seafood Ltd
Phone: +1-555-123-4567
""",
        "receivedAt": datetime.now().isoformat(),
        "attachments": []
    }
    
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/webhooks/zapier/email-received",
                               headers=headers,
                               json=mock_email)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Email webhook test successful")
            print(f"   Enquiry ID: {result.get('enquiryId', 'N/A')}")
            print(f"   Status: {result.get('status', 'N/A')}")
            return True
        else:
            print(f"❌ Email webhook test failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error testing email webhook: {e}")
        return False

def create_mcp_workflow():
    """Create an MCP workflow for email processing"""
    print("⚙️ Creating MCP workflow for email processing...")
    
    headers = {
        "Authorization": f"Bearer {ZAPIER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # MCP workflow configuration
    workflow_config = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "resources/read",
        "params": {
            "uri": "zapier://apps/outlook/triggers/new_email"
        }
    }
    
    try:
        response = requests.post(f"{ZAPIER_MCP_SERVER}", 
                               headers=headers,
                               json=workflow_config)
        
        if response.status_code == 200:
            print("✅ MCP workflow configuration retrieved")
            return response.json()
        else:
            print(f"❌ Failed to configure MCP workflow: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error creating MCP workflow: {e}")
        return None

def main():
    """Main integration test function"""
    print("🚀 Zapier MCP Integration Test")
    print("=" * 50)
    
    # Test connections
    zapier_ok = test_zapier_mcp_connection()
    backend_ok = test_backend_connection()
    
    if not zapier_ok or not backend_ok:
        print("\n❌ Connection tests failed. Please check your setup.")
        return False
    
    # Get available tools
    tools = get_available_tools()
    
    # Test email processing
    email_ok = test_email_webhook()
    
    # Create MCP workflow
    workflow = create_mcp_workflow()
    
    print("\n" + "=" * 50)
    print("📊 Integration Test Summary")
    print("=" * 50)
    print(f"Zapier MCP Connection: {'✅ OK' if zapier_ok else '❌ FAILED'}")
    print(f"Backend Connection: {'✅ OK' if backend_ok else '❌ FAILED'}")
    print(f"Available Tools: {len(tools)} found")
    print(f"Email Webhook: {'✅ OK' if email_ok else '❌ FAILED'}")
    print(f"MCP Workflow: {'✅ OK' if workflow else '❌ FAILED'}")
    
    if zapier_ok and backend_ok and email_ok:
        print("\n🎉 Integration test successful! Ready for production use.")
        print("\n📋 Next Steps:")
        print("1. Configure Outlook email triggers in Zapier MCP")
        print("2. Set up email processing workflows")
        print("3. Test with real emails")
        print("4. Monitor the Email Dashboard at http://localhost:3001/email-dashboard")
        return True
    else:
        print("\n⚠️ Some tests failed. Please review and fix issues.")
        return False

if __name__ == "__main__":
    main() 