import { Redis } from "@upstash/redis";
import { z } from "zod";

export const kv = Redis.fromEnv();

export const newsSchema = z.object({
    title: z.string(),
    link: z.string().url(),
});

export type News = z.infer<typeof newsSchema>

const getId = () => crypto.randomUUID();

class NewsRepository {
    constructor(private kv: Redis) {}

    addNews(news: News) {
        const id = getId();
        const key = `news`;
        return this.kv.hset(key, {[id]: news});
    }

    getOneNews(id: string) {
        return this.kv.hget<News>(`news`, id);
    }

    getAllNews() {
        return this.kv.hgetall<News>(`news`);
    }

    deleteNews(id: string) {
        return this.kv.hdel(`news`, id);
    }
}

export const newsRepository = new NewsRepository(kv);