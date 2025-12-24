/**
 * Web Scraper for Data Collection Layer
 * Collects performance metrics, latency data, and provider information
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedMetrics {
  provider: string;
  source: 'api-test' | 'documentation' | 'status-page' | 'community';
  timestamp: Date;
  metrics: {
    latency?: {
      average?: number;      // ms
      min?: number;          // ms
      max?: number;          // ms
      p95?: number;          // ms
      p99?: number;          // ms
    };
    errorRate?: number;      // percentage
    uptime?: number;          // percentage
    throughput?: number;      // requests per second
    concurrency?: {
      tested?: number;
      maxSupported?: number;
    };
  };
  metadata?: {
    region?: string;
    endpoint?: string;
    testDuration?: number;
    sampleSize?: number;
  };
}

export interface ScraperConfig {
  rateLimit: number;         // requests per second
  timeout: number;           // ms
  retries: number;
  userAgents: string[];
}

const DEFAULT_CONFIG: ScraperConfig = {
  rateLimit: 2,              // 2 requests per second
  timeout: 30000,            // 30 seconds
  retries: 3,
  userAgents: [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  ],
};

/**
 * Scrape provider documentation for performance metrics
 */
export async function scrapeDocumentation(
  url: string,
  provider: string,
  config: Partial<ScraperConfig> = {}
): Promise<ScrapedMetrics | null> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    const response = await axios.get(url, {
      timeout: finalConfig.timeout,
      headers: {
        'User-Agent': finalConfig.userAgents[0],
      },
    });

    const $ = cheerio.load(response.data);
    const metrics: ScrapedMetrics['metrics'] = {};

    // Look for latency mentions (common patterns)
    const text = $('body').text();
    
    // Extract latency values (e.g., "200ms", "latency: 150ms")
    const latencyMatches = text.match(/(?:latency|response time|delay)[:\s]+(\d+)\s*ms/gi);
    if (latencyMatches) {
      const latencies = latencyMatches
        .map(m => parseInt(m.match(/\d+/)?.[0] || '0'))
        .filter(l => l > 0);
      
      if (latencies.length > 0) {
        metrics.latency = {
          average: latencies.reduce((a, b) => a + b, 0) / latencies.length,
          min: Math.min(...latencies),
          max: Math.max(...latencies),
        };
      }
    }

    // Extract error rate mentions
    const errorRateMatch = text.match(/(?:error rate|failure rate)[:\s]+(\d+(?:\.\d+)?)\s*%/i);
    if (errorRateMatch) {
      metrics.errorRate = parseFloat(errorRateMatch[1]);
    }

    // Extract uptime mentions
    const uptimeMatch = text.match(/(?:uptime|availability)[:\s]+(\d+(?:\.\d+)?)\s*%/i);
    if (uptimeMatch) {
      metrics.uptime = parseFloat(uptimeMatch[1]);
    }

    // Extract concurrency limits
    const concurrencyMatch = text.match(/(?:concurrent|concurrency)[:\s]+(\d+)/i);
    if (concurrencyMatch) {
      metrics.concurrency = {
        maxSupported: parseInt(concurrencyMatch[1]),
      };
    }

    return {
      provider,
      source: 'documentation',
      timestamp: new Date(),
      metrics,
      metadata: {
        endpoint: url,
      },
    };
  } catch (error: any) {
    console.error(`Error scraping documentation for ${provider}:`, error.message);
    return null;
  }
}

/**
 * Test API endpoint directly and measure latency
 */
export async function testAPIEndpoint(
  url: string,
  provider: string,
  method: 'GET' | 'POST' = 'GET',
  headers: Record<string, string> = {},
  body?: any,
  config: Partial<ScraperConfig> = {}
): Promise<ScrapedMetrics | null> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const latencies: number[] = [];
  let errors: number = 0;
  const samples = 10; // Number of test requests

  try {
    for (let i = 0; i < samples; i++) {
      const startTime = Date.now();
      
      try {
        const response = await axios({
          method,
          url,
          headers: {
            'User-Agent': finalConfig.userAgents[i % finalConfig.userAgents.length],
            ...headers,
          },
          data: body,
          timeout: finalConfig.timeout,
          validateStatus: () => true, // Don't throw on any status
        });

        const latency = Date.now() - startTime;
        
        if (response.status >= 200 && response.status < 300) {
          latencies.push(latency);
        } else {
          errors++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000 / finalConfig.rateLimit));
      } catch (error: any) {
        errors++;
        const latency = Date.now() - startTime;
        latencies.push(latency); // Include failed requests in latency
      }
    }

    if (latencies.length === 0) {
      return null;
    }

    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedLatencies.length * 0.95);
    const p99Index = Math.floor(sortedLatencies.length * 0.99);

    return {
      provider,
      source: 'api-test',
      timestamp: new Date(),
      metrics: {
        latency: {
          average: latencies.reduce((a, b) => a + b, 0) / latencies.length,
          min: Math.min(...latencies),
          max: Math.max(...latencies),
          p95: sortedLatencies[p95Index],
          p99: sortedLatencies[p99Index],
        },
        errorRate: (errors / samples) * 100,
      },
      metadata: {
        endpoint: url,
        testDuration: Date.now() - (Date.now() - (samples * (1000 / finalConfig.rateLimit))),
        sampleSize: samples,
      },
    };
  } catch (error: any) {
    console.error(`Error testing API for ${provider}:`, error.message);
    return null;
  }
}

/**
 * Scrape status page for uptime and performance data
 */
export async function scrapeStatusPage(
  statusUrl: string,
  provider: string,
  config: Partial<ScraperConfig> = {}
): Promise<ScrapedMetrics | null> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    const response = await axios.get(statusUrl, {
      timeout: finalConfig.timeout,
      headers: {
        'User-Agent': finalConfig.userAgents[0],
      },
    });

    const $ = cheerio.load(response.data);
    const metrics: ScrapedMetrics['metrics'] = {};

    // Look for uptime indicators (common status page patterns)
    const uptimeText = $('body').text();
    
    // Common patterns: "99.9% uptime", "Uptime: 99.95%"
    const uptimeMatch = uptimeText.match(/(?:uptime|availability)[:\s]+(\d+(?:\.\d+)?)\s*%/i);
    if (uptimeMatch) {
      metrics.uptime = parseFloat(uptimeMatch[1]);
    }

    // Look for status indicators
    const statusElements = $('[class*="status"], [class*="indicator"], [data-status]');
    let operationalCount = 0;
    let totalCount = 0;

    statusElements.each((_, el) => {
      totalCount++;
      const status = $(el).text().toLowerCase();
      if (status.includes('operational') || status.includes('up') || status.includes('healthy')) {
        operationalCount++;
      }
    });

    if (totalCount > 0) {
      metrics.uptime = (operationalCount / totalCount) * 100;
    }

    return {
      provider,
      source: 'status-page',
      timestamp: new Date(),
      metrics,
      metadata: {
        endpoint: statusUrl,
      },
    };
  } catch (error: any) {
    console.error(`Error scraping status page for ${provider}:`, error.message);
    return null;
  }
}

/**
 * Scrape community forums/Reddit for user-reported performance data
 */
export async function scrapeCommunityData(
  searchQuery: string,
  provider: string,
  config: Partial<ScraperConfig> = {}
): Promise<ScrapedMetrics[]> {
  // Note: This is a placeholder - actual implementation would need
  // Reddit API, Stack Overflow API, or similar
  // For now, return empty array
  console.log(`Community scraping for ${provider} with query: ${searchQuery}`);
  return [];
}

/**
 * Collect all metrics for a provider
 */
export async function collectProviderMetrics(
  provider: string,
  endpoints: {
    documentation?: string;
    api?: string;
    statusPage?: string;
    apiMethod?: 'GET' | 'POST';
    apiHeaders?: Record<string, string>;
    apiBody?: any;
  },
  config: Partial<ScraperConfig> = {}
): Promise<ScrapedMetrics[]> {
  const results: ScrapedMetrics[] = [];

  // Scrape documentation
  if (endpoints.documentation) {
    const docMetrics = await scrapeDocumentation(endpoints.documentation, provider, config);
    if (docMetrics) results.push(docMetrics);
  }

  // Test API endpoint
  if (endpoints.api) {
    const apiMetrics = await testAPIEndpoint(
      endpoints.api,
      provider,
      endpoints.apiMethod || 'GET',
      endpoints.apiHeaders,
      endpoints.apiBody,
      config
    );
    if (apiMetrics) results.push(apiMetrics);
  }

  // Scrape status page
  if (endpoints.statusPage) {
    const statusMetrics = await scrapeStatusPage(endpoints.statusPage, provider, config);
    if (statusMetrics) results.push(statusMetrics);
  }

  return results;
}

