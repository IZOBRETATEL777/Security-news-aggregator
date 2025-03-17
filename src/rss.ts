import dayjs from 'dayjs';
import { parseFeed } from '@rowanmanning/feed-parser';

export async function fetchRSS(url: string) {
    try {
        const response = await fetch(url);
        const xmlData = await response.text();
        return parseFeed(xmlData);
    } catch (error) {
        console.error(error);
        return { items: [] };
    }
}

export async function fetchTodaysRSS(url: string) {
    try {
        const response = await fetch(url);
        const xmlData = await response.text();
        const feed = parseFeed(xmlData);
        
        const today = new Date()
        
        const todaysItems = feed.items.filter(item => {
            if (!item.published) return false;
            const itemDate = dayjs(item.published).toDate()
            return itemDate === today;
        });
        return { items: todaysItems };
    } catch (error) {
        console.error(error);
        return { items: [] };
    }
}

export async function fetchRangeDateRSS(url: string, startDate: Date, endDate: Date) {
    try {
        const response = await fetch(url);
        const xmlData = await response.text();
        const feed = parseFeed(xmlData);
        
        const rangeItems = feed.items.filter(item => {
            if (!item.published) return false;
            const itemDate = dayjs(item.published).toDate()
            return itemDate >= startDate && itemDate <= endDate;
        });
        return { items: rangeItems };
    } catch (error) {
        console.error(error);
        return { items: [] };
    }
}