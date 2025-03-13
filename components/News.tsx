export interface NewsItem {
  id: string;
  title: string;
  link: string;
}

interface NewsProps {
  news: NewsItem[];
}

export default function NewsComponent({ news }: NewsProps) {
  return news.map((item) => (
    `<tr>
      <td class="text-break">${item.title}</td>
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