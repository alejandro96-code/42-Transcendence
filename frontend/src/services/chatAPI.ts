import { readApiError } from './apiError'

const SERVER_IP = import.meta.env.VITE_SERVER_IP || window.location.hostname
const API_URL = import.meta.env.VITE_API_URL || `http://${SERVER_IP}:4000`

export interface ChatMessage {
  id: number
  sender_id: number
  receiver_id: number
  content: string
  created_at: string
}

export const chatAPI = {
  async getMessages(recipientId: number): Promise<ChatMessage[]> {
    const response = await fetch(`${API_URL}/api/messages/${recipientId}`, { credentials: 'include' })
    if (!response.ok) throw await readApiError(response, 'CHAT_MESSAGES_LOAD_FAILED')
    return response.json()
  },

  async sendMessage(recipientId: number, content: string): Promise<ChatMessage> {
    const response = await fetch(`${API_URL}/api/messages/${recipientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content }),
    })
    if (!response.ok) throw await readApiError(response, 'CHAT_MESSAGE_SEND_FAILED')
    return response.json()
  },

  async getUsers() {
    const response = await fetch(`${API_URL}/api/users`, { credentials: 'include' })
    if (!response.ok) throw await readApiError(response, 'CHAT_USERS_LOAD_FAILED')
    return response.json()
  },
}
