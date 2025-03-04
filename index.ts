import { readFileSync } from "fs";
import { parse } from "yaml";
import { XMLParser } from "fast-xml-parser";
import Groq from "groq-sdk";

// Connect to Groq API
const client = new Groq();

// Read YAML config
const configPath = "./config.yaml";
const config = parse(readFileSync(configPath, "utf-8"));
const topics = config.topics.join("\n");

// RSS Parser
const parser = new XMLParser({ ignoreAttributes: false });

async function analyzeBatchWithAI(newsItems: { title: string; description: string; link: string }[]) {
  try {
    if (newsItems.length === 0) return [];

    const formattedNews = newsItems
      .map((item, index) => `#${index + 1} Title: ${item.title}\nDescription: ${item.description}`)
      .join("\n\n");

    const prompt = `
      Analyze the following news headlines and descriptions:
      ${formattedNews}

      Determine which news items are relevant based on the following topics:
      ${topics}

      Reply in the format:
      - #1 YES
      - #2 NO
      - #3 YES
      (Only provide YES or NO responses without explanation)
    `;

    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "deepseek-r1-distill-llama-70b",
    });

    const responseText = chatCompletion.choices[0]?.message?.content?.trim() || "";
    
    // Parse AI response and determine relevance
    const relevanceResults = new Map<number, boolean>();
    responseText.split("\n").forEach((line) => {
      const match = line.match(/- #(\d+) (YES|NO)/);
      if (match) {
        const index = parseInt(match[1], 10) - 1; // Convert to zero-based index
        const isRelevant = match[2].toUpperCase() === "YES";
        relevanceResults.set(index, isRelevant);
      }
    });

    return relevanceResults;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return new Map(); // Return an empty map in case of failure
  }
}

async function fetchRSS(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);

    const xmlData = await response.text();
    const json = parser.parse(xmlData);
    const items = json.rss?.channel?.item || json.feed?.entry || [];

    if (items.length === 0) return;

    const newsItems = items.map((item: any) => ({
      title: item.title || "No title",
      description: item.description || "",
      link: item.link?.["@_href"] || item.link || "No link",
    }));

    // Send batch request for analysis
    const relevanceResults = await analyzeBatchWithAI(newsItems);

    // Log only relevant news
    newsItems.forEach((item, index) => {
      if (relevanceResults.get(index)) {
        console.log(`✅ ${item.title}`);
        console.log(`   🔗 ${item.link}\n`);
      }
    });

  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
  }
}

// Fetch and analyze all feeds
(async () => {
  for (const url of config.feeds) {
    await fetchRSS(url);
  }
})();
