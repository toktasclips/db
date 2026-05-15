export type UserRole = 'admin' | 'client'

export interface Profile {
  id: string
  email: string
  fullName: string
  role: UserRole
}
