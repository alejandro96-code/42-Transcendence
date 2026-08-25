import type { User } from '../types/auth'

const SERVER_IP = import.meta.env.VITE_SERVER_IP || window.location.hostname
const API_URL = import.meta.env.VITE_API_URL || `http://${SERVER_IP}:4000`

async function readErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return fallbackMessage
  }

  try {
    const data = await response.json()
    if (typeof data?.error === 'string' && data.error.length > 0) {
      return data.error
    }
  } catch {
    return fallbackMessage
  }

  return fallbackMessage
}

export const authAPI = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      })

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Error al obtener usuario:', error)
      return null
    }
  },

  async loginWithCredentials(username: string, password: string): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const message = await readErrorMessage(response, 'No se pudo iniciar sesión.')
      throw new Error(message)
    }

    return await response.json()
  },

  async registerWithCredentials(
    username: string,
    password: string,
    fullName: string,
    email: string,
  ): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password, fullName, email }),
    })

    if (!response.ok) {
      const message = await readErrorMessage(response, 'No se pudo registrar la cuenta.')
      throw new Error(message)
    }

    return await response.json()
  },

  async updateMyProfile(profile: {
    profession: string
    description: string
    avatarUrl?: string
  }): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(profile),
    })

    if (!response.ok) {
      const message = await readErrorMessage(
        response,
        'No se pudo guardar el profile.',
      )

      throw new Error(message)
    }

    return await response.json()
  },

  initiateLogin() {
    window.location.href = `${API_URL}/api/auth/42`
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  },
}
