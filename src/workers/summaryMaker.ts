import { container } from '../configs/ioc';
import type { News } from '../dao/db.ts';
import { NewsService } from '../services/newsService.ts';

export async function fetchSummary(): Promise<News[]> {
    const newsServiceRepo = container.resolve<NewsService>(NewsService);
    console.log("Enriching news with summaries...");
    return newsServiceRepo.enrichNewsWithSummaries(await newsServiceRepo.getNews());
}

export async function fetchNSummary(news: News[]): Promise<News[]> {
    const newsServiceRepo = container.resolve<NewsService>(NewsService);
    console.log("Enriching news with summaries...");
    return newsServiceRepo.enrichNewsWithSummaries(news);
}