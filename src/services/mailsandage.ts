import { emailConfig } from "../worker.ts";
import nodemailer from 'nodemailer';
import { NewsService } from "./newsService.ts";
import { type News } from "../dao/db.ts";


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
    const newsService = new NewsService();
    const news = await newsService.getNews();
    const to = emailConfig.subscribers.join(", ");
    const subject = "News Proposal";
    const html = news.map((n: News) => `<h1>${n.title}</h1><p>${n.url}</p>`).join("<hr>");
    await sendMail(to, subject, html);
}