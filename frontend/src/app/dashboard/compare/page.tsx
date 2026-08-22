'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, X, TrendingUp, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

// A palette for the chart lines
const colors = ['#C4A962', '#818CF8', '#34D399', '#F87171', '#A78BFA', '#60A5FA'];

export default function ComparePage() {
  const [symbols, setSymbols] = useState<string[]>(['RELIANCE.NS', 'TCS.NS']); // Default compare
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['compare-dynamic', symbols],
    queryFn: async () => {
      if (symbols.length === 0) return null;
      const res = await fetch(`http://localhost:8080/api/public/compare/dynamic?symbols=${symbols.join(',')}`);
      if (!res.ok) throw new Error('Failed to fetch comparison data');
      return res.json();
    },
    enabled: symbols.length > 0,
  });

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && !symbols.includes(searchInput.trim().toUpperCase())) {
      setSymbols([...symbols, searchInput.trim().toUpperCase()]);
      setSearchInput('');
    }
  };

  const removeSymbol = (sym: string) => {
    setSymbols(symbols.filter((s) => s !== sym));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-[28px] text-text-primary mb-2">Asset Comparison</h1>
        <p className="text-text-secondary text-[15px]">Compare 1-year historical returns (normalized to base 100) across multiple equities or mutual funds.</p>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-[16px] p-6">
        <form onSubmit={handleAddSymbol} className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
            <input
              type="text"
              placeholder="Add symbol (e.g. INFY.NS, HDFCBANK.NS)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-bg-surface-2 border border-border-default rounded-[8px] pl-9 pr-4 py-2.5 text-[14px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass transition-colors"
            />
          </div>
          <button type="submit" className="bg-bg-surface-3 hover:bg-bg-surface-2 border border-border-default px-4 py-2.5 rounded-[8px] text-[14px] font-medium text-text-primary transition-colors">
            Add
          </button>
        </form>

        <div className="flex flex-wrap gap-2 mb-8">
          {symbols.map((sym, i) => (
            <div key={sym} className="flex items-center gap-2 bg-bg-surface-2 border border-border-default px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="text-[13px] font-medium text-text-primary">{sym}</span>
              <button onClick={() => removeSymbol(sym)} className="text-text-faint hover:text-negative transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-negative-bg border border-negative/20 text-negative px-4 py-3 rounded-[8px] flex items-center gap-2 text-[14px] mb-6">
            <AlertTriangle className="w-4 h-4" />
            Failed to load data. Make sure the Spring Boot backend is running and the symbols are correct.
          </div>
        )}

        <div className="h-[400px] w-full bg-bg-surface-2/50 rounded-[12px] border border-border-default p-4 flex items-center justify-center relative overflow-hidden">
          {isLoading && symbols.length > 0 ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-accent-brass border-t-transparent animate-spin" />
              <p className="text-[13px] text-text-secondary">Fetching historical data from backend...</p>
            </div>
          ) : symbols.length === 0 ? (
            <p className="text-[14px] text-text-faint">Add assets to begin comparing.</p>
          ) : data?.chartData?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--text-faint)" 
                  fontSize={11} 
                  tickMargin={10} 
                  minTickGap={30}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear().toString().slice(2)}`;
                  }}
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  stroke="var(--text-faint)" 
                  fontSize={11} 
                  tickFormatter={(val) => val.toFixed(0)}
                  width={40}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                  formatter={(value: any) => [`${parseFloat(value || 0).toFixed(2)} (Base 100)`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                {data.symbols?.map((sym: string, i: number) => (
                  <Line 
                    key={sym} 
                    type="monotone" 
                    dataKey={sym} 
                    name={sym}
                    stroke={colors[i % colors.length]} 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[14px] text-text-faint">No historical data available for these symbols.</p>
          )}
        </div>
      </div>
    </div>
  );
}
