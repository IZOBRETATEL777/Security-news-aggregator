import { REDIS_KEY, emailConfig } from "./worker.ts";
import { kv, type News } from "./db";
import nodemailer from 'nodemailer';

async function getNews() {
    const news = await kv.hgetall(REDIS_KEY);
    if (news === null) {
        return [];
    }
    return Object.entries(news).map(([key, value]) => {
        const parsedValue = typeof value === "string" ? JSON.parse(value) : value;
        return {
            id: key,
            ...parsedValue,
            published: new Date(parsedValue.published)
        };
    });
}

const sendMail = async (to: string, subject: string, html: string) => {
    const transporter = nodemailer.createTransport({
        service: Bun.env.MAIL_HOST,
        auth: {
            user: Bun.env.MAIL_USERNAME,
            pass: Bun.env.MAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: Bun.env.MAIL_USERNAME,
        to: to,
        subject: subject,
        html: html
    };

    transporter.sendMail(mailOptions);
}

export async function sendNews() {
    const news = await getNews();
    const to = emailConfig.subscribers.join(", ");
    const subject = "News Proposal";
    const html = news.map((n: News) => `<h1>${n.title}</h1><p>${n.url}</p>`).join("<hr>");
    await sendMail(to, subject, html);
}