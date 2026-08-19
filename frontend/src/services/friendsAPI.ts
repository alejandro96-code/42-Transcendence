const SERVER_IP = import.meta.env.VITE_SERVER_IP || window.location.hostname
const API_URL = import.meta.env.VITE_API_URL || `http://${SERVER_IP}:4000`

export interface Friend {
  id: number
  username: string
  full_name?: string
  avatar_url?: string | null
  profession?: string | null
  description?: string | null
  last_seen?: string | null
  is_online?: boolean
}

export interface PendingFriendRequest {
  id: number
  username: string
  email: string
  created_at: string
}

export interface FriendProfile {
  id: number
  username: string
  email: string
  full_name: string
  avatar_url: string | null
  profession?: string | null
  description?: string | null
}

async function getError(response: Response, fallback: string) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return fallback
  }

  try {
    const data = await response.json()
    if (typeof data?.error === 'string') return data.error
  } catch {
    return fallback
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

  async heartbeat(): Promise<void> {
    await request('/heartbeat', {
        method: 'POST',
    })
  },

  async getFriends(): Promise<Friend[]> {
    return (await request('/')).json()
  },

  async getUserFriends(userId: number): Promise<Friend[]> {
    const response = await fetch(`${API_URL}/api/friends/user/${userId}`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(await getError(response, 'No se pudieron cargar los amigos.'))
    }

    return response.json()
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

async searchFriends(query: string) {
  const response = await fetch(
    `${API_URL}/api/friends/search?q=${encodeURIComponent(query)}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  )

  if (!response.ok) {
    throw new Error('No se pudieron buscar tus amigos.')
  }

  return await response.json()
},

  async getFriendProfile(friendId: number): Promise<FriendProfile> {
    const response = await fetch(`${API_URL}/api/friends/${friendId}/profile`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(await getError(response, 'No se pudo obtener el profile.'))
    }

    return response.json()
  },
}
