# Data Collection Layer - Setup Guide

## Overview

I've created a comprehensive web scraping system for collecting performance metrics, latency data, and provider information. This data will be used to project latency, complexity, and architecture requirements based on your cost calculator combinations.

## What Was Created

### 1. Core Scraper Module (`lib/data-collection/scraper.ts`)
- **Documentation Scraper**: Extracts performance metrics from provider docs
- **API Tester**: Directly tests API endpoints and measures latency
- **Status Page Scraper**: Monitors provider status pages for uptime
- **Community Scraper**: Placeholder for future Reddit/forum scraping

### 2. Provider Configuration (`lib/data-collection/providers.ts`)
- Endpoint definitions for all providers (HeyGen, Anam, Tavus, Voice Agents, Hosting)
- Default latency estimates as fallbacks
- Batch collection function

### 3. Storage System (`lib/data-collection/storage.ts`)
- JSON-based metrics database
- Aggregation of metrics from multiple sources
- Historical tracking (last 10 batches)

### 4. Main Entry Point (`lib/data-collection/index.ts`)
- Orchestrates the entire collection process
- Provides metrics for use in projections

### 5. Collection Script (`scripts/collect-metrics.ts`)
- CLI script to run data collection
- Can be scheduled via cron or GitHub Actions

## Installation

```bash
cd khushi/cost-calculator
npm install
```

This will install:
- `axios` - HTTP client for API testing
- `cheerio` - HTML parsing for web scraping
- `tsx` - TypeScript execution for scripts

## Usage

### Run Data Collection

```bash
npm run collect-metrics
```

This will:
1. Scrape documentation for all providers
2. Test API endpoints (if credentials are available)
3. Check status pages
4. Store aggregated metrics in `data/metrics/metrics-db.json`

### Use Metrics in Your Code

```typescript
import { getMetricsForProjections } from '@/lib/data-collection';

const metrics = getMetricsForProjections();
const heygenLatency = metrics.heygen?.latency?.average; // ms
const humeErrorRate = metrics['hume-pro']?.errorRate?.average; // %
```

## What Data Gets Collected

### Latency Metrics
- Average, Min, Max latency (ms)
- P95 and P99 percentiles
- Sample size

### Reliability Metrics
- Error rate (%)
- Uptime (%)
- Throughput (req/s)

### Concurrency Data
- Tested concurrency levels
- Maximum supported concurrency

## Data Sources

The scraper collects from:
- **Documentation**: Scrapes provider docs for performance mentions
- **API Testing**: Directly tests endpoints (requires API keys)
- **Status Pages**: Monitors uptime and availability
- **Community**: (Future) User-reported metrics

## Configuration

### Rate Limiting
- Default: 2 requests/second
- Prevents overwhelming servers
- Configurable per provider

### Timeouts
- Default: 30 seconds
- Prevents hanging requests

### API Keys (Optional)
Set environment variables for API testing:
```bash
export HEYGEN_API_KEY=your_key_here
export HUME_API_KEY=your_key_here
```

## Data Storage

Metrics are stored in:
```
data/metrics/metrics-db.json
```

This file is gitignored (see `.gitignore`).

## Next Steps

1. **Run Initial Collection**:
   ```bash
   npm run collect-metrics
   ```

2. **Integrate with Projections**:
   Use the collected metrics in your latency/complexity projection calculations

3. **Schedule Regular Updates**:
   Set up a cron job or GitHub Action to run collection daily/weekly

4. **Enhance Scraping**:
   - Add more specific endpoints
   - Improve parsing patterns
   - Add community scraping (Reddit API, Stack Overflow API)

## Example Output

After running collection, you'll have data like:

```json
{
  "providers": {
    "heygen": {
      "aggregated": {
        "latency": {
          "average": 300,
          "min": 150,
          "max": 500,
          "p95": 450,
          "p99": 480,
          "sampleSize": 10
        },
        "errorRate": {
          "average": 0.5,
          "sampleSize": 10
        }
      }
    }
  }
}
```

## Integration with Projections

This data collection layer provides the foundation for:
1. **Latency Projections**: Use real latency data instead of estimates
2. **Complexity Scoring**: Factor in error rates and reliability
3. **Architecture Planning**: Use uptime data to determine redundancy needs

## Troubleshooting

### Scraping Fails
- Some providers may block scrapers
- Use default estimates as fallback
- Check network connectivity

### API Testing Fails
- Ensure API keys are set (if required)
- Some endpoints may require authentication
- Rate limits may apply

### No Data Collected
- Check if endpoints are accessible
- Verify provider URLs are correct
- Review console logs for errors

## Future Enhancements

- [ ] Real-time monitoring integration
- [ ] Historical trend analysis
- [ ] Automated anomaly detection
- [ ] Integration with existing API calls in your codebase
- [ ] Community metrics (Reddit, Stack Overflow)
- [ ] Performance benchmarking suite

