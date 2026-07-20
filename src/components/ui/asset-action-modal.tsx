'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';

interface Props {
  assetType: 'stock' | 'mutual_fund' | 'gold' | 'silver' | 'fd' | 'property';
  mode: 'add' | 'remove';
  onClose: () => void;
  holdingId?: string; 
}

export function AssetActionModal({ assetType, mode, onClose, holdingId }: Props) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    quantity: '',
    pricePerUnit: '',
    transactionType: mode === 'add' ? 'buy' : 'sell'
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = mode === 'add' ? '/api/holdings' : `/api/holdings/${holdingId}/transactions`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, assetType })
      });
      if (!res.ok) throw new Error('Transaction failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['networth'] });
      onClose();
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-bg-surface border border-border-default rounded-[16px] w-full max-w-md p-6" style={{ boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[20px] font-medium text-text-primary capitalize">{mode} {assetType.replace('_', ' ')}</h2>
          <button onClick={onClose} className="text-text-faint hover:text-text-primary transition-colors"><X className="w-5 h-5"/></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-4">
          {(assetType === 'stock' || assetType === 'mutual_fund') && (
            <div className="space-y-1.5">
              <label className="text-[13px] text-text-secondary">Symbol</label>
              <input required type="text" placeholder="e.g. RELIANCE" className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass focus:ring-1 focus:ring-accent-brass transition-all" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})} />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[13px] text-text-secondary">Display Name</label>
            <input required type="text" placeholder="e.g. Reliance Industries" className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass focus:ring-1 focus:ring-accent-brass transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] text-text-secondary">Quantity</label>
              <input required type="number" step="any" placeholder="0.00" className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass focus:ring-1 focus:ring-accent-brass transition-all" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] text-text-secondary">Price per Unit</label>
              <input required type="number" step="any" placeholder="0.00" className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass focus:ring-1 focus:ring-accent-brass transition-all" value={formData.pricePerUnit} onChange={e => setFormData({...formData, pricePerUnit: e.target.value})} />
            </div>
          </div>
          <button type="submit" disabled={mutation.isPending} className="w-full bg-accent-brass hover:bg-accent-brass-dim text-bg-base font-medium py-2.5 rounded-[8px] mt-4 transition-colors disabled:opacity-50">
            {mutation.isPending ? 'Processing...' : 'Execute Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}
