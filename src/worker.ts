import { fetchRangeDateRSS } from "./services/rss";
import { createNewsSchema, newsFactory, type News } from "./db";
import { complete, initTemplate, reducedTemplate } from "./services/ai";
import { getLatestDateAndOldestDate, getStartEndDate, TOPICS_EXCLUDED, TOPICS_JOINED} from "./configs/configProvider";
import { Cron } from "croner";
import { sendNews } from "./services/mailsandage";
import { NewsService } from "./services/newsService";
import { CONFIG } from "./configs/configProvider";
import { container } from "./configs/ioc";

export async function processor() {
    const { start, end } = await getStartEndDate();
    const newsService = container.resolve<NewsService>(NewsService.name);
    // Fetch news from RSS feeds to one array
    const news: News[] = [];
    for (const url of CONFIG.feeds) {
        const rss = await fetchRangeDateRSS(url, start, end);
        for (const item of rss.items) {
            const res = createNewsSchema.safeParse(item);
            if (!res.success) {
                console.error(res.error.flatten().fieldErrors);
                continue;
            };

            const newsItem = newsFactory(res.data);
            news.push(newsItem);
        }
    }

    const oldNews = await newsService.getNews();
    const { oldestDate, latestDate } = await getLatestDateAndOldestDate();

    const datedNews = await dated_merge(oldNews, news, oldestDate, latestDate);

    await newsService.deleteAllNews();

    if (datedNews.length > 0) {
        // Process the news items with AI model
        const result = await complete(datedNews, TOPICS_EXCLUDED, TOPICS_JOINED, CONFIG.max_articles, CONFIG.ai_model, initTemplate);
        await newsService.saveNews(result)
    }

}

export async function reduceNews(count: number): Promise<News[]> {
    const newsService = container.resolve<NewsService>(NewsService.name);
    const news = await newsService.getNews();
    const { oldestDate, latestDate } = await getLatestDateAndOldestDate();
    const reducedNews = news.filter((news) => news.published >= oldestDate && news.published <= latestDate);
    const result = await complete(reducedNews, TOPICS_EXCLUDED, TOPICS_JOINED, count, CONFIG.ai_model, reducedTemplate);
    return result;
}

async function dated_merge(oldNews: News[], newNews: News[], oldestDate: Date, latestDate: Date): Promise<News[]> {
    const newsMap = new Map<string, News>();

    for (const news of newNews) {
        newsMap.set(news.id, news);
    }
    for (const news of oldNews) {
        if (news.published <= latestDate && news.published >= oldestDate) {
            newsMap.set(news.id, news);
        }
    }

    return Array.from(newsMap.values()).sort();
}

export const emailConfig = CONFIG.email_notifications;

if (emailConfig.enabled) {
    const cron = new Cron(emailConfig.cron, sendNews);
    console.log(`Email notifications enabled. ${cron.getPattern()}`);
    cron.trigger();
}
