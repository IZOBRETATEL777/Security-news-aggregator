import { NewsComponent } from "../../components/News.tsx";
import { processor, reduceNews } from "./../worker.ts";
import { REFRESH_RATE_MINUTES } from "./../configs/configProvider.ts";
import { NewsService } from "./../services/newsService.ts";
import { container } from "../configs/ioc.ts";
import type { News } from "../db.ts";

const entry = await Bun.file('./index.html').text();
const [beforeTable, part1, part2] = entry.split("<!--entry-->");

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
            async GET() {
                const readableStream = new ReadableStream({
                    async start(controller) {
                        const allNews = await getNews();
                        const totalCount = allNews.length;

                        controller.enqueue(beforeTable);

                        // Inject filter controls and script
                        controller.enqueue(`
                            <div style="margin-bottom: 1rem;">
                                <label for="newsRange">Select number of news to display: <span id="rangeVal">5</span></label>
                                <input type="range" id="newsRange" min="5" max="${totalCount}" value="5" />
                                <button id="applyFilter">Apply</button>
                            </div>

                            <script>
                                const range = document.getElementById("newsRange");
                                const output = document.getElementById("rangeVal");
                                range.oninput = () => output.textContent = range.value;

                                document.getElementById("applyFilter").onclick = async () => {
                                    const res = await fetch('/filter?count=' + range.value);
                                    const data = await res.text();
                                    const tbody = document.getElementById("news-body");
                                    if (tbody) {
                                        tbody.innerHTML = data;
                                    }
                                };
                            </script>
                        `);

                        controller.enqueue(part1);

                        // Wrap your dynamic content in a tbody with ID
                        controller.enqueue(`<tbody id="news-body">`);
                        controller.enqueue(`<tr id="loader"><td>Loading...</td></tr>`);

                        const newss = NewsComponent({ news: allNews }).join("\n");
                        controller.enqueue(newss);

                        controller.enqueue(`<script>document.getElementById("loader").remove();</script>`);
                        controller.enqueue(`</tbody>`); // Close the injected tbody

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
        "/filter": {
            async GET(req) {
                const url = new URL(req.url);
                const count = parseInt(url.searchParams.get("count") || "5");

                // reduceNews should return a Promise<News[]>
                const reduced = await reduceNews(count);
                const html = NewsComponent({ news: reduced }).join("\n");

                return new Response(html, {
                    headers: {
                        "Content-Type": "text/html",
                        "Cache-Control": "no-cache"
                    }
                });
            }
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
