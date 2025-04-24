import { z } from "zod";

export const yamlSchema = z.object({
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
    request_rate_mseconds: z.number().int().positive().optional().default(1000),

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