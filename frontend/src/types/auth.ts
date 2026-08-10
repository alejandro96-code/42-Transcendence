export interface User {
  id: number
  intra_id: string | null
  username: string
  email: string
  full_name: string
  avatar_url: string
  profession?: string
  description?: string
}
