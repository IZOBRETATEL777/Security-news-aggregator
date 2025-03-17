import { parse } from "yaml";
import { z } from "zod";
import { fetchTodaysRSS, fetchRangeDateRSS, fetchRSS } from "./rss";
import { createNewsSchema, kv, newsFactory, type News } from "./db";
import { complete } from "./ai";
import dayjs from 'dayjs';

const yamlSchema = z.object({
    topics: z.array(z.string()).min(1),
    feeds: z.array(z.string()).min(1),
    data_period: z.union([
        z.object({
            range: z.object({
                startDate: z.string().date('Invalid start date format (YYYY-MM-DD)').optional(),
                endDate: z.string().date('Invalid end date format (YYY-MM-DD)').optional(),
            }),
        }),
        z.literal("today"),
        z.literal("this_week")
    ]),
    max_articles: z.number().int().positive().optional(),
});

const configPath = "./config.yaml";
const buffer = await Bun.file(configPath).text();
const config = yamlSchema.parse(parse(buffer));

const topicsJoined = config.topics.join("\n");


async function getOldNews() {
    const news = await kv.hgetall("news");
    if (news === null) {
        return [];
    }
    return Object.values(news) as News[];
}

async function getRssFeed(url: string) {
    const fetchPeriod = config.data_period;
    if (fetchPeriod === "today") {
        return fetchTodaysRSS(url);
    } else if (typeof fetchPeriod === "object" && "range" in fetchPeriod) {
        const { startDate, endDate } = fetchPeriod.range;
        const start = dayjs(startDate).toDate();
        const end = dayjs(endDate).toDate();
        return await fetchRangeDateRSS(url, start, end);
    }
    else if (fetchPeriod === "this_week") {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay()));
        return await fetchRangeDateRSS(url, start, end);
    } else {
        return await fetchRSS(url);
    }
};

export async function processor() {
    // Fetch news from RSS feeds to one array
    const news: News[] = [];
    for (const url of config.feeds) {
        const rss = await getRssFeed(url);
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

    console.log(news);

    const oldNews = await getOldNews();
    news.push(...oldNews);

    const result = await complete(news, topicsJoined, config.max_articles || 20);

    // Save the news items to the database
    const grouped = result.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
    }, {} as Record<string, News>);

    await kv.hset("news", grouped);

}