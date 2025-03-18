# SRE Team News Feed

## Overview
SRE Team News Feed is a **news aggregator** designed to fetch security-related news from various sources, filter topics based on relevance, and provide a refined feed of cybersecurity updates. The aggregator processes RSS feeds, applies AI-based filtering, and delivers curated news articles.

## Setup

To install dependencies, run:

```bash
bun install
```

To run the aggregator, execute:

```bash
bun start
```

## Configuration
The aggregator is configurable via a config.yml file and environment variables.

### Config File (config.yml)
The configuration file defines the aggregator's behavior. Below are the available options:


| Parameter                  | Type                   | Required? | Default Value                          | Description |
|----------------------------|-----------------------|-----------|----------------------------------------|-------------|
| **`feeds`**                | `array<string>`       | ✅ Yes    | *None*                                 | List of RSS feed sources. |
| **`topics`**               | `array<string>`       | ✅ Yes    | *None*                                 | List of prioritized cybersecurity topics. |
| **`data_period`**          | `string \| object`    | ✅ Yes    | *None*                                 | Defines the article time range. Can be `"today"`, `"this_week"`, `"previous_week"`, or a date `range`. |
| **`data_period.range.startDate`** | `string (YYYY-MM-DD)` | ❌ No | *None* | Start date for custom range (optional). |
| **`data_period.range.endDate`**   | `string (YYYY-MM-DD)` | ❌ No | *None* | End date for custom range (optional). |
| **`exclude_topics`**       | `array<string>`       | ❌ No     | `[]` (empty array)                     | List of topics to be excluded. |
| **`max_articles`**         | `integer`             | ❌ No     | `20`                                    | Maximum number of articles to process per run. Must be a positive integer. |
| **`ai_model`**             | `string`              | ❌ No     | `"deepseek-r1-distill-llama-70b"`      | AI model used for processing articles. |
| **`refresh_rate_minutes`** | `integer`             | ❌ No     | `60`                                   | Time interval (in minutes) between news fetches. Must be a positive integer. |


### Environment Variables
The aggregator requires the following environment variables:

```bash
GROQ_API_KEY=<your_groq_api_key>
UPSTASH_REDIS_REST_URL=<your_upstash_redis_url>
UPSTASH_REDIS_REST_TOKEN=<your_upstash_redis_token
UPSTASH_REDIS_REST_KEY=<your_upstash_redis_key, default - 'news'>
```

## Contribution
Contributions are welcome! Feel free to submit issues or pull requests.
