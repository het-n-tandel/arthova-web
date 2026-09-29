'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Download, 
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { formatINR, cn } from '@/lib/formatters';

interface PortfolioImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRowPreview {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  assetType: string;
}

export function PortfolioImportModal({ isOpen, onClose }: PortfolioImportModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState<ParsedRowPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Helper to parse standard CSV line with quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const handleFileChange = async (file: File) => {
    setErrorMsg(null);
    setSuccessCount(null);

    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      setErrorMsg('Please upload a valid .csv file exported from your broker (Zerodha, Groww, Upstox, etc.).');
      return;
    }

    setSelectedFile(file);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setErrorMsg('The uploaded CSV file is empty or missing data rows.');
        return;
      }

      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''));
      const symIdx = headers.findIndex((h) => h.includes('symbol') || h.includes('ticker') || h.includes('instrument') || h.includes('script'));
      const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('company') || h.includes('security'));
      const qtyIdx = headers.findIndex((h) => h.includes('qty') || h.includes('quantity') || h.includes('shares') || h.includes('units'));
      const priceIdx = headers.findIndex((h) => h.includes('avgcost') || h.includes('buyprice') || h.includes('price') || h.includes('avgprice') || h.includes('cost') || h.includes('nav'));
      const typeIdx = headers.findIndex((h) => h.includes('type') || h.includes('assettype') || h.includes('segment'));

      const parsed: ParsedRowPreview[] = [];
      for (let i = 1; i < Math.min(lines.length, 25); i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length <= 1) continue;

        let sym = symIdx >= 0 ? row[symIdx] : '';
        let name = nameIdx >= 0 ? row[nameIdx] : '';
        const qty = parseFloat(qtyIdx >= 0 ? row[qtyIdx]?.replace(/,/g, '') : '0') || 0;
        const price = parseFloat(priceIdx >= 0 ? row[priceIdx]?.replace(/,/g, '') : '0') || 0;
        const rawType = typeIdx >= 0 ? row[typeIdx]?.toLowerCase() : '';

        if (qty <= 0) continue;
        if (!sym && name) sym = name.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (!name && sym) name = sym;

        let assetType = 'Stock';
        if (rawType.includes('fund') || rawType.includes('mf') || name.toLowerCase().includes('fund')) assetType = 'Mutual Fund';
        else if (rawType.includes('gold') || name.toLowerCase().includes('gold')) assetType = 'Gold';
        else if (rawType.includes('crypto')) assetType = 'Crypto';

        if (sym && !sym.includes('.') && !sym.includes(':') && assetType === 'Stock') {
          sym = `${sym.toUpperCase()}.NS`;
        }

        parsed.push({
          symbol: sym,
          name,
          quantity: qty,
          avgCost: price,
          assetType,
        });
      }

      setPreviews(parsed);
    } catch (err: any) {
      setErrorMsg('Could not parse preview. ' + err.message);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/portfolio/import', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to import portfolio CSV.');
      }

      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['networth'] });

      setSuccessCount(result.importedCount || previews.length);
      setTimeout(() => {
        onClose();
        setSelectedFile(null);
        setPreviews([]);
        setSuccessCount(null);
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Import failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Symbol,Name,Quantity,AvgCost,AssetType,PurchaseDate\n' +
      'TCS.NS,Tata Consultancy Services,10,3850,Stock,2024-01-15\n' +
      'RELIANCE.NS,Reliance Industries,15,2950,Stock,2024-02-10\n' +
      'GOLDBEES.NS,Nippon India ETF Gold BeES,50,72.5,Gold,2024-03-01\n' +
      '122639,Parag Parikh Flexi Cap Fund,100,74.2,Mutual Fund,2023-11-20\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'arthova_sample_portfolio_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl rounded-2xl border border-border-default bg-bg-surface p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full bg-accent-brass/10 text-accent-brass border border-accent-brass/20">
                  Broker Demat Sync
                </span>
                <span className="text-xs text-text-faint">Zerodha • Groww • Upstox • CAMS</span>
              </div>
              <h3 className="text-xl font-bold text-text-primary">
                Import Portfolio Statement
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-faint hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all space-y-3',
              isDragging
                ? 'border-accent-brass bg-accent-brass/5'
                : 'border-border-default hover:border-accent-brass/50 bg-bg-surface-2/40'
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-accent-brass/10 flex items-center justify-center mx-auto text-accent-brass">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {selectedFile ? selectedFile.name : 'Click or drag & drop broker CSV file here'}
              </p>
              <p className="text-xs text-text-faint mt-1">
                Supports Zerodha Kite Holdings CSV, Groww P&L CSV, Upstox, or custom CSV
              </p>
            </div>
          </div>

          {/* Sample template link */}
          <div className="flex items-center justify-between text-xs text-text-faint px-1">
            <span>Need a formatted file?</span>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="flex items-center gap-1.5 text-accent-brass hover:underline font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Download Sample CSV Template
            </button>
          </div>

          {/* Preview Table if file parsed */}
          {previews.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary">
                  Position Preview ({previews.length} holdings detected):
                </span>
                <span className="text-[11px] font-mono text-positive">✓ Auto-mapped columns</span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border-default">
                <table className="w-full text-left text-xs">
                  <thead className="bg-bg-surface-2 text-text-faint font-mono sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Symbol</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Avg Cost</th>
                      <th className="px-3 py-2">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default font-mono">
                    {previews.map((p, i) => (
                      <tr key={i} className="hover:bg-bg-surface-2/60">
                        <td className="px-3 py-1.5 font-bold text-accent-brass">{p.symbol}</td>
                        <td className="px-3 py-1.5 font-sans truncate max-w-[150px] text-text-primary">{p.name}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{p.quantity}</td>
                        <td className="px-3 py-1.5 text-text-secondary">₹{p.avgCost.toFixed(2)}</td>
                        <td className="px-3 py-1.5 font-sans">
                          <span className="px-1.5 py-0.5 rounded bg-bg-surface-2 border border-border-default text-[10px] text-text-faint">
                            {p.assetType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successCount !== null && (
            <div className="p-3.5 rounded-xl bg-positive/10 border border-positive/30 text-positive text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Successfully imported {successCount} holdings into your Supabase portfolio! Updating live charts...</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-default">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedFile || isUploading || successCount !== null}
              onClick={handleUpload}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-accent-brass hover:bg-accent-brass-dim text-bg-base transition-all shadow-md',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing to Supabase...
                </>
              ) : (
                <>
                  Confirm & Sync Portfolio ({previews.length} items)
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
