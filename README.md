# Security News Feed

## Overview
**Security News Feed** is a **news aggregator** designed to fetch cybersecurity news from various sources, filter topics based on relevance, and deliver curated content. It processes RSS feeds, applies AI-based filtering, and uses Redis for storage.

---

## 🛠️ Setup

Install dependencies:
```bash
bun install
```

Run the aggregator:
```bash
bun start
```

---

## ⚙️ Configuration

The aggregator is configured using a `config.yml` file and environment variables.

### config.yml Options

| Parameter                  | Type                   | Required? | Default Value                          | Description |
|---------------------------|------------------------|-----------|----------------------------------------|-------------|
| **`feeds`**               | `array<string>`        | ✅ Yes    | *None*                                 | List of RSS feed sources. |
| **`topics`**              | `array<string>`        | ✅ Yes    | *None*                                 | List of prioritized cybersecurity topics. |
| **`data_period`**         | `string \| object`     | ✅ Yes    | *None*                                 | Defines article date range: `"today"`, `"this_week"`, `"previous_week"`, or a `range` object with `startDate` and `endDate`. Internally validated via `yamlSchema`. |
| **`data_period.range.startDate`** | `string (YYYY-MM-DD)` | ❌ No | *None*         | Start date for custom range. |
| **`data_period.range.endDate`**   | `string (YYYY-MM-DD)` | ❌ No | *None*         | End date for custom range. |
| **`exclude_topics`**      | `array<string>`        | ❌ No     | `[]`                                   | Topics to exclude from results. |
| **`max_articles`**        | `integer`              | ❌ No     | `20`                                   | Max number of articles per run. |
| **`ai_model`**            | `string`               | ❌ No     | `"deepseek-r1-distill-llama-70b"`     | AI model used for filtering. |
| **`refresh_rate_minutes`**| `integer`              | ❌ No     | `60`                                   | Interval between fetches (minutes). |
| **`email_notifications`** | `object`               | ❌ No     | `enabled: false`                       | Email notification settings. |

## 🌍 Environment Variables

The following environment variables are required:

```bash
GROQ_API_KEY=<your_groq_api_key>
UPSTASH_REDIS_REST_URL=<your_upstash_redis_url>
UPSTASH_REDIS_REST_TOKEN=<your_upstash_redis_token>
UPSTASH_REDIS_REST_KEY=<your_upstash_redis_key> # default: 'news'
```

If email notifications are enabled:
```bash
MAIL_HOST="<your_mail_provider>"
MAIL_USERNAME="<your_mail>"
MAIL_PASSWORD="<password>>"
```

---

## 🤝 Contribution

Contributions are welcome! Feel free to open issues or submit pull requests.