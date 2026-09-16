const SERVER_IP =import.meta.env.VITE_SERVER_IP || window.location.hostname
const API_URL =import.meta.env.VITE_API_URL ||`http://${SERVER_IP}:4000`

export interface PostAttachment {
  data: string
  name: string
  type: string
}

export interface ApiPost {
  id: number
  content: string
  author_id: number
  created_at?: string
  media?: string[]
}

async function readErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  if (
    !response.headers.get('content-type')?.includes('application/json')
  ) {
    return fallbackMessage
  }

  try {
    const data: unknown = await response.json()

    if (
      typeof data === 'object' &&
      data !== null &&
      'description' in data &&
      typeof data.description === 'string' &&
      data.description.length > 0
    ) {
      return data.description
    }

    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string' &&
      data.message.length > 0
    ) {
      return data.message
    }

    if (
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof data.error === 'string' &&
      data.error.length > 0 &&
      data.error !== 'Bad Request'
    ) {
      return data.error
    }
  } catch {
    return fallbackMessage
  }

  return fallbackMessage
}

export const postsAPI = {
  async deletePost(postId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/posts`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        id: postId,
      }),
    })
    if (!response.ok) {
      const message = await readErrorMessage(
        response,
        'No se pudo eliminar la publicación.',
      )
      throw new Error(message)
    }
  },

  async createPost(
    content: string,
    attachment?: PostAttachment | null,
  ): Promise<ApiPost> {
    const response = await fetch(
      `${API_URL}/api/posts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content,
          ...(attachment ? { attachment } : {}),
        }),
      },
    )

    if (!response.ok) {
      const message =
        await readErrorMessage(
          response,
          'No se pudo crear la publicación.',
        )

      throw new Error(message)
    }

    const data: unknown = await response.json()

    if (
      typeof data !== 'object' ||
      data === null ||
      !('id' in data) ||
      !('content' in data)
    ) {
      throw new Error(
        'Respuesta inválida al crear la publicación.',
      )
    }

    return data as ApiPost
  },

  async getPosts(
    userId?: number,
    filter?: string,
  ): Promise<ApiPost[]> {
    const url = new URL(
      `${API_URL}/api/posts`,
    )

    if (userId !== undefined) {
      url.searchParams.set(
        'user',
        String(userId),
      )
    }

    if (filter !== undefined) {
      url.searchParams.set(
        'filter',
        filter,
      )
    }

    const response = await fetch(
      url.toString(),
      {
        method: 'GET',
        credentials: 'include',
      },
    )

    if (!response.ok) {
      const message =
        await readErrorMessage(
          response,
          'No se pudieron cargar las publicaciones.',
        )

      throw new Error(message)
    }

    const data: unknown =
      await response.json()

    if (!Array.isArray(data)) {
      return []
    }

    return data as ApiPost[]
  },
}