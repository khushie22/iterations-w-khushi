/**
 * Data Collection Layer - Main Entry Point
 * 
 * This module provides web scraping and data collection capabilities
 * for gathering performance metrics, latency data, and provider information
 */

export * from './scraper';
export * from './providers';
export * from './storage';

import { collectAllProviderMetrics } from './providers';
import { addMetrics, getAllProviderMetrics } from './storage';

/**
 * Run full data collection cycle
 */
export async function runDataCollection(): Promise<void> {
  console.log('Starting data collection...');
  
  try {
    const allMetrics = await collectAllProviderMetrics();
    
    // Store metrics
    for (const [provider, metrics] of Object.entries(allMetrics)) {
      if (metrics.length > 0) {
        addMetrics(provider, metrics);
        console.log(`✓ Stored ${metrics.length} metric sources for ${provider}`);
      }
    }
    
    console.log('Data collection completed successfully');
  } catch (error: any) {
    console.error('Error during data collection:', error.message);
    throw error;
  }
}

/**
 * Get metrics for use in projections
 */
export function getMetricsForProjections() {
  return getAllProviderMetrics();
}

