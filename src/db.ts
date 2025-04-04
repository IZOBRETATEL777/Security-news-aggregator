import { Redis } from "@upstash/redis";
import { z } from "zod";
import { container } from "./configs/ioc";

export const kv = Redis.fromEnv();

export const newsSchema = z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().url(),
    published: z.date(),
    keywords: z.array(z.string()).default([]),
});

export function sort(a: News, b: News) {
    return a.published > b.published ? -1 : 1;
}

export const createNewsSchema = newsSchema.omit({ id: true });

export type News = z.infer<typeof newsSchema>;
export type CreateNewsDTO = z.infer<typeof createNewsSchema>;

export const newsFactory = (dto: CreateNewsDTO): News => ({
    id: new Bun.SHA256().update(`${dto.url}-${dto.title}`).digest("hex"),
    ...dto
});

export interface BaseRepository<T, S> {
    find(): Promise<T[]>;
    findById(id: S): Promise<T | null>;
    saveNews(news: T[]): Promise<void>;
    deleteNewsIndex(): Promise<void>;
}

const REDIS_KEY = Bun.env.UPSTASH_REDIS_REST_KEY || "news";

export class KVRepository implements BaseRepository<News, string> {
    async find(): Promise<News[]> {
        const newsData = await kv.hgetall(REDIS_KEY);

        if (!newsData) return [];

        const newsArray = Object.entries(newsData).map(([key, value]) => {
            const parsedValue = typeof value === "string" ? JSON.parse(value) : value;

            return {
                id: key,
                ...parsedValue,
                published: new Date(parsedValue.published)
            };
        });

        const result = z.array(newsSchema).safeParse(newsArray);
        if (!result.success) {
            console.error("News data validation failed:", result.error.format());
            return [];
        }

        return result.data.sort(sort);
    }

    async findById(id: string): Promise<News | null> {
        const newsData = await kv.hget(REDIS_KEY, id);
        if (!newsData) return null;

        const result = newsSchema.safeParse(newsData);
        if (!result.success) {
            console.error("News data validation failed:", result.error.format());
            return null;
        }

        return result.data;
    }

    async saveNews(news: News[]): Promise<void> {
        const newsData = news.reduce((acc, item) => {
            acc[item.id] = JSON.stringify(item);
            return acc;
        }, {} as Record<string, string>);

        await kv.hmset(REDIS_KEY, newsData);
    }

    async deleteNewsIndex(): Promise<void> {
        await kv.del(REDIS_KEY)
    }

}

container.register("repo", new KVRepository());