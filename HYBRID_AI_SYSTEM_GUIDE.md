# Hybrid AI System Guide

## 🚀 **Smart Email Processing: Pattern-First with AI Fallback**

The hybrid system combines the **speed and cost-effectiveness** of pattern matching with the **intelligence** of OpenAI GPT, giving you the best of both worlds.

## 🧠 **How the Hybrid System Works**

### 📊 **Processing Flow**

```
📧 Email Received
     ↓
🔍 Pattern-Based Analysis
     ↓
📊 Confidence Scoring
     ↓
❓ Confidence < Threshold?
     ├─ NO → ✅ Use Pattern Result (FREE)
     └─ YES → 🤖 Try OpenAI (PAID)
              ↓
         ✅ Return AI Result
         ❌ Fallback to Pattern
```

### 🎯 **Decision Logic**

The system uses AI fallback when:

#### **Email Classification**
- ✅ Pattern confidence < 70%
- ✅ Classified as "GENERAL" (unclear intent)
- ✅ Complex emails (>800 chars, >5 sentences)
- ✅ Contains questions or natural language

#### **Customer Extraction** 
- ✅ Extraction score < 50%
- ✅ No formal signature but rich content
- ✅ Informal email formats

#### **Product Parsing**
- ✅ No products found by patterns
- ✅ Parsing score < 60%
- ✅ Contains product indicators but failed extraction

## 📈 **Expected Performance**

### 🎯 **Pattern Success Rate (Free Processing)**
- **Structured business emails**: 85-90%
- **Formal enquiries**: 80-85%
- **Clear product specifications**: 75-80%
- **Standard signatures**: 70-75%

### 🤖 **AI Fallback Rate**
- **Estimated 20-30%** of emails will use AI
- **70-80% cost savings** vs pure AI approach
- **95%+ accuracy** for complex emails

## ⚙️ **Configuration Options**

### Basic Setup (Pattern-Only)
```properties
# Hybrid mode enabled but no OpenAI key = pattern-only
ai.hybrid.enabled=true
ai.openai.fallback.enabled=true
openai.api.key=
```

### Hybrid Setup (Pattern + AI)
```properties
# Full hybrid mode with OpenAI fallback
ai.hybrid.enabled=true
ai.openai.fallback.enabled=true
openai.api.key=sk-your-openai-key-here
ai.confidence.threshold=0.7
```

### Advanced Tuning
```properties
# Confidence thresholds (0.0 = always use AI, 1.0 = never use AI)
ai.classification.confidence.threshold=0.8  # Higher = less AI usage
ai.extraction.confidence.threshold=0.7      # Lower = more AI usage
ai.parsing.confidence.threshold=0.6

# Cost control
ai.max.daily.requests=1000
ai.cost.alert.threshold=50.00
```

## 🧪 **Test Examples**

### ✅ **Pattern System Handles (No AI Cost)**

#### Example 1: Clear Business Enquiry
```
Subject: Salmon Fillet Enquiry

We need a quote for:
- 500kg salmon fillets, skinless  
- 200kg cod steaks

Best regards,
John Smith
ABC Seafood Ltd

RESULT: ✅ Pattern confidence: 95%
💰 Cost: $0 (no AI call)
⚡ Speed: <1ms
```

#### Example 2: Order Confirmation
```
Subject: Order Confirmation

We want to place an order for 300kg haddock fillets.
Please confirm delivery date.

RESULT: ✅ Pattern confidence: 90%
💰 Cost: $0 (no AI call)
🎯 Classification: ORDER
```

### 🤖 **AI Fallback Triggered (Small Cost)**

#### Example 3: Natural Language Enquiry
```
Subject: Restaurant Supply Needs

Hi there! We're a seafood restaurant chain and go through 
about half a ton of white fish weekly for our fish and chips. 
We need it cleaned and ready to cook. Can you help?

Thanks!
Mike from Ocean's Table

PATTERN RESULT: ❌ Confidence: 30% (triggers AI)
AI RESULT: ✅ Classification: ENQUIRY
          ✅ Product: COD (inferred from "fish and chips")  
          ✅ Quantity: ~500kg weekly
          ✅ Contact: Mike
💰 Cost: ~$0.003 (single AI call with GPT-4o Mini)
```

#### Example 4: Complex Multi-Product Request
```
Subject: Bulk Order Discussion

We operate 5 restaurants and typically serve 200+ customers 
daily. Looking for sustainable seafood options. We need:
- White fish for our signature fish and chips
- Salmon for grilled dishes  
- Something special for weekend specials

What can you recommend? We care about quality and sustainability.

PATTERN RESULT: ❌ Confidence: 25% (triggers AI)
AI RESULT: ✅ Extracts context, estimates quantities, maps products
💰 Cost: ~$0.005 (longer content with GPT-4o Mini)
```

## 💰 **Cost Analysis**

### Monthly Cost Estimation (1000 emails)

#### Pattern-Only Scenario
```
Cost: $0
Success Rate: 75%
Processing: 750 emails correctly, 250 poorly
```

#### Pure AI Scenario  
```
Cost: $3-5/month (GPT-4o Mini)
Success Rate: 95%
Processing: 950 emails correctly
```

#### Hybrid Scenario (Recommended)
```
Pattern Processing: 750 emails (75%) → $0
AI Fallback: 250 emails (25%) → $0.75-1.25
Total Cost: $0.75-1.25/month
Success Rate: 90-95%
Cost Savings: 75-85% vs pure AI
```

## 📊 **Monitoring and Analytics**

### Built-in Logging
```
🔄 Starting hybrid email classification for: Product Enquiry
📊 Pattern classification: ENQUIRY (confidence: 0.85)
✅ Using pattern classification result: ENQUIRY
📈 AI Usage: operation=classification, result=pattern_sufficient, textLength=0

🔄 Starting hybrid product parsing
📊 Pattern parsing score: 0.40, found 0 items  
🤖 Pattern parsing insufficient, trying OpenAI...
✅ OpenAI parsed 2 product items
📈 AI Usage: operation=product_parsing, result=openai_used, textLength=245
```

### Statistics API
```bash
GET /api/ai/stats

{
  "hybridModeEnabled": true,
  "openAIFallbackEnabled": true,
  "confidenceThreshold": 0.7,
  "patternSuccessRate": 0.75,
  "aiUsageRate": 0.25,
  "costSavings": "75%",
  "totalEmailsProcessed": 1000,
  "aiCallsThisMonth": 250,
  "estimatedMonthlyCost": "$3.50"
}
```

## 🔧 **Tuning the System**

### Reduce AI Usage (Lower Costs)
```properties
# Stricter thresholds = less AI usage
ai.confidence.threshold=0.5          # Lower = more pattern trust
ai.classification.confidence.threshold=0.9
ai.extraction.confidence.threshold=0.8
ai.parsing.confidence.threshold=0.7
```

### Increase Accuracy (Higher Costs)
```properties
# Looser thresholds = more AI usage
ai.confidence.threshold=0.8          # Higher = less pattern trust  
ai.classification.confidence.threshold=0.6
ai.extraction.confidence.threshold=0.5
ai.parsing.confidence.threshold=0.4
```

### Emergency Pattern-Only Mode
```properties
# Disable AI fallback completely
ai.openai.fallback.enabled=false
```

## 🚀 **Getting Started**

### Step 1: Start with Pattern-Only
```properties
# No OpenAI key = free pattern processing
ai.hybrid.enabled=true
openai.api.key=
```

### Step 2: Monitor Pattern Performance
- Check logs for confidence scores
- Identify emails that fail pattern processing
- Note complex enquiries that need better handling

### Step 3: Add OpenAI When Ready
```properties
# Add your OpenAI key to enable AI fallback
openai.api.key=sk-your-key-here
ai.confidence.threshold=0.7
```

### Step 4: Optimize Based on Usage
- Monitor AI usage rates and costs
- Adjust confidence thresholds
- Add more patterns for common cases

## 🎯 **Best Practices**

### ✅ **Do:**
- Start with pattern-only to understand your email types
- Monitor AI usage and costs regularly
- Adjust thresholds based on your business needs
- Add new patterns for frequently recurring email formats
- Use higher confidence thresholds to save costs

### ❌ **Don't:**
- Set thresholds too low (wastes money on unnecessary AI calls)
- Set thresholds too high (misses emails that need AI)
- Disable pattern processing entirely
- Ignore cost monitoring
- Use AI for simple, structured emails

## 📈 **Expected Outcomes**

After implementing the hybrid system:

### Month 1
- **Pattern success**: 70-75%
- **AI usage**: 25-30% 
- **Cost**: $0.75-1.25/month (1000 emails)
- **Accuracy**: 85-90%

### Month 3 (with pattern improvements)
- **Pattern success**: 80-85%
- **AI usage**: 15-20%
- **Cost**: $0.40-0.75/month
- **Accuracy**: 90-95%

### Month 6 (optimized)
- **Pattern success**: 85-90%
- **AI usage**: 10-15%
- **Cost**: $0.25-0.50/month
- **Accuracy**: 95%+

## 🎉 **Summary**

The hybrid system gives you:

✅ **Smart cost optimization** - only pay for AI when needed
✅ **High accuracy** - patterns for simple cases, AI for complex ones  
✅ **Reliability** - always falls back to patterns if AI fails
✅ **Scalability** - handles volume efficiently
✅ **Transparency** - full logging and monitoring
✅ **Flexibility** - easily adjustable thresholds

**Start with pattern-only, add AI when ready, optimize based on your needs!** 