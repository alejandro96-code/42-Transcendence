const SERVER_IP = import.meta.env.VITE_SERVER_IP || window.location.hostname
const API_URL = import.meta.env.VITE_API_URL || `http://${SERVER_IP}:4000`

export interface Friend {
  id: number
  username: string
}

export interface PendingFriendRequest {
  id: number
  username: string
  email: string
  created_at: string
}

async function getError(response: Response, fallback: string) {
  try {
    const data = await response.json()
    if (typeof data?.error === 'string') return data.error
  } catch {
    // Use the fallback for non-JSON responses.
  }
  return fallback
}

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}/api/friends${path}`, {
    credentials: 'include',
    ...options,
  })
  if (!response.ok) throw new Error(await getError(response, 'No se pudo completar la operación.'))
  return response
}

export const friendsAPI = {
  async getFriends(): Promise<Friend[]> {
    return (await request('/')).json()
  },

  async getPendingRequests(): Promise<PendingFriendRequest[]> {
    return (await request('/requests')).json()
  },

  async sendRequest(username: string): Promise<void> {
    await request('/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
  },

  async answerRequest(requestId: number, status: 'accepted' | 'rejected'): Promise<void> {
    await request(`/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  },

  async removeFriend(friendId: number): Promise<void> {
    await request(`/${friendId}`, { method: 'DELETE' })
  },
}
