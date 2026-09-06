'use client';

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { formatINR } from '@/lib/formatters';

interface CsvImportModalProps {
  onClose: () => void;
}

export function CsvImportModal({ onClose }: CsvImportModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    importedCount: number;
    totalImportedValue: number;
    message: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.csv')) {
        setError('Please upload a valid .csv file');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (!selected.name.endsWith('.csv')) {
        setError('Please upload a valid .csv file');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/portfolio/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import CSV');
      }

      setSuccessResult(data);
      queryClient.invalidateQueries({ queryKey: ['holdings'] });
      queryClient.invalidateQueries({ queryKey: ['networth'] });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during import');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-bg-surface border border-border-default rounded-[16px] w-full max-w-lg overflow-hidden relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-border-default">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-brass/10 flex items-center justify-center text-accent-brass">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-text-primary">Import Tradebook / CAS Statement</h2>
              <p className="text-[12px] text-text-faint">Upload Zerodha, Groww, Angel One or CAMS CAS CSV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-faint hover:text-text-primary transition-colors p-1 bg-bg-surface-2 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {successResult ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-positive/10 border border-positive/30 text-positive flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-[18px] font-semibold text-text-primary">Portfolio Statement Imported!</h3>
                <p className="text-[13px] text-text-secondary mt-1">
                  Successfully parsed and added{' '}
                  <strong className="text-text-primary">{successResult.importedCount} assets</strong> to your live portfolio.
                </p>
                <p className="text-[14px] font-mono text-positive font-medium mt-2">
                  Total Value: {formatINR(successResult.totalImportedValue)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-accent-brass hover:bg-accent-brass-dim text-bg-base font-medium py-2.5 rounded-[8px] transition-colors mt-4"
              >
                View Updated Portfolio
              </button>
            </div>
          ) : (
            <>
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[12px] p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-accent-brass bg-accent-brass/5'
                    : 'border-border-default hover:border-accent-brass/50 bg-bg-base'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-accent-brass/10 flex items-center justify-center text-accent-brass mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-[14px] font-medium text-text-primary">{file.name}</p>
                    <p className="text-[12px] text-text-faint mt-1">
                      {(file.size / 1024).toFixed(1)} KB • Click or drag another file to replace
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-10 h-10 text-text-faint mb-3 group-hover:text-accent-brass transition-colors" />
                    <p className="text-[14px] font-medium text-text-primary">
                      Drag and drop your tradebook or CAS CSV here
                    </p>
                    <p className="text-[12px] text-text-faint mt-1">
                      or click to browse from your computer
                    </p>
                  </div>
                )}
              </div>

              {/* Supported Brokers List */}
              <div className="bg-bg-surface-2 p-3.5 rounded-[8px] text-[12px] text-text-faint space-y-1">
                <span className="font-medium text-text-secondary block">Supported Formats:</span>
                <p>• <strong>Zerodha:</strong> Console &gt; Reports &gt; Tradebook / Holdings (.csv)</p>
                <p>• <strong>Groww:</strong> Reports &gt; Stock / Mutual Fund Holdings (.csv)</p>
                <p>• <strong>NSDL / CAMS:</strong> Consolidated Account Statement (CAS)</p>
                <p>• <strong>Custom CSV:</strong> Columns: Symbol, Name, Quantity, Price, Date</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-negative/10 border border-negative/30 rounded-[8px] flex items-center gap-2 text-[13px] text-negative">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-[8px] border border-border-default text-text-secondary hover:bg-bg-surface-2 transition-colors text-[13px] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="flex-1 bg-accent-brass hover:bg-accent-brass-dim text-bg-base font-medium py-2.5 rounded-[8px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[13px] flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Parsing &amp; Importing...
                    </>
                  ) : (
                    'Import Holdings Now'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
