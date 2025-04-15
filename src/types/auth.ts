export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
  apiTokens: number;
}

export interface TokenRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface TokenTransfer {
  id: string;
  senderId: string;
  senderEmail: string;
  recipientId: string;
  recipientEmail: string;
  amount: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  tokenRequests: TokenRequest[];
  tokenTransfers: TokenTransfer[];
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, phone: string) => Promise<void>;
  logout: () => void;
  requestToken: (amount: number) => Promise<void>;
  approveTokenRequest: (requestId: string, amount: number) => Promise<void>;
  rejectTokenRequest: (requestId: string) => Promise<void>;
  updateTokenRequest: (requestId: string, amount: number) => void;
  transferTokens: (recipientEmail: string, amount: number) => Promise<void>;
}