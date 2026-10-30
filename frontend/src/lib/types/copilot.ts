export interface CopilotAction {
  id: string;
  title: string;
  subtitle: string;
  actionType: 'trade' | 'rebalance' | 'tax_harvest' | 'navigate' | 'screener';
  symbol?: string;
  name?: string;
  side?: 'buy' | 'sell';
  price?: number;
  targetUrl?: string;
  badge?: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  actions?: CopilotAction[];
}
