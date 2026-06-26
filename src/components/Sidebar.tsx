import { RSSSource } from "@/src/types.ts";
import { cn } from "@/lib/utils.ts";
import { LayoutGrid, Rss, Star, Settings, Plus, Folder, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  sources: RSSSource[];
  selectedSourceId: string | null;
  selectedCategoryId: string | null;
  onSelectSource: (id: string | null) => void;
  onSelectCategory: (category: string | null) => void;
  onAddClick: () => void;
  onDeleteSource: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSettingsClick?: () => void;
}

export function Sidebar({
  sources,
  selectedSourceId,
  selectedCategoryId,
  onSelectSource,
  onSelectCategory,
  onAddClick,
  onDeleteSource,
  searchQuery,
  onSearchChange,
  onSettingsClick
}: SidebarProps) {
  const { t } = useTranslation();
  const categories = Array.from(new Set(sources.map(s => s.category))).filter(Boolean);

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full shrink-0">
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className="font-bold text-xl tracking-tight text-primary">{t("app.name")}</h1>
        <Button variant="ghost" size="icon" onClick={onAddClick}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 pt-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索文章..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="space-y-1">
            <Button
              variant={selectedSourceId === null && selectedCategoryId === null ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => {
                onSelectSource(null);
                onSelectCategory(null);
              }}
            >
              <LayoutGrid className="h-4 w-4" />
              {t("nav.all_articles")}
            </Button>
            <Button
              variant={selectedCategoryId === "Favorites" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => onSelectCategory("Favorites")}
            >
              <Star className="h-4 w-4" />
              {t("nav.favorites")}
            </Button>
          </div>

          {categories.length > 0 && (
            <div className="space-y-1">
              <h2 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("rss.categories")}
              </h2>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategoryId === category ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    onSelectCategory(category);
                    onSelectSource(null);
                  }}
                >
                  <Folder className="h-4 w-4" />
                  {category}
                </Button>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <h2 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t("rss.sources")}
            </h2>
            {sources.map(source => (
              <div key={source.id} className="group flex items-center gap-1">
                <Button
                  variant={selectedSourceId === source.id ? "secondary" : "ghost"}
                  className="flex-1 justify-start gap-2 truncate"
                  onClick={() => {
                    onSelectSource(source.id);
                    onSelectCategory(null);
                  }}
                >
                  <Rss className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{source.title}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSource(source.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={onSettingsClick}>
          <Settings className="h-4 w-4" />
          {t("nav.settings")}
        </Button>
      </div>
    </div>
  );
}
