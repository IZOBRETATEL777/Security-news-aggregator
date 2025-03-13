import { parse } from "yaml";
import { z } from "zod";
import { fetchTodaysRSS } from "./rss";
import { createNewsSchema, kv, newsFactory, type News } from "./db";
import { complete } from "./ai";

const yamlSchema = z.object({
    topics: z.array(z.string()).min(1),
    feeds: z.array(z.string()).min(1),
});

const configPath = "./config.yaml";
const buffer = await Bun.file(configPath).text();
const config = yamlSchema.parse(parse(buffer));

const topicsJoined = config.topics.join("\n");

async function main() {
    // Fetch news from RSS feeds to one array
    const news: News[] = [];
    for (const url of config.feeds) {
        const rss = await fetchTodaysRSS(url);
        for (const item of rss.items) {
            const res = createNewsSchema.safeParse(item);

            if (!res.success) {
                console.error(res.error.flatten().fieldErrors);
                continue;
            };

            const newsItem = newsFactory(res.data);
            news.push(newsItem);
        }
    }

    const result = await complete(news, topicsJoined);

    // Save the news items to the database
    const grouped = result.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
    }, {} as Record<string, News>);
    
    await kv.hset("news", grouped);

}

main()
setInterval(main, 1000 * 60 * 60);

const server = Bun.serve({
    port: 9090,
    routes: {
        "/health": {
            async GET(req) {
                return Response.json({
                    status: "ok",
                    timestamp: new Date().toISOString(),
                })
            }
        },
    },
    fetch() {
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`🚀 Health check running on ${server.url.href}health`);
