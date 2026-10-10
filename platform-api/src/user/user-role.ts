export const UserRole = {
  STUDENT: 'aluno',
  TEACHER: 'professor',
  ADMIN: 'admin'
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]
