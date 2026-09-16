import { ApiError, readApiError } from './apiError'

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

export interface PostSearchParams {
  q?: string
  author?: string
  hasAttachment?: boolean
  dateFrom?: string
  dateTo?: string
  sort?: 'newest' | 'oldest'
  page?: number
  pageSize?: number
}

export interface PostSearchResult {
  results: ApiPost[]
  page: number
  pageSize: number
  total: number
  totalPages: number
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
      throw await readApiError(response, 'POST_DELETE_FAILED')
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
      throw await readApiError(response, 'POST_CREATE_FAILED')
    }

    const data: unknown = await response.json()

    if (
      typeof data !== 'object' ||
      data === null ||
      !('id' in data) ||
      !('content' in data)
    ) {
      throw new ApiError('POST_CREATE_INVALID_RESPONSE')
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
      throw await readApiError(response, 'POSTS_LOAD_FAILED')
    }

    const data: unknown =
      await response.json()

    if (!Array.isArray(data)) {
      return []
    }

    return data as ApiPost[]
  },

  async searchPosts(params: PostSearchParams): Promise<PostSearchResult> {
    const url = new URL(`${API_URL}/api/posts/search`)

    if (params.q) url.searchParams.set('q', params.q)
    if (params.author) url.searchParams.set('author', params.author)
    if (params.hasAttachment !== undefined) {
      url.searchParams.set('hasAttachment', String(params.hasAttachment))
    }
    if (params.dateFrom) url.searchParams.set('dateFrom', params.dateFrom)
    if (params.dateTo) url.searchParams.set('dateTo', params.dateTo)
    if (params.sort) url.searchParams.set('sort', params.sort)
    if (params.page) url.searchParams.set('page', String(params.page))
    if (params.pageSize) url.searchParams.set('pageSize', String(params.pageSize))

    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      throw await readApiError(response, 'POSTS_SEARCH_FAILED')
    }

    return (await response.json()) as PostSearchResult
  },
}