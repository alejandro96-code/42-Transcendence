const SERVER_IP = import.meta.env.VITE_SERVER_IP || window.location.hostname
const API_URL = import.meta.env.VITE_API_URL || `http://${SERVER_IP}:4000`

export interface ChatMessage {
  id: number
  sender_id: number
  recipient_id: number
  content: string
  created_at: string
}

async function readError(response: Response, fallback: string) {
  try {
    const data = await response.json()
    if (typeof data?.error === 'string') return data.error
  } catch {
    // Use the fallback if the server response is not JSON.
  }
  return fallback
}

export const chatAPI = {
  async getMessages(recipientId: number): Promise<ChatMessage[]> {
    const response = await fetch(`${API_URL}/api/messages/${recipientId}`, { credentials: 'include' })
    if (!response.ok) throw new Error(await readError(response, 'No se pudieron cargar los mensajes.'))
    return response.json()
  },

  async sendMessage(recipientId: number, content: string): Promise<ChatMessage> {
    const response = await fetch(`${API_URL}/api/messages/${recipientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content }),
    })
    if (!response.ok) throw new Error(await readError(response, 'No se pudo enviar el mensaje.'))
    return response.json()
  },

  async getUsers() {
    const response = await fetch(`${API_URL}/api/users`, { credentials: 'include' })
    if (!response.ok) throw new Error('No se pudieron cargar los usuarios.')
    return response.json()
  },
}
