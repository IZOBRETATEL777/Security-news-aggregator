import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai";
import type { News } from "./db";
import { z } from "zod";

const templatePrompt = (news: string, topics: string, newsItemLimit: number) => `
Analyze the following news items and identify the most relevant ones based on the given security topics.

News:${news}

Topics:${topics}

Instructions:

Select the top ${newsItemLimit} relevant news items.

Exclude ads and promotional content.

Focus on security insights, risks, incidents, and best practices.

Return only the IDs of the top ${newsItemLimit} news items.
`;

export async function complete(newsItems: News[], topicsJoined: string, newsItemLimit: number, aiModel: string): Promise<News[]> {
    const formattedNews = newsItems
        .map((item) => `ID:${item.id}; Title: ${item.title}`)
        .join("\n\n");

    const { object } = await generateObject({
        model: groq(aiModel),
        maxRetries: 3,
        schema: z.object({
            answers: z.array(
                z.object({
                    id: z.string().describe("ID of the news item"),
                    keywords: z.array(z.string()).describe("Keywords of this news item"),
                })
            )
        }),
        prompt: templatePrompt(formattedNews, topicsJoined, newsItemLimit),
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
            return {
                ...item,
            }
        });
}