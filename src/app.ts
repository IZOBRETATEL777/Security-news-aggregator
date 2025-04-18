import { NewsComponent } from "./resources/components/News.tsx";
import { getNews, reduceNews, processor } from "./workers/worker.ts";
import { REFRESH_RATE_MINUTES } from "./configs/configProvider.ts";
import { enrichNewsWithSummaries } from "./services/scrapingService.ts";

const entry = await Bun.file('src/resources/index.html').text();
const [part1, part2] = entry.split("<!--entry-->");

await processor();
setInterval(processor, 1000 * 60 * REFRESH_RATE_MINUTES);

const server = Bun.serve({
    idleTimeout: 255,
    async fetch(req) {
        const url = new URL(req.url);
        const path = decodeURIComponent(url.pathname);

        // Health check
        if (path === "/health") {
            return Response.json({
                status: "ok",
                timestamp: new Date().toISOString(),
            });
        }

        // Main page with news
        if (path === "/") {
            const count = parseInt(url.searchParams.get("count") || "0");
            const isSummary = url.searchParams.get("summary") === "true";

            const readableStream = new ReadableStream({
                async start(controller) {
                    try {
                        controller.enqueue(part1);
                        controller.enqueue(`<tbody id="news-body">`);
                        controller.enqueue(`<tr id="loader"><td>Loading...</td></tr>`);



                        let news: any[] = [];
                        news = count >= 5 ? await reduceNews(count) : await getNews();
                        if (isSummary && news.length >= 5) {
                            console.log("Enriching news with summaries...");
                            news = await enrichNewsWithSummaries(news);
                        }

                        const html = NewsComponent({ news }, isSummary);

                        controller.enqueue(html.join(''));
                        controller.enqueue(`<script>document.getElementById("loader").remove();</script>`);
                        controller.enqueue(`<script>document.getElementById("newsCount").value = ${html.length};</script>`);
                        controller.enqueue(`</tbody>`);
                        controller.enqueue(part2);
                        controller.close();
                    } catch (error) {
                        console.error("Stream error:", error);
                        controller.enqueue(`<tr><td colspan="100%">Error loading news.</td></tr>`);
                        controller.enqueue(part2);
                        controller.close();
                    }
                }
            });

            return new Response(readableStream, {
                headers: {
                    "Content-Type": "text/html",
                    "Cache-Control": "no-cache",
                },
            });
        }

        // Static files from /src/resources/*
        try {
            const safePath = path.replace(/\.\./g, "");
            const filePath = `src/resources${safePath}`;
            const file = Bun.file(filePath);

            if (!(await file.exists())) throw new Error("Not Found");

            return new Response(file, {
                headers: {
                    "Content-Type": getContentType(filePath),
                    "Cache-Control": "max-age=3600"
                }
            });
        } catch (e) {
            console.warn(`404: ${path}`);
            return new Response("Not Found", { status: 404 });
        }
    },
});

function getContentType(path: string): string {
    if (path.endsWith(".js")) return "application/javascript";
    if (path.endsWith(".css")) return "text/css";
    if (path.endsWith(".html")) return "text/html";
    return "application/octet-stream";
}

console.log(`🚀 Bun server running on ${server.url.href}`);
