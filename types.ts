export enum Sender {
  User = 'user',
  Bot = 'model',
  System = 'system'
}

export interface Message {
  id: string;
  role: Sender;
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface QuickPrompt {
  id: string;
  label: string;
  category: 'pregnancy' | 'baby' | 'health' | 'nutrition';
  prompt: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface BabyProfile {
  name: string;
  date: string; // YYYY-MM-DD
  gender: 'boy' | 'girl' | 'unknown';
  notes: string;
}
