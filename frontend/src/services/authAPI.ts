import type { User } from '../types/auth'
import { ApiError, readApiError } from './apiError'

const SERVER_IP = import.meta.env.VITE_SERVER_IP || window.location.hostname
const API_URL = import.meta.env.VITE_API_URL || `http://${SERVER_IP}:4000`

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

  async loginWithCredentials(
    username: string,
    password: string,
  ): Promise<User> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      throw await readApiError(response, 'AUTH_LOGIN_FAILED')
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
      body: JSON.stringify({
        username,
        password,
        fullName,
        email,
      }),
    })

    if (!response.ok) {
      throw await readApiError(response, 'AUTH_REGISTER_FAILED')
    }

    return await response.json()
  },

  async updateMyProfile(profile: {
    profession: string
    description: string
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
      throw await readApiError(response, 'AUTH_PROFILE_UPDATE_FAILED')
    }

    return await response.json()
  },

  async uploadAvatar(file: File): Promise<User> {
    const image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new ApiError('AUTH_AVATAR_READ_FAILED'))
        }
      }

      reader.onerror = () => {
        reject(new ApiError('AUTH_AVATAR_READ_FAILED'))
      }

      reader.readAsDataURL(file)
    })

    const response = await fetch(`${API_URL}/api/auth/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        image,
      }),
    })

    if (!response.ok) {
      throw await readApiError(response, 'AUTH_AVATAR_UPLOAD_FAILED')
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
