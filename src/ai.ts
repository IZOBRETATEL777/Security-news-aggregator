import { groq } from "@ai-sdk/groq"
import { generateObject, generateText } from "ai";
import type { News } from "./db";
import { z } from "zod";

const deepseek = groq("deepseek-r1-distill-llama-70b");

const templatePrompt = (news: string, topics: string) => `
      Analyze the following news headlines and descriptions:
      ${news}

      Determine which news items are relevant based on the following topics:
      ${topics}
    `

export async function complete(newsItems: News[], topicsJoined: string) {
    const formattedNews = newsItems
        .map((item, index) => `#${index + 1} Title: ${item.title}`)
        .join("\n\n");

    const { object, providerMetadata } = await generateObject({
        model: deepseek,
        schema: z.object({
            answers: z.array(
                z.object({
                    isRelevant: z.boolean().describe("Is the news item relevant?"),
                    keywords: z.array(z.string()).describe("Keywords of this news item"),
                })
            ).length(newsItems.length).describe(`overall summarization of news items, size: ${newsItems.length}`),
        }),
        prompt: templatePrompt(formattedNews, topicsJoined),
    })

    return newsItems.map((item, index) => ({ ...item, aiSuggestion: object.answers[index] }));
}