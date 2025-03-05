import { Index } from "@upstash/vector";
import { openai } from "@ai-sdk/openai"
import { embed, generateText } from "ai";

const embedder = openai.embedding("text-embedding-3-small");
const chat = openai.chat("gpt-4o-mini");

const index = new Index<{ title: string, link: string }>();

const vapros = "MAGA cybersec news";

const { embedding } = await embed({
    model: embedder,
    value: vapros,
})

const results = await index.query({
    topK: 5,
    vector: embedding,
    includeMetadata: true,
    includeVectors: false
})

console.log(results.map(e => ({score: e.score, title: e.metadata?.title})))
const titles = results.map(e => e.metadata?.title)

const prompt = `
    You are an AI cybersecurity search engine bot who answers questions about cybersecurity news.
    Here is the user question: ${vapros}

    Use the following news articles to answer the user question:
    ${titles.join("\n")}
`

const { text } = await generateText({
    model: chat,
    prompt: prompt
})

console.log(text)