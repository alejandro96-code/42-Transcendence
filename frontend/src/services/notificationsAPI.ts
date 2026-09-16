import { readApiError } from './apiError'

const SERVER_IP = import.meta.env.VITE_SERVER_IP || window.location.hostname
const API_URL = import.meta.env.VITE_API_URL || `http://${SERVER_IP}:4000`

export interface Notification {
  type: string
  params?: Record<string, unknown>
}

export const notificationsAPI = {
  async getNotifications(): Promise<Notification[]> {
    const response = await fetch(`${API_URL}/api/notifications`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw await readApiError(response, 'NOTIFICATIONS_LOAD_FAILED')
    }

    return response.json()
  },

  async watchProfile(profileUserId: number): Promise<void> {
    await fetch(
      `${API_URL}/api/notifications/watch/${profileUserId}`,
      {
        method: 'POST',
        credentials: 'include',
      },
    )
  },

  async unwatchProfile(profileUserId: number): Promise<void> {
    await fetch(
      `${API_URL}/api/notifications/watch/${profileUserId}`,
      {
        method: 'DELETE',
        credentials: 'include',
        keepalive: true,
      },
    )
  },
}