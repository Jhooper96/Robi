import { apiRequest } from "./queryClient";
import { Message, MessageFilter, MessageResponse, MessageAssign, Property, Tenant } from "@shared/schema";

// Define a message status update interface
export interface MessageStatusUpdate {
  messageId: number;
  status: string;
}

// Messages API
export const getMessages = async (filter: MessageFilter = {}): Promise<Message[]> => {
  const searchParams = new URLSearchParams();
  
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  });
  
  const queryString = searchParams.toString();
  const url = `/api/messages${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Error fetching messages: ${response.statusText}`);
  }
  
  return response.json();
};

export const getMessageStats = async (): Promise<any> => {
  const response = await fetch('/api/messages/stats', { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Error fetching message stats: ${response.statusText}`);
  }
  
  return response.json();
};

export const getProperties = async (): Promise<Property[]> => {
  const response = await fetch('/api/properties', { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Error fetching properties: ${response.statusText}`);
  }
  
  return response.json();
};

export const getTenants = async (): Promise<Tenant[]> => {
  const response = await fetch('/api/tenants', { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Error fetching tenants: ${response.statusText}`);
  }
  
  return response.json();
};

export const respondToMessage = async (data: MessageResponse): Promise<Message> => {
  return apiRequest('POST', '/api/messages/respond', data)
    .then(res => res.json());
};

export const assignMessage = async (data: MessageAssign): Promise<Message> => {
  return apiRequest('POST', '/api/messages/assign', data)
    .then(res => res.json());
};

export const resolveMessage = async (messageId: number): Promise<Message> => {
  return apiRequest('POST', `/api/messages/${messageId}/resolve`, {})
    .then(res => res.json());
};

export const updateMessageStatus = async (data: MessageStatusUpdate): Promise<Message> => {
  return apiRequest('POST', `/api/messages/${data.messageId}/status`, { status: data.status })
    .then(res => res.json());
};

export const createTenant = async (tenant: Partial<Tenant>): Promise<Tenant> => {
  return apiRequest('POST', '/api/tenants', tenant)
    .then(res => res.json());
};
