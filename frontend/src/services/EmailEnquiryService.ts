import axios from 'axios';
import { API_BASE_URL } from '../config';
import AuthService from './AuthService';

const API_URL = API_BASE_URL + '/webhooks/zapier';

// Types
export interface EmailEnquiry {
  id: number;
  enquiryId: string;
  fromEmail: string;
  subject: string;
  emailBody: string;
  status: 'RECEIVED' | 'PROCESSING' | 'QUOTED' | 'CONVERTED' | 'EXPIRED';
  receivedAt: string;
  processedAt?: string;
  customer: Customer;
  enquiryItems: EnquiryItem[];
  aiProcessed: boolean;
  processingNotes?: string;
}

export interface Customer {
  id: number;
  email: string;
  contactPerson?: string;
  companyName?: string;
  phone?: string;
  address?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnquiryItem {
  id: number;
  customerSkuReference?: string;
  productDescription: string;
  requestedQuantity: number;
  deliveryRequirement?: string;
  specialInstructions?: string;
  product?: string;
  trimType?: string;
  rmSpec?: string;
  productType?: string;
  packagingType?: string;
  transportMode?: string;
  unitPrice?: number;
  totalPrice?: number;
  currency?: string;
  mappingConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'MANUAL_REVIEW';
  aiMapped: boolean;
  aiProcessingNotes?: string;
  processedAt?: string;
}

export interface Quote {
  id: number;
  quoteNumber: string;
  enquiryId: string;
  customer: Customer;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  totalAmount: number;
  currency: string;
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
  expiresAt?: string;
  validityPeriod: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  specialInstructions?: string;
  quoteItems: QuoteItem[];
}

export interface QuoteItem {
  id: number;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  notes?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  quoteNumber: string;
  customer: Customer;
  status: 'CONFIRMED' | 'IN_PRODUCTION' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  totalAmount: number;
  currency: string;
  createdAt: string;
  confirmedAt?: string;
  expectedDelivery?: string;
  deliveredAt?: string;
  shippingAddress?: string;
  specialInstructions?: string;
  orderItems: OrderItem[];
}

export interface OrderItem {
  id: number;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  status: 'PENDING' | 'IN_PRODUCTION' | 'QUALITY_CHECK' | 'COMPLETED' | 'SHIPPED';
  productionNotes?: string;
}

// Helper function to get auth headers
const getHeaders = () => {
  const user = AuthService.getCurrentUser();
  return {
    headers: {
      'Content-Type': 'application/json',
      ...(user && user.token ? { 'Authorization': `Bearer ${user.token}` } : {})
    }
  };
};

// API Service Class
class EmailEnquiryService {
  
  // Email Processing (Webhook simulation)
  async simulateEmailReceived(emailData: {
    fromEmail: string;
    subject: string;
    emailBody: string;
    messageId?: string;
  }) {
    try {
      console.log('Simulating email received:', emailData);
      
      const response = await axios.post(
        `${API_URL}/email-received`,
        {
          fromEmail: emailData.fromEmail,
          toEmail: 'orders@yourcompany.com',
          subject: emailData.subject,
          emailBody: emailData.emailBody,
          messageId: emailData.messageId || 'sim-' + Date.now(),
          receivedAt: new Date().toISOString()
        },
        getHeaders()
      );
      
      return response.data;
    } catch (error) {
      console.error('Error simulating email received:', error);
      throw error;
    }
  }

  // Generate and send quote
  async generateQuote(enquiryId: string) {
    try {
      console.log('Generating quote for enquiry:', enquiryId);
      
      const response = await axios.post(
        `${API_URL}/send-quote/${enquiryId}`,
        {},
        getHeaders()
      );
      
      return response.data;
    } catch (error) {
      console.error('Error generating quote:', error);
      throw error;
    }
  }

  // Quote acceptance
  async simulateQuoteAcceptance(quoteData: {
    quoteNumber: string;
    customerEmail: string;
    acceptanceMessage?: string;
  }) {
    try {
      console.log('Simulating quote acceptance:', quoteData);
      
      const response = await axios.post(
        `${API_URL}/quote-accepted`,
        {
          fromEmail: quoteData.customerEmail,
          subject: `RE: Quote ${quoteData.quoteNumber} - ACCEPTED`,
          emailBody: quoteData.acceptanceMessage || 
                     `We accept quote ${quoteData.quoteNumber}. Please proceed with the order.`,
          messageId: 'accept-' + Date.now(),
          receivedAt: new Date().toISOString()
        },
        getHeaders()
      );
      
      return response.data;
    } catch (error) {
      console.error('Error simulating quote acceptance:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderNumber: string, status: string, notes?: string) {
    try {
      console.log('Updating order status:', { orderNumber, status });
      
      const response = await axios.post(
        `${API_URL}/order-status-update`,
        {
          order_number: orderNumber,
          status: status,
          notes: notes || '',
          updated_at: new Date().toISOString()
        },
        getHeaders()
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Get dashboard statistics (mock for now)
  async getDashboardStats() {
    try {
      // TODO: Replace with actual API call
      return {
        totalEnquiries: 15,
        pendingQuotes: 8,
        activeOrders: 12,
        totalCustomers: 25,
        recentActivity: [
          {
            id: 1,
            type: 'ENQUIRY',
            title: 'New enquiry from ABC Corp',
            description: 'Salmon fillet request - 500kg',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'PROCESSING'
          },
          {
            id: 2,
            type: 'QUOTE',
            title: 'Quote QUO-2024-001 sent',
            description: 'Sent to customer@example.com',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            status: 'SENT'
          },
          {
            id: 3,
            type: 'ORDER',
            title: 'Order ORD-2024-001 confirmed',
            description: 'Production started',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'IN_PRODUCTION'
          }
        ]
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // Get all enquiries (mock for now)
  async getAllEnquiries(): Promise<EmailEnquiry[]> {
    try {
      // TODO: Replace with actual API call
      return [
        {
          id: 1,
          enquiryId: 'ENQ-2024-001',
          fromEmail: 'customer@abc-corp.com',
          subject: 'Salmon Fillet Enquiry - Urgent',
          emailBody: 'Hi, we need 500kg of fresh salmon fillets for next week delivery. Please provide quote.',
          status: 'PROCESSING',
          receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          processedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          customer: {
            id: 1,
            email: 'customer@abc-corp.com',
            contactPerson: 'John Smith',
            companyName: 'ABC Corp',
            phone: '+1-555-0123',
            country: 'USA',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          enquiryItems: [
            {
              id: 1,
              customerSkuReference: 'ABC-SALMON-001',
              productDescription: 'Fresh salmon fillets',
              requestedQuantity: 500,
              deliveryRequirement: 'Next week',
              product: 'Salmon',
              trimType: 'Fillet',
              rmSpec: 'Fresh',
              productType: 'Fresh',
              packagingType: 'Box',
              transportMode: 'Air',
              unitPrice: 12.50,
              totalPrice: 6250.00,
              currency: 'USD',
              mappingConfidence: 'HIGH',
              aiMapped: true,
              aiProcessingNotes: 'Successfully mapped from customer description',
              processedAt: new Date().toISOString()
            }
          ],
          aiProcessed: true,
          processingNotes: 'AI successfully extracted 1 product requirement'
        }
      ];
    } catch (error) {
      console.error('Error getting enquiries:', error);
      throw error;
    }
  }

  // Get all quotes (mock for now)
  async getAllQuotes(): Promise<Quote[]> {
    try {
      // TODO: Replace with actual API call
      return [
        {
          id: 1,
          quoteNumber: 'QUO-2024-001',
          enquiryId: 'ENQ-2024-001',
          customer: {
            id: 1,
            email: 'customer@abc-corp.com',
            contactPerson: 'John Smith',
            companyName: 'ABC Corp',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          status: 'SENT',
          totalAmount: 6250.00,
          currency: 'USD',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          validityPeriod: '30 days',
          paymentTerms: 'Net 30',
          deliveryTerms: 'FOB Origin',
          quoteItems: [
            {
              id: 1,
              itemDescription: 'Fresh salmon fillets - Premium quality',
              quantity: 500,
              unitPrice: 12.50,
              totalPrice: 6250.00,
              currency: 'USD',
              notes: 'Delivery within 7 days'
            }
          ]
        }
      ];
    } catch (error) {
      console.error('Error getting quotes:', error);
      throw error;
    }
  }

  // Get all orders (mock for now)
  async getAllOrders(): Promise<Order[]> {
    try {
      // TODO: Replace with actual API call
      return [
        {
          id: 1,
          orderNumber: 'ORD-2024-001',
          quoteNumber: 'QUO-2024-001',
          customer: {
            id: 1,
            email: 'customer@abc-corp.com',
            contactPerson: 'John Smith',
            companyName: 'ABC Corp',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          status: 'IN_PRODUCTION',
          totalAmount: 6250.00,
          currency: 'USD',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          confirmedAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
          expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          shippingAddress: '123 Business St, City, State, ZIP',
          specialInstructions: 'Handle with care - perishable goods',
          orderItems: [
            {
              id: 1,
              itemDescription: 'Fresh salmon fillets - Premium quality',
              quantity: 500,
              unitPrice: 12.50,
              totalPrice: 6250.00,
              currency: 'USD',
              status: 'IN_PRODUCTION',
              productionNotes: 'Quality check scheduled for tomorrow'
            }
          ]
        }
      ];
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  }

  // Get all customers (mock for now)
  async getAllCustomers(): Promise<Customer[]> {
    try {
      // TODO: Replace with actual API call
      return [
        {
          id: 1,
          email: 'customer@abc-corp.com',
          contactPerson: 'John Smith',
          companyName: 'ABC Corp',
          phone: '+1-555-0123',
          address: '123 Business St, City, State, ZIP',
          country: 'USA',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          email: 'orders@seafood-inc.com',
          contactPerson: 'Mary Johnson',
          companyName: 'Seafood Inc',
          phone: '+1-555-0456',
          address: '456 Marine Ave, Port City, State, ZIP',
          country: 'USA',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  }
}

export default new EmailEnquiryService(); 