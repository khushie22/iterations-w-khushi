#!/usr/bin/env node

/**
 * Script to run data collection
 * Usage: npm run collect-metrics
 *        or: ts-node scripts/collect-metrics.ts
 */

import { runDataCollection } from '../lib/data-collection';

async function main() {
  console.log('🚀 Starting metrics collection...\n');
  
  try {
    await runDataCollection();
    console.log('\n✅ Metrics collection completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error during metrics collection:', error.message);
    process.exit(1);
  }
}

main();

