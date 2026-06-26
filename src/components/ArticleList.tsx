import { RSSArticle } from "@/src/types.ts";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils.ts";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Star } from "lucide-react";

interface ArticleListProps {
  articles: RSSArticle[];
  selectedArticleId: string | null;
  onSelectArticle: (id: string) => void;
  isLoading: boolean;
}

export function ArticleList({ articles, selectedArticleId, onSelectArticle, isLoading }: ArticleListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center">
        <div>
          <p className="text-lg font-medium">No articles found</p>
          <p className="text-sm">Try adding a new RSS source or checking another category.</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 h-full border-r">
      <div className="p-4 space-y-4">
        {articles.map(article => (
          <Card
            key={article.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md border-l-4",
              selectedArticleId === article.id ? "border-l-primary bg-primary/5" : "border-l-transparent",
              !article.read && "font-bold"
            )}
            onClick={() => onSelectArticle(article.id)}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-base line-clamp-2 leading-snug">
                  {article.title}
                </CardTitle>
                {article.favorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
              </div>
              <CardDescription className="text-xs flex items-center gap-2 mt-1">
                {article.author && <span className="truncate max-w-[100px]">{article.author}</span>}
                {article.publishedAt && (
                  <span>{formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {article.snippet || "No description available."}
              </p>
              {!article.read && (
                <Badge variant="secondary" className="mt-2 text-[10px] h-4 px-1.5 font-normal">
                  New
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
