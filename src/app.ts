import { NewsComponent } from "./resources/components/News.tsx";
import { getNews, reduceNews, processor } from "./workers/worker.ts";
import { REFRESH_RATE_MINUTES } from "./configs/configProvider.ts";

const entry = await Bun.file('src/resources/index.html').text();
const [part1, part2] = entry.split("<!--entry-->");

await processor();
setInterval(processor, 1000 * 60 * REFRESH_RATE_MINUTES);

const server = Bun.serve({
    idleTimeout: 20,
    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;

        // 1. Health check route
        if (path === "/health") {
            return Response.json({
                status: "ok",
                timestamp: new Date().toISOString(),
            });
        }

        // 2. Main HTML route with news streaming
        if (path === "/") {
            const count = parseInt(url.searchParams.get("count") || "0");

            const readableStream = new ReadableStream({
                async start(controller) {
                    controller.enqueue(part1);
                    controller.enqueue(`<tbody id="news-body">`);
                    controller.enqueue(`<tr id="loader"><td>Loading...</td></tr>`);

                    let newsComponent: string[];
                    if (count >= 5) {
                        newsComponent = NewsComponent({ news: await reduceNews(count) });
                    } else {
                        newsComponent = NewsComponent({ news: await getNews() });
                    }

                    controller.enqueue(newsComponent.join(''));
                    controller.enqueue(`<script>document.getElementById("loader").remove();</script>`);
                    controller.enqueue(`<script>document.getElementById("newsCount").value = ${newsComponent.length};</script>`);
                    controller.enqueue(`</tbody>`);
                    controller.enqueue(part2);
                    controller.close();
                }
            });

            return new Response(readableStream, {
                headers: {
                    "Content-Type": "text/html",
                    "Cache-Control": "no-cache"
                }
            });
        }

        // 3. Static file handling (e.g., index.js, styles.css)
        try {
            const file = Bun.file(`src/resources${path}`);
            if (!(await file.exists())) throw new Error("Not Found");

            return new Response(file, {
                headers: {
                    "Content-Type": getContentType(path),
                    "Cache-Control": "max-age=3600"
                }
            });
        } catch {
            return new Response("Not Found", { status: 404 });
        }
    },
});

function getContentType(path: string): string {
    if (path.endsWith(".js")) return "application/javascript";
    if (path.endsWith(".css")) return "text/css";
    if (path.endsWith(".html")) return "text/html";
    if (path.endsWith(".json")) return "application/json";
    if (path.endsWith(".svg")) return "image/svg+xml";
    if (path.endsWith(".png")) return "image/png";
    if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
    return "application/octet-stream";
}

console.log(`🚀 Bun server running on ${server.url.href}`);
