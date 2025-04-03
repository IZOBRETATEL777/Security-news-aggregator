import { NewsComponent } from "../../components/News.tsx";
import { processor, reduceNews } from "./../worker.ts";
import { REFRESH_RATE_MINUTES } from "./../configs/configProvider.ts";
import { NewsService } from "./../services/newsService.ts";
import { container } from "../configs/ioc.ts";
import type { News } from "../db.ts";

const entry = await Bun.file('./index.html').text();
const [part1, part2] = entry.split("<!--entry-->");

processor();
setInterval(processor, 1000 * 60 * REFRESH_RATE_MINUTES);

export async function getNews(): Promise<News[]> {
    const newsService = container.resolve<NewsService>(NewsService.name);
    const news = await newsService.getNews();
    return news;
};

const server = Bun.serve({
    idleTimeout: 20,
    routes: {
        "/": {
            async GET(req) {
                const url = new URL(req.url);
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

                        controller.enqueue(`<script>
                            document.getElementById("newsCount").value = ${newsComponent.length};
                        </script>`);

                        controller.enqueue(`</tbody>`);
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
                });
            }
        },
    },
    fetch() {
        return new Response("Not Found", { status: 404 });
    },
});

console.log(`🚀 Bun server running on ${server.url.href}`);
