import dayjs from 'dayjs';
import Parser from "rss-parser"

const parser = new Parser()

export async function fetchRSS(url: string) {
    try {
        const response = await fetch(url);
        const xmlData = await response.text();
        return parser.parseString(xmlData);
    } catch (error) {
        console.error(error);
        return { items: [] };
    }
}

export async function fetchTodaysRSS(url: string) {
    try {
        const response = await fetch(url);
        const xmlData = await response.text();
        const feed = await parser.parseString(xmlData);
        
        const today = new Date().toDateString();
        
        const todaysItems = feed.items.filter(item => {
            if (!item.isoDate) return false;
            const itemDate = new Date(item.isoDate).toDateString();
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
        const feed = await parser.parseString(xmlData);
        
        const rangeItems = feed.items.filter(item => {
            if (!item.pubDate) return false;
            const itemDate = dayjs(item.pubDate).toDate()
            return itemDate >= startDate && itemDate <= endDate;
        });
        return { items: rangeItems };
    } catch (error) {
        console.error(error);
        return { items: [] };
    }
}