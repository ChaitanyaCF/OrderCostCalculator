import axios from 'axios';
import AuthService from './AuthService';
import { InquiryFormData, Inquiry } from '../types/types';

class InquiryService {
  async getProductOptions(): Promise<string[]> {
    const response = await axios.get('/api/options/products', {
      headers: AuthService.getAuthHeader()
    });
    return response.data;
  }

  async getTrimTypes(product: string): Promise<string[]> {
    const response = await axios.get(`/api/options/trim-types?product=${product}`, {
      headers: AuthService.getAuthHeader()
    });
    return response.data;
  }

  async getRmSpecs(): Promise<string[]> {
    const response = await axios.get('/api/options/rm-specs', {
      headers: AuthService.getAuthHeader()
    });
    return response.data;
  }

  async getProdTypes(): Promise<string[]> {
    const response = await axios.get('/api/options/product-types', {
      headers: AuthService.getAuthHeader()
    });
    return response.data;
  }

  async getPackagingTypes(product: string, prodType: string): Promise<string[]> {
    const response = await axios.get(`/api/options/packaging-types?product=${product}&prodType=${prodType}`, {
      headers: AuthService.getAuthHeader()
    });
    return response.data;
  }

  async getPackagingSizes(product: string, prodType: string): Promise<string[]> {
    const response = await axios.get(`/api/options/packaging-sizes?product=${product}&prodType=${prodType}`, {
      headers: AuthService.getAuthHeader()
    });
    return response.data;
  }

  async getTransportModes(): Promise<string[]> {
    const response = await axios.get('/api/options/transport-modes', {
      headers: AuthService.getAuthHeader()
    });
    return response.data;
  }

  async calculateRates(product: string, trimType: string, rmSpec: string, 
                      prodType: string, packType: string, transportMode: string): Promise<{ filingRate: number, packagingRate: number }> {
    const response = await axios.get(`/api/calculate/rates`, {
      params: {
        product,
        trimType,
        rmSpec,
        prodType,
        packType,
        transportMode
      },
      headers: AuthService.getAuthHeader()
    });
    return response.data;
  }

  async calculateCharges(yieldValue: number, weight: number, options: {
    prodaB?: boolean,
    encoding?: boolean
  }): Promise<{ palletCharge: number, terminalCharge: number, optionalCharges: any, totalCharges: number }> {
    const response = await axios.post('/api/calculate/charges', {
      yieldValue,
      weight,
      options
    }, {
      headers: AuthService.getAuthHeader()
    });
    return response.data;
  }

  async saveInquiry(inquiryData: InquiryFormData): Promise<{ message: string }> {
    const response = await axios.post('/api/inquiries', inquiryData, {
      headers: AuthService.getAuthHeader()
    });
    return response.data;
  }

  async getUserInquiries(): Promise<Inquiry[]> {
    const response = await axios.get('/api/inquiries', {
      headers: AuthService.getAuthHeader()
    });
    return response.data;
  }
}

export default new InquiryService();