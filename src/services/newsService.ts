import { container } from '../configs/ioc';
import { type BaseRepository, type News } from '../dao/db';
import { complete } from './aiService';
import { initTemplate, reducedTemplate } from '../templates/aiTemplates';

export class NewsService {
    private repository = container.resolve<BaseRepository<News, string>>('repo');


    async getNews(): Promise<News[]> {
        return await this.repository.find();
    }

    async getNewsById(id: string): Promise<News | null> {
        return await this.repository.findById(id);
    }

    async getReducedNews(topicsJoined: string, excludeTopicsJoined: string, newsItemLimit: number, aiModel: string): Promise<News[]> {
        const news = await this.getNews();
        return await complete(news, topicsJoined, excludeTopicsJoined, newsItemLimit, aiModel, reducedTemplate);
    }

    async getRelevantNews(excluded_topics: string, topics: string, number: number, aiModel: string): Promise<News[]> {
        return await complete(await this.getNews(), topics, excluded_topics, number, aiModel, initTemplate);
    }

    async saveNews(news: News[]): Promise<void> {
        await this.repository.saveNews(news);
    }

    async setNews(news: News[]): Promise<void> {
        await this.deleteAllNews();
        await this.saveNews(news);
    }
        

    async deleteAllNews(): Promise<void> {
        await this.repository.deleteNewsIndex();
    }
}

container.register(NewsService.name, new NewsService());