/**
 * Provider-specific endpoints and configuration for data collection
 */

import { collectProviderMetrics, ScrapedMetrics } from './scraper';

export interface ProviderEndpoints {
  documentation?: string;
  api?: string;
  statusPage?: string;
  apiMethod?: 'GET' | 'POST';
  apiHeaders?: Record<string, string>;
  apiBody?: any;
}

export const PROVIDER_ENDPOINTS: Record<string, ProviderEndpoints> = {
  // Avatar Providers
  heygen: {
    documentation: 'https://docs.heygen.com',
    api: 'https://api.heygen.com/v2/avatars',
    statusPage: 'https://status.heygen.com',
    apiMethod: 'GET',
    apiHeaders: {
      // Note: API key should be provided via environment variable
      // 'X-API-KEY': process.env.HEYGEN_API_KEY || '',
    },
  },
  anam: {
    documentation: 'https://docs.anam.ai',
    // API endpoint would need to be determined
    statusPage: 'https://status.anam.ai',
  },
  tavus: {
    documentation: 'https://docs.tavus.io',
    api: 'https://api.tavus.io/v1/replicas',
    statusPage: 'https://status.tavus.io',
    apiMethod: 'GET',
  },
  
  // Voice Agents
  'gemini-live': {
    documentation: 'https://ai.google.dev/gemini-api/docs',
    // API endpoint for testing would be specific to Gemini Live
    statusPage: 'https://status.cloud.google.com',
  },
  'gpt-realtime': {
    documentation: 'https://platform.openai.com/docs/guides/realtime',
    // API endpoint for testing would be specific to Realtime API
    statusPage: 'https://status.openai.com',
  },
  'hume-pro': {
    documentation: 'https://dev.hume.ai/docs',
    api: 'https://api.hume.ai/v0/evi/chat',
    statusPage: 'https://status.hume.ai',
    apiMethod: 'POST',
  },
  'hume-scale': {
    documentation: 'https://dev.hume.ai/docs',
    api: 'https://api.hume.ai/v0/evi/chat',
    statusPage: 'https://status.hume.ai',
    apiMethod: 'POST',
  },
  'hume-business': {
    documentation: 'https://dev.hume.ai/docs',
    api: 'https://api.hume.ai/v0/evi/chat',
    statusPage: 'https://status.hume.ai',
    apiMethod: 'POST',
  },
  grok: {
    documentation: 'https://docs.x.ai',
    statusPage: 'https://status.x.ai',
  },
  
  // Hosting Providers
  azure: {
    documentation: 'https://docs.microsoft.com/azure',
    statusPage: 'https://status.azure.com',
  },
  vercel: {
    documentation: 'https://vercel.com/docs',
    statusPage: 'https://www.vercel-status.com',
  },
  railway: {
    documentation: 'https://docs.railway.app',
    statusPage: 'https://status.railway.app',
  },
};

/**
 * Collect metrics for all providers
 */
export async function collectAllProviderMetrics(): Promise<Record<string, ScrapedMetrics[]>> {
  const results: Record<string, ScrapedMetrics[]> = {};

  for (const [provider, endpoints] of Object.entries(PROVIDER_ENDPOINTS)) {
    console.log(`Collecting metrics for ${provider}...`);
    try {
      const metrics = await collectProviderMetrics(provider, endpoints);
      results[provider] = metrics;
      console.log(`Collected ${metrics.length} metric sources for ${provider}`);
    } catch (error: any) {
      console.error(`Error collecting metrics for ${provider}:`, error.message);
      results[provider] = [];
    }
  }

  return results;
}

/**
 * Get default latency estimates (fallback when scraping fails)
 */
export function getDefaultLatencyEstimates(): Record<string, number> {
  return {
    // Avatar Providers (ms)
    heygen: 300,
    anam: 250,
    tavus: 350,
    
    // Voice Agents (ms)
    'gemini-live': 200,
    'gpt-realtime': 150,
    'hume-pro': 100,
    'hume-scale': 100,
    'hume-business': 100,
    grok: 180,
    
    // Hosting (ms)
    azure: 50,
    vercel: 30,
    railway: 60,
  };
}

