const SERVER_IP = import.meta.env.VITE_SERVER_IP || window.location.hostname
const API_URL = import.meta.env.VITE_API_URL || `http://${SERVER_IP}:4000`

async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  try {
    const data = await response.json()

    // Priorizamos el mensaje descriptivo
    if (
      typeof data?.description === 'string' &&
      data.description.length > 0
    ) {
      return data.description
    }

    if (
      typeof data?.message === 'string' &&
      data.message.length > 0
    ) {
      return data.message
    }

    // Evitamos devolver "Bad Request" si existe un mensaje más útil
    if (
      typeof data?.error === 'string' &&
      data.error.length > 0 &&
      data.error !== 'Bad Request'
    ) {
      return data.error
    }
  } catch {
    // Si la respuesta no contiene JSON, usamos el mensaje por defecto.
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

  async getPosts(userId?: number) {
    const url = new URL(`${API_URL}/api/posts`)

    if (userId !== undefined) {
      url.searchParams.set('user', String(userId))
    }

    const response = await fetch(url.toString(), {
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