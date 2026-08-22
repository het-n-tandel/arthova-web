'use client';
import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Search, Loader2, ChevronLeft, TrendingUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/formatters';
import { usePortfolio } from '@/lib/hooks/use-portfolio';
import { useLedgerStore } from '@/lib/store';

interface Props {
  assetType: 'stock' | 'mutual_fund' | 'gold' | 'silver' | 'fd' | 'property' | 'crypto' | 'cash' | 'bond' | 'liability';
  mode: 'add' | 'remove'; // Kept for compatibility
  onClose: () => void;
  holdingId?: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
}

export function AssetActionModal({ assetType, mode, onClose }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const portfolio = usePortfolio();
  const livePrices = useLedgerStore((s) => s.livePrices);

  let activeHoldings: any[] = [];
  if (assetType === 'stock') activeHoldings = portfolio.stockHoldings;
  else if (assetType === 'mutual_fund') activeHoldings = portfolio.mfHoldings;
  else if (assetType === 'gold' || assetType === 'silver') activeHoldings = portfolio.goldHoldings;
  else if (assetType === 'fd') activeHoldings = portfolio.fdHoldings;
  else if (assetType === 'property') activeHoldings = portfolio.propHoldings;
  else if (assetType === 'crypto') activeHoldings = portfolio.cryptoHoldings;
  else if (assetType === 'bond') activeHoldings = portfolio.bondHoldings;
  else if (assetType === 'cash') activeHoldings = portfolio.cashHoldings;
  else if (assetType === 'liability') activeHoldings = portfolio.liabilityHoldings;

  const ownedSymbols = activeHoldings.map((h: any) => h.symbol);

  const isManualAsset = assetType === 'fd' || assetType === 'property' || assetType === 'cash' || assetType === 'liability' || assetType === 'gold' || assetType === 'silver';
  const isMetal = assetType === 'gold' || assetType === 'silver'; // Kept for text label logic

  const [view, setView] = useState<'discovery' | 'trade'>(isManualAsset ? 'trade' : 'discovery');
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);

  const [manualName, setManualName] = useState('');
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  
  // Custom manual asset fields
  const [cashType, setCashType] = useState<'income' | 'locker'>('income');
  const [liabilityEmi, setLiabilityEmi] = useState('');
  const [liabilityInterestRate, setLiabilityInterestRate] = useState('');
  
  // FD fields
  const [fdInterestRate, setFdInterestRate] = useState('');
  const [fdTenureMonths, setFdTenureMonths] = useState('');

  // Property fields
  const [propertyLocation, setPropertyLocation] = useState('');
  const [propertyMonthlyRent, setPropertyMonthlyRent] = useState('');

  // Bond fields
  const [bondCouponRate, setBondCouponRate] = useState('');
  const [bondTenureYears, setBondTenureYears] = useState('');

  // Purchase Date (defaults to today, but can be backdated)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [purchaseDate, setPurchaseDate] = useState(todayStr);

  // Metal fields
  const [metalPurity, setMetalPurity] = useState('24K');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMetal) {
      const metalSymbol = assetType === 'gold' ? 'GC=F' : 'SI=F';
      const metalName = assetType === 'gold' ? 'Gold (COMEX)' : 'Silver (COMEX)';
      
      const rawUSD = livePrices.get(metalSymbol)?.price || (assetType === 'gold' ? 2400 : 29.5);
      const usdInr = livePrices.get('INR=X')?.price || 83.5;
      const ratePerGram = (rawUSD * usdInr) / 31.1035;
      const formattedRate = ratePerGram.toFixed(2);
      
      setSelectedAsset({ symbol: metalSymbol, name: metalName, price: parseFloat(formattedRate) });
      setView('trade');
      setPricePerUnit(formattedRate);
    }
  }, [isMetal, assetType, livePrices]);

  const { data: suggestionsData, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['market-suggestions-ai', assetType],
    queryFn: async () => {
      const randomSeed = Math.floor(Math.random() * 10000);
      let query = `suggest 5 random trending indian stocks on NSE (ignore previous answers, seed: ${randomSeed})`;
      
      if (assetType === 'mutual_fund') {
          query = `suggest 5 random top performing indian mutual funds (ignore previous answers, seed: ${randomSeed})`;
      } else if (assetType === 'crypto') {
          query = `suggest 5 popular cryptocurrencies (ignore previous answers, seed: ${randomSeed})`;
      } else if (assetType === 'bond') {
          query = `suggest 5 popular indian government or corporate bonds (ignore previous answers, seed: ${randomSeed})`;
      }
      
      const res = await fetch(`/api/ai/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      return res.json();
    },
    staleTime: 60000 * 5,
    enabled: !isManualAsset && !isMetal
  });

  const { data: historicalData, isLoading: isLoadingChart } = useQuery({
    queryKey: ['historical-chart', selectedAsset?.symbol],
    queryFn: async () => {
      if (!selectedAsset) return null;
      const res = await fetch(`http://localhost:8080/api/public/compare/dynamic?symbols=${selectedAsset.symbol}`);
      if (!res.ok) throw new Error('Failed to fetch chart data');
      return res.json();
    },
    enabled: view === 'trade' && !!selectedAsset && !isManualAsset,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2 && (assetType === 'stock' || assetType === 'mutual_fund')) {
      setIsSearching(true);
      setShowDropdown(true);
      
      if (searchTimeout) clearTimeout(searchTimeout);
      
      const timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`/api/ai/search?q=${encodeURIComponent(query)}&type=${assetType}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data.suggestions || []);
          }
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      }, 800);
      
      setSearchTimeout(timeoutId);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
    }
  };

  const selectAssetForTrade = async (asset: SearchResult) => {
    setSelectedAsset(asset);
    setView('trade');
    setTradeTab('buy');
    
    if (asset.price) {
      setPricePerUnit(asset.price.toString());
    } else if (!isManualAsset) {
      try {
        const res = await fetch(`http://localhost:8080/api/public/market/quote?symbol=${asset.symbol}`);
        if (res.ok) {
          const price = await res.text();
          setPricePerUnit(price);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const userId = session?.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      let finalSymbol = selectedAsset?.symbol || `MANUAL-${Date.now()}`;
      let finalName = selectedAsset?.name || manualName;

      if (isManualAsset && !isMetal) {
          // Manual assets (FD, property, cash, bond, liability) don't have ticker symbols
          finalSymbol = manualName.trim().replace(/\s+/g, '-').toUpperCase();
      }

      let metadata: Record<string, any> = {};
      
      if (assetType === 'fd') {
          const dep = parseFloat(quantity || '0');
          const rate = parseFloat(fdInterestRate || '0');
          const tenure = parseFloat(fdTenureMonths || '0');
          const estMaturity = dep + (dep * (rate / 100) * (tenure / 12));
          metadata = { interestRate: fdInterestRate, tenureMonths: fdTenureMonths, estimatedMaturityValue: estMaturity.toFixed(2) };
      } else if (assetType === 'property') {
          metadata = { location: propertyLocation, monthlyRent: propertyMonthlyRent };
      } else if (assetType === 'bond') {
          metadata = { couponRate: bondCouponRate, tenureYears: bondTenureYears };
      } else if (isMetal) {
          metadata = { purity: metalPurity };
      } else if (assetType === 'cash') {
          metadata = { type: cashType, amount: quantity };
      } else if (assetType === 'liability') {
          metadata = { emi: liabilityEmi, interestRate: liabilityInterestRate };
      }

      const payload = {
        assetType,
        symbol: finalSymbol,
        name: finalName,
        quantity: parseFloat(quantity || '0'),
        pricePerUnit: isManualAsset && !isMetal ? 1 : parseFloat(pricePerUnit || '1'),
        transactionType: tradeTab,
        metadata: JSON.stringify(metadata),
        purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
      };

      const res = await fetch(`http://localhost:8080/api/public/portfolio/${userId}/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, assetType })
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

  const renderDiscovery = () => {
    if (isManualAsset) return null;

    const rawSuggestions = suggestionsData?.suggestions || [];
    const filteredSuggestions = rawSuggestions.filter((s: any) => !ownedSymbols.includes(s.symbol));

    return (
      <div className="space-y-6">
        <div className="relative" ref={dropdownRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
          <input 
            type="text" 
            placeholder={`Search ${assetType === 'mutual_fund' ? 'funds' : 'stocks'} to trade...`} 
            className="w-full bg-bg-base border border-border-default rounded-[8px] pl-9 pr-3 py-3 text-[14px] text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent-brass focus:ring-1 focus:ring-accent-brass transition-all" 
            value={searchQuery} 
            onChange={(e) => handleSearch(e.target.value)} 
          />
          {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint animate-spin" />}

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-bg-surface border border-border-default rounded-[8px] overflow-hidden max-h-60 overflow-y-auto shadow-lg">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectAssetForTrade(res)}
                  className="w-full text-left px-4 py-2 hover:bg-bg-surface-2 transition-colors border-b border-border-default last:border-b-0"
                >
                  <div className="font-medium text-[13px] text-text-primary">{res.symbol}</div>
                  <div className="text-[11px] text-text-secondary">{res.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {activeHoldings.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[13px] font-medium text-text-secondary mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-text-faint" /> 
              Your Holdings
            </h3>
            <div className="grid grid-cols-2 gap-3 max-h-[150px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
              {activeHoldings.map((stock: any) => (
                <button
                  key={stock.symbol}
                  onClick={() => selectAssetForTrade({ symbol: stock.symbol, name: stock.name, price: stock.cmp, change: stock.dayChange })}
                  className="text-left bg-bg-surface-2 border border-border-default hover:border-accent-brass/50 rounded-[8px] p-3 transition-all group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-[13px] text-text-primary truncate pr-2" title={stock.name}>{stock.symbol.replace('.NS', '')}</span>
                    <span className="text-[12px] font-medium text-text-faint">
                      {stock.quantity}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-faint truncate">{stock.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-[13px] font-medium text-text-secondary mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent-brass" /> 
            Suggested Discoveries
          </h3>
          
          {isLoadingSuggestions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-text-faint animate-spin" />
            </div>
          ) : filteredSuggestions.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
              {filteredSuggestions.map((stock: any) => (
                <button
                  key={stock.symbol}
                  onClick={() => selectAssetForTrade(stock)}
                  className="text-left bg-bg-base border border-border-default hover:border-accent-brass/50 rounded-[8px] p-3 transition-all hover:bg-bg-surface-2 group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-[13px] text-text-primary truncate pr-2" title={stock.name}>{stock.symbol.replace('.NS', '')}</span>
                    <span className={cn("text-[12px] font-medium whitespace-nowrap", stock.change >= 0 ? "text-positive" : "text-negative")}>
                      {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-text-faint truncate">{stock.name}</div>
                  <div className="mt-2 text-[13px] text-text-secondary font-mono">₹{stock.price?.toFixed(2)}</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-text-faint text-center py-8 bg-bg-surface-2 rounded-[8px]">No new suggestions right now.</p>
          )}
        </div>
      </div>
    );
  };

  const renderTrading = () => {
    if (!isManualAsset && !selectedAsset) return null;
    
    const checkSymbol = isManualAsset ? (manualName.replace(/\s+/g, '-').toUpperCase()) : (selectedAsset?.symbol || '');
    const isOwned = ownedSymbols.includes(checkSymbol);
    const ownedHolding = activeHoldings.find((h: any) => h.symbol === checkSymbol);
    
    const chartKey = selectedAsset?.symbol?.replace('.NS', '') || '';
    const dataPoints = historicalData?.chartData || [];

    const isQuantityValid = !!quantity && !isNaN(parseFloat(quantity)) && parseFloat(quantity) > 0;
    const isNameValid = (!isManualAsset || isMetal) ? true : (manualName.trim().length > 0);
    const isPriceValid = (!isManualAsset || isMetal) ? (!!pricePerUnit && !isNaN(parseFloat(pricePerUnit)) && parseFloat(pricePerUnit) > 0) : true;
    const isEmiValid = assetType === 'liability' ? (!!liabilityEmi && !isNaN(parseFloat(liabilityEmi)) && parseFloat(liabilityEmi) > 0) : true;
    const isFdValid = assetType === 'fd' ? (!!fdInterestRate && !isNaN(parseFloat(fdInterestRate)) && parseFloat(fdInterestRate) > 0 && !!fdTenureMonths && !isNaN(parseFloat(fdTenureMonths)) && parseFloat(fdTenureMonths) > 0) : true;
    const isPropertyValid = assetType === 'property' ? (propertyLocation.trim().length > 0) : true;
    const isBondValid = assetType === 'bond' ? (!!bondCouponRate && !isNaN(parseFloat(bondCouponRate)) && parseFloat(bondCouponRate) > 0 && !!bondTenureYears && !isNaN(parseFloat(bondTenureYears)) && parseFloat(bondTenureYears) > 0) : true;
    const isSellValid = tradeTab !== 'sell' || !ownedHolding || (parseFloat(quantity) <= ownedHolding.quantity);

    const isFormValid = isQuantityValid && isNameValid && isPriceValid && isEmiValid && isFdValid && isPropertyValid && isBondValid && isSellValid;
    
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
        {!isManualAsset && !isMetal && (
            <div className="flex items-center gap-3 bg-bg-surface-2 p-3 rounded-[8px] border border-border-default">
            <button onClick={() => setView('discovery')} className="p-1 hover:bg-bg-surface-3 rounded-[6px] transition-colors text-text-secondary hover:text-text-primary">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
                <div className="font-medium text-[15px] text-text-primary">{selectedAsset?.symbol}</div>
                <div className="text-[12px] text-text-faint truncate">{selectedAsset?.name}</div>
            </div>
            </div>
        )}

        {isMetal && selectedAsset && (
            <div className="flex items-center gap-3 bg-bg-surface-2 p-3 rounded-[8px] border border-border-default">
            <div className="flex-1">
                <div className="font-medium text-[15px] text-text-primary">{selectedAsset.symbol}</div>
                <div className="text-[12px] text-text-faint truncate">{selectedAsset.name}</div>
            </div>
            </div>
        )}

        {!isManualAsset && (
            <div className="h-[120px] bg-bg-base border border-border-default rounded-[8px] p-2 flex items-center justify-center overflow-hidden relative">
            {isLoadingChart ? (
                <Loader2 className="w-5 h-5 text-text-faint animate-spin" />
            ) : dataPoints.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataPoints}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line 
                    type="monotone" 
                    dataKey={chartKey} 
                    stroke="var(--accent-brass)" 
                    strokeWidth={2} 
                    dot={false} 
                    isAnimationActive={false}
                    />
                </LineChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-[11px] text-text-faint">No chart data</p>
            )}
            </div>
        )}

        {isManualAsset && !isMetal && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] text-text-secondary">{assetType === 'cash' ? 'Account/Income Name *' : assetType === 'liability' ? 'Loan Name *' : assetType === 'fd' ? 'Bank / Institution Name *' : 'Asset Name *'}</label>
                <input required type="text" placeholder={`E.g. ${assetType === 'fd' ? 'HDFC 5-Year FD' : assetType === 'property' ? 'Downtown Apartment' : assetType === 'cash' ? 'Salary / HDFC Savings' : 'Home Loan'}`} className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary focus:border-accent-brass transition-colors" value={manualName} onChange={e => setManualName(e.target.value)} />
              </div>
              
              {assetType === 'cash' && tradeTab === 'buy' && (
                <div className="flex bg-bg-surface-2 rounded-[8px] p-1 border border-border-default">
                  <button type="button" onClick={() => setCashType('income')} className={cn("flex-1 py-1 text-[12px] font-medium rounded-[6px] transition-colors", cashType === 'income' ? "bg-bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}>Income (Monthly)</button>
                  <button type="button" onClick={() => setCashType('locker')} className={cn("flex-1 py-1 text-[12px] font-medium rounded-[6px] transition-colors", cashType === 'locker' ? "bg-bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}>Locker (One-time)</button>
                </div>
              )}
            </div>
        )}

        <div className="flex bg-bg-surface-2 rounded-[8px] p-1 border border-border-default">
          <button 
            type="button" 
            onClick={() => setTradeTab('buy')} 
            className={cn("flex-1 py-1.5 text-[13px] font-medium rounded-[6px] transition-colors", tradeTab === 'buy' ? "bg-bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}
          >
            {isManualAsset ? 'Add' : 'Buy'}
          </button>
          <button 
            type="button" 
            onClick={() => setTradeTab('sell')}
            disabled={!isOwned}
            title={!isOwned ? "You don't own this asset" : ""}
            className={cn(
              "flex-1 py-1.5 text-[13px] font-medium rounded-[6px] transition-colors", 
              tradeTab === 'sell' ? "bg-bg-surface text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary",
              !isOwned && "opacity-40 cursor-not-allowed"
            )}
          >
            {isManualAsset ? 'Remove' : 'Sell'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12px] text-text-secondary flex justify-between">
                {assetType === 'cash' && cashType === 'income' ? 'Monthly Amount (₹) *' : 
                 assetType === 'cash' && cashType === 'locker' ? 'Total Amount (₹) *' :
                 assetType === 'liability' ? 'Total Loan Amount (₹) *' :
                 assetType === 'fd' ? 'Deposit Amount (₹) *' :
                 assetType === 'property' ? 'Property Value (₹) *' :
                 isMetal ? 'Quantity (Grams) *' :
                 'Quantity / Shares *'} {tradeTab === 'sell' && ownedHolding && <span className="text-text-faint">(Max: {ownedHolding.quantity})</span>}
              </label>
              <input required type="number" step="any" min="0.01" max={tradeTab === 'sell' ? ownedHolding?.quantity : undefined} placeholder="0" className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary focus:border-accent-brass transition-colors" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            
            {(!isManualAsset || isMetal) && (
              <div className="space-y-1.5">
                <label className="text-[12px] text-text-secondary">{isMetal ? 'Price per Gram (₹) *' : 'Cost per Unit (₹) *'}</label>
                <input required type="number" step="any" placeholder="0.00" className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary focus:border-accent-brass transition-colors" value={pricePerUnit} onChange={e => setPricePerUnit(e.target.value)} />
              </div>
            )}

            {/* Specialized inputs per asset class */}
            {assetType === 'fd' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[12px] text-text-secondary">Interest Rate (% p.a.) *</label>
                  <input required type="number" step="0.1" placeholder="e.g. 7.5" className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary focus:border-accent-brass transition-colors" value={fdInterestRate} onChange={e => setFdInterestRate(e.target.value)} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[12px] text-text-secondary">Tenure / Duration (Months) *</label>
                  <input required type="number" step="1" placeholder="e.g. 12" className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary focus:border-accent-brass transition-colors" value={fdTenureMonths} onChange={e => setFdTenureMonths(e.target.value)} />
                </div>
              </>
            )}

            {assetType === 'property' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[12px] text-text-secondary">City / Location *</label>
                  <input required type="text" placeholder="e.g. Mumbai, BKC" className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary focus:border-accent-brass transition-colors" value={propertyLocation} onChange={e => setPropertyLocation(e.target.value)} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[12px] text-text-secondary">Monthly Rental Income (₹)</label>
                  <input type="number" step="any" placeholder="0.00" className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary focus:border-accent-brass transition-colors" value={propertyMonthlyRent} onChange={e => setPropertyMonthlyRent(e.target.value)} />
                </div>
              </>
            )}

            {assetType === 'bond' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[12px] text-text-secondary">Coupon Rate (% p.a.) *</label>
                  <input required type="number" step="0.1" placeholder="e.g. 8.1" className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary focus:border-accent-brass transition-colors" value={bondCouponRate} onChange={e => setBondCouponRate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] text-text-secondary">Tenure (Years) *</label>
                  <input required type="number" step="1" placeholder="e.g. 5" className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary focus:border-accent-brass transition-colors" value={bondTenureYears} onChange={e => setBondTenureYears(e.target.value)} />
                </div>
              </>
            )}

            {isMetal && (
              <div className="space-y-1.5 col-span-2">
                <label className="text-[12px] text-text-secondary">Metal Purity</label>
                <select className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary focus:border-accent-brass transition-colors" value={metalPurity} onChange={e => setMetalPurity(e.target.value)}>
                  {assetType === 'gold' ? (
                    <>
                      <option value="24K">24K (99.9% Pure)</option>
                      <option value="22K">22K (91.6% Pure)</option>
                      <option value="18K">18K (75.0% Pure)</option>
                    </>
                  ) : (
                    <>
                      <option value="999">999 Fine Silver</option>
                      <option value="925">925 Sterling Silver</option>
                    </>
                  )}
                </select>
              </div>
            )}
            
            {assetType === 'liability' && (
              <div className="space-y-1.5">
                <label className="text-[12px] text-text-secondary">Monthly EMI (₹) *</label>
                <input required type="number" step="any" placeholder="0.00" className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary focus:border-accent-brass transition-colors" value={liabilityEmi} onChange={e => setLiabilityEmi(e.target.value)} />
              </div>
            )}
          </div>

          <div className="bg-bg-surface-2 p-3 rounded-[8px] flex justify-between items-center text-[13px]">
            <span className="text-text-secondary">{assetType === 'cash' && cashType === 'income' ? 'Total Monthly Income' : assetType === 'liability' ? 'Total Liability' : 'Total Value'}</span>
            <span className="font-medium text-text-primary font-mono">
              ₹{assetType === 'cash' && cashType === 'income' ? (parseFloat(quantity) || 0).toFixed(2) : assetType === 'liability' ? (parseFloat(quantity) || 0).toFixed(2) : ((parseFloat(quantity) || 0) * (parseFloat(pricePerUnit) || 1)).toFixed(2)}
            </span>
          </div>

          {/* Purchase / Investment Date Picker */}
          <div className="space-y-1.5">
            <label className="text-[12px] text-text-secondary flex items-center justify-between">
              <span>{tradeTab === 'buy' ? '📅 Purchase / Investment Date' : '📅 Sale Date'}</span>
              {(() => {
                if (!purchaseDate) return null;
                const diffMs = Date.now() - new Date(purchaseDate).getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365);
                const diffMonths = Math.floor(diffDays / 30);

                let ltcgThreshold = 12; // months - default for stocks/MF/crypto/bonds
                if (assetType === 'property') ltcgThreshold = 24;
                if (assetType === 'gold' || assetType === 'silver') ltcgThreshold = 36;

                const isLTCG = diffMonths >= ltcgThreshold;
                const holdingLabel = diffYears >= 1
                  ? `${diffYears.toFixed(1)}Y`
                  : `${diffMonths}M`;

                return (
                  <span className={cn(
                    'text-[11px] font-medium px-2 py-0.5 rounded-full',
                    isLTCG ? 'bg-positive-bg text-positive' : 'bg-negative-bg text-negative'
                  )}>
                    {holdingLabel} • {isLTCG ? 'LTCG ✓' : 'STCG'}
                  </span>
                );
              })()}
            </label>
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
              className="w-full bg-bg-base border border-border-default rounded-[8px] px-3 py-2 text-[14px] text-text-primary focus:border-accent-brass transition-colors"
            />
          </div>

          <button 
            type="button"
            onClick={() => mutation.mutate()} 
            disabled={mutation.isPending || !isFormValid} 
            className="w-full bg-accent-brass hover:bg-accent-brass-dim text-bg-base font-medium py-2.5 rounded-[8px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Processing...' : `Confirm ${isManualAsset ? (tradeTab === 'buy' ? 'ADD' : 'REMOVE') : tradeTab.toUpperCase()}`}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-bg-surface border border-border-default rounded-[16px] w-full max-w-md overflow-hidden relative shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-border-default">
          <h2 className="text-[18px] font-medium text-text-primary capitalize">
              {isManualAsset ? `Manage ${assetType.replace('_', ' ')}` : 'Trade Platform'}
          </h2>
          <button onClick={onClose} className="text-text-faint hover:text-text-primary transition-colors p-1 bg-bg-surface-2 rounded-full"><X className="w-4 h-4"/></button>
        </div>
        
        <div className="p-5">
          {view === 'discovery' ? renderDiscovery() : renderTrading()}
        </div>
      </div>
    </div>
  );
}
