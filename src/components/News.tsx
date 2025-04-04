import type { News } from "../dao/db";

export type NewsItem = News;

interface NewsProps {
  news: NewsItem[];
}

export function NewsComponent({ news }: NewsProps) {
  return news
    .map((e) => ({ ...e, published: new Date(e.published) }))
    .map((item) => {
      const formattedDate = item.published.toLocaleDateString("en-US", {
        weekday: "long", // Friday
        month: "long",   // March
        day: "numeric",  // 14
      });

      return `
        <tr>
          <td class="text-break">${item.title}</td>
          <td class="word-break">
            ${item.keywords
          .map(
            (keyword) =>
              `<span class="badge rounded-pill bg-warning text-dark me-1">${keyword}</span>`
          )
          .join(" ")}
          </td>
          <td class="word-break">
            <div class="p-2 bg-light border rounded text-center">
              <small class="text-muted">${formattedDate}</small>
            </div>
          </td>
          <td class="word-break">
            <a
              href="${item.url}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-sm btn-primary"
            >
              Open
            </a>
          </td>
          <td hidden>${item.url}</td>
        </tr>
      `;
    });
}
