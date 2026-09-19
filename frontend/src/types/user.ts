export type UserRole = 'admin' | 'agent' | 'viewer'

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  jobTitle?: string;
}