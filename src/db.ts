import { Redis } from "@upstash/redis";
import { z } from "zod";

export const kv = Redis.fromEnv();

export const newsSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    link: z.string().url(),
});
export const createNewsSchema = newsSchema.omit({ id: true });

export type News = z.infer<typeof newsSchema>;
export type CreateNewsDTO = z.infer<typeof createNewsSchema>;

export const newsFactory = (dto: CreateNewsDTO): News => ({
    id: crypto.randomUUID(),
    ...dto
});