import { kv, newsSchema, sort, type News } from "./db";
import { z } from "zod";
import NewsComponent from "../components/News.tsx";
import { processor, REFRESH_RATE_MINUTES, REDIS_KEY } from "./worker.ts";

const entry = await Bun.file('./index.html').text();

const [part1, part2] = entry.split("<!--entry-->");

const getNews = async (): Promise<News[]> => {
    try {
        const newsData = await kv.hgetall(REDIS_KEY);

        if (!newsData) return [];

        const newsArray = Object.entries(newsData).map(([key, value]) => {
            const parsedValue = typeof value === "string" ? JSON.parse(value) : value;

            return {
                id: key,
                ...parsedValue,
                published: new Date(parsedValue.published)
            };
        });

        const result = z.array(newsSchema).safeParse(newsArray);
        if (!result.success) {
            console.error("News data validation failed:", result.error.format());
            return [];
        }

        return result.data.sort(sort);
    } catch (error) {
        console.warn(error);
        return [];
    }
};

processor();
setInterval(processor, 1000 * 60 * REFRESH_RATE_MINUTES);

const server = Bun.serve({
    idleTimeout: 20,
    routes: {
        "/": {
            async GET() {
                const readableStream = new ReadableStream({
                    async start(controller) {
                        controller.enqueue(part1);
                        controller.enqueue(`<tr id="loader"> <td>Loading...</td> </tr>`);
                        const news = await getNews();
                        const newss = NewsComponent({ news }).join("\n");
                        controller.enqueue(newss);
                        controller.enqueue(`<script>document.getElementById("loader").remove();</script>`);
                        controller.enqueue(part2);
                        controller.close();
                    },
                });

                return new Response(readableStream, {
                    headers: {
                        "Content-Type": "text/html",
                        "Cache-Control": "no-cache"
                    }
                });
            },
        },
        "/health": {
            async GET() {
                return Response.json({
                    status: "ok",
                    timestamp: new Date().toISOString(),
                })
            }
        },
    },
    fetch() {
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`🚀 Bun server running on ${server.url.href}`);
