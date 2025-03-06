import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai";
import type { News } from "./db";
import { z } from "zod";

const deepseek = groq("deepseek-r1-distill-llama-70b");

const NEWS_ITEMS_LIMIT = 20;

const templatePrompt = (news: string, topics: string) => `
      Analyze the following news headlines and descriptions:
      ${news}

      Determine which news items are relevant based on the following topics:
      ${topics}

      Give me top ${NEWS_ITEMS_LIMIT} IDs of news items that are relevant to the topics.
    `

export async function complete(newsItems: News[], topicsJoined: string) {
    const formattedNews = newsItems
        .map((item) => `ID:${item.id}; Title: ${item.title}`)
        .join("\n\n");

    const { object } = await generateObject({
        model: deepseek,
        maxRetries: 3,
        schema: z.object({
            answers: z.array(
                z.object({
                    id: z.string().uuid().describe("ID of the news item"),
                    keywords: z.array(z.string()).describe("Keywords of this news item"),
                })
            )
        }),
        prompt: templatePrompt(formattedNews, topicsJoined),
    })
    // Return news items whose IDs are in object.answers
    return newsItems
        .filter((item) => object.answers.findIndex((answer) => answer.id === item.id) !== -1)
        .map((item) => {
            const answer = object.answers.find((answer) => answer.id === item.id);

            return {
                ...item,
                keywords: answer?.keywords || [],
            }
        }).map(item => {
            const sha = new Bun.SHA256();
            const hash = sha.update(`${item.link}-${item.title}`).digest("hex");
            
            return {
                ...item,
                hash,
            }
        });
}