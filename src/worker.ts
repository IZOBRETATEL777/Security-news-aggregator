import { parse } from "yaml";
import { z } from "zod";
import { fetchTodaysRSS, fetchRangeDateRSS, fetchRSS } from "./rss";
import { createNewsSchema, kv, newsFactory, type News } from "./db";
import { complete } from "./ai";
import dayjs from 'dayjs';
import { Cron } from "croner";
import { sendNews } from "./mailsandage";

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
        z.literal("this_week"),
        z.literal("previous_week"),
    ]),
    exclude_topics: z.array(z.string()).optional().default([]),
    max_articles: z.number().int().positive().optional().default(20),
    ai_model: z.string().optional().default("deepseek-r1-distill-llama-70b"),
    refresh_rate_minutes: z.number().int().positive().optional().default(60),

    email_notifications: z.object({
        enabled: z.boolean(),
        subscribers: z.array(z.string().email()).optional().default([]),
        cron: z.string().regex(
            /^(\d+|\*) (\d+|\*) (\d+|\*) (\d+|\*) (\d+|\*)$/,
            "Invalid cron format (should be 'min hour day month weekday')"
        ),
    }).optional().default({
        enabled: false,
        subscribers: [],
        cron: "* * * * *",
    }),

});

const configPath = "./config.yaml";
const buffer = await Bun.file(configPath).text();
const config = yamlSchema.parse(parse(buffer));

const topicsJoined = config.topics.join("\n");
const excludeTopicsJoined = config.exclude_topics.join("\n");

export const REFRESH_RATE_MINUTES = config.refresh_rate_minutes;
export const REDIS_KEY = Bun.env.UPSTASH_REDIS_REST_KEY || "news";


async function getOldNews() {
    const news = await kv.hgetall(REDIS_KEY);
    if (news === null) {
        return [];
    }
    // change from date string to date object
    return Object.entries(news).map(([key, value]) => {
        const parsedValue = typeof value === "string" ? JSON.parse(value) : value;
        return {
            id: key,
            ...parsedValue,
            published: new Date(parsedValue.published)
        };
    });
}

async function getLatestDateAndOldestDate(): Promise<{ oldestDate: Date, latestDate: Date }> {
    const oldNews = new Date();
    const newNews = new Date();
    const fetchPeriod = config.data_period;

    if (fetchPeriod === "today") {
        return { oldestDate: oldNews, latestDate: newNews };
    }

    else if (typeof fetchPeriod === "object" && "range" in fetchPeriod) {
        const { startDate, endDate } = fetchPeriod.range;
        const start = dayjs(startDate).toDate();
        const end = dayjs(endDate).toDate();
        return { oldestDate: start, latestDate: end };
    }

    else if (fetchPeriod === "this_week") {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay()));
        return { oldestDate: start, latestDate: end };
    }

    else if (fetchPeriod === "previous_week") {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 7);
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay() - 7));
        return { oldestDate: start, latestDate: end };
    }

    else {
        return { oldestDate: oldNews, latestDate: newNews };
    }

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
    }
    else if (fetchPeriod === "previous_week") {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 7);
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay() - 7));
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

    const oldNews = await getOldNews();
    const { oldestDate, latestDate } = await getLatestDateAndOldestDate();

    const datedNews = await dated_merge(oldNews, news, oldestDate, latestDate);

    await kv.del(REDIS_KEY);

    if (datedNews.length > 0) {
        // Process the news items with AI model
        const result = await complete(datedNews, topicsJoined, excludeTopicsJoined, config.max_articles, config.ai_model);

        // Save the news items to the databases
        const grouped = result.reduce((acc, item) => {
            acc[item.id] = item;
            return acc;
        }, {} as Record<string, News>);

        await kv.hset(REDIS_KEY, grouped);
    }

}

async function dated_merge(oldNews: News[], newNews: News[], oldestDate: Date, latestDate: Date): Promise<News[]> {
    const newsMap = new Map<string, News>();

    for (const news of newNews) {
        newsMap.set(news.id, news);
    }
    for (const news of oldNews) {
        if (news.published <= latestDate && news.published >= oldestDate) {
            newsMap.set(news.id, news);
        }
    }

    return Array.from(newsMap.values()).sort();
}

export const emailConfig = config.email_notifications;

if (emailConfig.enabled) {
    const cron = new Cron(emailConfig.cron, sendNews);
    console.log(`Email notifications enabled. ${cron.getPattern()}`);
    cron.trigger();
}
