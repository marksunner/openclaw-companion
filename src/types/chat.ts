// Chat message types

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  twin?: 'case' | 'tars'; // Which twin responded
  pending?: boolean; // Offline queue indicator
}

export interface VoiceNote {
  id: string;
  audioUri: string;
  duration: number;
  timestamp: number;
  transcript?: string;
  embedded?: boolean;
  syncStatus: 'pending' | 'uploading' | 'transcribing' | 'complete' | 'error';
}

export interface AuthState {
  authenticated: boolean;
  token?: string;
  gatewayUrl?: string;
}
