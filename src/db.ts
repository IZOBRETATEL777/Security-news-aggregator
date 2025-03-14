import { Redis } from "@upstash/redis";
import { z } from "zod";

export const kv = Redis.fromEnv();

export const newsSchema = z.object({
    id: z.string(),
    title: z.string(),
    link: z.string().url(),
    isoDate: z.string().datetime(),
    keywords: z.array(z.string()).default([]),
});

export function sort(a: News, b: News) {
    const dateA = new Date(a.isoDate).getTime();
    const dateB = new Date(b.isoDate).getTime();
    return dateB - dateA;
}

export const createNewsSchema = newsSchema.omit({ id: true });

export type News = z.infer<typeof newsSchema>;
export type CreateNewsDTO = z.infer<typeof createNewsSchema>;

export const newsFactory = (dto: CreateNewsDTO): News => ({
    id: new Bun.SHA256().update(`${dto.link}-${dto.title}`).digest("hex"),
    ...dto
});