import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai";
import type { News } from "../dao/db";
import { z } from "zod";

export const initTemplate = (news: string, topics: string, irrelevantTopics: string, newsItemLimit: number) => `
Analyze the news items and identify the most relevant ones based on the given security topics.

News: ${news}

Relevant Topics: ${topics}

Exclude news items related to: ${irrelevantTopics}

Select the top ${newsItemLimit} relevant items.

Return only their IDs.
`;

export const reducedTemplate = (news: string, topics: string, irrelevantTopics: string, newsItemLimit: number) => `
Imagine you are a PR expert. You are given a list of news items and a list of security topics. Your task is to identify the most interesting and relevant news items based on the given topics.

Relevant Topics: ${topics}

News: ${news}

Give exactly ${newsItemLimit} news items.

Return only their IDs.
`;


export async function complete(newsItems: News[], topicsJoined: string, excludeTopicsJoined: string, newsItemLimit: number, aiModel: string, templatePrompt: ((arg0: string, arg1: string, arg2: string, arg3: number) => string) ): Promise<News[]> {
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
        prompt: templatePrompt(formattedNews, topicsJoined, excludeTopicsJoined, newsItemLimit),
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