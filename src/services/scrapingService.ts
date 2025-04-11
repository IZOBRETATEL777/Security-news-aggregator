
import { chromium } from "playwright";
import LLMScraper from "llm-scraper";
import { groq } from "@ai-sdk/groq";
import { CONFIG } from "./../configs/configProvider.ts";
import { type News } from "../dao/db";
import { z } from "zod";

const summarySchema = z.object({
    top: z
        .array(
            z.object({
                blurb: z.string().describe("Blurb of the story"),
            })
        )
        .length(1)
        .describe("Summary of the article"),
});

export async function enrichNewsWithSummaries(newsItems: News[]): Promise<News[]> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        locale: 'en-US',
    });

    const llm = groq(CONFIG.ai_model);
    const scraper = new LLMScraper(llm);

    const enrichedNews: News[] = [];

    for (const item of newsItems) {
        try {
            const page = await context.newPage();
            await page.goto(item.url, { waitUntil: "domcontentloaded" });
            await page.waitForTimeout(5000);
            const { data } = await scraper.run(page, summarySchema, {
                format: "text",
                prompt: "Give me a 3-sentence summary (blurb) of the following article.",
            });

            enrichedNews.push({
                ...item,
                summary: data.top[0].blurb,
            });

            await page.close();
        } catch (err) {
            console.error(`Failed to process ${item.url}:`, err);
            enrichedNews.push(item);
        }
    }

    await browser.close();
    return enrichedNews;
}
