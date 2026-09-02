const SERVER_IP = import.meta.env.VITE_SERVER_IP || window.location.hostname
const API_URL = import.meta.env.VITE_API_URL || `http://${SERVER_IP}:4000`

export interface Notification {
  type: string
  message: string
}

export const notificationsAPI = {
  async getNotifications(): Promise<Notification[]> {
    const response = await fetch(`${API_URL}/api/notifications`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('No se pudieron obtener las notificaciones.')
    }

    return response.json()
  },
}