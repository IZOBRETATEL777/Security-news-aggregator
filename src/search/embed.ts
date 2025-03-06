import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { kv, type News } from "../db";
import { parse } from "yaml";
import { z } from "zod";
import { Index } from "@upstash/vector"

const index = new Index<{ title: string, link: string }>();

const yamlSchema = z.object({
    topics: z.array(z.string()).min(1),
    feeds: z.array(z.string()).min(1),
});

const configPath = "./config.yaml";
const buffer = await Bun.file(configPath).text();
const config = yamlSchema.parse(parse(buffer));

const embedder = openai.embedding("text-embedding-3-small");

const items = config.feeds.map((e) => `news:${e}`)

for (const item of [items[0]]) {
    const news = await kv.hgetall<Record<string, News>>(item);
    
    if (!news) continue;
    
    const newsArray = Object.values(news);
    const newsItems = newsArray.map((e) => e.title);

    const { embeddings } = await embedMany({
        model: embedder,
        values: newsItems,
    })

    await index.upsert(newsArray.map((e, i) => ({ metadata: e, vector: embeddings[i], id: crypto.randomUUID() })));
}
