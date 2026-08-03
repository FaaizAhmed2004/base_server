import axios, { AxiosInstance } from 'axios';

export interface RevolutOrderResponse {
  id: string;
  state?: string;
  checkout_url?: string;
  failure_reason?: string;
  related_order_id?: string;
}

interface CreateOrderPayload {
  amount: number;
  currency: string;
  description?: string;
}

interface RefundOrderPayload {
  amount?: number;
  description?: string;
}

class RevolutService {
  private client: AxiosInstance;

  constructor() {
    const apiKey = process.env.REVOLUT_API_KEY;
    const baseURL = process.env.REVOLUT_API_URL;

    if (!apiKey) {
      throw new Error('REVOLUT_API_KEY is missing');
    }

    if (!baseURL) {
      throw new Error('REVOLUT_API_URL is missing');
    }

    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  async createOrder(data: CreateOrderPayload): Promise<RevolutOrderResponse> {
    const response = await this.client.post<RevolutOrderResponse>('/orders', data);

    return response.data;
  }

  async getOrder(orderId: string): Promise<RevolutOrderResponse> {
    const response = await this.client.get<RevolutOrderResponse>(`/orders/${orderId}`);

    return response.data;
  }

  async refundOrder(
    orderId: string,
    data: RefundOrderPayload
  ): Promise<RevolutOrderResponse> {
    const response = await this.client.post<RevolutOrderResponse>(
      `/orders/${orderId}/refund`,
      data
    );

    return response.data;
  }
}

export const revolutService = new RevolutService();