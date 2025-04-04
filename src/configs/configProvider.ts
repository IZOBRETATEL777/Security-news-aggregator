import { parse } from "yaml";
import dayjs from 'dayjs';
import { yamlSchema } from "./schema";

const configPath = "./config.yaml";
const buffer = await Bun.file(configPath).text();

export class ConfigProvider {
    constructor(private readonly schema: typeof yamlSchema, private readonly buffer: string) { }

    get CONFIG() {
        return this.schema.parse(parse(this.buffer));
    }

    get TOPICS_JOINED() {
        return this.CONFIG.topics.join("\n");
    }

    get TOPICS_EXCLUDED() {
        return this.CONFIG.exclude_topics.join("\n");
    }

    get REFRESH_RATE_MINUTES() {
        return this.CONFIG.refresh_rate_minutes;
    }
}

export const {
    CONFIG,
    REFRESH_RATE_MINUTES,
    TOPICS_EXCLUDED, 
    TOPICS_JOINED
} = new ConfigProvider(yamlSchema, buffer);

export async function getLatestDateAndOldestDate(): Promise<{ oldestDate: Date, latestDate: Date }> {
    const oldNews = new Date();
    const newNews = new Date();
    const fetchPeriod = CONFIG.data_period;

    if (fetchPeriod === "today") {
        return { oldestDate: oldNews, latestDate: newNews };
    }

    else if (typeof fetchPeriod === "object" && "range" in fetchPeriod) {
        const { startDate, endDate } = fetchPeriod.range;
        const start = dayjs(startDate).toDate();
        const end = dayjs(endDate).toDate();
        return { oldestDate: start, latestDate: end };
    }

    else if (fetchPeriod === "this_week") {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay()));
        return { oldestDate: start, latestDate: end };
    }

    else if (fetchPeriod === "previous_week") {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 7);
        const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay() - 7));
        return { oldestDate: start, latestDate: end };
    }

    else {
        return { oldestDate: oldNews, latestDate: newNews };
    }

}

export async function getStartEndDate(): Promise<{ start: Date, end: Date }> {
    const fetchPeriod = CONFIG.data_period;
    const today = new Date();
    let start = new Date();
    let end = new Date();
    if (fetchPeriod === "today") {
        return { start: new Date(), end: new Date() };
    } else if (typeof fetchPeriod === "object" && "range" in fetchPeriod) {
        const { startDate, endDate } = fetchPeriod.range;
        start = dayjs(startDate).toDate();
        end = dayjs(endDate).toDate();
        return { start, end };
    }
    else if (fetchPeriod === "this_week") {
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay()));
    }
    else if (fetchPeriod === "previous_week") {
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 7);
        end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay() - 7));
    }
    return { start, end };

}

