const SERVER_IP = import.meta.env.VITE_SERVER_IP || window.location.hostname
const API_URL = import.meta.env.VITE_API_URL || `http://${SERVER_IP}:4000`

async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const data = await response.json()

    if (typeof data?.error === 'string' && data.error.length > 0) {
      return data.error
    }

    if (typeof data?.description === 'string' && data.description.length > 0) {
      return data.description
    }
  } catch {
    // Usamos el mensaje por defecto.
  }

  return fallbackMessage
}

export const postsAPI = {
  async createPost(content: string, image?: string | null) {
    const response = await fetch(`${API_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        content,
        ...(image ? { image } : {}),
      }),
    })

    if (!response.ok) {
      const message = await readErrorMessage(
        response,
        'No se pudo crear la publicación.',
      )

      throw new Error(message)
    }

    return await response.json()
  },

  async getPosts() {
    const response = await fetch(`${API_URL}/api/posts`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const message = await readErrorMessage(
        response,
        'No se pudieron cargar las publicaciones.',
      )

      throw new Error(message)
    }

    return await response.json()
  },
}