// OpenClaw Gateway service
// Handles communication with the home OpenClaw instance

import * as SecureStore from 'expo-secure-store';
import { Message } from '../types/chat';

const TOKEN_KEY = 'openclaw_gateway_token';
const GATEWAY_URL_KEY = 'openclaw_gateway_url';

export class OpenClawService {
  private token: string | null = null;
  private gatewayUrl: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      this.token = await SecureStore.getItemAsync(TOKEN_KEY);
      this.gatewayUrl = await SecureStore.getItemAsync(GATEWAY_URL_KEY);
      return !!(this.token && this.gatewayUrl);
    } catch (error) {
      console.error('Failed to initialize OpenClaw service:', error);
      return false;
    }
  }

  async configure(gatewayUrl: string, token: string): Promise<void> {
    await SecureStore.setItemAsync(GATEWAY_URL_KEY, gatewayUrl);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    this.gatewayUrl = gatewayUrl;
    this.token = token;
  }

  async sendMessage(content: string): Promise<Message | null> {
    if (!this.token || !this.gatewayUrl) {
      throw new Error('OpenClaw not configured');
    }

    try {
      const response = await fetch(`${this.gatewayUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error(`Gateway error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: data.id || Date.now().toString(),
        role: 'assistant',
        content: data.content || data.message,
        timestamp: Date.now(),
        twin: data.twin, // 'case' or 'tars'
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.token || !this.gatewayUrl) {
      return false;
    }

    try {
      const response = await fetch(`${this.gatewayUrl}/api/health`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  isConfigured(): boolean {
    return !!(this.token && this.gatewayUrl);
  }
}

export const openClawService = new OpenClawService();
