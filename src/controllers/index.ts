import {  NewsComponent } from "../../components/News.tsx";
import { processor } from "./../worker.ts";
import { REFRESH_RATE_MINUTES } from "./../configs/configProvider.ts";
import { NewsService } from "./../services/newsService.ts";
import { container } from "../configs/ioc.ts";

const entry = await Bun.file('./index.html').text();

const [part1, part2] = entry.split("<!--entry-->");
const [part3, part4] = part2.split("<!-- limit_scale -->");

processor();
setInterval(processor, 1000 * 60 * REFRESH_RATE_MINUTES);

const getNews = async () => {
    const newsService = container.resolve<NewsService>(NewsService.name);
    const news = await newsService.getNews();
    return news;
};

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
