import type { News } from "../src/db";

export type NewsItem = News

interface NewsProps {
  news: NewsItem[];
}

export default function NewsComponent({ news }: NewsProps) {
  return news.map(e=>({...e, date: new Date(e.isoDate)})).map((item) => (
    `<tr>
      <td class="text-break">${item.title}</td>
      <td class="word-break">${item.keywords.join(', ')}</td>
      <td class="word-break">${item.date.toDateString()}</td>
      <td class="word-break">
        <a
          href="${item.link}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-sm btn-primary"
        >
          Open
        </a>
      </td>
    </tr>`
  ))
};