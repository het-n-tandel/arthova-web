import { useQuery } from '@tanstack/react-query';

export function useLiveQuote(symbol: string) {
  return useQuery({
    queryKey: ['quote', symbol],
    queryFn: async () => {
      if (!symbol) return null;
      const res = await fetch(`/api/market/quote?symbol=${symbol}`);
      if (!res.ok) throw new Error('Failed to fetch quote');
      return res.json();
    },
    refetchInterval: 15000, // Poll every 15 seconds
    enabled: !!symbol,
  });
}

export function useLiveMF(code: string) {
  return useQuery({
    queryKey: ['mf', code],
    queryFn: async () => {
      if (!code) return null;
      const res = await fetch(`/api/market/mf?code=${code}`);
      if (!res.ok) throw new Error('Failed to fetch mutual fund');
      return res.json();
    },
    refetchInterval: 300000, // MF NAVs update once a day, poll every 5 mins
    enabled: !!code,
  });
}
