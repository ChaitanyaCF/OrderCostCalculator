import axios from 'axios';
import { API_BASE_URL } from '../config';
import AuthService from './AuthService';

export interface Email {
  id: number;
  fromEmail: string;
  subject: string;
  emailBody: string;
  receivedAt: string;
  classification: string | null;
  manualClassification: string | null;
  effectiveClassification: string;
  processed: boolean;
  enquiryId: string | null;
  orderId: string | null;
  isManuallyClassified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailStats {
  totalEmails: number;
  needingClassification: number;
  enquiries: number;
  orders: number;
  general: number;
}

class EmailService {
  private baseURL = `${API_BASE_URL}/api/emails`;

  private getAuthHeaders() {
    const user = AuthService.getCurrentUser();
    return user?.token ? { 
      'Authorization': `Bearer ${user.token}`,
      'Content-Type': 'application/json'
    } : { 'Content-Type': 'application/json' };
  }

  /**
   * Get all emails with their classification status
   */
  async getAllEmails(): Promise<Email[]> {
    try {
      const response = await axios.get(`${this.baseURL}/all`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all emails:', error);
      throw error;
    }
  }

  /**
   * Get emails that need manual classification
   */
  async getEmailsNeedingClassification(): Promise<Email[]> {
    try {
      const response = await axios.get(`${this.baseURL}/needing-classification`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching emails needing classification:', error);
      throw error;
    }
  }

  /**
   * Manually classify an email as Enquiry or Order
   */
  async classifyEmail(emailId: number, classification: 'INITIAL_ENQUIRY' | 'ORDER' | 'GENERAL' | 'FOLLOW_UP'): Promise<any> {
    try {
      const response = await axios.post(`${this.baseURL}/${emailId}/classify`, {
        classification: classification
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error classifying email:', error);
      throw error;
    }
  }

  /**
   * Get email classification statistics
   */
  async getEmailStats(): Promise<EmailStats> {
    try {
      const response = await axios.get(`${this.baseURL}/stats`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching email stats:', error);
      throw error;
    }
  }

  /**
   * Format email classification for display
   */
  formatClassification(classification: string): string {
    switch (classification) {
      case 'INITIAL_ENQUIRY':
        return 'Initial Enquiry';
      case 'FOLLOW_UP':
        return 'Follow Up';
      case 'ORDER':
        return 'Order';
      case 'GENERAL':
        return 'General';
      case 'UNCLASSIFIED':
        return 'Unclassified';
      default:
        return classification;
    }
  }

  /**
   * Get classification color for UI
   */
  getClassificationColor(classification: string): 'primary' | 'success' | 'warning' | 'error' | 'default' {
    switch (classification) {
      case 'INITIAL_ENQUIRY':
        return 'primary';
      case 'ORDER':
        return 'success';
      case 'FOLLOW_UP':
        return 'warning';
      case 'GENERAL':
        return 'default';
      case 'UNCLASSIFIED':
        return 'error';
      default:
        return 'default';
    }
  }
}

export default new EmailService();