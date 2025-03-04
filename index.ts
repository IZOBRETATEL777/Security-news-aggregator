import { readFileSync } from "fs";
import { parse } from "yaml";
import { XMLParser } from "fast-xml-parser";

// Read YAML config
const configPath = "./config.yaml";
const config = parse(readFileSync(configPath, "utf-8"));

// RSS Parser
const parser = new XMLParser({ ignoreAttributes: false });

async function fetchRSS(url: string) {
  try {
    console.log(`Fetching: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}`);

    const xmlData = await response.text();
    const json = parser.parse(xmlData);
    const items = json.rss?.channel?.item || json.feed?.entry || [];

    console.log(`\nNews from ${url}:\n`);
    items.forEach((item: any, index: number) => {
      const title = item.title || "No title";
      const link = item.link?.["@_href"] || item.link || "No link";
      console.log(`${index + 1}. ${title}\n   ${link}`);
    });
    console.log("\n----------------------------------\n");
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
  }
}

(async () => {
  for (const url of config.feeds) {
    await fetchRSS(url);
  }
})();
