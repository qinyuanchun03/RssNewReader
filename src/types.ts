export interface RSSSource {
  id: string;
  title: string;
  url: string;
  category: string;
  icon?: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
}

export interface RSSArticle {
  id: string;
  sourceId: string;
  title: string;
  link: string;
  author?: string;
  content?: string;
  snippet?: string;
  publishedAt?: string;
  image?: string;
  read: boolean;
  favorite: boolean;
}

export interface AIHistory {
  id: string;
  articleId: string;
  summary: string;
  createdAt: string;
}
