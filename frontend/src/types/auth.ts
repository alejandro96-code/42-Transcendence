export interface User {
  id: number
  username: string
  full_name: string
  email: string
  avatar_url?: string | null
  profession?: string | null
  description?: string | null
  is_intra_user?: boolean
}
