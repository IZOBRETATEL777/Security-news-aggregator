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