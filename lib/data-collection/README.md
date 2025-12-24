# Data Collection Layer

This module provides web scraping and data collection capabilities for gathering performance metrics, latency data, and provider information to support latency, complexity, and architecture projections.

## Overview

The data collection layer scrapes data from multiple sources:
- **API Testing**: Direct API endpoint testing to measure real latency
- **Documentation**: Scraping provider documentation for performance metrics
- **Status Pages**: Monitoring provider status pages for uptime data
- **Community Data**: (Future) Scraping forums/Reddit for user-reported metrics

## Components

### 1. Scraper (`scraper.ts`)
Core web scraping functionality:
- `scrapeDocumentation()` - Extracts performance metrics from docs
- `testAPIEndpoint()` - Directly tests APIs and measures latency
- `scrapeStatusPage()` - Gets uptime and status information
- `collectProviderMetrics()` - Orchestrates collection for a provider

### 2. Providers (`providers.ts`)
Provider-specific configuration:
- Endpoint definitions for each provider
- `collectAllProviderMetrics()` - Collects metrics for all providers
- Default latency estimates (fallback when scraping fails)

### 3. Storage (`storage.ts`)
Metrics persistence:
- JSON-based storage in `data/metrics/metrics-db.json`
- Aggregates metrics from multiple sources
- Maintains history of collected metrics

## Usage

### Run Data Collection

```bash
npm run collect-metrics
```

This will:
1. Scrape documentation for all providers
2. Test API endpoints (if available)
3. Check status pages
4. Store aggregated metrics

### Use Metrics in Code

```typescript
import { getMetricsForProjections } from '@/lib/data-collection';

const metrics = getMetricsForProjections();
const heygenLatency = metrics.heygen?.latency?.average; // ms
```

## Data Sources

### Avatar Providers
- **HeyGen**: `https://docs.heygen.com`, `https://api.heygen.com/v2/avatars`
- **Anam**: `https://docs.anam.ai`
- **Tavus**: `https://docs.tavus.io`, `https://api.tavus.io/v1/replicas`

### Voice Agents
- **Gemini Live**: `https://ai.google.dev/gemini-api/docs`
- **GPT Realtime**: `https://platform.openai.com/docs/guides/realtime`
- **Hume**: `https://dev.hume.ai/docs`, `https://api.hume.ai/v0/evi/chat`
- **Grok**: `https://docs.x.ai`

### Hosting Providers
- **Azure**: `https://docs.microsoft.com/azure`, `https://status.azure.com`
- **Vercel**: `https://vercel.com/docs`, `https://www.vercel-status.com`
- **Railway**: `https://docs.railway.app`, `https://status.railway.app`

## Configuration

### Rate Limiting
Default: 2 requests per second per provider
- Prevents overwhelming servers
- Reduces risk of being blocked
- Configurable per provider

### Timeouts
Default: 30 seconds
- Prevents hanging requests
- Configurable per provider

### Retries
Default: 3 attempts
- Handles transient failures
- Configurable per provider

## Metrics Collected

### Latency Metrics
- Average latency (ms)
- Min/Max latency (ms)
- P95 latency (ms)
- P99 latency (ms)
- Sample size

### Reliability Metrics
- Error rate (%)
- Uptime (%)
- Throughput (req/s)

### Concurrency Metrics
- Tested concurrency levels
- Maximum supported concurrency

## Data Storage

Metrics are stored in:
```
data/
  metrics/
    metrics-db.json
```

Structure:
```json
{
  "providers": {
    "heygen": {
      "latest": [...],
      "history": [[...], [...]],
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
  },
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

## API Keys

For API testing, set environment variables:
- `HEYGEN_API_KEY` - For HeyGen API testing
- `HUME_API_KEY` - For Hume API testing
- (Add others as needed)

## Best Practices

1. **Respect Rate Limits**: Don't overwhelm provider servers
2. **Handle Errors Gracefully**: Some providers may block scrapers
3. **Use Fallbacks**: Default estimates when scraping fails
4. **Regular Updates**: Run collection periodically (daily/weekly)
5. **Validate Data**: Check for outliers and anomalies

## Future Enhancements

- [ ] Reddit/Stack Overflow scraping for community metrics
- [ ] Real-time monitoring integration
- [ ] Historical trend analysis
- [ ] Automated anomaly detection
- [ ] Integration with existing API calls in codebase

