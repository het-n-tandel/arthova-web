/**
 * Institutional Tracing & Diagnostic Engine for Arthova
 * Provides structured execution tracking, latency benchmarking, and error isolation
 * across Authentication, Database Poolers, Quant Scoring, Trading, and Tax Engines.
 */

export type FeatureDomain = 
  | 'AUTH'
  | 'DB_POOLER'
  | 'QUANT_QVM'
  | 'TRADE_EXECUTION'
  | 'REBALANCE_ENGINE'
  | 'TAX_ENGINE'
  | 'CSV_IMPORT'
  | 'PRICE_STREAM';

export type TraceStatus = 'PENDING' | 'SUCCESS' | 'WARNING' | 'FAILED';

export interface TraceRecord {
  id: string;
  domain: FeatureDomain;
  operation: string;
  status: TraceStatus;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  metadata?: Record<string, any>;
  logs: Array<{
    level: 'INFO' | 'WARN' | 'ERROR';
    timestamp: number;
    message: string;
    context?: any;
  }>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

class TracingManager {
  private traces: TraceRecord[] = [];
  private readonly maxTraces = 200;

  public startTrace(domain: FeatureDomain, operation: string, metadata?: Record<string, any>) {
    const traceId = `${domain.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: TraceRecord = {
      id: traceId,
      domain,
      operation,
      status: 'PENDING',
      startTime: Date.now(),
      metadata,
      logs: [],
    };

    this.traces.unshift(record);
    if (this.traces.length > this.maxTraces) {
      this.traces.pop();
    }

    const self = this;

    return {
      id: traceId,
      info: (message: string, context?: any) => {
        record.logs.push({ level: 'INFO', timestamp: Date.now(), message, context });
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[${domain}][${operation}] ℹ️ ${message}`, context || '');
        }
      },
      warn: (message: string, context?: any) => {
        record.logs.push({ level: 'WARN', timestamp: Date.now(), message, context });
        console.warn(`[${domain}][${operation}] ⚠️ ${message}`, context || '');
      },
      error: (message: string, err?: any) => {
        const errorDetails = err instanceof Error ? { message: err.message, stack: err.stack } : { message: String(err) };
        record.error = errorDetails;
        record.logs.push({ level: 'ERROR', timestamp: Date.now(), message, context: errorDetails });
        console.error(`[${domain}][${operation}] 🛑 ${message}`, errorDetails);
      },
      end: (status: 'SUCCESS' | 'WARNING' | 'FAILED', summary?: string) => {
        record.status = status;
        record.endTime = Date.now();
        record.durationMs = record.endTime - record.startTime;
        if (summary) {
          record.logs.push({ level: status === 'FAILED' ? 'ERROR' : 'INFO', timestamp: Date.now(), message: summary });
        }
        return record;
      },
    };
  }

  public getRecentTraces(filter?: { domain?: FeatureDomain; status?: TraceStatus; limit?: number }): TraceRecord[] {
    let result = [...this.traces];
    if (filter?.domain) {
      result = result.filter((t) => t.domain === filter.domain);
    }
    if (filter?.status) {
      result = result.filter((t) => t.status === filter.status);
    }
    return result.slice(0, filter?.limit || 50);
  }

  public getSummaryStats() {
    const total = this.traces.length;
    const failed = this.traces.filter((t) => t.status === 'FAILED').length;
    const warnings = this.traces.filter((t) => t.status === 'WARNING').length;
    const successes = this.traces.filter((t) => t.status === 'SUCCESS').length;

    const domainCounts: Record<string, { total: number; failed: number; avgDuration: number }> = {};

    this.traces.forEach((t) => {
      if (!domainCounts[t.domain]) {
        domainCounts[t.domain] = { total: 0, failed: 0, avgDuration: 0 };
      }
      domainCounts[t.domain].total++;
      if (t.status === 'FAILED') domainCounts[t.domain].failed++;
      if (t.durationMs) {
        domainCounts[t.domain].avgDuration = (domainCounts[t.domain].avgDuration + t.durationMs) / 2;
      }
    });

    return {
      totalTraces: total,
      successes,
      warnings,
      failed,
      healthScore: total > 0 ? Math.round(((total - failed) / total) * 100) : 100,
      domainCounts,
    };
  }
}

// Global singleton instance
export const tracing = new TracingManager();
