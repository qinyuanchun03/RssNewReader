import { RSSArticle } from "@/src/types.ts";
import { useState, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { 
  Sparkles, Star, ExternalLink, Share2, BookOpen, Clock, Loader2, 
  PanelLeftClose, PanelLeftOpen, Languages, PenTool, Trash2, Plus, Check, X 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { cn } from "@/lib/utils.ts";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/src/context/SettingsContext.tsx";

interface ArticleViewProps {
  article: RSSArticle | null;
  onToggleFavorite: (id: string) => void;
  isListCollapsed?: boolean;
  onToggleListCollapse?: () => void;
}

interface ArticleNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

function processHtml(html: string): string {
  if (!html) return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    // Process links
    const links = doc.querySelectorAll("a");
    links.forEach((link) => {
      // Ensure all links open in a new tab safely
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      
      // Style the links beautifully with high visibility, accent color and underline offset
      link.className = "text-primary hover:text-primary/80 font-medium underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-all duration-150 cursor-pointer inline-flex items-center gap-0.5 break-all";
      
      // Add a subtle, clean external link icon if it doesn't already have an icon/image
      if (!link.querySelector("img") && !link.querySelector("svg") && link.textContent?.trim()) {
        const iconContainer = doc.createElement("span");
        iconContainer.className = "inline-block align-middle ml-0.5 opacity-70 shrink-0";
        iconContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`;
        link.appendChild(iconContainer);
      }
    });

    // Process images: Default all images to be centered
    const imgs = doc.querySelectorAll("img");
    imgs.forEach((img) => {
      img.className = cn(img.className, "mx-auto block my-6 max-w-full h-auto rounded-lg shadow-sm");
      img.style.display = "block";
      img.style.marginLeft = "auto";
      img.style.marginRight = "auto";
    });

    return doc.body.innerHTML;
  } catch (e) {
    console.error("Error processing HTML:", e);
    return html;
  }
}
 
export function ArticleView({ 
  article, 
  onToggleFavorite, 
  isListCollapsed = false, 
  onToggleListCollapse 
}: ArticleViewProps) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Background Full-text Extraction States
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  // Translation States
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Notes States
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<ArticleNote[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const getAiHeaders = () => {
    const hdrs: Record<string, string> = {
      "X-Enable-AI": settings.enableAi ? "true" : "false",
      "X-AI-Provider": settings.aiProvider,
    };

    if (settings.geminiApiKey) hdrs["X-Gemini-API-Key"] = settings.geminiApiKey;
    if (settings.openaiApiKey) {
      hdrs["X-OpenAI-API-Key"] = settings.openaiApiKey;
      hdrs["X-OpenAI-Base-Url"] = settings.openaiBaseUrl || "";
      hdrs["X-OpenAI-Model"] = settings.openaiModel || "";
    }
    if (settings.anthropicApiKey) {
      hdrs["X-Anthropic-API-Key"] = settings.anthropicApiKey;
      hdrs["X-Anthropic-Base-Url"] = settings.anthropicBaseUrl || "";
      hdrs["X-Anthropic-Model"] = settings.anthropicModel || "";
    }
    if (settings.openrouterApiKey) {
      hdrs["X-Openrouter-API-Key"] = settings.openrouterApiKey;
      hdrs["X-Openrouter-Base-Url"] = settings.openrouterBaseUrl || "";
      hdrs["X-Openrouter-Model"] = settings.openrouterModel || "";
    }
    if (settings.zenmuxApiKey) {
      hdrs["X-Zenmux-API-Key"] = settings.zenmuxApiKey;
      hdrs["X-Zenmux-Base-Url"] = settings.zenmuxBaseUrl || "";
      hdrs["X-Zenmux-Model"] = settings.zenmuxModel || "";
    }
    if (settings.customApiKey) {
      hdrs["X-Custom-API-Key"] = settings.customApiKey;
      hdrs["X-Custom-Base-Url"] = settings.customBaseUrl || "";
      hdrs["X-Custom-Model"] = settings.customModel || "";
    }
    return hdrs;
  };

  // Load article content, reset AI features, load notes
  useEffect(() => {
    setSummary(null);
    setFullContent(null);
    setContentError(null);
    setTranslatedContent(null);
    setShowTranslation(false);
    setTranslationError(null);

    if (!article?.id) return;

    // Load Notes from localStorage for this article
    try {
      const saved = localStorage.getItem(`rss_notes_${article.id}`);
      if (saved) {
        setNotes(JSON.parse(saved));
      } else {
        setNotes([]);
      }
    } catch (e) {
      console.error("Failed to load notes", e);
      setNotes([]);
    }
    setNoteTitle("");
    setNoteContent("");
    setEditingNoteId(null);

    if (!article?.link) return;

    let isMounted = true;
    setIsLoadingContent(true);

    const fetchFullText = async () => {
      try {
        const headers = getAiHeaders();

        const response = await fetch(`/api/rss/full-content?url=${encodeURIComponent(article.link)}`, {
          headers
        });
        if (!response.ok) {
          throw new Error("Extraction failed");
        }
        const data = await response.json();
        if (isMounted) {
          if (data.content) {
            setFullContent(data.content);
          } else {
            throw new Error("No content extracted");
          }
        }
      } catch (err) {
        console.error("Full text extraction error:", err);
        if (isMounted) {
          setContentError(t("article.extract_failed") || "Failed to load full text");
        }
      } finally {
        if (isMounted) {
          setIsLoadingContent(false);
        }
      }
    };

    fetchFullText();

    return () => {
      isMounted = false;
    };
  }, [
    article?.id,
    article?.link,
    settings.enableAi,
    settings.aiProvider,
    settings.geminiApiKey,
    settings.openaiApiKey,
    settings.openaiBaseUrl,
    settings.openaiModel,
    settings.anthropicApiKey,
    settings.anthropicBaseUrl,
    settings.anthropicModel,
    settings.openrouterApiKey,
    settings.openrouterBaseUrl,
    settings.openrouterModel,
    settings.zenmuxApiKey,
    settings.zenmuxBaseUrl,
    settings.zenmuxModel,
    settings.customApiKey,
    settings.customBaseUrl,
    settings.customModel,
    t
  ]);

  if (!article) {
    return (
      <div className="flex-[2] flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-background">
        <BookOpen className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-xl font-medium">{t("article.select_article")}</p>
      </div>
    );
  }

  // AI Summarization
  const getSelectedProviderKey = () => {
    switch (settings.aiProvider) {
      case "gemini": return settings.geminiApiKey;
      case "openai": return settings.openaiApiKey;
      case "anthropic": return settings.anthropicApiKey;
      case "openrouter": return settings.openrouterApiKey;
      case "zenmux": return settings.zenmuxApiKey;
      case "custom": return settings.customApiKey;
      default: return "";
    }
  };

  const handleSummarize = async () => {
    if (!settings.enableAi || !getSelectedProviderKey()) {
      setSummary("AI 辅助功能未开启。\n\n请点击左下角（或底部导航栏）的“设置”图标，并在“AI 辅助功能”板块开启 AI 辅助并填写您的 API 密钥。");
      return;
    }

    setIsSummarizing(true);
    try {
      const headers = {
        ...getAiHeaders(),
        "Content-Type": "application/json"
      };

      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: fullContent || article.content || article.snippet || "",
          title: article.title
        }),
      });
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error("Summary error:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  // AI Translation (Professional & Free using backend API)
  const handleTranslate = async () => {
    if (translatedContent) {
      // Toggle between original and translation if already cached
      setShowTranslation(!showTranslation);
      return;
    }

    if (!settings.enableAi || !getSelectedProviderKey()) {
      setTranslationError("AI 翻译需要开启 AI 辅助功能。请在设置中开启并填写 API 密钥。");
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);
    try {
      const headers = {
        ...getAiHeaders(),
        "Content-Type": "application/json"
      };

      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: fullContent || article.content || article.snippet || "",
          targetLang: "Simplified Chinese"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Translation request failed");
      }

      const data = await response.json();
      setTranslatedContent(data.content);
      setShowTranslation(true);
    } catch (error: any) {
      console.error("Translation error:", error);
      setTranslationError(error.message || "翻译失败，请检查网络或 AI 密钥设置。");
    } finally {
      setIsTranslating(false);
    }
  };

  // Notes Functions (Fully functional client-side storage)
  const saveNote = () => {
    if (!noteContent.trim()) return;

    let updatedNotes: ArticleNote[];
    const now = new Date().toLocaleString();

    if (editingNoteId) {
      updatedNotes = notes.map(n => 
        n.id === editingNoteId 
          ? { ...n, title: noteTitle.trim() || "无标题笔记", content: noteContent, createdAt: now } 
          : n
      );
    } else {
      const newNote: ArticleNote = {
        id: crypto.randomUUID(),
        title: noteTitle.trim() || "无标题笔记",
        content: noteContent,
        createdAt: now
      };
      updatedNotes = [newNote, ...notes];
    }

    setNotes(updatedNotes);
    localStorage.setItem(`rss_notes_${article.id}`, JSON.stringify(updatedNotes));
    
    // Clear form
    setNoteTitle("");
    setNoteContent("");
    setEditingNoteId(null);
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem(`rss_notes_${article.id}`, JSON.stringify(updatedNotes));
    if (editingNoteId === id) {
      setNoteTitle("");
      setNoteContent("");
      setEditingNoteId(null);
    }
  };

  const startEditNote = (note: ArticleNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setNoteTitle("");
    setNoteContent("");
  };

  // Highlight Text and Append to Note Input as a quote block! (High level of craft)
  const clipSelectionToNote = () => {
    const selectedText = window.getSelection()?.toString();
    if (selectedText && selectedText.trim()) {
      const formattedQuote = `\n\n> ${selectedText.trim()}\n\n`;
      setNoteContent(prev => prev + formattedQuote);
      if (!noteTitle) {
        setNoteTitle("内容剪辑");
      }
    } else {
      setNoteContent(prev => prev + (prev ? "" : "💡 温馨提示：用鼠标在左侧文章中圈选一段文本，然后再点击“剪切选中文字”按钮，该内容就会自动导入到这里。"));
    }
  };

  return (
    <div className="flex-[2] flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b flex flex-wrap gap-4 items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleListCollapse} 
            className="hidden md:flex text-muted-foreground hover:text-foreground mr-1"
            title={isListCollapsed ? "展开文章列表" : "收起文章列表"}
          >
            {isListCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(article.id)}>
            <Star className={article.favorite ? "fill-yellow-400 text-yellow-400" : ""} />
          </Button>
          <Button 
            variant={showNotes ? "secondary" : "ghost"} 
            size="icon" 
            onClick={() => setShowNotes(!showNotes)}
            title="文章随手记 / Notes"
            className="relative"
          >
            <PenTool className={cn("h-5 w-5", showNotes && "text-primary")} />
            {notes.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {notes.length}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Translation Button (Professional, elegant & free) */}
          <Button 
            variant={showTranslation ? "secondary" : "outline"} 
            size="sm" 
            className="gap-2" 
            onClick={handleTranslate} 
            disabled={isTranslating}
          >
            {isTranslating ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Languages className="h-4 w-4 text-emerald-500" />
            )}
            {isTranslating ? "翻译中..." : showTranslation ? "显示原文" : "翻译为中文"}
          </Button>

          {/* AI Summarization Button */}
          <Button variant="outline" size="sm" className="gap-2" onClick={handleSummarize} disabled={isSummarizing || !!summary}>
            <Sparkles className="h-4 w-4 text-purple-500" />
            {isSummarizing ? t("article.summarizing") : summary ? t("article.summary_ready") : t("article.summarize")}
          </Button>

          <a 
            href={article.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}
          >
            <ExternalLink className="h-4 w-4" />
            {t("article.visit_source")}
          </a>
        </div>
      </div>

      {/* Main Content Area Split Layout (Reader on Left, Notes on Right) */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Left Scrollable Reader */}
        <ScrollArea className="flex-1 h-full min-h-0">
          <article className="max-w-3xl mx-auto p-8 space-y-8 pb-20">
            <header className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight leading-tight">
                {article.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {article.author && <span className="font-medium text-foreground">{article.author}</span>}
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Unknown date"}
                </span>
                {showTranslation && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Languages className="h-3 w-3" />
                      已翻译为中文
                    </span>
                  </>
                )}
              </div>
            </header>

            {/* Translation Error */}
            {translationError && (
              <div className="p-4 text-sm bg-destructive/10 text-destructive rounded-lg border border-destructive/20 whitespace-pre-wrap">
                {translationError}
              </div>
            )}

            {/* AI Summary Card */}
            {summary && (
              <Card className="bg-purple-50/50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/50">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold text-sm">
                    <Sparkles className="h-4 w-4" />
                    {t("article.ai_summary")}
                  </div>
                  <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {summary}
                  </div>
                </CardContent>
              </Card>
            )}

            {isLoadingContent && (
              <div className="flex items-center gap-2 text-xs text-primary animate-pulse py-2 border-b border-primary/10">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>正在加载全文... / Loading full text...</span>
              </div>
            )}

            {contentError && !showTranslation && (
              <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                {contentError}。已为您展示订阅源内容。
              </div>
            )}

            {/* Main Rich text body */}
            <div 
              className="prose prose-slate dark:prose-invert max-w-none text-lg leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ 
                __html: processHtml(
                  showTranslation && translatedContent 
                    ? translatedContent 
                    : (fullContent || article.content || article.snippet || "")
                ) 
              }}
            />
          </article>
        </ScrollArea>

        {/* Right Collapsible Notes Panel */}
        {showNotes && (
          <div className="w-80 border-l bg-muted/20 flex flex-col h-full shrink-0 z-20">
            <div className="p-3 border-b flex items-center justify-between bg-background">
              <span className="text-sm font-semibold flex items-center gap-2">
                <PenTool className="h-4 w-4 text-primary" />
                文章随手记
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNotes(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Note Editor */}
            <div className="p-4 border-b bg-background space-y-3 shrink-0 shadow-sm">
              <input
                type="text"
                placeholder="笔记标题..."
                className="w-full text-sm font-medium bg-transparent border-b border-muted py-1 outline-none focus:border-primary transition-colors text-foreground"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
              <textarea
                placeholder="记录灵感、金句，或选中文章中的文字剪辑到此..."
                className="w-full h-32 text-xs bg-muted/40 rounded-md p-2 outline-none focus:ring-1 focus:ring-primary/40 resize-none leading-relaxed text-foreground"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              <div className="flex items-center justify-between gap-2">
                <Button 
                  variant="outline" 
                  size="xs" 
                  className="text-[11px] h-7 px-2 hover:bg-muted"
                  onClick={clipSelectionToNote}
                  title="圈选原文中想引用的段落后，点击此键自动插入"
                >
                  剪辑选中文字
                </Button>
                <div className="flex gap-1">
                  {editingNoteId && (
                    <Button variant="ghost" size="xs" className="text-[11px] h-7 px-2" onClick={cancelEditNote}>
                      取消
                    </Button>
                  )}
                  <Button variant="default" size="xs" className="text-[11px] h-7 px-3 gap-1" onClick={saveNote}>
                    {editingNoteId ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {editingNoteId ? "更新" : "保存"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Notes List */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {notes.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground">
                    <p className="opacity-60">暂无随笔记录</p>
                    <p className="text-[10px] mt-1">您可以使用上方的编辑器写笔记，或圈选文字后点击“剪辑选中文字”自动记录！</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div 
                      key={note.id} 
                      className={cn(
                        "p-3 rounded-lg border text-xs bg-background shadow-xs transition-all",
                        editingNoteId === note.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-muted hover:border-muted-foreground/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 font-medium mb-1">
                        <span 
                          className="truncate cursor-pointer hover:text-primary max-w-[140px] text-foreground"
                          onClick={() => startEditNote(note)}
                        >
                          {note.title}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 hover:text-destructive text-muted-foreground"
                            onClick={() => deleteNote(note.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p 
                        className="text-muted-foreground line-clamp-4 cursor-pointer whitespace-pre-wrap leading-relaxed"
                        onClick={() => startEditNote(note)}
                      >
                        {note.content}
                      </p>
                      <div className="text-[10px] text-muted-foreground/60 mt-2 text-right">
                        {note.createdAt}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

      </div>
    </div>
  );
}
