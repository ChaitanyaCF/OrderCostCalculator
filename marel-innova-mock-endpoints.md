# Marel Innova System - Mock API Endpoints for Integration Testing

## Base URL
```
https://api-demo.marel-innova.com/v2
```

## Authentication
- **Type**: Bearer Token
- **Header**: `Authorization: Bearer {token}`
- **Test Token**: `innova_test_token_2024_demo_12345`

---

## 📦 **Product Management Endpoints**

### Get Products
```
GET /products
GET /products/{productId}
GET /products/search?name={name}&category={category}
```

### Create/Update Products
```
POST /products
PUT /products/{productId}
DELETE /products/{productId}
```

**Sample Product Response:**
```json
{
  "productId": "PROD_SAL_001",
  "name": "Atlantic Salmon Fillet",
  "category": "SALMON",
  "species": "Salmo salar",
  "processingType": "FILLETED",
  "weightRange": {
    "min": 150,
    "max": 800,
    "unit": "grams"
  },
  "qualityGrade": "PREMIUM",
  "origin": "Norway",
  "certifications": ["ASC", "MSC"],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## 📋 **Order Management Endpoints**

### Orders
```
GET /orders
GET /orders/{orderId}
POST /orders
PUT /orders/{orderId}
DELETE /orders/{orderId}
GET /orders/status/{status}
```

### Order Items
```
GET /orders/{orderId}/items
POST /orders/{orderId}/items
PUT /orders/{orderId}/items/{itemId}
DELETE /orders/{orderId}/items/{itemId}
```

**Sample Order Response:**
```json
{
  "orderId": "ORD_2024_001234",
  "customerCode": "CUST_MOWI_001",
  "orderDate": "2024-01-15T08:00:00Z",
  "deliveryDate": "2024-01-22T12:00:00Z",
  "status": "CONFIRMED",
  "priority": "HIGH",
  "totalWeight": 2500.0,
  "totalValue": 15750.00,
  "currency": "EUR",
  "items": [
    {
      "itemId": "ITEM_001",
      "productCode": "PROD_SAL_001",
      "quantity": 500,
      "unit": "kg",
      "unitPrice": 12.50,
      "totalPrice": 6250.00,
      "specifications": {
        "trimType": "C",
        "rmSize": "3-4",
        "packaging": "IVP_5KG",
        "skinOn": true
      }
    }
  ]
}
```

---

## 👥 **Customer Management Endpoints**

### Customers
```
GET /customers
GET /customers/{customerId}
POST /customers
PUT /customers/{customerId}
GET /customers/search?name={name}&country={country}
```

**Sample Customer Response:**
```json
{
  "customerId": "CUST_MOWI_001",
  "companyName": "Mowi Central Europe",
  "contactPerson": "Razvan Popescu",
  "email": "razvan.popescu@mowi.com",
  "phone": "+48-123-456-789",
  "address": {
    "street": "Industrial Park 15",
    "city": "Warsaw",
    "country": "Poland",
    "postalCode": "00-001"
  },
  "customerType": "PREMIUM",
  "creditLimit": 500000.00,
  "paymentTerms": "NET_30",
  "preferredCurrency": "EUR"
}
```

---

## 📊 **Production Planning Endpoints**

### Production Orders
```
GET /production/orders
GET /production/orders/{productionOrderId}
POST /production/orders
PUT /production/orders/{productionOrderId}/status
```

### Production Capacity
```
GET /production/capacity
GET /production/capacity/available?date={date}
POST /production/capacity/reserve
```

**Sample Production Order:**
```json
{
  "productionOrderId": "PROD_ORD_2024_0156",
  "salesOrderId": "ORD_2024_001234",
  "productCode": "PROD_SAL_001",
  "plannedQuantity": 500,
  "actualQuantity": 485,
  "status": "IN_PROGRESS",
  "startDate": "2024-01-16T06:00:00Z",
  "endDate": "2024-01-16T14:00:00Z",
  "line": "PROCESSING_LINE_A",
  "operator": "John Smith",
  "qualityChecks": [
    {
      "checkType": "WEIGHT_CONTROL",
      "result": "PASSED",
      "timestamp": "2024-01-16T10:30:00Z"
    }
  ]
}
```

---

## 📈 **Inventory Management Endpoints**

### Stock Levels
```
GET /inventory/stock
GET /inventory/stock/{productCode}
POST /inventory/adjustments
GET /inventory/movements
```

### Raw Materials
```
GET /inventory/raw-materials
GET /inventory/raw-materials/{materialId}
POST /inventory/raw-materials/receipt
```

**Sample Inventory Response:**
```json
{
  "productCode": "PROD_SAL_001",
  "currentStock": 1250.5,
  "unit": "kg",
  "location": "COLD_STORAGE_A",
  "expiryDate": "2024-02-15T23:59:59Z",
  "batchNumber": "BATCH_2024_0045",
  "qualityStatus": "APPROVED",
  "reservedQuantity": 500.0,
  "availableQuantity": 750.5,
  "lastUpdated": "2024-01-15T16:45:00Z"
}
```

---

## 💰 **Pricing & Quotes Endpoints**

### Price Lists
```
GET /pricing/pricelists
GET /pricing/pricelists/{priceListId}
GET /pricing/products/{productCode}/price?customer={customerId}&date={date}
```

### Quotes
```
GET /quotes
GET /quotes/{quoteId}
POST /quotes
PUT /quotes/{quoteId}
POST /quotes/{quoteId}/convert-to-order
```

**Sample Quote Response:**
```json
{
  "quoteId": "QUO_2024_0789",
  "customerId": "CUST_MOWI_001",
  "quoteDate": "2024-01-15T09:00:00Z",
  "validUntil": "2024-01-29T23:59:59Z",
  "status": "PENDING",
  "totalAmount": 15750.00,
  "currency": "EUR",
  "items": [
    {
      "productCode": "PROD_SAL_001",
      "quantity": 500,
      "unitPrice": 12.50,
      "discount": 5.0,
      "netPrice": 11.88,
      "totalPrice": 5940.00
    }
  ],
  "terms": {
    "paymentTerms": "NET_30",
    "deliveryTerms": "EXW_FACTORY",
    "validityPeriod": 14
  }
}
```

---

## 🚚 **Logistics & Shipping Endpoints**

### Shipments
```
GET /logistics/shipments
GET /logistics/shipments/{shipmentId}
POST /logistics/shipments
PUT /logistics/shipments/{shipmentId}/status
```

### Delivery Tracking
```
GET /logistics/tracking/{trackingNumber}
POST /logistics/shipments/{shipmentId}/tracking-update
```

**Sample Shipment Response:**
```json
{
  "shipmentId": "SHIP_2024_0234",
  "orderId": "ORD_2024_001234",
  "trackingNumber": "MAREL_TRK_789456123",
  "carrier": "DHL_COLD_CHAIN",
  "status": "IN_TRANSIT",
  "pickupDate": "2024-01-17T08:00:00Z",
  "estimatedDelivery": "2024-01-18T14:00:00Z",
  "temperature": {
    "required": -2.0,
    "current": -1.8,
    "unit": "celsius"
  },
  "route": [
    {
      "location": "Marel Processing Plant",
      "timestamp": "2024-01-17T08:00:00Z",
      "status": "DEPARTED"
    },
    {
      "location": "Distribution Hub Warsaw",
      "timestamp": "2024-01-17T16:30:00Z",
      "status": "IN_TRANSIT"
    }
  ]
}
```

---

## 📊 **Quality Control Endpoints**

### Quality Tests
```
GET /quality/tests
GET /quality/tests/{testId}
POST /quality/tests
GET /quality/batches/{batchId}/tests
```

### Certificates
```
GET /quality/certificates
GET /quality/certificates/{certificateId}
POST /quality/certificates/generate
```

---

## 🔄 **Webhook Endpoints (for receiving data)**

### Webhook Registration
```
POST /webhooks/register
GET /webhooks
DELETE /webhooks/{webhookId}
```

### Sample Webhook Payload (Order Created):
```json
{
  "eventType": "ORDER_CREATED",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "orderId": "ORD_2024_001234",
    "customerId": "CUST_MOWI_001",
    "totalValue": 15750.00,
    "status": "PENDING_CONFIRMATION"
  },
  "metadata": {
    "source": "INNOVA_ERP",
    "version": "2.1.4",
    "correlationId": "corr_12345_abcdef"
  }
}
```

---

## 🧪 **Test Data Sets**

### Sample Field Mappings for Testing:

**Order Creation Mapping:**
- Source: `enquiry.totalCost` → Target: `order.totalValue`
- Source: `enquiry.customerEmail` → Target: `customer.email`
- Source: `enquiry.items[].quantity` → Target: `orderItems[].quantity`
- Source: `enquiry.items[].productDescription` → Target: `orderItems[].productCode`

**Transformation Examples:**
- Weight: `kg` → `grams` (multiply by 1000)
- Currency: `USD` → `EUR` (API call for conversion)
- Date: `DD/MM/YYYY` → `ISO 8601`
- Status: `QUOTED` → `PENDING_CONFIRMATION`

---

## 🔐 **Authentication Test Credentials**

```
Username: marel_test_user
Password: InnovaDemo2024!
API Key: innova_api_key_demo_xyz789
Client ID: innova_client_demo_001
Client Secret: innova_secret_demo_abc123
```

---

## 📝 **Usage Instructions**

1. **Use these URLs in the Integration Dashboard**
2. **Set Authentication Type**: Bearer Token
3. **Test Connection** with the provided credentials
4. **Discover Fields** to see the available data structure
5. **Create Mappings** between your system and Innova
6. **Test Transformations** with the sample data provided

These mock endpoints simulate a realistic Marel Innova system integration scenario! 🎯
