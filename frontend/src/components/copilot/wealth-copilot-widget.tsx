'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Trash2,
  Minimize2,
  Maximize2,
  TrendingUp,
  Scissors,
  PieChart,
  Target,
  Bot,
  User,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { formatINR, cn } from '@/lib/formatters';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function WealthCopilotWidget() {
  const portfolio = usePortfolio();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your **Arthova Wealth Copilot**. I have real-time visibility into your **₹${(portfolio.netWorth || 0).toLocaleString('en-IN')}** portfolio, tax buckets, and factor scoring. How can I assist you with your wealth strategy today?`,
      timestamp: Date.now(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  // Extract real-time portfolio context
  const portfolioContext = useMemo(() => {
    const totalEq = portfolio.assets.find((a) => a.name.toLowerCase().includes('stock') || a.name.toLowerCase().includes('equity'))?.current || 0;
    const totalDebt = portfolio.assets.find((a) => a.name.toLowerCase().includes('fd') || a.name.toLowerCase().includes('debt'))?.current || 0;
    const totalGold = portfolio.assets.find((a) => a.name.toLowerCase().includes('gold'))?.current || 0;
    const totalCash = portfolio.assets.find((a) => a.name.toLowerCase().includes('cash'))?.current || 0;
    const net = Math.max(1, portfolio.netWorth);

    // Compute basic tax metrics
    let stcg = 0;
    let ltcg = 0;
    let harvestableLoss = 0;
    const now = Date.now();

    portfolio.stockHoldings.forEach((h: any) => {
      const purchaseTs = new Date(h.purchaseDate || h.createdAt || now).getTime();
      const isLTCG = (now - purchaseTs) / (1000 * 60 * 60 * 24) >= 365;
      const gain = (h.cmp - h.avgCost) * h.quantity;
      if (gain > 0) {
        if (isLTCG) ltcg += gain;
        else stcg += gain;
      } else if (gain < 0) {
        harvestableLoss += Math.abs(gain);
      }
    });

    const LTCG_EXEMPTION = 125000;
    const ltcgExemptionRemaining = Math.max(0, LTCG_EXEMPTION - ltcg);
    const estimatedTaxSaved = Math.round(Math.min(stcg, harvestableLoss) * 0.20);

    return {
      netWorth: portfolio.netWorth,
      cashBalance: totalCash,
      allocation: {
        equity: (totalEq / net) * 100,
        debt: (totalDebt / net) * 100,
        gold: (totalGold / net) * 100,
        cash: (totalCash / net) * 100,
      },
      holdings: portfolio.stockHoldings.map((s: any) => ({
        symbol: s.symbol,
        name: s.name,
        quantity: s.quantity,
        avgCost: s.avgCost,
        cmp: s.cmp,
        sector: s.sector,
        gainPercent: s.avgCost > 0 ? ((s.cmp - s.avgCost) / s.avgCost) * 100 : 0,
      })),
      taxSummary: {
        stcg,
        ltcg,
        totalTaxable: stcg + ltcg,
        harvestableLoss,
        estimatedTaxSaved,
        ltcgExemptionRemaining,
      },
    };
  }, [portfolio]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isTyping) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          portfolioContext,
        }),
      });

      if (!res.ok) {
        throw new Error('Copilot service temporarily unavailable');
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'I analyzed your portfolio but could not generate a reply. Please try again.',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${err.message || 'Connection error. Please try again.'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        content: `Chat cleared. Ask me any question regarding your portfolio allocation, single-stock risk, tax harvesting, or QVM factor picks!`,
        timestamp: Date.now(),
      },
    ]);
  };

  const promptChips = [
    { label: 'Tech Exposure', query: 'Am I overexposed to tech or any single sector?' },
    { label: 'Harvest Tax', query: 'How much capital gains tax can I harvest before March 31?' },
    { label: 'Allocation Audit', query: 'Review my asset allocation against institutional benchmarks.' },
    { label: 'QVM Picks', query: 'What does the QVM quant engine suggest for my portfolio?' },
  ];

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-semibold text-xs shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all border border-amber-300/40"
          aria-label="Open Arthova AI Wealth Copilot"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-black animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-black" />
          </div>
          <span className="font-mono tracking-tight font-bold">AI Copilot</span>
        </motion.button>
      )}

      {/* Expandable Chat Drawer Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? '64px' : '580px',
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'w-[360px] sm:w-[420px] rounded-2xl border border-border-default bg-bg-surface shadow-2xl flex flex-col overflow-hidden transition-all',
              'backdrop-blur-xl bg-bg-surface/95'
            )}
          >
            {/* Header */}
            <div className="h-16 px-4 py-3 border-b border-border-default bg-bg-surface-2/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    Arthova Copilot
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-positive/10 text-positive border border-positive/20">
                      Live
                    </span>
                  </h4>
                  <p className="text-[10.5px] text-text-faint font-mono truncate max-w-[190px]">
                    Context: {formatINR(portfolio.netWorth)} Net Worth
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-text-faint">
                <button
                  type="button"
                  onClick={clearChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? 'Expand' : 'Minimize'}
                  className="p-1.5 rounded-lg hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close Copilot"
                  className="p-1.5 rounded-lg hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body (Hidden when minimized) */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'flex gap-2.5 max-w-[90%]',
                        m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      )}
                    >
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px]',
                          m.role === 'user'
                            ? 'bg-accent-brass text-bg-base font-bold'
                            : 'bg-bg-surface-2 border border-border-default text-accent-brass'
                        )}
                      >
                        {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>

                      <div
                        className={cn(
                          'p-3 rounded-2xl leading-relaxed whitespace-pre-wrap',
                          m.role === 'user'
                            ? 'bg-accent-brass text-bg-base font-medium rounded-tr-xs'
                            : 'bg-bg-surface-2/80 border border-border-default text-text-primary rounded-tl-xs space-y-1.5'
                        )}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-2 text-text-faint text-xs pl-8">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-brass" />
                      <span>Synthesizing portfolio intelligence...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Suggested Prompt Chips */}
                <div className="px-3 py-2 border-t border-border-default/60 bg-bg-surface-2/30 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
                  {promptChips.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleSendMessage(chip.query)}
                      disabled={isTyping}
                      className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-bg-surface hover:bg-bg-surface-2 border border-border-default hover:border-accent-brass text-text-secondary hover:text-text-primary whitespace-nowrap transition-all shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-border-default bg-bg-surface shrink-0">
                  <div className="relative flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about sector risk, taxes, or QVM..."
                      disabled={isTyping}
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-border-default bg-bg-surface-2/70 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass transition-all font-sans"
                    />
                    <button
                      type="button"
                      disabled={!inputMessage.trim() || isTyping}
                      onClick={() => handleSendMessage()}
                      className="absolute right-1.5 p-1.5 rounded-lg bg-accent-brass hover:bg-accent-brass-dim text-bg-base disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-text-faint px-1 mt-1.5 font-mono">
                    <span>Powered by Arthova Quant & Gemini</span>
                    <span>Press Enter ↵</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
