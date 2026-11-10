import { apiClient } from './apiClient';

const BASE = '/assistant';

// Gemini needs more time than the 15s default of the shared client.
const CHAT_TIMEOUT_MS = 90000;

const listOf = (data) => (Array.isArray(data) ? data : data?.results || []);

export const getConversations = async () => listOf((await apiClient.get(`${BASE}/conversations/`)).data);

export const getConversation = async (id) => (await apiClient.get(`${BASE}/conversations/${id}/`)).data;

export const createConversation = async (title) =>
  (await apiClient.post(`${BASE}/conversations/`, title ? { title } : {})).data;

export const deleteConversation = (id) => apiClient.delete(`${BASE}/conversations/${id}/`);

export const sendMessage = async ({ message, conversationId }) => {
  const payload = {
    message,
    ...(conversationId ? { conversation_id: conversationId } : {}),
  };
  const response = await apiClient.post(`${BASE}/chat/`, payload, { timeout: CHAT_TIMEOUT_MS });
  return response.data;
};
