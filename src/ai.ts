import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai";
import type { News } from "./db";
import { z } from "zod";

const templatePrompt = (news: string, topics: string, newsItemLimit: number) => `
You are a news analyst preparing a security awareness news digest for employees. Your task is to analyze the following news headlines and descriptions:
News Items:
${news}

Determine which news items are relevant based on the following security-related topics:

Relevant Topics:
${topics}

Requirements:

Select the top ${newsItemLimit} most relevant news items based on their alignment with the specified topics.
Exclude advertisements and promotional content.
Focus on news that provides valuable security insights, trends, risks, incidents, or best practices.
Return only the IDs of the top ${newsItemLimit} relevant news items.
`

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