import { symbol } from 'zod';
import { container } from '../configs/ioc';
import { type BaseRepository, type News } from '../dao/db';
import { reducedTemplate, complete } from './ai';

export class NewsService {
    private repository = container.resolve<BaseRepository<News, string>>('repo');


    async getNews() : Promise<News[]> {
        return await this.repository.find();
    }

    async getNewsById(id: string) : Promise<News | null> {
        return await this.repository.findById(id);
    }

    async getReducedNews(topicsJoined: string, excludeTopicsJoined: string, newsItemLimit: number, aiModel: string) : Promise<News[]> {
        const news = await this.getNews();
        return await complete(news, topicsJoined, excludeTopicsJoined, newsItemLimit, aiModel, reducedTemplate);
    }

    async saveNews(news: News[]) : Promise<void> {
        await this.repository.saveNews(news);
    }

    async deleteAllNews() : Promise<void> {
        await this.repository.deleteNewsIndex();
    }
}

container.register(NewsService.name, new NewsService());