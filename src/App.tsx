/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { RSSSource, RSSArticle } from "@/src/types.ts";
import { Sidebar } from "@/src/components/Sidebar.tsx";
import { ArticleList } from "@/src/components/ArticleList.tsx";
import { ArticleView } from "@/src/components/ArticleView.tsx";
import { AddSource } from "@/src/components/AddSource.tsx";
import { BottomNav } from "@/src/components/BottomNav.tsx";
import { AppearanceSettings } from "@/src/components/AppearanceSettings.tsx";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils.ts";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

const INITIAL_SOURCES: RSSSource[] = [
  {
    id: "ruan-yi-feng",
    title: "阮一峰的网络日志",
    url: "https://www.ruanyifeng.com/blog/atom.xml",
    category: "开发",
    enabled: true,
    createdAt: new Date().toISOString(),
  }
];

export default function App() {
  const { t } = useTranslation();
  const [sources, setSources] = useState<RSSSource[]>(() => {
    const saved = localStorage.getItem("rss_sources");
    return saved ? JSON.parse(saved) : INITIAL_SOURCES;
  });

  const [articles, setArticles] = useState<RSSArticle[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMobileTab, setActiveMobileTab] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListCollapsed, setIsListCollapsed] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem("rss_sources", JSON.stringify(sources));
  }, [sources]);

  // Fetch articles from all enabled sources
  const fetchAllArticles = async () => {
    setIsLoading(true);
    try {
      const allArticles: RSSArticle[] = [];
      
      for (const source of sources) {
        if (!source.enabled) continue;
        
        try {
          const response = await fetch(`/api/rss?url=${encodeURIComponent(source.url)}`);
          const data = await response.json();
          
          if (data.items) {
            const sourceArticles = data.items.map((item: any) => ({
              id: item.guid || item.link,
              sourceId: source.id,
              title: item.title,
              link: item.link,
              author: item.creator || item.author,
              content: item.content || item.contentSnippet,
              snippet: item.contentSnippet,
              publishedAt: item.pubDate || item.isoDate,
              read: false,
              favorite: false
            }));
            allArticles.push(...sourceArticles);
          }
        } catch (e) {
          console.error(`Error fetching ${source.title}:`, e);
        }
      }
      
      // Sort by date
      allArticles.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });

      // Merge with metadata from localStorage
      const metadata = JSON.parse(localStorage.getItem("article_metadata") || "{}");
      const merged = allArticles.map(a => ({
        ...a,
        read: metadata[a.id]?.read || false,
        favorite: metadata[a.id]?.favorite || false
      }));

      setArticles(merged);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllArticles();
  }, [sources]);

  const filteredArticles = useMemo(() => {
    let filtered = articles;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(query) || 
        (a.snippet && a.snippet.toLowerCase().includes(query))
      );
    }

    if (selectedSourceId) {
      filtered = filtered.filter(a => a.sourceId === selectedSourceId);
    } else if (selectedCategoryId) {
      if (selectedCategoryId === "Favorites") {
        filtered = filtered.filter(a => a.favorite);
      } else {
        const sourceIds = sources.filter(s => s.category === selectedCategoryId).map(s => s.id);
        filtered = filtered.filter(a => sourceIds.includes(a.sourceId));
      }
    }
    return filtered;
  }, [articles, selectedSourceId, selectedCategoryId, sources]);

  const currentArticle = useMemo(() => 
    articles.find(a => a.id === selectedArticleId) || null
  , [articles, selectedArticleId]);

  const handleSelectArticle = (id: string) => {
    setSelectedArticleId(id);
    // Mark as read
    const metadata = JSON.parse(localStorage.getItem("article_metadata") || "{}");
    metadata[id] = { ...metadata[id], read: true };
    localStorage.setItem("article_metadata", JSON.stringify(metadata));
    
    setArticles(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const handleToggleFavorite = (id: string) => {
    const metadata = JSON.parse(localStorage.getItem("article_metadata") || "{}");
    const isFavorite = !metadata[id]?.favorite;
    metadata[id] = { ...metadata[id], favorite: isFavorite };
    localStorage.setItem("article_metadata", JSON.stringify(metadata));
    
    setArticles(prev => prev.map(a => a.id === id ? { ...a, favorite: isFavorite } : a));
  };

  const handleAddSource = (source: RSSSource) => {
    setSources(prev => [...prev, source]);
  };

  const handleDeleteSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    if (selectedSourceId === id) setSelectedSourceId(null);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Sidebar - Desktop/Tablet */}
      <div className="hidden md:block">
        <Sidebar
          sources={sources}
          selectedSourceId={selectedSourceId}
          selectedCategoryId={selectedCategoryId}
          onSelectSource={setSelectedSourceId}
          onSelectCategory={setSelectedCategoryId}
          onAddClick={() => setIsAddOpen(true)}
          onDeleteSource={handleDeleteSource}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSettingsClick={() => setIsAppearanceOpen(true)}
        />
      </div>
      
      <main className="flex-1 flex overflow-hidden relative">
        {/* Article List */}
        <div className={cn(
          "flex-1 transition-all duration-300 border-r overflow-hidden",
          selectedArticleId ? "hidden md:block" : "block w-full",
          isListCollapsed ? "md:max-w-0 md:w-0 md:border-r-0 md:opacity-0" : "md:max-w-md lg:max-w-lg xl:max-w-xl md:w-full"
        )}>
          <ArticleList
            articles={filteredArticles}
            selectedArticleId={selectedArticleId}
            onSelectArticle={handleSelectArticle}
            isLoading={isLoading}
          />
        </div>
        
        {/* Article View */}
        <div className={cn(
          "flex-[2] transition-all h-full overflow-hidden",
          selectedArticleId ? "block w-full" : "hidden md:block"
        )}>
          <AnimatePresence mode="wait">
            {selectedArticleId ? (
              <motion.div
                key="article-view"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                className="h-full relative flex flex-col"
              >
                {/* Back button for mobile */}
                <div className="md:hidden p-4 border-b bg-background flex items-center shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedArticleId(null)}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="ml-2 font-medium truncate">{currentArticle?.title}</span>
                </div>
                
                <ArticleView
                  article={currentArticle}
                  onToggleFavorite={handleToggleFavorite}
                  isListCollapsed={isListCollapsed}
                  onToggleListCollapse={() => setIsListCollapsed(!isListCollapsed)}
                />
              </motion.div>
            ) : (
              <div key="placeholder" className="hidden md:flex h-full items-center justify-center text-muted-foreground bg-muted/10">
                <div className="text-center">
                  <p className="text-lg">{t("article.select_article")}</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <BottomNav
          activeTab={activeMobileTab}
          onTabChange={(tab) => {
            setActiveMobileTab(tab);
            setSelectedArticleId(null);
            if (tab === "rss") setIsAddOpen(true);
          }}
          onSettingsClick={() => setIsAppearanceOpen(true)}
        />
      </div>

      <AddSource
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddSource}
      />

      <AppearanceSettings
        isOpen={isAppearanceOpen}
        onClose={() => setIsAppearanceOpen(false)}
      />
    </div>
  );
}

