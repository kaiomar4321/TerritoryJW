export interface User {
  id: string;
  uid?: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin' | 'superadmin';
  congregationId: string;
  createdAt?: string | number;
}
