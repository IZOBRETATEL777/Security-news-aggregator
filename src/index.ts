import { parse } from "yaml";
import { set, z } from "zod";
import { fetchRSS } from "./rss";
import { kv, newsSchema, type News } from "./db";
import { complete } from "./ai";

const yamlSchema = z.object({
    topics: z.array(z.string()).min(1),
    feeds: z.array(z.string()).min(1),
});

const configPath = "./config.yaml";
const buffer = await Bun.file(configPath).text();
const config = yamlSchema.parse(parse(buffer));

const topicsJoined = config.topics.join("\n");

async function main() {
    console.log(config.feeds)
    for (const url of config.feeds) {

        const rss = await fetchRSS(url);

        const news = newsSchema.array().parse(rss.items);

        const result = await complete(news, topicsJoined);

        const relevantResults = result
            .map(e => {
                const hasher = new Bun.SHA256();
                return ({ ...e, hash: hasher.update(`${e.title} ${e.link}`).digest('hex') })
            })
            .filter(e => Boolean(e));

        console.log(relevantResults)
        const final: Record<string, News> = {}
        
        relevantResults.forEach(e => {
            final[e.hash] = e;
        });

        await kv.hset(`news:${url}`, final);
    }
}

await main();
setInterval(main, 1000 * 60 * 60);