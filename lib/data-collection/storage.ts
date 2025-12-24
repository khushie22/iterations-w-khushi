/**
 * Storage layer for collected metrics
 */

import { ScrapedMetrics } from './scraper';
import * as fs from 'fs';
import * as path from 'path';

export interface MetricsDatabase {
  providers: Record<string, {
    latest: ScrapedMetrics[];
    history: ScrapedMetrics[][];
    aggregated: {
      latency?: {
        average: number;
        min: number;
        max: number;
        p95: number;
        p99: number;
        sampleSize: number;
      };
      errorRate?: {
        average: number;
        sampleSize: number;
      };
      uptime?: {
        average: number;
        sampleSize: number;
      };
    };
  }>;
  lastUpdated: Date;
}

const DATA_DIR = path.join(process.cwd(), 'data', 'metrics');
const DB_FILE = path.join(DATA_DIR, 'metrics-db.json');

/**
 * Ensure data directory exists
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load metrics database from disk
 */
export function loadMetricsDatabase(): MetricsDatabase {
  ensureDataDir();
  
  if (!fs.existsSync(DB_FILE)) {
    return {
      providers: {},
      lastUpdated: new Date(),
    };
  }

  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(data);
    
    // Convert date strings back to Date objects
    db.lastUpdated = new Date(db.lastUpdated);
    for (const provider in db.providers) {
      db.providers[provider].latest.forEach((m: ScrapedMetrics) => {
        m.timestamp = new Date(m.timestamp);
      });
      db.providers[provider].history.forEach((batch: ScrapedMetrics[]) => {
        batch.forEach((m: ScrapedMetrics) => {
          m.timestamp = new Date(m.timestamp);
        });
      });
    }
    
    return db;
  } catch (error: any) {
    console.error('Error loading metrics database:', error.message);
    return {
      providers: {},
      lastUpdated: new Date(),
    };
  }
}

/**
 * Save metrics database to disk
 */
export function saveMetricsDatabase(db: MetricsDatabase): void {
  ensureDataDir();
  
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('Error saving metrics database:', error.message);
    throw error;
  }
}

/**
 * Add new metrics to database
 */
export function addMetrics(provider: string, metrics: ScrapedMetrics[]): void {
  const db = loadMetricsDatabase();
  
  if (!db.providers[provider]) {
    db.providers[provider] = {
      latest: [],
      history: [],
      aggregated: {},
    };
  }

  // Add to latest
  db.providers[provider].latest = metrics;
  
  // Add to history (keep last 10 batches)
  db.providers[provider].history.push(metrics);
  if (db.providers[provider].history.length > 10) {
    db.providers[provider].history.shift();
  }

  // Recalculate aggregated metrics
  db.providers[provider].aggregated = aggregateMetrics(metrics);

  db.lastUpdated = new Date();
  saveMetricsDatabase(db);
}

/**
 * Aggregate metrics from multiple sources
 */
function aggregateMetrics(metrics: ScrapedMetrics[]): MetricsDatabase['providers'][string]['aggregated'] {
  const aggregated: MetricsDatabase['providers'][string]['aggregated'] = {};

  // Aggregate latency
  const latencies: number[] = [];
  metrics.forEach(m => {
    if (m.metrics.latency?.average) {
      latencies.push(m.metrics.latency.average);
    }
  });

  if (latencies.length > 0) {
    const sorted = [...latencies].sort((a, b) => a - b);
    aggregated.latency = {
      average: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      min: Math.min(...latencies),
      max: Math.max(...latencies),
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      sampleSize: latencies.length,
    };
  }

  // Aggregate error rate
  const errorRates: number[] = [];
  metrics.forEach(m => {
    if (m.metrics.errorRate !== undefined) {
      errorRates.push(m.metrics.errorRate);
    }
  });

  if (errorRates.length > 0) {
    aggregated.errorRate = {
      average: errorRates.reduce((a, b) => a + b, 0) / errorRates.length,
      sampleSize: errorRates.length,
    };
  }

  // Aggregate uptime
  const uptimes: number[] = [];
  metrics.forEach(m => {
    if (m.metrics.uptime !== undefined) {
      uptimes.push(m.metrics.uptime);
    }
  });

  if (uptimes.length > 0) {
    aggregated.uptime = {
      average: uptimes.reduce((a, b) => a + b, 0) / uptimes.length,
      sampleSize: uptimes.length,
    };
  }

  return aggregated;
}

/**
 * Get aggregated metrics for a provider
 */
export function getProviderMetrics(provider: string): MetricsDatabase['providers'][string]['aggregated'] | null {
  const db = loadMetricsDatabase();
  return db.providers[provider]?.aggregated || null;
}

/**
 * Get all provider metrics
 */
export function getAllProviderMetrics(): Record<string, MetricsDatabase['providers'][string]['aggregated']> {
  const db = loadMetricsDatabase();
  const result: Record<string, MetricsDatabase['providers'][string]['aggregated']> = {};
  
  for (const provider in db.providers) {
    result[provider] = db.providers[provider].aggregated;
  }
  
  return result;
}

