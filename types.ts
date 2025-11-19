export interface FlowerTheme {
  primary: string;
  secondary: string;
  accent: string;
  bg_light: string;
  bg_dark: string;
  icon: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  user_prompt: string;
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
}

export interface ExecutionLog {
  agentId: string;
  agentName: string;
  input: string;
  output: string;
  latency: number; // in seconds
  tokens: number;
  timestamp: string;
}

export type Language = 'zh_TW' | 'en';

export type PageSection = 'upload' | 'preview' | 'config' | 'execute' | 'dashboard' | 'notes';