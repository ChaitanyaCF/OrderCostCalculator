# AI Agents Configuration Guide

## 🤖 **Current AI Implementation**

### ✅ **What We Have Now:**

1. **Rule-Based Pattern Matching** (`AIEmailProcessor.java`)
   - Email classification using keyword patterns
   - Product extraction using regex patterns
   - Customer info extraction using signature patterns
   - **Pros**: Fast, deterministic, no API costs
   - **Cons**: Limited flexibility, requires manual pattern updates

2. **OpenAI GPT Integration** (`OpenAIEmailProcessor.java`)
   - Real AI-powered email classification
   - Intelligent customer information extraction
   - Advanced product parsing with context understanding
   - **Pros**: Very intelligent, handles edge cases, learns from context
   - **Cons**: Requires API key, costs money, needs internet

## 🔧 **AI Service Options**

### Option 1: OpenAI GPT (Recommended)

#### Setup:
1. **Get OpenAI API Key**:
   - Sign up at https://platform.openai.com/
   - Generate API key
   - Choose model: `gpt-4` (best) or `gpt-3.5-turbo` (cheaper)

2. **Configure Application**:
   ```properties
   # application.properties
   openai.api.key=sk-your-openai-api-key-here
   openai.model=gpt-4
   openai.api.url=https://api.openai.com/v1/chat/completions
   ```

3. **Cost Estimation**:
   - GPT-4: ~$0.03 per 1K tokens (~750 words)
   - GPT-3.5: ~$0.002 per 1K tokens
   - Average email: ~200-500 tokens
   - Cost per email: $0.006-$0.015 (GPT-4), $0.0004-$0.001 (GPT-3.5)

### Option 2: Claude API (Anthropic)

#### Setup:
```properties
# application.properties
claude.api.key=your-claude-api-key
claude.model=claude-3-sonnet
claude.api.url=https://api.anthropic.com/v1/messages
```

### Option 3: Azure Cognitive Services

#### Setup:
```properties
# application.properties
azure.cognitive.key=your-azure-key
azure.cognitive.endpoint=https://your-region.cognitiveservices.azure.com/
azure.cognitive.region=your-region
```

### Option 4: Local AI Models

#### Setup:
```properties
# application.properties
local.ai.enabled=true
local.ai.model.path=/path/to/local/model
local.ai.api.url=http://localhost:11434/api/generate  # Ollama
```

## 🚀 **Enabling AI Agents**

### Method 1: OpenAI Integration

1. **Add OpenAI dependency** to `pom.xml`:
   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-web</artifactId>
   </dependency>
   ```

2. **Update EmailEnquiryService** to use OpenAI:
   ```java
   @Autowired
   private OpenAIEmailProcessor openAIEmailProcessor;
   
   // Replace AIEmailProcessor calls with OpenAIEmailProcessor
   String emailType = openAIEmailProcessor.classifyEmailWithAI(subject, body);
   Customer customer = openAIEmailProcessor.extractCustomerInfoWithAI(email, body, subject);
   List<EnquiryItem> items = openAIEmailProcessor.parseProductRequirementsWithAI(body);
   ```

3. **Add your OpenAI API key** to `application.properties`:
   ```properties
   openai.api.key=sk-your-actual-api-key-here
   openai.model=gpt-4
   ```

### Method 2: Hybrid Approach (Recommended)

Use AI for complex emails, patterns for simple ones:

```java
@Service
public class HybridEmailProcessor {
    
    @Autowired
    private AIEmailProcessor patternProcessor;
    
    @Autowired
    private OpenAIEmailProcessor aiProcessor;
    
    public String classifyEmail(String subject, String body) {
        // Try pattern matching first
        String patternResult = patternProcessor.classifyEmail(subject, body);
        
        // Use AI for uncertain cases
        if ("GENERAL".equals(patternResult) || isComplexEmail(subject, body)) {
            return aiProcessor.classifyEmailWithAI(subject, body);
        }
        
        return patternResult;
    }
    
    private boolean isComplexEmail(String subject, String body) {
        return body.length() > 500 || 
               subject.toLowerCase().contains("complex") ||
               !containsObviousKeywords(body);
    }
}
```

## 📊 **AI Agent Capabilities**

### 🔍 **Email Classification**
```
Input: "Hi, can you send me pricing for 500kg salmon fillets?"
Output: "ENQUIRY"

Input: "We accept quote QUO-2024-001, please proceed with order"
Output: "QUOTE_RESPONSE"
```

### 👤 **Customer Information Extraction**
```
Input Email:
"Best regards,
John Smith
ABC Seafood Ltd
Phone: +47-123-456-789
Oslo, Norway"

Output JSON:
{
  "contactPerson": "John Smith",
  "companyName": "ABC Seafood Ltd", 
  "phone": "+47-123-456-789",
  "country": "Norway"
}
```

### 🐟 **Product Requirements Parsing**
```
Input: "We need 500kg salmon fillets, skinless, and 200kg cod steaks"

Output JSON:
[
  {
    "productDescription": "500kg salmon fillets, skinless",
    "product": "SALMON",
    "trimType": "FILLET", 
    "requestedQuantity": 500,
    "mappingConfidence": "HIGH"
  },
  {
    "productDescription": "200kg cod steaks",
    "product": "COD",
    "trimType": "STEAK",
    "requestedQuantity": 200,
    "mappingConfidence": "HIGH"
  }
]
```

## ⚙️ **Configuration Options**

### AI Processing Settings
```properties
# Enable/disable AI processing
ai.processing.enabled=true

# Confidence thresholds
ai.classification.confidence.threshold=0.8
ai.extraction.confidence.threshold=0.7

# Fallback behavior
ai.fallback.to.patterns=true
ai.retry.on.failure=true
ai.max.retries=3

# Performance settings
ai.request.timeout=30000
ai.batch.processing=false
ai.cache.results=true
```

### Model Selection
```properties
# OpenAI Models
openai.model=gpt-4              # Best accuracy
# openai.model=gpt-3.5-turbo    # Best cost/performance
# openai.model=gpt-4-turbo      # Best speed

# Temperature (creativity vs consistency)
openai.temperature=0.1          # Very consistent
# openai.temperature=0.5        # Balanced
# openai.temperature=0.9        # Very creative
```

## 🧪 **Testing AI Agents**

### Test Email Processing
```bash
curl -X POST http://localhost:8082/webhooks/zapier/email-received \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromEmail": "john@abcseafood.com",
    "subject": "Salmon Fillet Enquiry",
    "emailBody": "Hello,\n\nWe would like to request pricing for:\n- 500kg salmon fillets, skinless\n- Atlantic salmon, premium grade\n\nBest regards,\nJohn Smith\nABC Seafood Ltd\nPhone: +47-123-456-789"
  }'
```

### Expected AI Response
```json
{
  "success": true,
  "enquiryId": "ENQ-2024-001",
  "classification": "ENQUIRY",
  "customer": {
    "contactPerson": "John Smith",
    "companyName": "ABC Seafood Ltd",
    "phone": "+47-123-456-789",
    "country": "Norway"
  },
  "products": [
    {
      "product": "SALMON",
      "trimType": "FILLET",
      "quantity": 500,
      "confidence": "HIGH"
    }
  ]
}
```

## 🔒 **Security and Privacy**

### API Key Security
```properties
# Use environment variables
openai.api.key=${OPENAI_API_KEY}

# Or encrypted properties
openai.api.key=ENC(encrypted-api-key)
```

### Data Privacy
- Email content is sent to AI service
- Consider data anonymization for sensitive content
- Review AI service privacy policies
- Implement data retention policies

## 📈 **Monitoring and Analytics**

### AI Performance Metrics
```java
@Component
public class AIMetrics {
    
    @EventListener
    public void onEmailProcessed(EmailProcessedEvent event) {
        // Track AI accuracy
        recordMetric("ai.classification.accuracy", event.getAccuracy());
        
        // Track processing time
        recordMetric("ai.processing.time", event.getProcessingTime());
        
        // Track costs
        recordMetric("ai.api.cost", event.getApiCost());
    }
}
```

### Dashboard Integration
- Add AI metrics to Email Dashboard
- Monitor classification accuracy
- Track API usage and costs
- Alert on processing failures

## 🚀 **Production Deployment**

### Environment Configuration
```yaml
# Production
spring:
  profiles: production
  
openai:
  api:
    key: ${OPENAI_API_KEY}
    url: https://api.openai.com/v1/chat/completions
  model: gpt-4
  temperature: 0.1
  
ai:
  processing:
    enabled: true
    timeout: 30000
    max-retries: 3
```

### Scaling Considerations
- Implement request queuing for high volume
- Use connection pooling for API calls
- Add circuit breaker for API failures
- Cache frequent AI responses

## 🎯 **Next Steps**

1. **Choose AI Service**: OpenAI GPT-4 recommended for best results
2. **Get API Key**: Sign up and get your API credentials
3. **Update Configuration**: Add API key to application.properties
4. **Test Integration**: Use test emails to verify AI processing
5. **Monitor Performance**: Track accuracy and costs
6. **Optimize Prompts**: Refine prompts based on results

---

🤖 **Your AI agents are ready to intelligently process emails and extract structured information!** 